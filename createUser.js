const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve('D:/Clinic-Management-System/electron/userdata/database.db');
console.log('🧭 Using DB at:', dbPath);

const db = new Database(dbPath);

// ⚡ no callbacks in better-sqlite3, it’s synchronous!
function createUser() {
  const name = 'Admin'; 
  const password = 'securepass456';
  const role = 'admin';

  // hash password (bcrypt is async, so wrap in Promise)
  bcrypt.hash(password, 10).then((hashedPassword) => {
    // check if user exists
    const row = db.prepare('SELECT * FROM users WHERE name = ?').get(name);

    if (row) {
      console.log(`⚠️ User "${name}" already exists. No action taken.`);
    } else {
      db.prepare('INSERT INTO users (name, password, role) VALUES (?, ?, ?)')
        .run(name, hashedPassword, role);

      console.log('✅ Admin user inserted!');
    }
  }).catch(err => {
    console.error('❌ Error hashing password:', err.message);
  });
}

createUser();