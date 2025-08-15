const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

let db;

// ✅ Path to DB
const dbPath = path.join(app.getPath('userdata'), 'database.db');
console.log('📂 Electron is trying to open DB at:', dbPath);

// ✅ Create or open DB and tables
function initDB() {
  try {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    const dbInstance = new Database(dbPath);
    console.log('✅ Database opened successfully');

    // Users
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      )
    `);

    // Products
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productname TEXT NOT NULL,
        image TEXT,
        price REAL,
        vat REAL,
        vatAmount REAL,
        total REAL
      )
    `);

    // Patients
    dbInstance.exec(`
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
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        total REAL,
        items TEXT
      )
    `);

    // Invoice
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS invoice (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        total REAL,
        items TEXT,
        invoice_number TEXT UNIQUE
      )
    `);

    return dbInstance;
  } catch (err) {
    console.error('❌ Failed to open DB:', err);
    app.quit();
  }
}

// ✅ Seed default admin
function ensureDefaultAdmin(db) {
  try {
    const username = 'admin2@example.com';
    const existing = db.prepare('SELECT 1 FROM users WHERE username = ?').get(username);

    if (!existing) {
      const name = 'Ai Ly';
      const password = 'securepass456';
      const role = 'admin';
      const hash = bcrypt.hashSync(password, 10);

      db.prepare(`
        INSERT INTO users (name, username, password, role)
        VALUES (?, ?, ?, ?)
      `).run(name, username, hash, role);

      console.log(`✅ Seeded default admin "${username}"`);
    } else {
      console.log(`ℹ️ Admin "${username}" already exists — skipping seed`);
    }
  } catch (err) {
    console.error('❌ Failed to seed default admin:', err);
  }
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

  win.loadURL('http://localhost:3000'); // Or Nuxt build path
}

// ✅ App ready
app.whenReady().then(() => {
  db = initDB();
  ensureDefaultAdmin(db);
  createWindow();

  // Product images folder
  const imagesDir = path.join(app.getPath('userData'), 'product-images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

  // -------------------- IPC HANDLERS --------------------

  ipcMain.handle('save-product-image', async (event, { imageName, buffer }) => {
    const fullPath = path.join(imagesDir, imageName);
    fs.writeFileSync(fullPath, Buffer.from(buffer));
    return fullPath;
  });

  // Login
  ipcMain.handle('login', async (_event, { username, password }) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
      if (!user) return { success: false, error: 'User not found' };

      const match = await bcrypt.compare(password, user.password);
      if (!match) return { success: false, error: 'Incorrect password' };

      return { success: true, name: user.name, username: user.username, role: user.role };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Internal login error' };
    }
  });

  // Register
  ipcMain.handle('auth:register', async (_event, { name, username, password, role }) => {
    try {
      if (!name || !username || !password || !role) {
        return { success: false, error: 'All fields are required' };
      }

      const hash = await bcrypt.hash(password, 10);
      db.prepare(`INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)`)
        .run(name, username, hash, role);
      return { success: true };
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        return { success: false, error: 'Username already exists' };
      }
      console.error('Register error:', err);
      return { success: false, error: 'Registration failed' };
    }
  });

  // Patients
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

  // Products
  ipcMain.handle('get-products', () => db.prepare('SELECT * FROM products').all());

  ipcMain.handle('add-products', (_event, product) => {
    db.prepare(`
      INSERT INTO products (productname, price, vat, vatAmount, total, image)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(product.productname, product.price, product.vat, product.vatAmount, product.total, product.image);
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

  // Invoice
  ipcMain.handle('add-invoice', (_event, invoice) => {
    const lastInvoice = db.prepare(`
      SELECT invoice_number FROM invoice 
      ORDER BY id DESC LIMIT 1
    `).get();

    let nextInvoiceNumber = 'INV-000001';
    if (lastInvoice?.invoice_number) {
      const lastNumber = parseInt(lastInvoice.invoice_number.replace('INV-', ''));
      const nextNumber = (lastNumber + 1).toString().padStart(6, '0');
      nextInvoiceNumber = `INV-${nextNumber}`;
    }

    db.prepare(`
      INSERT INTO invoice (date, total, items, invoice_number)
      VALUES (?, ?, ?, ?)
    `).run(invoice.date, invoice.total, invoice.items, nextInvoiceNumber);

    return { success: true, invoice_number: nextInvoiceNumber };
  });

  ipcMain.handle('generate-invoice-number', () => {
    const lastInvoice = db.prepare(`
      SELECT invoice_number FROM invoice 
      ORDER BY id DESC LIMIT 1
    `).get();

    let nextInvoiceNumber = 'INV-000001';
    if (lastInvoice?.invoice_number) {
      const lastNumber = parseInt(lastInvoice.invoice_number.replace('INV-', ''));
      const nextNumber = (lastNumber + 1).toString().padStart(6, '0');
      nextInvoiceNumber = `INV-${nextNumber}`;
    }

    return nextInvoiceNumber;
  });

  console.log('✅ All IPC handlers registered');
});