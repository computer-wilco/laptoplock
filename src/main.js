const { app, BrowserWindow, ipcMain, globalShortcut, Menu, screen } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const axios = require('axios');

let mainWindow;
let lockWindows = []; // Array voor meerdere vergrendelvensters
let allowClose = false;

const SERVER_STATUS_URL = 'https://wapi.djoamersfoort.nl/laptop/status/';
const CHECK_INTERVAL = 2500; // Controleer elke 2,5 seconden

// Maak hoofdvenster
function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
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
        } else {
            lockWindow.loadFile(path.join(__dirname, 'secondary-lockscreen.html'));
        }

        lockWindow.on('close', (e) => {
            if (!allowClose) e.preventDefault(); // Voorkom sluiten
        });

        lockWindows.push(lockWindow);
    });

    // Blokkeer sneltoetsen (ESC, Alt+Tab, etc.)
    globalShortcut.registerAll(['Alt+Tab', 'Ctrl+Shift+Esc', 'Meta+Tab', 'F11'], () => false);
}

// Sluit ALLE vergrendelvensters
function closeLockWindows() {
    allowClose = true;
    lockWindows.forEach((win) => win.close());
    lockWindows = [];
    allowClose = false;
    globalShortcut.unregisterAll();
}

// Controleer serverstatus en vergrendel/ontgrendel
async function checkStatus() {
    try {
        const response = await axios.get(SERVER_STATUS_URL);
        const { locked } = response.data;

        if (locked && lockWindows.length === 0) {
            createLockWindows();
            if (mainWindow) mainWindow.hide();
        } else if (!locked && lockWindows.length > 0) {
            closeLockWindows();
            if (mainWindow) mainWindow.show();
        }
    } catch (err) {
        console.error('Fout bij het ophalen van de status:', err);
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
    setInterval(checkStatus, CHECK_INTERVAL);
});

// Sluit volledig af als de app wordt gesloten (behalve op macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
