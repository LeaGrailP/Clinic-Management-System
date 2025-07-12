import express from 'express'
import cors from 'cors'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { initDB } from './db.js'

const app = express()
const PORT = 3000
const SECRET_KEY = 'my_secret_key'

let db

// Initialize DB
initDB().then(database => {
  db = database
  console.log('Database initialized')
})

// Middlewares
app.use(cors())
app.use(express.json())

// ✅ Register Endpoint
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body

  if (!username || !password || !role) {
    return res.status(400).json({ success: false, error: 'All fields are required.' })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    await db.run(
      `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
      [username, hashedPassword, role]
    )
    res.json({ success: true, message: 'User registered successfully.' })
  } catch (err) {
    res.json({ success: false, error: 'Username already exists or failed to register.' })
  }
})

// ✅ Login Endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required.' })
  }

  const user = await db.get(`SELECT * FROM users WHERE username = ?`, [username])

  if (!user) {
    return res.json({ success: false, error: 'User not found.' })
  }

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    return res.json({ success: false, error: 'Invalid password.' })
  }

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '2h' })

  res.json({
    success: true,
    message: 'Login successful.',
    token,
    role: user.role
  })
})

// ✅ (Optional) Get current user by token
app.post('/api/me', async (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ success: false, error: 'No token provided.' })

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, SECRET_KEY)
    const user = await db.get(`SELECT id, username, role FROM users WHERE id = ?`, [decoded.id])
    res.json({ success: true, user })
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid token.' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`Auth server running at http://localhost:${PORT}`)
})
