// electron/sqlite.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Path to SQLite DB in persistent 'data' folder
const dbPath = path.join(__dirname, '../data/pos-database.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// Example: create a table
db.prepare(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    total REAL,
    items TEXT
  )
`).run();

module.exports = {
  insertTransaction({ date, total, items }) {
    db.prepare(`INSERT INTO transactions (date, total, items) VALUES (?, ?, ?)`)
      .run(date, total, JSON.stringify(items));
  },

  getTransactions() {
    return db.prepare(`SELECT * FROM transactions ORDER BY id DESC`).all();
  }
};
