const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite = require('./sqlite');

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js') // Preload bridge
    }
  });

  mainWindow.loadURL('http://localhost:3000');
});

ipcMain.handle('insert-transaction', async (_event, data) => {
  sqlite.insertTransaction(data);
  return true;
});

ipcMain.handle('get-transactions', async () => {
  return sqlite.getTransactions();
});
