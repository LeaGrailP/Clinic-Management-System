
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

  const dbPath = path.join(dbDir, 'DB3.db')
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
      newName TEXT,
      masterPin TEXT
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
    customer_name TEXT,
    customer_tin TEXT,
    patient_id INTEGER,
    vat_sales REAL,
    vat_amount REAL,
    vat_exempt_sales REAL,
    zero_rated_sales REAL,
    discount REAL,
    total REAL,
    items TEXT,
    invoice_number TEXT UNIQUE,
    issued_by Text
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

ipcMain.handle('createAdmin', (_event, { name, password, pin }) => {
  try {
    const hash = bcrypt.hashSync(password, 10)
    const pinHash = bcrypt.hashSync(pin, 10)

    db.prepare(`
      INSERT INTO users (name, password, role, masterPin)
      VALUES (?, ?, 'admin', ?)
    `).run(name, hash, pinHash)

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


ipcMain.handle('reset-password', async (_event, { name, newName, newPassword, pin }) => {
  try {
    // 1. Fetch admin master PIN
    const admin = db.prepare(`
      SELECT masterPin FROM users
      WHERE role = 'admin'
      LIMIT 1
    `).get()

    if (!admin?.masterPin) {
      return { success: false, error: "No master PIN found. Admin must set it up." }
    }

    // 2. Validate PIN
    const validPin = bcrypt.compareSync(pin, admin.masterPin)
    if (!validPin) return { success: false, error: "Invalid master PIN." }

    // 3. Prevent name conflicts
    if (newName && newName !== name) {
      const exists = db.prepare(`SELECT 1 FROM users WHERE name = ?`).get(newName)
      if (exists) {
        return { success: false, error: "This name is already in use." }
      }
    }

    const hashed = bcrypt.hashSync(newPassword, 10)

    // 4. Update both name + password safely
    const stmt = db.prepare(`
      UPDATE users
      SET password = ?, name = COALESCE(?, name)
      WHERE name = ?
    `)

    const info = stmt.run(hashed, newName || null, name)

    return { success: info.changes > 0 }
  } catch (err) {
    console.error("reset-password error:", err)
    return { success: false, error: err.message }
  }
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

  // 🔍 Search Patients (Name + TIN)
ipcMain.handle('search-patients', (_event, query) => {
  try {
    const stmt = db.prepare(`
      SELECT id, firstName, middleName, lastName, tin
      FROM clinicpatients
      WHERE firstName LIKE ?
         OR middleName LIKE ?
         OR lastName LIKE ?
         OR tin LIKE ?
      LIMIT 20
    `)

    const like = `%${query}%`
    const results = stmt.all(like, like, like, like)

    return results
  } catch (err) {
    console.error('search-patients error:', err)
    return []
  }
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
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
ipcMain.handle('add-invoice', (_e, inv) => {
  const last = db.prepare('SELECT invoice_number FROM invoice ORDER BY id DESC LIMIT 1').get()
  let nextNumber = "INV-000001"

  if (last?.invoice_number) {
    const n = parseInt(last.invoice_number.replace("INV-", ""))
    nextNumber = `INV-${String(n + 1).padStart(6, "0")}`
  }

  db.prepare(`
    INSERT INTO invoice (
      date,
      customer_name,
      customer_tin,
      patient_id,
      issued_by,
      vat_sales,
      vat_amount,
      vat_exempt_sales,
      zero_rated_sales,
      discount,
      total,
      items,
      invoice_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    inv.date,
    inv.customer_name,
    inv.customer_tin,
    inv.patient_id || null,
    inv.issued_by,
    inv.vat_sales,
    inv.vat_amount,
    inv.vat_exempt_sales,
    inv.zero_rated_sales,
    inv.discount,
    inv.total,
    inv.items,
    nextNumber
  )

  return { success: true, invoice_number: nextNumber }
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

  ipcMain.handle('get-all-invoices', () => {
  return db.prepare(`
    SELECT 
      invoice.*,
      clinicpatients.firstName,
      clinicpatients.lastName,
      clinicpatients.middleName,
      clinicpatients.address,
      clinicpatients.phone,
      clinicpatients.businessStyle,
      clinicpatients.tin AS patient_tin,
      clinicpatients.isSenior,
      clinicpatients.seniorId,
      clinicpatients.isPWD,
      clinicpatients.pwdId
    FROM invoice
    LEFT JOIN clinicpatients 
      ON clinicpatients.id = invoice.patient_id
    ORDER BY invoice.id DESC
  `).all()
})

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
