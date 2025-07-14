// db.js
const Database = require('better-sqlite3');
const path = require('path');

function initDB() {
  const db = new Database(path.join(__dirname, './userData/database.db'));

  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);

  return db;
}

module.exports = { initDB };