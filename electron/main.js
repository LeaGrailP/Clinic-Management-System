const { app, dialog, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const express = require('express')
const serveStatic = require('serve-static')
const bcrypt = require('bcryptjs')
const Database = require('better-sqlite3')
const { setupPrinterHandlers } = require('./printer')
const isDev = !app.isPackaged

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

  const dbPath = path.join(dbDir, 'DB4.db')
  const db = new Database(dbPath)

  console.log('Using DB at:', dbPath)

  // Optimize SQLite for performance
  db.pragma('journal_mode = WAL')
  db.pragma('busy_timeout = 5000')
  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = 10000')
  db.pragma('temp_store = MEMORY')

  // Users table - CLEANED UP
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
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
      vatType TEXT NOT NULL CHECK(vatType IN ('vatable', 'exempt', 'zero'))
    )
  `)

  // Patients table
  db.exec(`
    CREATE TABLE IF NOT EXISTS clinicpatients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      middleName TEXT,
      address TEXT,
      phone TEXT,
      businessStyle TEXT,
      tin TEXT,
      isSenior INTEGER DEFAULT 0,
      seniorId TEXT,
      isPWD INTEGER DEFAULT 0,
      pwdId TEXT
    )
  `)

  // Invoice table with void columns
  db.exec(`
    CREATE TABLE IF NOT EXISTS invoice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      customer_name TEXT,
      customer_tin TEXT,
      patient_id INTEGER,
      vat_sales REAL DEFAULT 0,
      vat_amount REAL DEFAULT 0,
      vat_exempt_sales REAL DEFAULT 0,
      zero_rated_sales REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      items TEXT NOT NULL,
      invoice_number TEXT UNIQUE NOT NULL,
      issued_by TEXT NOT NULL,
      voided INTEGER DEFAULT 0,
      void_reason TEXT,
      voided_by TEXT,
      voided_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES clinicpatients(id) ON DELETE SET NULL
    )
  `)

  // Z-readings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS z_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL,
      totals_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Voided invoices audit trail
  db.exec(`
    CREATE TABLE IF NOT EXISTS voided_invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_invoice_id INTEGER NOT NULL,
      invoice_number TEXT NOT NULL,
      original_total REAL NOT NULL,
      void_reason TEXT NOT NULL,
      voided_by TEXT NOT NULL,
      voided_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(original_invoice_id) REFERENCES invoice(id)
    )
  `)

  // CRITICAL: Add indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoice_date ON invoice(date);
    CREATE INDEX IF NOT EXISTS idx_invoice_number ON invoice(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_invoice_voided ON invoice(voided);
    CREATE INDEX IF NOT EXISTS idx_users_name_role ON users(name, role);
    CREATE INDEX IF NOT EXISTS idx_patients_name ON clinicpatients(firstName, lastName);
    CREATE INDEX IF NOT EXISTS idx_patients_tin ON clinicpatients(tin);
    CREATE INDEX IF NOT EXISTS idx_z_readings_date ON z_readings(date);
    CREATE INDEX IF NOT EXISTS idx_voided_invoices_date ON voided_invoices(voided_at);
  `)

  // Check if we need to add void columns to existing invoice table
  try {
    const tableInfo = db.prepare("PRAGMA table_info(invoice)").all()
    const hasVoidedColumn = tableInfo.some(col => col.name === 'voided')
    
    if (!hasVoidedColumn) {
      console.log('Adding void columns to invoice table...')
      db.exec(`
        ALTER TABLE invoice ADD COLUMN voided INTEGER DEFAULT 0;
        ALTER TABLE invoice ADD COLUMN void_reason TEXT;
        ALTER TABLE invoice ADD COLUMN voided_by TEXT;
        ALTER TABLE invoice ADD COLUMN voided_at TEXT;
      `)
      console.log('Void columns added successfully')
    }
  } catch (err) {
    console.log('Void columns already exist or error:', err.message)
  }
  console.log('Tables and indexes created/verified')
  return db
}

// -------------------- VALIDATION HELPERS --------------------
function validatePatient(p) {
  if (!p.firstName?.trim() || !p.lastName?.trim()) {
    return 'First and last name required'
  }
  if (p.phone && !/^[\d\s\-+()]{10,}$/.test(p.phone)) {
    return 'Invalid phone format'
  }
  if (p.tin && !/^\d{9,15}$/.test(p.tin.replace(/\D/g, ''))) {
    return 'Invalid TIN format'
  }
  return null
}

