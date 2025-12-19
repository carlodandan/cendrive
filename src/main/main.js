import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import setupIpcHandlers from './ipcHandlers.js';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) app.quit();

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1200,
    minHeight: 800,
    resizable: true,
    maximizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      webSecurity: true,
      defaultFontSize: 12
    },
    icon: path.join(__dirname, '../../icons/cendrive.ico'),
    show: false,
    backgroundColor: '#fff',
    titleBarStyle: 'hiddenInset',
    frame: true
  });

  // Setup IPC handlers
  setupIpcHandlers(ipcMain)

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/src/index.html'));
  }

  // Show once everything is loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();

    // Making sure that the app is maximize
    mainWindow.maximize();
  })

};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  // Import the database service instance
  import('../services/database/DatabaseService.js').then(({ default: databaseService }) => {
    databaseService.close()
  }).catch(console.error)
})