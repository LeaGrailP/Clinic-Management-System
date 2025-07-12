const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { initDB } = require('./db.js')

let db

async function createWindow() {
  db = await initDB()

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  })

  win.loadURL('http://localhost:3000') // Or your Nuxt build path
}

// IPC handler: REGISTER
ipcMain.handle('auth:register', async (event, { username, password, role }) => {
  try {
    const hash = await bcrypt.hash(password, 10)
    await db.run(
      `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
      [username, hash, role]
    )
    return { success: true }
  } catch (err) {
    return { success: false, error: 'User exists or error inserting user.' }
  }
})

// IPC handler: LOGIN
ipcMain.handle('auth:login', async (event, { username, password }) => {
  const user = await db.get(`SELECT * FROM users WHERE username = ?`, [username])
  if (!user) return { success: false, error: 'User not found.' }

  const match = await bcrypt.compare(password, user.password)
  if (!match) return { success: false, error: 'Incorrect password.' }

  const token = jwt.sign({ id: user.id, role: user.role }, 'my_secret', { expiresIn: '2h' })
  return { success: true, token, role: user.role }
})

app.whenReady().then(createWindow)
