const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, './userData/database.db');
console.log('🧭 Using DB at:', dbPath);

const db = new sqlite3.Database(dbPath);

async function createUser() {
  const username = 'admin2@example.com';
  const password = 'securepass456';
  const role = 'admin';

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, hashedPassword, role],
    (err) => {
      if (err) {
        console.error('❌ Failed to insert user:', err.message);
      } else {
        console.log('✅ Admin user inserted!');
      }
      db.close();
    }
  );
}

createUser();
