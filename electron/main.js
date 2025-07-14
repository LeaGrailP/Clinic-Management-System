const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

let db;

// ✅ Create or open the DB
function initDB() {
  const fs = require('fs');
  const path = require('path');
  const Database = require('better-sqlite3');

  const dbDir = path.join(__dirname, './userData');
  const dbPath = path.join(dbDir, 'database.db');

  console.log('📂 Electron is trying to open DB at:', dbPath); // << debug

  // Ensure folder exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);

  // Products
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productname TEXT NOT NULL,
      price REAL,
      vat REAL,
      vatAmount REAL,
      total REAL
    )
  `);

  // Patients
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patientname TEXT NOT NULL,
      business TEXT,
      address TEXT,
      tin REAL,
      number REAL
    )
  `);

  // Transactions
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      total REAL,
      items TEXT
    )
  `);

  return db;
}

// ✅ Create Electron window
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadURL('http://localhost:3000'); // Or use Nuxt build path
}

// ✅ Setup Electron + DB + Handlers
app.whenReady().then(() => {
  db = initDB();
  createWindow();

  // ✅ Auth Handlers
  ipcMain.handle('login', async (_event, { username, password }) => {
    console.log('LOGIN ATTEMPT:', username);

    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!user) return { success: false, error: 'User not found' };

      const match = await bcrypt.compare(password, user.password);
      if (!match) return { success: false, error: 'Incorrect password' };

      return { success: true, username: user.username, role: user.role };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Internal login error' };
    }
  });

  ipcMain.handle('auth:register', async (_event, { username, password, role }) => {
    try {
      const hash = await bcrypt.hash(password, 10);
      db.prepare(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`).run(username, hash, role);
      return { success: true };
    } catch (err) {
      console.error('Register error:', err);
      return { success: false, error: 'User exists or DB error' };
    }
  });

  // ✅ Patients
  ipcMain.handle('get-patients', () => db.prepare('SELECT * FROM patients').all());

  ipcMain.handle('add-patient', (_event, patient) => {
    db.prepare(`
      INSERT INTO patients (patientname, address, number, business, tin)
      VALUES (?, ?, ?, ?, ?)
    `).run(patient.patientname, patient.address, patient.number, patient.business, patient.tin);
  });

  ipcMain.handle('update-patient', (_event, patient) => {
    db.prepare(`
      UPDATE patients SET patientname = ?, address = ?, number = ?, business = ?, tin = ?
      WHERE id = ?
    `).run(patient.patientname, patient.address, patient.number, patient.business, patient.tin, patient.id);
  });

  ipcMain.handle('delete-patient', (_event, id) => {
    db.prepare('DELETE FROM patients WHERE id = ?').run(id);
  });

  // ✅ Products
  ipcMain.handle('get-products', () => db.prepare('SELECT * FROM products').all());

  ipcMain.handle('add-products', (_event, product) => {
    db.prepare(`
      INSERT INTO products (productname, price, vat, vatAmount, total)
      VALUES (?, ?, ?, ?, ?)
    `).run(product.productname, product.price, product.vat, product.vatAmount, product.total);
    return { success: true };
  });

  ipcMain.handle('update-product', (_event, product) => {
    db.prepare(`
      UPDATE products SET productname = ?, price = ?, vat = ?, vatAmount = ?, total = ?
      WHERE id = ?
    `).run(product.productname, product.price, product.vat, product.vatAmount, product.total, product.id);
    return { success: true };
  });

  ipcMain.handle('delete-product', (_event, id) => {
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return { success: true };
  });

  console.log('✅ All IPC handlers registered');
});