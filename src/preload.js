const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    shutdown: () => ipcRenderer.send('shutdown'),
    onMagNiet: (callback) => ipcRenderer.on('mag-niet', (event, data) => callback(data))
});
