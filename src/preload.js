const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    shutdown: () => ipcRenderer.send('shutdown'),
});

addEventListener("DOMContentLoaded", function () {
    console.log("doe-iets");
    ipcRenderer.on("mag-niet", function () {
        console.log("ipc");
        Swal.fire({
            title: 'Niet doen!',
            text: 'Dat mag niet!',
            icon: 'error'
        });
    });
});