const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const Database = require('better-sqlite3')

let db // 👈 declare once (will assign later)

// -------------------- DATABASE INIT --------------------
function initDB() {
  // Always relative to THIS file's folder (electron/main.js)
  const dbPath = path.resolve('C:/Clinic-Management-System/electron/userData/database.db')
  const database = new Database(dbPath) // 👈 use local var, not let db again

  // Enable WAL mode to reduce locking issues
  database.pragma('journal_mode = WAL')

  // Users table
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `)

  // Products table
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
    )
  `)

  // Patients table
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
    )
  `)

  // Transactions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      total REAL,
      items TEXT
    )
  `)

  // Invoice table
  database.exec(`
    CREATE TABLE IF NOT EXISTS invoice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      total REAL,
      items TEXT,
      invoice_number TEXT UNIQUE
    )
  `)

  return database // 👈 return instance
}

// -------------------- ELECTRON WINDOW --------------------
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadURL('http://localhost:3000') // Nuxt dev/build URL
}

// -------------------- APP READY --------------------
app.whenReady().then(() => {
  db = initDB()   // 👈 assign once here
  createWindow()


  // -------------------- USERS --------------------

ipcMain.handle('auth:register', async (event, { name, password, role }) => {
  try {
    const hashed = await bcrypt.hash(password, 10)

    // Prepare insert
    const insert = db.prepare(
      'INSERT INTO users (name, password, role) VALUES (?, ?, ?)'
    )

    // Transaction ensures DB isn’t locked by partial writes
    const transaction = db.transaction((name, hashed, role) => {
      insert.run(name, hashed, role)
    })

    transaction(name, hashed, role)

    return { success: true }
  } catch (err) {
    console.error('Register error:', err)
    return { success: false, error: err.message }
  }
})

// -------------------- CHECK IF ADMIN EXISTS --------------------
ipcMain.handle('check-admin', async () => {
  try {
    const row = db.prepare('SELECT 1 FROM users WHERE role = ? LIMIT 1').get('admin')
    return !!row // true if admin exists
  } catch (err) {
    console.error('check-admin error:', err)
    throw err
  }
})

// -------------------- LOGIN --------------------
ipcMain.handle('login', async (event, { name, password }) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return { success: false, error: 'Invalid password' }
    }

    return { success: true, name: user.name, role: user.role }
  } catch (err) {
    console.error('login error:', err)
    return { success: false, error: err.message }
  }
})


  // -------------------- PATIENTS --------------------
  ipcMain.handle('get-patients', () => db.prepare('SELECT * FROM clinicpatients').all())

  ipcMain.handle('add-patient', (_event, patient) => {
    db.prepare(`
      INSERT INTO clinicpatients
      (firstName, lastName, middleName, address, phone, businessStyle, tin, isSenior, seniorId, isPWD, pwdId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      patient.firstName,
      patient.lastName,
      patient.middleName || '',
      patient.address,
      patient.phone,
      patient.businessStyle,
      patient.tin,
      patient.isSenior ? 1 : 0,
      patient.seniorId || '',
      patient.isPWD ? 1 : 0,
      patient.pwdId || ''
    )
    return { success: true }
  })

  ipcMain.handle('update-patient', (_e, patient) => {
    db.prepare(`
      UPDATE clinicpatients
      SET firstName=?, lastName=?, middleName=?, address=?, phone=?, businessStyle=?, tin=?, isSenior=?, seniorId=?, isPWD=?, pwdId=?
      WHERE id=?
    `).run(
      patient.firstName,
      patient.lastName,
      patient.middleName || '',
      patient.address,
      patient.phone,
      patient.businessStyle,
      patient.tin,
      patient.isSenior ? 1 : 0,
      patient.seniorId || '',
      patient.isPWD ? 1 : 0,
      patient.pwdId || '',
      patient.id
    )
    return { success: true }
  })

  ipcMain.handle('delete-patient', (_event, id) => {
    db.prepare('DELETE FROM clinicpatients WHERE id = ?').run(id)
    return { success: true }
  })

  // -------------------- PRODUCTS --------------------
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
      (productname, price, vatType, vatSales, vatAmount, vatExempt, zeroRated, total, image)
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
      p.total,
      p.image
    )
    return { success: true, id: info.lastInsertRowid }
  })

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
    )
    return { success: true }
  })

  ipcMain.handle('delete-product', (_e, id) => {
    db.prepare('DELETE FROM products WHERE id=?').run(id)
    return { success: true }
  })

ipcMain.handle('save-product-image', async (event, { imageName, buffer }) => {
  const imagePath = path.join(app.getPath('userData'), 'images', imageName)
  fs.writeFileSync(imagePath, Buffer.from(buffer))
  return imagePath // 👈 this is stored in DB
})

  // -------------------- INVOICES --------------------
  ipcMain.handle('add-invoice', (_e, invoice) => {
    const lastInvoice = db.prepare(`SELECT invoice_number FROM invoice ORDER BY id DESC LIMIT 1`).get()
    let nextInvoiceNumber = 'INV-000001'
    if (lastInvoice?.invoice_number) {
      const lastNumber = parseInt(lastInvoice.invoice_number.replace('INV-', ''))
      nextInvoiceNumber = `INV-${(lastNumber + 1).toString().padStart(6, '0')}`
    }
    db.prepare(`
      INSERT INTO invoice (date, total, items, invoice_number)
      VALUES (?, ?, ?, ?)
    `).run(invoice.date, invoice.total, invoice.items, nextInvoiceNumber)
    return { success: true, invoice_number: nextInvoiceNumber }
  })

  ipcMain.handle('generate-invoice-number', () => {
    const lastInvoice = db.prepare(`SELECT invoice_number FROM invoice ORDER BY id DESC LIMIT 1`).get()
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
})

// -------------------- APP CLOSE --------------------
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
