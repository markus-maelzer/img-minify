const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  validateFolder: (path) => ipcRenderer.invoke('validate-folder', path),
  startProcessing: (args) => ipcRenderer.invoke('start-processing', args),
  onLog: (callback) =>
    ipcRenderer.on('log-update', (_event, value) => callback(value)),
  getPathForFile: (file) => webUtils.getPathForFile(file),
});
