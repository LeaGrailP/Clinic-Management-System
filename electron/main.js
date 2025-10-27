const { app, BrowserWindow, ipcMain } = require('electron')
const fs = require('fs')
const os = require("os")
const path = require('path')
const bcrypt = require('bcryptjs')
const Database = require('better-sqlite3')

let db

// -------------------- APP READY --------------------
app.whenReady().then(() => {
  db = initDB()
  createWindow()

// -------------------- DATABASE INIT --------------------
function initDB() {
  // Always relative to THIS file's folder (electron/main.js)
  const dbPath = path.resolve(__dirname, 'userData', 'database.db');
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
      total REAL,
      image TEXT
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

  return db
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
  // -------------------- USERS --------------------
  ipcMain.handle('login', async (_event, { name, password }) => {
    try {
      const user = db.prepare('SELECT * FROM users WHERE name = ?').get(name)
      if (!user) return { success: false, error: 'User not found' }
      const match = await bcrypt.compare(password, user.password)
      if (!match) return { success: false, error: 'Incorrect password' }
      return { success: true, name: user.name, role: user.role }
    } catch (err) {
      console.error('Login error:', err)
      return { success: false, error: 'Internal login error' }
    }
  })

  ipcMain.handle('auth:register', async (_event, { name, password, role }) => {
    try {
      const hash = await bcrypt.hash(password, 10)
      db.prepare(`INSERT INTO users (name, password, role) VALUES (?, ?, ?)`).run(name, hash, role)
      return { success: true }
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT') return { success: false, error: 'Name already exists' }
      console.error('Register error:', err)
      return { success: false, error: 'Registration failed' }
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
  return imagePath 
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

  console.log('All IPC handlers registered')
})
//SAVE RECEIPTS AS PDF//
ipcMain.handle("export-invoices-pdf", async (event, invoices) => {
  const rows = invoices.map(inv => `
    <div style="border-bottom:1px dashed #000; margin:6px 0; padding-bottom:4px;">
      <div><strong>Invoice #:</strong> ${inv.invoice_number}</div>
      <div><strong>Date:</strong> ${inv.date}</div>
      <div><strong>Customer:</strong> ${inv.customer_name || "-"}</div>
      <div><strong>VAT Sales:</strong> ₱${Number(inv.vat_sales).toFixed(2)}</div>
      <div><strong>VAT Amount:</strong> ₱${Number(inv.vat_amount).toFixed(2)}</div>
      <div><strong>Exempt Sales:</strong> ₱${Number(inv.vat_exempt_sales).toFixed(2)}</div>
      <div><strong>Zero-Rated:</strong> ₱${Number(inv.zero_rated_sales).toFixed(2)}</div>
      <div><strong>Discount:</strong> ₱${Number(inv.discount).toFixed(2)}</div>
      <div><strong>Total:</strong> <strong>₱${Number(inv.total).toFixed(2)}</strong></div>
    </div>
  `).join("");

  const htmlContent = `
    <html>
      <head>
        <style>
          body {
            font-family: monospace;
            font-size: 11px;
            margin: 0;
            padding: 8px;
            width: 58mm;
          }
          h2 {
            text-align: center;
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <h2>Invoice Report</h2>
        ${rows}
        <div style="border-top:1px dashed #000; margin-top:10px; text-align:center;">
          Exported: ${new Date().toLocaleString()}
        </div>
      </body>
    </html>
  `;

  const pdfWin = new BrowserWindow({ show: false });
  await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  const pdfBuffer = await pdfWin.webContents.printToPDF({
    marginsType: 1,
    pageSize: { width: 58000, height: 2000000 }, // 58mm wide roll, long page
    printBackground: true
  });

  const filePath = path.join(app.getPath("documents"), `invoices_${Date.now()}.pdf`);
  fs.writeFileSync(filePath, pdfBuffer);

  pdfWin.close();

  return filePath;
});
//check printers//
ipcMain.handle("check-printer-status", async () => {
  try {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) throw new Error("No active window");

    const printers = await win.webContents.getPrintersAsync();
    console.log("🖨 Installed printers:", printers.map(p => p.name));

    const posPrinter = printers.find(p => p.name === "POS58_Generic");
    if (!posPrinter) {
      console.warn("⚠️ POS58 printer not found in system.");
      return { success: true, connected: false, message: "Printer not found" };
    }

    return { success: true, connected: true, message: "POS58 printer is available" };
  } catch (err) {
    console.error("Printer check error:", err);
    return { success: false, message: err.message };
  }
});
//PrintReceipts//
ipcMain.handle("print-receipt", async (event, html) => {
  console.log("🧾 Received print request from renderer");

  try {
    // Sanitize the HTML (no scripts/styles)
    const cleanHTML = html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
      .replace(/<link[^>]*>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "");

    // Wrap in minimal printable document
    const wrappedHTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { margin: 0; font-family: Arial, sans-serif; font-size: 12px; }
  table { border-collapse: collapse; width: 100%; }
  td, th { padding: 2px; text-align: left; }
</style>
</head>
<body>
${cleanHTML}
</body>
</html>`;

    // Write to temporary local file
    const debugFile = path.join(os.tmpdir(), "receipt_print.html");
    fs.writeFileSync(debugFile, wrappedHTML, "utf8");

    // Load hidden window
    const printWin = new BrowserWindow({
      width: 300,
      height: 600,
      show: false,
    });

    await printWin.loadFile(debugFile);

    // Silent print
    const printerName = "POS58_Generic";
    await new Promise((resolve) => {
      printWin.webContents.print(
        {
          silent: true,
          printBackground: false,
          deviceName: printerName,
        },
        (success, failureReason) => {
          if (!success) {
            console.error("⚠️ Print failed:", failureReason);
            resolve({ success: false, message: failureReason });
          } else {
            console.log("🎉 Receipt printed successfully");
            resolve({ success: true });
          }
          setTimeout(() => printWin.close(), 1000);
        }
      );
    });

    return { success: true, message: "Printed successfully" };
  } catch (err) {
    console.error("❌ Print handler error:", err);
    return { success: false, message: err.message };
  }
});
// -------------------- APP CLOSE --------------------
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