function validateProduct(p) {
  if (!p.productname?.trim()) return 'Product name required'
  if (typeof p.price !== 'number' || p.price < 0) return 'Invalid price'
  if (!['vatable', 'exempt', 'zero'].includes(p.vatType)) return 'Invalid VAT type'
  return null
}

function sanitizeString(str) {
  if (!str) return ''
  return String(str).trim().slice(0, 500) // Limit length
}

// -------------------- ELECTRON WINDOW --------------------
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  if (isDev) {
    win.loadURL("http://localhost:3000")
    win.webContents.openDevTools()
    console.log("Running in DEV mode")
  } else {
    win.loadFile(path.join(__dirname, "../.output/public/index.html"))
    console.log("Running in PROD mode")
  }
}

// -------------------- IPC HANDLERS --------------------
function registerIPCHandlers() {
  // Prepare statements once for reuse
  const stmts = {
    getUser: db.prepare('SELECT * FROM users WHERE role=? AND name=? LIMIT 1'),
    checkAdmin: db.prepare("SELECT 1 FROM users WHERE role='admin' LIMIT 1"),
    getAdmin: db.prepare("SELECT masterPin FROM users WHERE role='admin' LIMIT 1"),
    insertUser: db.prepare('INSERT INTO users (name, password, role, masterPin) VALUES (?, ?, ?, ?)'),
    updateUserName: db.prepare('UPDATE users SET name=? WHERE name=?'),
    updateUserPassword: db.prepare('UPDATE users SET password=?, name=COALESCE(?, name) WHERE name=?'),
    deleteUser: db.prepare('DELETE FROM users WHERE id=?'),
    getAllUsers: db.prepare('SELECT id, name, role FROM users ORDER BY id DESC'),
    
    // Patient statements
    getAllPatients: db.prepare('SELECT * FROM clinicpatients ORDER BY id DESC'),
    searchPatients: db.prepare(`
      SELECT id, firstName, middleName, lastName, tin
      FROM clinicpatients
      WHERE firstName LIKE ? OR middleName LIKE ? OR lastName LIKE ? OR tin LIKE ?
      LIMIT 20
    `),
    insertPatient: db.prepare(`
      INSERT INTO clinicpatients
      (firstName, lastName, middleName, address, phone, businessStyle, tin, isSenior, seniorId, isPWD, pwdId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    updatePatient: db.prepare(`
      UPDATE clinicpatients
      SET firstName=?, lastName=?, middleName=?, address=?, phone=?, businessStyle=?, tin=?, isSenior=?, seniorId=?, isPWD=?, pwdId=?
      WHERE id=?
    `),
    deletePatient: db.prepare('DELETE FROM clinicpatients WHERE id=?'),
    
    // Product statements
    getAllProducts: db.prepare(`
      SELECT 
        id, productname, price, vatType,
        CASE WHEN vatType='vatable' THEN price ELSE 0 END as vatSales,
        CASE WHEN vatType='vatable' THEN price*0.12 ELSE 0 END as vatAmount,
        CASE WHEN vatType='exempt' THEN price ELSE 0 END as vatExempt,
        CASE WHEN vatType='zero' THEN price ELSE 0 END as zeroRated,
        price + CASE WHEN vatType='vatable' THEN price*0.12 ELSE 0 END as total
      FROM products
    `),
    insertProduct: db.prepare('INSERT INTO products (productname, price, vatType) VALUES (?, ?, ?)'),
    updateProduct: db.prepare('UPDATE products SET productname=?, price=?, vatType=? WHERE id=?'),
    deleteProduct: db.prepare('DELETE FROM products WHERE id=?'),
    
    // Invoice statements (excluding voided by default)
    getLastInvoice: db.prepare('SELECT invoice_number FROM invoice ORDER BY id DESC LIMIT 1'),
    insertInvoice: db.prepare(`
      INSERT INTO invoice (
        date, customer_name, customer_tin, patient_id, issued_by,
        vat_sales, vat_amount, vat_exempt_sales, zero_rated_sales,
        discount, total, items, invoice_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `),
    getAllInvoices: db.prepare(`
      SELECT 
        invoice.*,
        clinicpatients.firstName, clinicpatients.lastName, clinicpatients.middleName,
        clinicpatients.address, clinicpatients.phone, clinicpatients.businessStyle,
        clinicpatients.tin AS patient_tin, clinicpatients.isSenior, clinicpatients.seniorId,
        clinicpatients.isPWD, clinicpatients.pwdId
      FROM invoice
      LEFT JOIN clinicpatients ON clinicpatients.id = invoice.patient_id
      ORDER BY invoice.id DESC
    `),
    getInvoiceById: db.prepare('SELECT * FROM invoice WHERE id=?'),
    deleteInvoice: db.prepare('DELETE FROM invoice WHERE id=?'),
    
    // Void-related statements
    insertVoidedInvoice: db.prepare(`
      INSERT INTO voided_invoices (
        original_invoice_id, invoice_number, original_total, void_reason, voided_by
      ) VALUES (?, ?, ?, ?, ?)
    `),
    markInvoiceVoided: db.prepare(`
      UPDATE invoice 
      SET voided = 1, void_reason = ?, voided_by = ?, voided_at = datetime('now')
      WHERE id = ?
    `),
    
    // Z-reading statements (excluding voided invoices)
    checkZReading: db.prepare('SELECT 1 FROM z_readings WHERE date=?'),
    insertZReading: db.prepare('INSERT INTO z_readings (date, totals_json) VALUES (?, ?)'),
    getZTotals: db.prepare(`
      SELECT
        MIN(invoice_number) first_inv, MAX(invoice_number) last_inv,
        SUM(vat_sales) vat_sales, SUM(vat_amount) vat_amount,
        SUM(vat_exempt_sales) vat_exempt, SUM(zero_rated_sales) zero_rated,
        SUM(discount) discount, SUM(total) total
      FROM invoice
      WHERE date=? AND voided=0
    `),
    getSalesJournal: db.prepare(`
      SELECT * FROM invoice
      WHERE date BETWEEN ? AND ? AND voided=0
      ORDER BY invoice_number
    `)
  }

  // ---------- USERS ----------
  ipcMain.handle('auth:register', async (_event, { name, password, role }) => {
    try {
      name = sanitizeString(name)
      if (!name || !password || password.length < 6) {
        return { success: false, error: 'Invalid credentials' }
      }
      
      const hashed = await bcrypt.hash(password, 8)
      stmts.insertUser.run(name, hashed, role, null)
      return { success: true }
    } catch (err) {
      console.error('Register error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('checkAdmin', () => {
    try {
      return !!stmts.checkAdmin.get()
    } catch (err) {
      console.error('checkAdmin error:', err)
      throw err
    }
  })

  ipcMain.handle('createAdmin', async (_event, { name, password, pin }) => {
    try {
      name = sanitizeString(name)
      if (!name || !password || !pin || pin.length < 4) {
        return { success: false, error: 'Invalid input' }
      }
      
      const hash = await bcrypt.hash(password, 8)
      const pinHash = await bcrypt.hash(pin, 8)
      stmts.insertUser.run(name, hash, 'admin', pinHash)
      
      return { success: true }
    } catch (err) {
      console.error('createAdmin error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('login', async (_event, { role, name, password }) => {
    try {
      name = sanitizeString(name)
      const user = stmts.getUser.get(role, name)
      if (!user) return { success: false, error: 'User not found' }
      
      const valid = await bcrypt.compare(password, user.password)
      if (!valid) return { success: false, error: 'Invalid password' }
      
      return { success: true, name: user.name, role: user.role }
    } catch (err) {
      console.error('login error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('user:updateName', (_event, { oldName, newName }) => {
    try {
      oldName = sanitizeString(oldName)
      newName = sanitizeString(newName)
      if (!newName) return { success: false, error: 'Invalid name' }
      
      const info = stmts.updateUserName.run(newName, oldName)
      return { success: info.changes > 0 }
    } catch (err) {
      console.error("Update name error:", err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('reset-password', async (_event, { name, newName, newPassword, pin }) => {
    try {
      const admin = stmts.getAdmin.get()
      if (!admin?.masterPin) {
        return { success: false, error: "No master PIN found" }
      }

      const validPin = await bcrypt.compare(pin, admin.masterPin)
      if (!validPin) return { success: false, error: "Invalid master PIN" }

      if (newName && newName !== name) {
        newName = sanitizeString(newName)
        const exists = stmts.getUser.get('cashier', newName) || stmts.getUser.get('admin', newName)
        if (exists) return { success: false, error: "Name already in use" }
      }

      const hashed = await bcrypt.hash(newPassword, 8)
      const info = stmts.updateUserPassword.run(hashed, newName || null, name)
      
      return { success: info.changes > 0 }
    } catch (err) {
      console.error("reset-password error:", err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('get-accounts', () => {
    try {
      return stmts.getAllUsers.all()
    } catch (err) {
      console.error('get-accounts error:', err)
      return []
    }
  })

  ipcMain.handle('deleteAccount', async (_e, { id, pin }) => {
    try {
      const admin = stmts.getAdmin.get()
      if (!admin) return { success: false, error: 'No admin found' }
      
      const valid = await bcrypt.compare(pin, admin.masterPin)
      if (!valid) return { success: false, error: 'Invalid master PIN' }

      stmts.deleteUser.run(id)
      return { success: true }
    } catch (err) {
      console.error('deleteAccount error:', err)
      return { success: false, error: err.message }
    }
  })

  // ---------- PATIENTS ----------
  ipcMain.handle('get-patients', () => stmts.getAllPatients.all())

  ipcMain.handle('add-patient', (_e, p) => {
    const error = validatePatient(p)
    if (error) return { success: false, error }
    
    try {
      stmts.insertPatient.run(
        sanitizeString(p.firstName), sanitizeString(p.lastName), 
        sanitizeString(p.middleName) || '', sanitizeString(p.address),
        sanitizeString(p.phone), sanitizeString(p.businessStyle),
        sanitizeString(p.tin), p.isSenior ? 1 : 0, sanitizeString(p.seniorId) || '',
        p.isPWD ? 1 : 0, sanitizeString(p.pwdId) || ''
      )
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('update-patient', (_e, p) => {
    const error = validatePatient(p)
    if (error) return { success: false, error }
    
    try {
      stmts.updatePatient.run(
        sanitizeString(p.firstName), sanitizeString(p.lastName),
        sanitizeString(p.middleName) || '', sanitizeString(p.address),
        sanitizeString(p.phone), sanitizeString(p.businessStyle),
        sanitizeString(p.tin), p.isSenior ? 1 : 0, sanitizeString(p.seniorId) || '',
        p.isPWD ? 1 : 0, sanitizeString(p.pwdId) || '', p.id
      )
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('delete-patient', (_e, id) => {
    try {
      stmts.deletePatient.run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('search-patients', (_event, query) => {
    try {
      query = sanitizeString(query)
      const like = `%${query}%`
      return stmts.searchPatients.all(like, like, like, like)
    } catch (err) {
      console.error('search-patients error:', err)
      return []
    }
  })

  ipcMain.handle("secure-delete-patient", async (_e, { id, pin }) => {
    try {
      const admin = stmts.getAdmin.get()
      if (!admin) return { success: false, error: "Admin not found" }

      const valid = await bcrypt.compare(pin, admin.masterPin)
      if (!valid) return { success: false, error: "Invalid master PIN" }

      stmts.deletePatient.run(id)
      return { success: true }
    } catch (err) {
      console.error("secure-delete-patient error:", err)
      return { success: false, error: err.message }
    }
  })

  // ---------- PRODUCTS ----------
  ipcMain.handle('get-products', () => stmts.getAllProducts.all())

  ipcMain.handle('add-product', (_e, p) => {
    const error = validateProduct(p)
    if (error) return { success: false, error }
    
    try {
      const info = stmts.insertProduct.run(
        sanitizeString(p.productname),
        p.price,
        p.vatType
      )
      return { success: true, id: info.lastInsertRowid }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('update-product', (_e, p) => {
    const error = validateProduct(p)
    if (error) return { success: false, error }
    
    try {
      stmts.updateProduct.run(
        sanitizeString(p.productname),
        p.price,
        p.vatType,
        p.id
      )
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('delete-product', (_e, id) => {
    try {
      stmts.deleteProduct.run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  // ---------- INVOICES ----------
  ipcMain.handle('add-invoice', (_e, inv) => {
    try {
      const last = stmts.getLastInvoice.get()
      let nextNumber = "INV-000001"

      if (last?.invoice_number) {
        const n = parseInt(last.invoice_number.replace("INV-", ""))
        nextNumber = `INV-${String(n + 1).padStart(6, "0")}`
      }

      // Validate items is valid JSON
      const itemsJson = typeof inv.items === 'string' ? inv.items : JSON.stringify(inv.items)
      JSON.parse(itemsJson) // Validate

      stmts.insertInvoice.run(
        inv.date,
        sanitizeString(inv.customer_name),
        sanitizeString(inv.customer_tin),
        inv.patient_id || null,
        sanitizeString(inv.issued_by),
        inv.vat_sales || 0,
        inv.vat_amount || 0,
        inv.vat_exempt_sales || 0,
        inv.zero_rated_sales || 0,
        inv.discount || 0,
        inv.total,
        itemsJson,
        nextNumber
      )

      return { success: true, invoice_number: nextNumber }
    } catch (err) {
      console.error('add-invoice error:', err)
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('generate-invoice-number', () => {
    const last = stmts.getLastInvoice.get()
    let nextNumber = 'INV-000001'
    if (last?.invoice_number) {
      const n = parseInt(last.invoice_number.replace('INV-', ''))
      nextNumber = `INV-${(n + 1).toString().padStart(6, '0')}`
    }
    return nextNumber
  })

  ipcMain.handle('get-all-invoice', () => {
    try {
      const rows = stmts.getAllInvoices.all()
      return rows.map(r => {
        try {
          return { ...r, items: JSON.parse(r.items || '[]') }
        } catch {
          return { ...r, items: [] }
        }
      })
    } catch (err) {
      console.error('get-all-invoice error:', err)
      return []
    }
  })

  ipcMain.handle('delete-invoice', (_e, id) => {
    try {
      stmts.deleteInvoice.run(id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  // ---------- VOID TRANSACTION (BIR REQUIREMENT) ----------
  ipcMain.handle('void-invoice', async (_e, { invoiceId, reason, voidedBy, pin }) => {
    try {
      // Verify admin PIN
      const admin = stmts.getAdmin.get()
      if (!admin?.masterPin) {
        return { success: false, error: 'No admin found' }
      }
      
      const validPin = await bcrypt.compare(pin, admin.masterPin)
      if (!validPin) {
        return { success: false, error: 'Invalid master PIN' }
      }

      // Get original invoice
      const invoice = stmts.getInvoiceById.get(invoiceId)
      if (!invoice) {
        return { success: false, error: 'Invoice not found' }
      }

      // Check if already voided
      if (invoice.voided) {
        return { success: false, error: 'Invoice already voided' }
      }

      // Execute in transaction
      const voidTransaction = db.transaction(() => {
        // Create audit trail
        stmts.insertVoidedInvoice.run(
          invoiceId,
          invoice.invoice_number,
          invoice.total,
          reason,
          voidedBy
        )
        
        // Mark invoice as voided
        stmts.markInvoiceVoided.run(reason, voidedBy, invoiceId)
      })

      voidTransaction()

      return { 
        success: true,
        message: `Invoice ${invoice.invoice_number} voided successfully`
      }
    } catch (err) {
      console.error('Void invoice error:', err)
      return { success: false, error: err.message }
    }
  })

  // ---------- TRANSACTIONS ----------
  ipcMain.handle('export-sales-journal', async (_, { from, to }) => {
    try {
      const invoices = stmts.getSalesJournal.all(from, to)
      
      const lines = invoices.map(i =>
        [
          i.invoice_number,
          i.date,
          i.vat_sales.toFixed(2),
          i.vat_amount.toFixed(2),
          i.vat_exempt_sales.toFixed(2),
          i.zero_rated_sales.toFixed(2),
          i.discount.toFixed(2),
          i.total.toFixed(2),
          i.issued_by
        ].join('|')
      )

      const filePath = dialog.showSaveDialogSync({
        defaultPath: `SALES_JOURNAL_${Date.now()}.txt`
      })

      if (filePath) {
        fs.writeFileSync(filePath, lines.join('\n'))
      }

      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('z-reading:generate', async (_e, { date }) => {
    try {
      if (stmts.checkZReading.get(date)) {
        return { success: false, error: 'Z-Reading already printed for this date' }
      }

      const totals = stmts.getZTotals.get(date)
      stmts.insertZReading.run(date, JSON.stringify(totals))

      return { success: true, totals }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })
  // -------------------- ENSURE PRINT HISTORY COLUMN --------------------
try {
  const tableInfo = db.prepare("PRAGMA table_info(invoice)").all()
  const hasPrintHistory = tableInfo.some(col => col.name === 'print_history_id')

  if (!hasPrintHistory) {
    console.log('Adding print_history_id column to invoice table...')
    db.exec(`ALTER TABLE invoice ADD COLUMN print_history_id TEXT;`)
    console.log('print_history_id column added successfully')
  }
} catch (err) {
  console.error('Error checking/adding print_history_id column:', err.message)
}

// -------------------- IPC HANDLER FOR RECEIPT HISTORY --------------------
  ipcMain.handle('receipt:get-history-id', (_e, invoiceId) => {
  const row = db.prepare(`
    SELECT print_history_id FROM invoice WHERE id=?
  `).get(invoiceId)

  return { historyId: row?.print_history_id || null }
  })
  console.log('✅ All IPC handlers registered')
}

// -------------------- APP CLOSE --------------------
app.on('window-all-closed', () => {
  if (db) db.close()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})