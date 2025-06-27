const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');


let db;

function createDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'my-database.db');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productname TEXT NOT NULL,
      price REAL,
      vat REAL
    )
  `);
  
}


function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadURL('http://localhost:3000');
}

app.whenReady().then(() => {
  createDatabase();


ipcMain.handle('get-products', () => {
  try {
    const stmt = db.prepare('SELECT * FROM products');
    return stmt.all();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
});

  ipcMain.handle('add-products', (event, products) => {
    try {
      const stmt = db.prepare('INSERT INTO products (productname, price, vat) VALUES (?, ?, ?)');
      stmt.run(products.productname, products.price, products.vat);
      return { success: true};
    }
    catch (error) {
      console.error('Error adding products:', error);
      return { success: false, error };
    }
  });

  createWindow();
});

