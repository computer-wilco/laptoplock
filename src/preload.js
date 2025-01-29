const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    shutdown: () => ipcRenderer.send('shutdown'),
});