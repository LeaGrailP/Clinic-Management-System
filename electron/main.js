
const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const express = require('express')
const serveStatic = require('serve-static')
const bcrypt = require('bcryptjs')
const Database = require('better-sqlite3')
const { setupPrinterHandlers } = require('./printer')

let db
let win

// -------------------- APP READY --------------------
app.whenReady().then(() => {
  db = initDB()
  createWindow()
  setupPrinterHandlers(ipcMain, BrowserWindow, app)
  registerIPCHandlers()
})

// -------------------- DATABASE INIT --------------------
function initDB() {
  const dbDir = app.getPath('userData')

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const dbPath = path.join(dbDir, 'DBTrial.db')
  const db = new Database(dbPath)

  console.log('🧭 Using DB at:', dbPath)

  // Optimize SQLite
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 5000')


  // ---------------------Users table------------------
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      password TEXT,
      role TEXT,
      newPassword TEXT,
      oldName TEXT,
      newName TEXT
    )
  `)

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
      total REAL
    )
  `)

  // Patients table
  db.exec(`
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
    )
  `)

  // Transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      total REAL,
      items TEXT
    )
  `)

  // Invoice table
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      total REAL,
      items TEXT,
      invoice_number TEXT UNIQUE
    )
  `)

  console.log('✅ Tables verified / created')
  return db
}

// -------------------- ELECTRON WINDOW --------------------
function createWindow() {
  const nuxtDist = path.join(__dirname, "../.output/public");
  const port = 3001;

  const server = express();
  server.use(serveStatic(nuxtDist));

  server.listen(port, () => {
    console.log(`Serving Nuxt at http://localhost:${port}`);
    
   win = new BrowserWindow({
  width: 1200,
  height: 800,
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false

  }
});


    win.loadURL(`http://localhost:${port}`);
  });
}

