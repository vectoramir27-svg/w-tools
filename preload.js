const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktopAPI', {
  loadProjects: () => ipcRenderer.invoke('projects:list'), saveProject: project => ipcRenderer.invoke('projects:save', project), deleteProject: id => ipcRenderer.invoke('projects:delete', id),
  saveSession: session => ipcRenderer.invoke('session:save', session), loadSession: () => ipcRenderer.invoke('session:load'), saveSettings: settings => ipcRenderer.invoke('settings:save', settings), loadSettings: () => ipcRenderer.invoke('settings:load'),
  getVersion: () => ipcRenderer.invoke('app:version'),
  windowControl: action => ipcRenderer.invoke('window:control', action), getHwid: () => ipcRenderer.invoke('hwid:get'), copyHwid: () => ipcRenderer.invoke('hwid:copy'), getLicenseState: () => ipcRenderer.invoke('license:state'), activateLicense: key => ipcRenderer.invoke('license:activate', key), clearLicense: () => ipcRenderer.invoke('license:clear'), openExternal: url => ipcRenderer.invoke('external:open', url),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'), downloadUpdate: () => ipcRenderer.invoke('updates:download'), installUpdate: () => ipcRenderer.invoke('updates:install'),
  onUpdateStatus: callback => ipcRenderer.on('update-status', (_event, data) => callback(data)), onUpdateProgress: callback => ipcRenderer.on('update-progress', (_event, data) => callback(data)),
  onPrepareClose: callback => ipcRenderer.on('window:prepare-close', () => callback()), closeReady: success => ipcRenderer.send('window:close-ready', success), rendererReady: () => ipcRenderer.send('window:renderer-ready')
});
contextBridge.exposeInMainWorld('electronAPI', { minimizeWindow: () => ipcRenderer.invoke('window:control', 'minimize'), maximizeWindow: () => ipcRenderer.invoke('window:control', 'maximize'), closeWindow: () => ipcRenderer.invoke('window:control', 'close'), openFileDialog: options => ipcRenderer.invoke('dialog-open-file', options), saveFileDialog: options => ipcRenderer.invoke('dialog-save-file', options), saveBinaryFile: (filePath, bytes) => ipcRenderer.invoke('file-save-binary', filePath, bytes) });
