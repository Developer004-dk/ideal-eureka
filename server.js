'use strict';
const WebSocket = require('ws');
const path = require('path');
const express = require('express');
const http = require('http');
const multer = require('multer');
const fs = require('fs');
const { Server: WebSocketServer } = require('ws');
const app = express();
const connectedPis = new Map();  // deviceId -> WebSocket
const httpPort = process.env.PORT || 8080;  // HTTP server port
const wsPort = 8765;  // WebSocket server port
const wscommandsPort = 8766;  // WebSocket server port
const host = process.env.HOSTNAME || '192.168.44.162';
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up storage for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Specify the directory to save uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}_${file.originalname}`); // Name the file uniquely
    },
});
const upload = multer({ storage: storage });

// Create the main HTTP server
const server = http.createServer(app);

// Ensure the uploads and records directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const recordsDir = path.join(__dirname, 'records');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(recordsDir)) {
    fs.mkdirSync(recordsDir);
}

let isRecording = false;  // State to track if recording is on
let recordedChunks = [];  // To store recorded audio chunks

// Serve the HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index2.html'));
});
app.get('/advanced', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'advanced.html'));
});
app.get('/video', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'video-stream.html'));
});

app.get('/experimental', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'experimental.html'));
});

// Handle file uploads
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    console.log(`File uploaded: ${req.file.path}`);
    res.status(200).send(`File uploaded successfully: ${req.file.path}`);
});

app.get('/download/:filename', (req, res) => {
    const fileName = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', fileName);

    if (fs.existsSync(filePath)) {
        res.download(filePath); // triggers file download
    } else {
        res.status(404).send('File not found');
    }
});

app.post('/upload-video', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    console.log(`File uploaded: ${req.file.path}`);
    res.status(200).send(`File uploaded successfully: ${req.file.path}`);
});

// WebSocket logic
const wss = new WebSocketServer({server });
const wsCommands = new WebSocketServer({ port: wscommandsPort });

app.post('/getfiles', (req, res) => {
    const { filter = '', dateFrom, dateTo } = req.body;
    const uploadsDir = path.join(__dirname, 'uploads');

    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read uploads directory' });
        }

        let filteredFiles = [];

        files.forEach(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);

            const modifiedTime = new Date(stats.mtime);
            const afterStart = dateFrom ? new Date(dateFrom) <= modifiedTime : true;
            const beforeEnd = dateTo ? modifiedTime <= new Date(dateTo) : true;
            const matchesFilter = file.toLowerCase().includes(filter.toLowerCase());

            if (afterStart && beforeEnd && matchesFilter) {
                filteredFiles.push({
                    name: file,
                    date: modifiedTime.toISOString().split('T')[0], // e.g., "2025-05-15"
                    size: formatBytes(stats.size)
                });
            }
        });

        res.json(filteredFiles);
    });
});

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
app.get('/devices', (req, res) => {
    res.json(Array.from(connectedPis.keys()));
});
app.get('/uploads/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            return res.status(404).json({ error: 'File not found' });
        }
        res.sendFile(filePath);
    });
});

wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');
    wss.on('connection', (client, req) => {
        const userAgent = req.headers['user-agent'];
        if (userAgent && userAgent.includes('Mozilla')) {
            client.clientType = 'web'; // Mark as web client based on the user-agent
        } else {
            client.clientType = 'python'; // Otherwise, mark as Python client
        }
    });

    ws.on('message', (message) => {
        console.log(typeof(message))
        const msgStr = message.toString();
        if (msgStr === 'start_record'  || msgStr === 'stop_record'|| msgStr === 'stop_and_save' || msgStr === 'pause_record'  || msgStr === 'set_duration:600' || msgStr === 'set_duration:1800' || msgStr === 'set_duration:3600' || msgStr === 'set_duration:3600'){
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN && client.clientType !== 'web') {
                    console.log(message.toString())
                    client.send(message, {binary:false}); // Send the message only to web clients
                }
            });
            console.log('got command')
        }
        else if (msgStr.startsWith('register:')) {
            const deviceId = msgStr.split(':')[1];
            ws.deviceId = deviceId;
            connectedPis.set(deviceId, ws);
            console.log(`Registered device: ${deviceId}`);
            return;
        }
        else if (msgStr.startsWith('{') && msgStr.endsWith('}')) {
            try {
                const data = JSON.parse(msgStr);
                if (data.type === 'status_update') {
                    console.log(`Status from ${data.device_id}:`);
                    console.log(`  Recording: ${data.is_recording}`);
                    console.log(`  Elapsed Time: ${data.elapsed_time}s`);
                    console.log(`  CPU: ${data.cpu_usage}%`);
                    console.log(`  Memory: ${data.memory_usage}%`);
                    console.log(`  Temp: ${data.cpu_temp}°C`);

                    // Optionally forward to web clients
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN && client.clientType === 'web') {
                            client.send(JSON.stringify(data));
                        }
                    });
                }
            } catch (err) {
                console.log('Failed to parse JSON message:', err.message);
            }
        }
        else{
            if (Buffer.isBuffer(message)) {
                console.log('Received binary data (likely audio)');

                // Send the received binary audio data to all connected clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN && client.clientType === 'web') {
                        client.send(message); // Send the message only to web clients
                    }
                });
            }
        }


    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

// Start the HTTP server
server.listen(httpPort,  () => {
    console.log(`HTTP server running at http://${host}:${httpPort}`);
});

// WebSocket server already listens on port 8765 (no need to manually call server.listen for WebSocket)
console.log(`WebSocket server running at ws://localhost:${wsPort}`);
