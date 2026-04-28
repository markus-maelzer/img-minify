const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { processImages } = require('./image-processor');

// Auto-updater wrap to prevent crash in dev/bad env
function initAutoUpdater() {
  try {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-available', () => console.log('Update available'));
    autoUpdater.on('update-downloaded', () => console.log('Update downloaded'));
  } catch (e) {
    console.log(
      'Auto-updater not initialized (dev mode or missing dependency):',
      e.message
    );
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();
  initAutoUpdater();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

ipcMain.handle('validate-folder', async (_event, folderPath) => {
  try {
    const stat = fs.statSync(folderPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
});

ipcMain.handle('start-processing', async (event, args) => {
  const { inputDir, width, height, fit, background, format, quality, keepDimensions } = args;

  // Define log callback
  const onLog = (msg) => {
    // Check if the sender (renderer) is still available
    if (!event.sender.isDestroyed()) {
      event.sender.send('log-update', msg);
    }
  };

  await processImages(inputDir, { width, height, fit, background, format, quality, keepDimensions }, onLog);
  return 'Done';
});
