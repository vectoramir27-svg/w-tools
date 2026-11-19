const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1420,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    frame: false, // Custom dark titlebar
    backgroundColor: '#0F0F12',
    icon: path.join(__dirname, '../../assets/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false // Allows reading local files and offline blobs seamlessly
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state-changed', { isMaximized: true });
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state-changed', { isMaximized: false });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window control IPC
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// File Dialogs
ipcMain.handle('dialog-open-file', async (event, options = {}) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || 'Открыть файл',
    filters: options.filters || [
      { name: 'Telegram Emoji & Stickers (.tgs, .json)', extensions: ['tgs', 'json'] },
      { name: 'Все файлы', extensions: ['*'] }
    ],
    properties: ['openFile']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  const buffer = fs.readFileSync(filePath);
  return {
    canceled: false,
    filePath: filePath,
    fileName: path.basename(filePath),
    data: new Uint8Array(buffer)
  };
});

ipcMain.handle('dialog-save-file', async (event, options = {}) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: options.title || 'Сохранить файл',
    defaultPath: options.defaultPath || 'emoji.tgs',
    filters: options.filters || [
      { name: 'Telegram Animated Sticker (*.tgs)', extensions: ['tgs'] },
      { name: 'Animated GIF (*.gif)', extensions: ['gif'] },
      { name: 'MP4 Video (*.mp4)', extensions: ['mp4'] },
      { name: 'Lottie JSON (*.json)', extensions: ['json'] }
    ]
  });

  return result;
});

ipcMain.handle('file-save-binary', async (event, filePath, uint8Array) => {
  try {
    fs.writeFileSync(filePath, Buffer.from(uint8Array));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('file-read-binary', async (event, filePath) => {
  try {
    const buf = fs.readFileSync(filePath);
    return { success: true, data: new Uint8Array(buf) };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app-get-version', () => app.getVersion());

ipcMain.handle('open-external-url', (event, url) => {
  shell.openExternal(url);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