// -------------------- IPC HANDLERS --------------------
function registerIPCHandlers() {


  // ---------- USERS ----------
  ipcMain.handle('auth:register', async (_event, { name, password, role }) => {
    try {
      const hashed = await bcrypt.hash(password, 10)
      const insert = db.prepare('INSERT INTO users (name, password, role) VALUES (?, ?, ?)')
      db.transaction((name, hashed, role) => insert.run(name, hashed, role))(name, hashed, role)
      return { success: true }
    } catch (err) {
      console.error('Register error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('checkAdmin', () => {
    try {
      const row = db.prepare("SELECT 1 FROM users WHERE role='admin' LIMIT 1").get()
      return !!row
    } catch (err) {
      console.error('checkAdmin error:', err)
      throw err
    }
  })

  ipcMain.handle('createAdmin', (_event, { name, password }) => {
    try {
      const hash = bcrypt.hashSync(password, 10)
      db.prepare("INSERT INTO users (name, password, role) VALUES (?, ?, 'admin')").run(name, hash)
      return { success: true }
    } catch (err) {
      console.error('createAdmin error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('login', (_event, { role, name, password }) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE role=? AND name=? LIMIT 1').get(role, name)
      if (!user) return { success: false, error: 'User not found' }
      const valid = bcrypt.compareSync(password, user.password)
      if (!valid) return { success: false, error: 'Invalid password' }
      return { success: true, name: user.name, role: user.role }
    } catch (err) {
      console.error('login error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('user:updateName', (_event, { oldName, newName }) => {
  try {
    const stmt = db.prepare("UPDATE users SET name = ? WHERE name = ?");
    const info = stmt.run(newName, oldName);

    return { success: info.changes > 0 };
  } catch (err) {
    console.error("Update name error:", err);
    return { success: false, error: err.message };
  }
});


  ipcMain.handle('reset-password', (event, { name, newPassword }) => {
  const hashed = bcrypt.hashSync(newPassword, 10)
  const stmt = db.prepare(`UPDATE users SET password = ? WHERE name = ?`)
  const info = stmt.run(hashed, name)

  return { success: info.changes > 0 }
})


  // ---------- PATIENTS ----------
  ipcMain.handle('get-patients', () => db.prepare('SELECT * FROM clinicpatients').all())

  ipcMain.handle('add-patient', (_e, p) => {
    db.prepare(`
      INSERT INTO clinicpatients
      (firstName, lastName, middleName, address, phone, businessStyle, tin, isSenior, seniorId, isPWD, pwdId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.firstName, p.lastName, p.middleName || '',
      p.address, p.phone, p.businessStyle,
      p.tin, p.isSenior ? 1 : 0, p.seniorId || '',
      p.isPWD ? 1 : 0, p.pwdId || ''
    )
    return { success: true }
  })

  ipcMain.handle('update-patient', (_e, p) => {
    db.prepare(`
      UPDATE clinicpatients
      SET firstName=?, lastName=?, middleName=?, address=?, phone=?, businessStyle=?, tin=?, isSenior=?, seniorId=?, isPWD=?, pwdId=?
      WHERE id=?
    `).run(
      p.firstName, p.lastName, p.middleName || '',
      p.address, p.phone, p.businessStyle,
      p.tin, p.isSenior ? 1 : 0, p.seniorId || '',
      p.isPWD ? 1 : 0, p.pwdId || '', p.id
    )
    return { success: true }
  })

  ipcMain.handle('delete-patient', (_e, id) => {
    db.prepare('DELETE FROM clinicpatients WHERE id=?').run(id)
    return { success: true }
  })

  // ---------- PRODUCTS ----------
  ipcMain.handle('get-products', () => {
  const rows = db.prepare('SELECT * FROM products').all()
  return rows.map(p => {
    let vatSales = 0, vatAmount = 0, vatExempt = 0, zeroRated = 0
    if (p.vatType === 'vatable') {
      vatSales = p.price
      vatAmount = p.price * 0.12
    } else if (p.vatType === 'exempt') {
      vatExempt = p.price
    } else if (p.vatType === 'zero') {
      zeroRated = p.price
    }
    return {
      ...p,
      vatSales,
      vatAmount,
      vatExempt,
      zeroRated,
      total: p.price + vatAmount
    }
  })
})
  ipcMain.handle('add-product', (_e, p) => {
    const stmt = db.prepare(`
      INSERT INTO products
      (productname, price, vatType, vatSales, vatAmount, vatExempt, zeroRated, total)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const info = stmt.run(
      p.productname,
      p.price,
      p.vatType,
      p.vatSales,
      p.vatAmount,
      p.vatExempt,
      p.zeroRated,
      p.total
    )
    return { success: true, id: info.lastInsertRowid }
  })

  ipcMain.handle('update-product', (_e, p) => {
    db.prepare(`
      UPDATE products
      SET productname=?, price=?, vatType=?, vatSales=?, vatAmount=?, vatExempt=?, zeroRated=?, total=?
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
      p.id
    )
    return { success: true }
  })

  ipcMain.handle('delete-product', (_e, id) => {
    db.prepare('DELETE FROM products WHERE id=?').run(id)
    return { success: true }
  })
  // ---------- INVOICES ----------
  ipcMain.handle('add-invoice', (_e, invoice) => {
    const lastInvoice = db.prepare('SELECT invoice_number FROM invoice ORDER BY id DESC LIMIT 1').get()
    let nextInvoiceNumber = 'INV-000001'
    if (lastInvoice?.invoice_number) {
      const lastNumber = parseInt(lastInvoice.invoice_number.replace('INV-', ''))
      nextInvoiceNumber = `INV-${(lastNumber + 1).toString().padStart(6, '0')}`
    }
    db.prepare('INSERT INTO invoice (date, total, items, invoice_number) VALUES (?, ?, ?, ?)')
      .run(invoice.date, invoice.total, invoice.items, nextInvoiceNumber)
    return { success: true, invoice_number: nextInvoiceNumber }
  })

  ipcMain.handle('generate-invoice-number', () => {
    const lastInvoice = db.prepare('SELECT invoice_number FROM invoice ORDER BY id DESC LIMIT 1').get()
    let nextInvoiceNumber = 'INV-000001'
    if (lastInvoice?.invoice_number) {
      const lastNumber = parseInt(lastInvoice.invoice_number.replace('INV-', ''))
      nextInvoiceNumber = `INV-${(lastNumber + 1).toString().padStart(6, '0')}`
    }
    return nextInvoiceNumber
  })

  ipcMain.handle('get-all-invoices', () => db.prepare('SELECT * FROM invoice').all())
  ipcMain.handle('delete-invoice', (_e, id) => {
    db.prepare('DELETE FROM invoice WHERE id=?').run(id)
    return { success: true }
  })

  console.log('✅ All IPC handlers registered')
}

// -------------------- APP CLOSE --------------------
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
