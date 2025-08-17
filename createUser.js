const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve('D:/Clinic-Management-System/electron/userdata/database.db');
console.log('🧭 Using DB at:', dbPath);

const db = new sqlite3.Database(dbPath);

async function createUser() {
  const name = 'Admin'; 
  const password = 'securepass456';
  const role = 'admin';

  const hashedPassword = await bcrypt.hash(password, 10);

  db.get('SELECT * FROM users WHERE name = ?', [name], (err, row) => {
    if (err) {
      console.error('❌ Error checking user:', err.message);
      db.close();
      return;
    }

    if (row) {
      console.log(`⚠️ User "${name}" already exists. No action taken.`);
      db.close();
    } else {
      db.run(
        'INSERT INTO users (name, password, role) VALUES (?, ?, ?)',
        [name, hashedPassword, role],
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
  });
}

createUser();