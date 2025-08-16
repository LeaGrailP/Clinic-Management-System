const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

let db;

// ✅ Initialize Database
function initDB() {
  const dbPath = path.resolve('D:/Clinic-Management-System/electron/userData/database.db');
  const dbDir = path.dirname(dbPath);
  console.log('📂 Electron is trying to open DB at:', dbPath);

  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  db = new Database(dbPath);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productname TEXT NOT NULL,
      price REAL NOT NULL,
      vatType TEXT NOT NULL,
      vatSales REAL,
      vatAmount REAL,
      vatExempt REAL,
      zeroRated REAL,
      total REAL,
      image TEXT
    )
  `);

  // Patients table
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

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      total REAL,
      items TEXT
    )
  `);

  // Invoice table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      total REAL,
      items TEXT,
      invoice_number TEXT UNIQUE
    )
  `);

  return db;
}

// ✅ Create Electron Window
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

  win.loadURL('http://localhost:3000'); // Nuxt dev or build URL
}

// ✅ App Ready
app.whenReady().then(() => {
  db = initDB();
  createWindow();

  // ----- USERS -----
  ipcMain.handle('login', async (_event, { name, password }) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name);
      if (!user) return { success: false, error: 'User not found' };
      const match = await bcrypt.compare(password, user.password);
      if (!match) return { success: false, error: 'Incorrect password' };
      return { success: true, name: user.name, role: user.role };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Internal login error' };
    }
  });

  ipcMain.handle('auth:register', async (_event, { name, password, role }) => {
    try {
      const hash = await bcrypt.hash(password, 10);
      db.prepare(`INSERT INTO users (name, password, role) VALUES (?, ?, ?)`).run(name, hash, role);
      return { success: true };
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT') return { success: false, error: 'Name already exists' };
      console.error('Register error:', err);
      return { success: false, error: 'Registration failed' };
    }
  });

  // ----- PATIENTS -----
  ipcMain.handle('get-patients', () => db.prepare('SELECT * FROM patients').all());
  ipcMain.handle('add-patient', (_e, p) => db.prepare(`
    INSERT INTO patients (patientname, address, number, business, tin)
    VALUES (?, ?, ?, ?, ?)
  `).run(p.patientname, p.address, p.number, p.business, p.tin));
  ipcMain.handle('update-patient', (_e, p) => db.prepare(`
    UPDATE patients SET patientname = ?, address = ?, number = ?, business = ?, tin = ?
    WHERE id = ?
  `).run(p.patientname, p.address, p.number, p.business, p.tin, p.id));
  ipcMain.handle('delete-patient', (_e, id) => db.prepare('DELETE FROM patients WHERE id = ?').run(id));

  // ----- PRODUCTS -----
  ipcMain.handle('get-products', () => db.prepare('SELECT * FROM products').all());

  ipcMain.handle('add-product', (_e, p) => {
    const stmt = db.prepare(`
      INSERT INTO products
      (productname, price, vatType, vatSales, vatAmount, vatExempt, zeroRated, total, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      p.productname,
      p.price,
      p.vatType,
      p.vatSales,
      p.vatAmount,
      p.vatExempt,
      p.zeroRated,
      p.total,
      p.image
    );
    return { success: true, id: result.lastInsertRowid };
  });

  ipcMain.handle('update-product', (_e, p) => {
    db.prepare(`
      UPDATE products
      SET productname=?, price=?, vatType=?, vatSales=?, vatAmount=?, vatExempt=?, zeroRated=?, total=?, image=?
      WHERE id=?
    `).run(
      p.productname,
      p.price,
      p.vatType,
      p.vatSales,
      p.vatAmount,
      p.vatExempt,
      p.zeroRated,
      p.total,
      p.image,
      p.id
    );
    return { success: true };
  });

  ipcMain.handle('delete-product', (_e, id) => {
    db.prepare('DELETE FROM products WHERE id=?').run(id);
    return { success: true };
  });

  ipcMain.handle('save-product-image', (_e, { imageName, buffer }) => {
    const saveDir = path.join(app.getPath('userData'), 'images');
    if (!fs.existsSync(saveDir)) fs.mkdirSync(saveDir);
    const fullPath = path.join(saveDir, imageName);
    fs.writeFileSync(fullPath, Buffer.from(buffer));
    return fullPath;
  });

  // ----- INVOICES -----
  ipcMain.handle('add-invoice', (_e, invoice) => {
    const lastInvoice = db.prepare(`SELECT invoice_number FROM invoice ORDER BY id DESC LIMIT 1`).get();
    let nextInvoiceNumber = 'INV-000001';
    if (lastInvoice?.invoice_number) {
      const lastNumber = parseInt(lastInvoice.invoice_number.replace('INV-', ''));
      nextInvoiceNumber = `INV-${(lastNumber + 1).toString().padStart(6, '0')}`;
    }
    db.prepare(`
      INSERT INTO invoice (date, total, items, invoice_number)
      VALUES (?, ?, ?, ?)
    `).run(invoice.date, invoice.total, invoice.items, nextInvoiceNumber);
    return { success: true, invoice_number: nextInvoiceNumber };
  });

  ipcMain.handle('generate-invoice-number', () => {
    const lastInvoice = db.prepare(`SELECT invoice_number FROM invoice ORDER BY id DESC LIMIT 1`).get();
    let nextInvoiceNumber = 'INV-000001';
    if (lastInvoice?.invoice_number) {
      const lastNumber = parseInt(lastInvoice.invoice_number.replace('INV-', ''));
      nextInvoiceNumber = `INV-${(lastNumber + 1).toString().padStart(6, '0')}`;
    }
    return nextInvoiceNumber;
  });

  ipcMain.handle('get-all-invoices', () => db.prepare('SELECT * FROM invoice').all());
  ipcMain.handle('delete-invoice', (_e, id) => { db.prepare('DELETE FROM invoice WHERE id=?').run(id); return { success: true }; });

  console.log('✅ All IPC handlers registered');
});
