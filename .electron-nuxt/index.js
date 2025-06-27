const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');


// 🔥 REMOVE THIS LINE in production!
// if (fs.existsSync('my-database.db')) fs.unlinkSync('my-database.db');

let db;

function createDatabase() {
  console.log('📦 Using database at:', dbPath);

  const dbPath = path.join(app.getPath('userData'), 'my-database.db');
db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      age INTEGER NOT NULL,
      contact TEXT,
      gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')) NOT NULL
    )
  `);

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


ipcMain.handle('add-user', async (event, user) => {
  try {
    const stmt = db.prepare('INSERT INTO users (name, address, age, contact, gender) VALUES (?, ?, ?, ?, ?)');
    stmt.run(user.name, user.address, user.age, user.contact, user.gender);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});


ipcMain.handle('get-users', () => {
  const rows = db.prepare('SELECT * FROM users').all();
  return rows;
});


  ipcMain.handle('add-products', (event, products) => {
    try {
      const stmt = db.prepare('INSERT INTO products (productname, price, vat) VALUES (?, ?, ?)');
      stmt.run(products.productname, products.price, products.vat);
      return { success: true};
    }
    catch (error) {
      console.error('Error adding user:', error);
      return { success: false, error };
    }
  });

  createWindow();
});

