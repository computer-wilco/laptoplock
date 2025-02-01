const { app, BrowserWindow, ipcMain, globalShortcut, Menu, screen, ipcRenderer } = require('electron');
const { exec } = require('child_process');
const { io } = require("socket.io-client");
const path = require('path');
const axios = require('axios');

let mainWindow;
let lockWindows = []; // Array voor meerdere vergrendelvensters
let allowClose = false;

const socket = io("wss://wapi.djoamersfoort.nl");

const SERVER_STATUS_URL = 'https://wapi.djoamersfoort.nl/laptop/status/';
const SCHEDULE_API_URL = "https://wapi.djoamersfoort.nl/laptop/schedule/";
const CHECK_INTERVAL = 2500; // Controleer elke 2,5 seconden

// Maak hoofdvenster
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    Menu.setApplicationMenu(null);
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

// Maak vergrendelvensters op ALLE schermen
function createLockWindows() {
    if (lockWindows.length > 0) return; // Voorkom dubbele vensters

    const displays = screen.getAllDisplays();
    displays.forEach((display, index) => {
        const lockWindow = new BrowserWindow({
            x: display.bounds.x,
            y: display.bounds.y,
            width: display.bounds.width,
            height: display.bounds.height,
            fullscreen: true,
            frame: false,
            alwaysOnTop: true,
            kiosk: true, // Blokkeer ESC, Alt+Tab, etc.
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
            },
        });

        // Hoofdscherm krijgt afsluitknop, extra schermen alleen tekst
        if (index === 0) {
            lockWindow.loadFile(path.join(__dirname, 'lockscreen.html'));
            lockWindow.webContents.openDevTools();
        } else {
            lockWindow.loadFile(path.join(__dirname, 'secondary-lockscreen.html'));
        }

        lockWindow.on('close', (e) => {
            if (!allowClose) e.preventDefault(); // Voorkom sluiten
        });

        lockWindows.push(lockWindow);
    });

    // Blokkeer sneltoetsen (ESC, Alt+Tab, etc.)
    globalShortcut.registerAll(['Alt+Tab', 'Ctrl+Shift+Esc', 'Meta+Tab', 'F11'], () => {
        ipcMain.emit("mag-niet");
    });
}

// Sluit ALLE vergrendelvensters
function closeLockWindows() {
    allowClose = true;
    lockWindows.forEach((win) => win.close());
    lockWindows = [];
    allowClose = false;
    globalShortcut.unregisterAll();
}

function checkStatus(status) {
    if (status && lockWindows.length === 0) {
        createLockWindows();
        // if (mainWindow) mainWindow.hide();
    } else if (!status && lockWindows.length > 0) {
        closeLockWindows();
        // if (mainWindow) mainWindow.show();
    }
}
async function checkLockStatus() {
    try {
        const response1 = await axios.get(SERVER_STATUS_URL);
        const { locked } = response1.data;

        const response = await axios.get(SCHEDULE_API_URL);
        const { lock_time, unlock_time } = response.data;

        const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM

        let shouldLock = false;

        if (lock_time < unlock_time) {
            // Normale situatie (bijv. 20:00 - 08:00)
            if (currentTime >= lock_time && currentTime < unlock_time) {
                shouldLock = true;
            }
        } else {
            // Om middernacht heen (bijv. 22:00 - 06:00)
            if (currentTime >= lock_time || currentTime < unlock_time) {
                shouldLock = true;
            }
        }

        

        if (shouldLock && lockWindows.length === 0) {
            await axios.post(SERVER_STATUS_URL, { locked: true }, {
                headers: { 'Content-Type': 'application/json' }
            });
            createLockWindows();
            if (mainWindow) mainWindow.hide();
        } else if (!shouldLock && lockWindows.length > 0) {
            await axios.post(SERVER_STATUS_URL, { locked: false }, {
                headers: { 'Content-Type': 'application/json' }
            });
            closeLockWindows();
            if (mainWindow) mainWindow.show();
        }

        if (locked && lockWindows.length === 0) {
            createLockWindows();
            if (mainWindow) mainWindow.hide();
        } else if (!locked && lockWindows.length > 0) {
            closeLockWindows();
            if (mainWindow) mainWindow.show();
        }
    } catch (err) {
        console.error("Fout bij ophalen schema:", err);
    }
}


// Sluit computer af via knop
ipcMain.on('shutdown', () => {
    exec('shutdown now', (err) => {
        if (err) console.error('Fout bij afsluiten:', err);
    });
});

// Start Electron-app
app.whenReady().then(() => {
    createMainWindow();
});

socket.on("status", (lockedarray) => {
    checkStatus(lockedarray.locked);
});

// Sluit volledig af als de app wordt gesloten (behalve op macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
