const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');

let db;

function createDatabase() {
  const dbPath = path.join(__dirname, '../userData/database.db');
  db = new Database(dbPath);

// DB for Daskboard
db.exec(`
  CREATE TABLE IF NOT EXISTS dashboard (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice INTEGER PRIMARY KEY AUTOINCREMENT,
  employee TEXT,
  log_date TEXT DEFAULT (date('now', 'localtime')),     -- YYYY-MM-DD
  log_time TEXT DEFAULT (time('now', 'localtime'))
  )`)


// DB for Products
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

// DB for Patients
db.exec(`
  CREATE TABLE IF NOT EXISTS patients(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patientname TEXT NOT NULL,
  business TEXT,
  address TEXT,
  tin REAL,
  number REAL
)
  `)


//
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    total REAL,
    items TEXT
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


  //---- IPCMain Products -----
   ipcMain.handle('get-products', () => {
    try {
      const stmt = db.prepare('SELECT * FROM products');
      return stmt.all();
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  });


  ipcMain.handle('add-products', (event, product) => {
    const stmt = db.prepare(`
      INSERT INTO products (productname, price, vat, vatAmount, total)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      product.productname,
      product.price,
      product.vat,
      product.vatAmount, 
      product.total
    );
    return { success: true };
  });

  ipcMain.handle('update-product', (event, product) => {
    const stmt = db.prepare(`
      UPDATE products SET productname = ?, price = ?, vat = ?, vatAmount = ?, total = ?
      WHERE id = ?
    `);
    stmt.run(
      product.productname,
      product.price,
      product.vat,
      product.vatAmount,
      product.total,
      product.id
    );
    return { success: true };
  });

  ipcMain.handle('delete-product', (event, id) => {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    stmt.run(id);
    return { success: true };
  });

// ----- Patients ----

ipcMain.handle('get-patients', () => {
  return db.prepare('SELECT * FROM patients').all()
})

ipcMain.handle('add-patient', (event, patient) => {
  db.prepare(`
    INSERT INTO patients (patientname, address, number, business, tin)
    VALUES (?, ?, ?, ?, ?)
  `).run(patient.patientname, patient.address, patient.number, patient.business, patient.tin)
})

ipcMain.handle('update-patient', (event, patient) => {
  db.prepare(`
    UPDATE patients SET patientname = ?, address = ?, number = ?, business = ?, tin = ?
    WHERE id = ?
  `).run(patient.patientname, patient.address, patient.number, patient.business, patient.tin, patient.id)
})

ipcMain.handle('delete-patient', (event, id) => {
  db.prepare('DELETE FROM patients WHERE id = ?').run(id)
})

  console.log('✅ IPC handlers registered');

  createWindow();
});

