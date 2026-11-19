const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const os = require('os');
const { execFile } = require('child_process');

const API_BASE_URL = "http://64.188.64.121:8080";
const BOT_URL = "https://t.me/wtools_key_bot";
const APP_NAME = 'W Tools';

let mainWindow;
let allowClose = false;
let closeRequested = false;
let rendererReady = false;
let closeTimer;
let currentHwid = null;
let licensed = false;
const queues = new Map();
const storageRoot = () => path.join(app.getPath('userData'), 'WTools');
const projectDir = () => path.join(storageRoot(), 'projects');
const licensePath = () => path.join(storageRoot(), 'license.json');

function enqueue(file, action) {
  const previous = queues.get(file) || Promise.resolve();
  const next = previous.catch(() => {}).then(action);
  queues.set(file, next);
  next.finally(() => { if (queues.get(file) === next) queues.delete(file); }).catch(() => {});
  return next;
}

function atomicSave(file, value) {
  return enqueue(file, async () => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const temp = `${file}.${crypto.randomUUID()}.tmp`;
    try {
      const handle = await fs.open(temp, 'wx');
      try { await handle.writeFile(JSON.stringify(value), 'utf8'); await handle.sync(); }
      finally { await handle.close(); }
      await fs.rename(temp, file);
    } finally { await fs.unlink(temp).catch(() => {}); }
  });
}

async function readJson(file) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

function ensureSender(event) {
  if (!mainWindow || event.sender !== mainWindow.webContents || event.senderFrame !== mainWindow.webContents.mainFrame) throw new Error('Недопустимый источник запроса');
}
const unlockedChannels = new Set(['hwid:get', 'license:state', 'license:activate', 'license:clear', 'external:open', 'hwid:copy', 'window:control', 'app:version']);
function handle(channel, callback) {
  ipcMain.handle(channel, (event, ...args) => {
    ensureSender(event);
    if (!licensed && !unlockedChannels.has(channel)) throw new Error('Требуется активация');
    return callback(...args);
  });
}
function runPowerShell(command) {
  return new Promise(resolve => {
    execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', command], { windowsHide: true, timeout: 5000 }, (error, stdout) => resolve(error ? '' : String(stdout).trim()));
  });
}
async function getMachineHwid() {
  const uuid = await runPowerShell("(Get-CimInstance Win32_ComputerSystemProduct).UUID");
  const validUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid) && !/^(00000000-0000-0000-0000-000000000000|FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF)$/i.test(uuid);
  const source = (validUuid ? uuid.toUpperCase() : '') || `${os.hostname()}|${os.arch()}|${os.cpus()[0]?.model || 'unknown'}`;
  const digest = crypto.createHash('sha256').update(source).digest('hex').toUpperCase();
  return `WT-${digest.slice(0, 4)}-${digest.slice(4, 8)}-${digest.slice(8, 12)}`;
}
async function verifyLicense(key, hwid = currentHwid) {
  if (!key) return { valid: false, error: 'Введите лицензионный ключ' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key, hwid }), signal: controller.signal });
    let payload = null;
    try { payload = await response.json(); } catch { payload = null; }
    if (!response.ok) return { valid: false, error: payload?.error || `Ошибка сервера (${response.status})` };
    return { valid: payload?.valid === true, error: payload?.error || (payload?.valid ? undefined : 'Ключ не найден'), expiresAt: payload?.expiresAt || payload?.expires_at || payload?.expires || payload?.until, plan: payload?.plan };
  } catch (error) {
    return { valid: false, offline: true, error: 'Сервер лицензий недоступен. Проверьте подключение к интернету.' };
  } finally { clearTimeout(timeout); }
}
async function getLicenseState() {
  currentHwid ||= await getMachineHwid();
  const saved = await readJson(licensePath());
  if (!saved?.key) { licensed = false; return { valid: false, hwid: currentHwid, error: 'Лицензия не активирована' }; }
  const result = await verifyLicense(saved.key, currentHwid);
  licensed = result.valid;
  return { ...result, hwid: currentHwid };
}

