const { app, BrowserWindow, ipcMain, protocol } = require('electron')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcryptjs')
const Database = require('better-sqlite3')

// -------------------- DATABASE INIT --------------------
function initDB() {
  const dbPath = path.resolve('C:/Clinic-Management-System/electron/userData/database.db')
  const database = new Database(dbPath)
  database.pragma('journal_mode = WAL')

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      password TEXT,
      role TEXT
    );
  `)

  // --- Create tables if missing ---
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      password TEXT,
      role TEXT
    );
  `)

  database.exec(`
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
    );
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS clinicpatients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      lastName TEXT,
      middleName TEXT,
      address TEXT,
      phone TEXT,
      businessStyle TEXT,
      tin REAL,
      isSenior INTEGER,
      seniorId TEXT,
      isPWD INTEGER,
      pwdId TEXT
    );
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      total REAL,
      items TEXT
    );
  `)

  database.exec(`
    CREATE TABLE IF NOT EXISTS invoice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      total REAL,
      items TEXT,
      invoice_number TEXT UNIQUE
    );
  `)

    return database
}

const db = initDB()

// -------------------- CREATE MAIN WINDOW --------------------
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const baseDir = path.join(__dirname, '../dist');
  const indexPath = path.join(baseDir, 'index.html');
  console.log('📦 Loading:', indexPath);

  // Always load the SPA root
  mainWindow.loadFile(indexPath);

  // Prevent navigation to real folders (let Vue Router handle)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) {
      event.preventDefault();
      mainWindow.loadFile(indexPath);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('file://')) {
      mainWindow.loadFile(indexPath);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.webContents.openDevTools();
}

// -------------------- APP READY --------------------
app.whenReady().then(() => {
  // ⚙️ Register a safe custom protocol
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.replace('app://', '')
    const filePath = path.normalize(`${process.resourcesPath}/${url}`)
    callback({ path: filePath })
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})



// -------------------- IPC HANDLERS --------------------

// USER HANDLERS
ipcMain.handle('auth:register', async (_e, { name, password, role }) => {
  try {
    const hashed = await bcrypt.hash(password, 10);
    const insert = db.prepare('INSERT INTO users (name, password, role) VALUES (?, ?, ?)');
    const tx = db.transaction(() => insert.run(name, hashed, role));
    tx();
    return { success: true };
  } catch (err) {
    console.error('Register error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('checkAdmin', () => {
  const row = db.prepare("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1").get();
  return !!row;
});

ipcMain.handle('createAdmin', (_e, { name, password }) => {
  try {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare("INSERT INTO users (name, password, role) VALUES (?, ?, 'admin')").run(name, hash);
    return { success: true };
  } catch (err) {
    console.error('createAdmin error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('login', (_e, { role, name, password }) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE role = ? AND name = ? LIMIT 1').get(role, name);
    if (!user) return { success: false, error: 'User not found' };
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) return { success: false, error: 'Invalid password' };
    return { success: true, name: user.name, role: user.role };
  } catch (err) {
    console.error('login error:', err);
    return { success: false, error: err.message };
  }
});

// PATIENTS
ipcMain.handle('get-patients', () => db.prepare('SELECT * FROM clinicpatients').all());

ipcMain.handle('add-patient', (_e, p) => {
  db.prepare(`
    INSERT INTO clinicpatients
    (firstName, lastName, middleName, address, phone, businessStyle, tin, isSenior, seniorId, isPWD, pwdId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(p.firstName, p.lastName, p.middleName || '', p.address, p.phone, p.businessStyle, p.tin, p.isSenior ? 1 : 0, p.seniorId || '', p.isPWD ? 1 : 0, p.pwdId || '');
  return { success: true };
});

ipcMain.handle('update-patient', (_e, p) => {
  db.prepare(`
    UPDATE clinicpatients
    SET firstName=?, lastName=?, middleName=?, address=?, phone=?, businessStyle=?, tin=?, isSenior=?, seniorId=?, isPWD=?, pwdId=?
    WHERE id=?
  `).run(p.firstName, p.lastName, p.middleName || '', p.address, p.phone, p.businessStyle, p.tin, p.isSenior ? 1 : 0, p.seniorId || '', p.isPWD ? 1 : 0, p.pwdId || '', p.id);
  return { success: true };
});

ipcMain.handle('delete-patient', (_e, id) => {
  db.prepare('DELETE FROM clinicpatients WHERE id=?').run(id);
  return { success: true };
});

// PRODUCTS
ipcMain.handle('get-products', () => db.prepare('SELECT * FROM products').all());

ipcMain.handle('add-product', (_e, p) => {
  const stmt = db.prepare(`
    INSERT INTO products
    (productname, price, vatType, vatSales, vatAmount, vatExempt, zeroRated, total, image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(p.productname, p.price, p.vatType, p.vatSales, p.vatAmount, p.vatExempt, p.zeroRated, p.total, p.image);
  return { success: true, id: info.lastInsertRowid };
});

ipcMain.handle('update-product', (_e, p) => {
  db.prepare(`
    UPDATE products
    SET productname=?, price=?, vatType=?, vatSales=?, vatAmount=?, vatExempt=?, zeroRated=?, total=?, image=?
    WHERE id=?
  `).run(p.productname, p.price, p.vatType, p.vatSales, p.vatAmount, p.vatExempt, p.zeroRated, p.total, p.image, p.id);
  return { success: true };
});

ipcMain.handle('delete-product', (_e, id) => {
  db.prepare('DELETE FROM products WHERE id=?').run(id);
  return { success: true };
});

ipcMain.handle('save-product-image', async (_e, { imageName, buffer }) => {
  const imgDir = path.join(app.getPath('userData'), 'images');
  if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
  const imagePath = path.join(imgDir, imageName);
  fs.writeFileSync(imagePath, Buffer.from(buffer));
  return imagePath;
});

// INVOICES
ipcMain.handle('add-invoice', (_e, invoice) => {
  const last = db.prepare(`SELECT invoice_number FROM invoice ORDER BY id DESC LIMIT 1`).get();
  let next = 'INV-000001';
  if (last?.invoice_number) {
    const num = parseInt(last.invoice_number.replace('INV-', ''));
    next = `INV-${(num + 1).toString().padStart(6, '0')}`;
  }
  db.prepare(`INSERT INTO invoice (date, total, items, invoice_number) VALUES (?, ?, ?, ?)`)
    .run(invoice.date, invoice.total, invoice.items, next);
  return { success: true, invoice_number: next };
});

ipcMain.handle('generate-invoice-number', () => {
  const last = db.prepare(`SELECT invoice_number FROM invoice ORDER BY id DESC LIMIT 1`).get();
  let next = 'INV-000001';
  if (last?.invoice_number) {
    const num = parseInt(last.invoice_number.replace('INV-', ''));
    next = `INV-${(num + 1).toString().padStart(6, '0')}`;
  }
  return next;
});

ipcMain.handle('get-all-invoices', () => db.prepare('SELECT * FROM invoice').all());

ipcMain.handle('delete-invoice', (_e, id) => {
  db.prepare('DELETE FROM invoice WHERE id=?').run(id);
  return { success: true };
});


// -------------------- QUIT --------------------
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})