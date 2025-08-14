// main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");

let mainWindow;
let db;

// --------------------
// INIT DATABASE
// --------------------
function initDB() {
  const userDataPath = path.join(app.getPath("userData"), "database.db");
  console.log("📂 Electron DB Path:", userDataPath);

  db = new sqlite3.Database(userDataPath);

  // PRODUCTS TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price REAL,
      vat_rate REAL,
      vat_amount REAL,
      vat_type TEXT CHECK(vat_type IN ('vatable','vat-exempt','zero-rated'))
    )
  `);

  // INVOICES TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      customer_name TEXT,
      vat_sales REAL,
      vat_amount REAL,
      vat_exempt_sales REAL,
      zero_rated_sales REAL,
      discount REAL,
      total REAL,
      items TEXT,
      invoice_number TEXT UNIQUE
    )
  `);

  // USERS TABLE
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);
}

// --------------------
// CREATE ADMIN USER (ONCE)
// --------------------
async function createAdminUser() {
  const username = "admin@example.com";
  const password = "securepass123";
  const hashedPassword = await bcrypt.hash(password, 10);

  db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
    if (err) return console.error("❌ User check failed:", err);

    if (row) {
      console.log(`⚠️ Admin "${username}" already exists.`);
    } else {
      db.run(
        `INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)`,
        ["Admin", username, hashedPassword, "admin"],
        (err) => {
          if (err) console.error("❌ Failed to insert admin:", err);
          else console.log("✅ Admin user created.");
        }
      );
    }
  });
}

// --------------------
// GENERATE INVOICE NUMBER
// --------------------
function generateInvoiceNumber(callback) {
  db.get(
    `SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1`,
    (err, row) => {
      if (err) return callback(err);

      let nextNum = 1;
      if (row && row.invoice_number) {
        const currentNum = parseInt(row.invoice_number.replace("INV-", ""), 10);
        if (!isNaN(currentNum)) nextNum = currentNum + 1;
      }
      const newInvoiceNumber = `INV-${String(nextNum).padStart(6, "0")}`;
      callback(null, newInvoiceNumber);
    }
  );
}

// --------------------
// IPC HANDLERS
// --------------------

// Add invoice
ipcMain.handle("add-invoice", (event, invoiceData) => {
  return new Promise((resolve, reject) => {
    generateInvoiceNumber((err, invoiceNumber) => {
      if (err) return reject(err);

      const {
        date,
        customer_name,
        vat_sales,
        vat_amount,
        vat_exempt_sales,
        zero_rated_sales,
        discount,
        total,
        items
      } = invoiceData;

      db.run(
        `INSERT INTO invoices 
        (date, customer_name, vat_sales, vat_amount, vat_exempt_sales, zero_rated_sales, discount, total, items, invoice_number) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          date,
          customer_name,
          vat_sales,
          vat_amount,
          vat_exempt_sales,
          zero_rated_sales,
          discount,
          total,
          JSON.stringify(items),
          invoiceNumber
        ],
        function (err) {
          if (err) reject(err);
          else resolve({ success: true, invoice_number: invoiceNumber });
        }
      );
    });
  });
});

// Get all invoices (dashboard ready)
ipcMain.handle("get-all-invoices", () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, date, customer_name, vat_sales, vat_amount, vat_exempt_sales, zero_rated_sales, discount, total, invoice_number 
       FROM invoices ORDER BY date DESC`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
});

// Get products
ipcMain.handle("get-products", () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM products`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

// Add product
ipcMain.handle("add-product", (event, product) => {
  const { name, price, vat_rate, vat_amount, vat_type } = product;
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO products (name, price, vat_rate, vat_amount, vat_type) VALUES (?, ?, ?, ?, ?)`,
      [name, price, vat_rate, vat_amount, vat_type],
      function (err) {
        if (err) reject(err);
        else resolve({ success: true, id: this.lastID });
      }
    );
  });
});

// --------------------
// APP READY
// --------------------
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  });

  mainWindow.loadFile("index.html");
}

app.on("ready", () => {
  initDB();
  createAdminUser();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
