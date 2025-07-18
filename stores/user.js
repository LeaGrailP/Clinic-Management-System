const bcrypt = require('bcryptjs');

function registerUser(db, username, password, role) {
  return new Promise(async (resolve, reject) => {
    try {
      const hash = await bcrypt.hash(password, 10);
      db.prepare(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`).run(username, hash, role);
      resolve({ success: true });
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        resolve({ success: false, error: 'Username already exists' });
      } else {
        console.error('Register error:', err);
        resolve({ success: false, error: 'Registration failed' });
      }
    }
  });
}

module.exports = { registerUser };