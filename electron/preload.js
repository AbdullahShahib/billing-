// ═══════════════════════════════════════════════════
//  VegiBill TN — Electron Preload Script
//  Secure bridge between main and renderer processes
// ═══════════════════════════════════════════════════

const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
});
