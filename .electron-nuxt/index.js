const { app, BrowserWindow } = require('electron');
const path = require('path');

let win;

function createWindow () {
  console.log('Creating window...');

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Allow loading local dev server
    }
  });

  // Load Nuxt dev server
  win.loadURL('http://localhost:3000');

  // Open DevTools to debug white screen
  win.webContents.openDevTools();

  // Log load failures
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`Failed to load ${validatedURL}: ${errorDescription} (code: ${errorCode})`);
  });

  // Log renderer crashes
  win.webContents.on('crashed', () => {
    console.error('Electron window has crashed');
  });
}

// Disable hardware acceleration (fixes certain white screen issues)
app.disableHardwareAcceleration();

// App ready
app.whenReady().then(() => {
  console.log('App is ready');
  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Re-create window on macOS
app.on('activate', () => {
  console.log('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
