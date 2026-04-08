// ═══════════════════════════════════════════════════
//  VegiBill TN — Electron Main Process
//  Desktop app using Electron (Windows, Mac, Linux)
// ═══════════════════════════════════════════════════

const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = process.argv.includes('--dev');

let mainWindow;

// ── CREATE WINDOW ────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  const startUrl = isDev
    ? 'http://localhost:8000' // Development: serve from local server
    : `file://${path.join(__dirname, '../www/index.html')}`; // Production: serve from bundled files

  mainWindow.loadURL(startUrl);

  if (isDev) mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── APP EVENTS ───────────────────────────────────────
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// ── MENU ─────────────────────────────────────────────
const template = [
  {
    label: 'File',
    submenu: [
      { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
    ],
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About VegiBill TN',
        click: () => {
          const { dialog } = require('electron');
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About VegiBill TN',
            message: 'VegiBill TN v1.0.0',
            detail: 'Tamil Nadu Market Billing System\n\nWorks on Android, iOS, Web & Desktop.\nNo server needed. All data stored locally.',
          });
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

// ── IPC HANDLERS (Optional: for advanced features) ──
ipcMain.handle('get-app-version', () => app.getVersion());
