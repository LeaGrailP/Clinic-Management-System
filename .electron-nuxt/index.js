const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const Database = require('better-sqlite3')

let db
function createDatabase() {
  db = new Database('my-database.db')
  db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    age INTEGER
  )
`)

}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadURL('http://localhost:3000')
}

app.whenReady().then(() => {
  createDatabase()

  ipcMain.handle('get-users', () => {
    const stmt = db.prepare('SELECT * FROM users')
    return stmt.all()
  })

ipcMain.handle('add-user', (event, user) => {
  console.log('Received user:', user) // Debug log
  const stmt = db.prepare('INSERT INTO users (name, address, age) VALUES (?, ?, ?)')
  stmt.run(user.name, user.address, user.age)
})



  createWindow()
})
