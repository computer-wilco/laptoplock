const { app, BrowserWindow, ipcMain, globalShortcut, Menu, screen } = require('electron');
const { exec } = require('child_process');
const { io } = require("socket.io-client");
const path = require('path');

let mainWindow;
let lockWindows = []; // Array voor meerdere vergrendelvensters
let allowClose = false;

var headLockWindow;

const socket = io("wss://wapi.wilcowebsite.nl");

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
            headLockWindow = lockWindow;
        } else {
            lockWindow.loadFile(path.join(__dirname, 'secondary-lockscreen.html'));
        }

        lockWindow.on('close', (e) => {
            if (!allowClose) e.preventDefault(); // Voorkom sluiten
        });

        lockWindows.push(lockWindow);
    });

    // Blokkeer sneltoetsen (ESC, Alt+Tab, etc.)
    globalShortcut.registerAll(['Esc', 'Alt+Tab', 'Ctrl+Shift+Esc', 'Meta+Tab', 'F11'], () => {
        headLockWindow.webContents.send("mag-niet");
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
