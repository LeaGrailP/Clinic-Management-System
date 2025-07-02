const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let db;

function createDatabase() {
  const dbPath = path.join(__dirname, '../userData/database.db');
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
    return stmt.all(); // Returns an array of product objects
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
});




ipcMain.handle('add-products', (event, product) => {
  try {
    const stmt = db.prepare(
      'INSERT INTO products (productname, price, vat) VALUES (?, ?, ?)'
    );
    stmt.run(product.productname, product.price, product.vat);
    return { success: true };
  } catch (error) {
    console.error('Error adding product:', error);
    return { success: false, error };
  }
});

  createWindow();
});

