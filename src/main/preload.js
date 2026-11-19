const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  // File dialogs & Native I/O
  openFileDialog: (options) => ipcRenderer.invoke('dialog-open-file', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog-save-file', options),
  saveBinaryFile: (filePath, uint8Array) => ipcRenderer.invoke('file-save-binary', filePath, uint8Array),
  readBinaryFile: (filePath) => ipcRenderer.invoke('file-read-binary', filePath),
  
  // App info & platform
  getAppVersion: () => ipcRenderer.invoke('app-get-version'),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url)
});