handle('hwid:get', async () => ({ hwid: currentHwid || (currentHwid = await getMachineHwid()) }));
handle('hwid:copy', async () => { currentHwid ||= await getMachineHwid(); clipboard.writeText(currentHwid); });
handle('license:state', getLicenseState);
handle('license:activate', async key => {
  currentHwid ||= await getMachineHwid();
  const cleanKey = String(key || '').trim().toUpperCase();
  const result = await verifyLicense(cleanKey, currentHwid);
  if (result.valid) {
    await atomicSave(licensePath(), { key: cleanKey, hwid: currentHwid, activatedAt: new Date().toISOString(), expiresAt: result.expiresAt || null });
    licensed = true;
  }
  return { ...result, hwid: currentHwid };
});
handle('license:clear', async () => { await fs.unlink(licensePath()).catch(error => { if (error.code !== 'ENOENT') throw error; }); licensed = false; return { valid: false, hwid: currentHwid }; });
handle('external:open', () => shell.openExternal(BOT_URL));
handle('app:version', () => app.getVersion());

handle('projects:list', async () => {
  await fs.mkdir(projectDir(), { recursive: true });
  const files = (await fs.readdir(projectDir())).filter(name => /^[a-zA-Z0-9_-]+\.json$/.test(name));
  const projects = [];
  for (const file of files) { try { const project = await readJson(path.join(projectDir(), file)); if (project?.id) projects.push(project); } catch (error) { console.error('Не удалось прочитать проект', file, error); } }
  return projects.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
});
function projectPath(id) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) throw new Error('Недопустимый идентификатор проекта');
  return path.join(projectDir(), `${id}.json`);
}
handle('projects:save', project => { if (!project?.rawLottieJson) throw new Error('Некорректный проект'); return atomicSave(projectPath(project.id), project); });
handle('projects:delete', id => enqueue(projectPath(id), async () => { try { await fs.unlink(projectPath(id)); } catch (error) { if (error.code !== 'ENOENT') throw error; } }));
handle('session:save', session => atomicSave(path.join(storageRoot(), 'current_session.json'), session));
handle('session:load', () => readJson(path.join(storageRoot(), 'current_session.json')));
handle('settings:save', settings => atomicSave(path.join(storageRoot(), 'settings.json'), settings));
handle('settings:load', () => readJson(path.join(storageRoot(), 'settings.json')));
handle('window:control', action => { if (action === 'minimize') mainWindow.minimize(); else if (action === 'maximize') mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize(); else if (action === 'close') mainWindow.close(); else throw new Error('Неизвестная команда окна'); });
handle('dialog-open-file', async options => { const result = await dialog.showOpenDialog(mainWindow, { title: options?.title || 'Открыть файл', filters: options?.filters, properties: ['openFile'] }); if (result.canceled || !result.filePaths.length) return { canceled: true }; const filePath = result.filePaths[0]; return { canceled: false, filePath, fileName: path.basename(filePath), data: new Uint8Array(await fs.readFile(filePath)) }; });
handle('dialog-save-file', options => dialog.showSaveDialog(mainWindow, { title: options?.title || 'Сохранить файл', defaultPath: options?.defaultPath || 'emoji.tgs', filters: options?.filters }));
handle('file-save-binary', async (filePath, bytes) => { try { await fs.writeFile(filePath, Buffer.from(bytes)); return { success: true }; } catch (error) { return { success: false, error: error.message }; } });

function sendUpdate(channel, payload) { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload); }
autoUpdater.autoDownload = false;
autoUpdater.on('checking-for-update', () => sendUpdate('update-status', { status: 'checking' }));
autoUpdater.on('update-available', info => sendUpdate('update-status', { status: 'available', version: info.version }));
autoUpdater.on('update-not-available', info => sendUpdate('update-status', { status: 'latest', version: info.version }));
autoUpdater.on('download-progress', progress => sendUpdate('update-progress', { percent: Math.round(progress.percent), transferred: progress.transferred, total: progress.total }));
autoUpdater.on('update-downloaded', info => sendUpdate('update-status', { status: 'downloaded', version: info.version }));
autoUpdater.on('error', error => sendUpdate('update-status', { status: 'error', error: error.message }));
handle('updates:check', async () => { if (!app.isPackaged || process.env.PORTABLE_EXECUTABLE_FILE) return { ok: false, error: 'Автообновление доступно в установленной версии приложения' }; try { const result = await autoUpdater.checkForUpdates(); return { ok: true, updateInfo: result?.updateInfo || null }; } catch (error) { sendUpdate('update-status', { status: 'error', error: error.message }); return { ok: false, error: error.message }; } });
handle('updates:download', async () => { try { await autoUpdater.downloadUpdate(); return { ok: true }; } catch (error) { sendUpdate('update-status', { status: 'error', error: error.message }); return { ok: false, error: error.message }; } });
handle('updates:install', async () => { await Promise.all([...queues.values()]); allowClose = true; autoUpdater.quitAndInstall(); return { ok: true }; });

