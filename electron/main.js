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
  const fs = require('fs');
  const Database = require('better-sqlite3');
const { app } = require('electron');
const path = require('path');

const dbPath = path.resolve(__dirname, 'userData', 'database.db');

  const dbDir = path.dirname(dbPath);
  console.log('📂 Electron is trying to open DB at:', dbPath); // << debug

  // Ensure folder exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbPath);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      name TEXT NOT NULL,
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
      image TEXT,
      price REAL,
      vat REAL,
      vatAmount REAL,
      total REAL
    )
  `);

  // Patients
  db.exec(`
 CREATE TABLE IF NOT EXISTS clinicpatients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT,
    lastName TEXT,
    middleName TEXT,
    address TEXT,
    phone INTEGER,
    businessStyle TEXT,
    tin INTEGER,
    isSenior INTEGER,
    seniorId TEXT
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

  //Invoice
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

  //PRODUCTiMAGE
  const imagesDir = path.join(app.getPath('userData'), 'product-images');
  if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);

  ipcMain.handle('save-product-image', async (event, { imageName, buffer }) => {
    const fullPath = path.join(imagesDir, imageName);
    fs.writeFileSync(fullPath, Buffer.from(buffer));
    return fullPath;
  });

  // Login
  ipcMain.handle('login', async (_event, { username, password }) => {
    console.log('LOGIN ATTEMPT:', username);

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

//Register
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
  ipcMain.handle('get-patients', () => db.prepare('SELECT * FROM clinicpatients').all());

  ipcMain.handle('add-patient', (_event, clinicPT) => {
    db.prepare(`
    INSERT INTO clinicpatients
    (firstName, lastName, middleName, address, phone, businessStyle, tin, isSenior, seniorId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  });

  ipcMain.handle('update-patient', (_event, clinicPT) => {
    db.prepare(`
      UPDATE patients SET  firstName = ?, lastName = ?, middleName = ?, 
      address = ?, phone = ?, businessStyle = ?, tin = ?, isSenior = ?, seniorId = ? 
      WHERE id = ?
    `).run(
    patient.firstName,
    patient.lastName,
    patient.middleName || '',
    patient.address,
    patient.phone,
    patient.businessStyle,
    patient.tin,
    patient.isSenior ? 1 : 0,
    patient.seniorId || ''
  );
  });

  ipcMain.handle('delete-patient', (_event, id) => {
    db.prepare('DELETE FROM clinicpatients WHERE id = ?').run(id);
  });

  // Products
  ipcMain.handle('get-products', () => db.prepare('SELECT * FROM products').all());

  ipcMain.handle('add-product', (_event, product) => {
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

  console.log('✅ All IPC handlers registered');
});
