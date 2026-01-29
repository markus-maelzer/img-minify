const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  startProcessing: (args) => ipcRenderer.invoke('start-processing', args),
  onLog: (callback) =>
    ipcRenderer.on('log-update', (_event, value) => callback(value)),
});