ipcMain.on('window:renderer-ready', event => { try { ensureSender(event); rendererReady = true; } catch {} });
ipcMain.on('window:close-ready', async (event, success) => { try { ensureSender(event); } catch { return; } if (!closeRequested) return; closeRequested = false; clearTimeout(closeTimer); try { await Promise.all([...queues.values()]); } catch { success = false; } if (!success) { const result = await dialog.showMessageBox(mainWindow, { type: 'warning', buttons: ['Вернуться', 'Закрыть'], defaultId: 0, cancelId: 0, message: 'Не удалось сохранить сессию' }); if (result.response !== 1) return; } allowClose = true; mainWindow.close(); });

async function migrateLegacyData() {
  const marker = path.join(storageRoot(), '.legacy-migration.json');
  if (await readJson(marker)) return;
  const candidates = [path.join(app.getPath('appData'), 'telegram-emoji-studio', 'TelegramEmojiStudio'), path.join(app.getPath('appData'), 'Telegram Emoji Studio', 'TelegramEmojiStudio'), path.join(app.getPath('userData'), 'TelegramEmojiStudio')];
  for (const source of candidates) {
    let files;
    try { files = await fs.readdir(source, { withFileTypes: true }); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    await fs.mkdir(storageRoot(), { recursive: true });
    for (const entry of files) {
      if (entry.name === 'license.json') continue;
      const from = path.join(source, entry.name), to = path.join(storageRoot(), entry.name);
      if (entry.isDirectory() && entry.name === 'projects') {
        await fs.mkdir(to, { recursive: true });
        for (const name of await fs.readdir(from)) {
          if (/^[a-zA-Z0-9_-]+\.json$/.test(name)) {
            try { await fs.copyFile(path.join(from, name), path.join(to, name), require('fs').constants.COPYFILE_EXCL); } catch (error) { if (error.code !== 'EEXIST') throw error; }
          }
        }
      } else if (entry.isFile() && ['settings.json', 'current_session.json'].includes(entry.name)) {
        try { await fs.copyFile(from, to, require('fs').constants.COPYFILE_EXCL); } catch (error) { if (error.code !== 'EEXIST') throw error; }
      }
    }
  }
  await atomicSave(marker, { completedAt: new Date().toISOString() });
}

function createWindow() {
  allowClose = false; rendererReady = false;
  mainWindow = new BrowserWindow({ title: APP_NAME, width: 1420, height: 920, minWidth: 1180, minHeight: 740, frame: false, backgroundColor: '#000000', icon: path.join(__dirname, 'assets', 'icon.ico'), webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  mainWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));
  mainWindow.on('close', event => { if (allowClose || !rendererReady) return; event.preventDefault(); if (!closeRequested) { closeRequested = true; mainWindow.webContents.send('window:prepare-close'); closeTimer = setTimeout(async () => { if (!closeRequested || !mainWindow) return; closeRequested = false; const result = await dialog.showMessageBox(mainWindow, { type: 'warning', buttons: ['Вернуться', 'Закрыть'], defaultId: 0, cancelId: 0, message: 'Приложение не ответило на запрос сохранения' }); if (result.response === 1) { allowClose = true; mainWindow.close(); } }, 10000); } });
  mainWindow.on('closed', () => { mainWindow = null; });
}
app.whenReady().then(async () => {
  try { await migrateLegacyData(); } catch (error) { console.error('Ошибка переноса данных:', error); }
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });

});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });


