const translations = {
    en: {
        dashboard: "Dashboard",
        devices: "Devices",
        recordings: "Recordings",
        settings: "Settings",
        recordingManagment: "Recordings Management",
        systemSettings: "system Settings",
        аppearance: "Appearance",
        theme: "dark Mode",
        languageSettings: "language Settings",
        english : "english",
        russian : "russian",
        armenian : "armenian",
        deviceStatus : "Device Status",
        SystemHealth : "System Health",
        selectDevice : "Select Device",
        none: "None",
        recordingControls : "Recording Controls",
        recDuration : 'Recording Duration',
        tenMinute : " 10 minutes",
        thirtyMinute : " 30 minutes",
        oneHour : " 1 hour",
        start: "Start",
        stop: "Stop",
        equalizer: "Equalizer",
        systemView: "System Overview",
        currentDevice:  "Current Device",
        recordingStatus:"Recording Status",
        elapsedTime: "Elapsed Time  (in seconds)",
        cpuUsage: "CPU Usage",
        cpuTemp: "CPU Temperature",
        memoryUsage: "Memory Usage",
        nameFilter: "Filter By Name",
        dateFrom: "Date From",
        dateTo: "Date To",
        bass: 'Bass',
        mid: 'Mid',
        treble: 'Treble',
        deleteSelected: "Delete Selected",
        applyFilters: "apply Filters",
        pause: "save recorded",
        stopAndSave: "Save and stop recording",
    },
    ru: {
        dashboard: "Панель",
        devices: "устройства",
        recordings: "Записи",
        settings: "Настройки",
        recordingManagment : "Управление записями",
        systemSettings : "Настройки Системы",
        аppearance: "Тема",
        theme: "Темная",
        languageSettings: "Выбрать Язык",
        english : "англиский",
        russian : "русский",
        armenian : "армянский",
        deviceStatus : "Информация о Устройствие",
        SystemHealth : "Информация о Нагрузке",
        selectDevice : "Выбрать устройство",
        none: "Не Выбрано",
        recordingControls : "Контроль Записи",
        recDuration : 'Продолжительность записи',
        tenMinute : " 10 минут",
        thirtyMinute : " 30 минут",
        oneHour : " 1 час",
        start : "начать",
        stop : " остановить",
        equalizer : "Еквалайзер",
        systemView: 'Панель Системы',
        currentDevice:  "Выбранное Устройство",
        recordingStatus:"Статус Записи",
        elapsedTime: "Время Записи (в секундах)",
        cpuUsage: "Использование процессора",
        memoryUsage: "использование памяти",
        cpuTemp: "Температура процессора",
        nameFilter: "Фильтровать по Имени",
        dateFrom: "Дата с ",
        dateTo: "Дата По",
        bass:"басс",
        mid:"средние",
        treble:"шум",
        deleteSelected: "Удалить Выбранное",
        applyFilters: "Применить",
        pause: "сохранить записанное",
        stopAndSave: "сохранить записанное и остановить",
    },
    am: {
        dashboard: "Panel",
        devices: "Dispositivos",
        recordings: "Grabaciones",
        settings: "Configuración"
    }
};

function updateLanguage(lang) {
    document.querySelectorAll('[data-translate]').forEach(el => {
        const key = el.dataset.translate;
        el.textContent = translations[lang][key];
    });
}
const languageSelect = document.getElementById('languageSelect');

const savedLang = localStorage.getItem('lang') || 'en';
console.log(languageSelect.value)
languageSelect.value = savedLang;
console.log(languageSelect.value)
languageSelect.addEventListener('change', (e) => {
    const lang = e.target.value;
    localStorage.setItem('lang', lang);
    updateLanguage(lang)
});