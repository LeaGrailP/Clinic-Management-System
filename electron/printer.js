// printer.js — PRODUCTION-SAFE, SIMPLIFIED, COPY-PASTE READY
// Electron + Thermal POS printing with health check, cash drawer, and REPRINT support

const { BrowserWindow } = require('electron')
const fs = require('fs')
const os = require('os')
const path = require('path')

// ---------------- CONFIG ----------------
const HEALTH_CACHE_TTL = 5000 // ms

let printerHealthCache = {
  printerName: null,
  lastCheck: 0,
  status: null
}

// In-memory print history (POS-safe)
const printHistory = Object.create(null)

function addToPrintHistory(entry) {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  printHistory[id] = { id, time: new Date().toISOString(), ...entry }
  return id
}

// ---------------- PRINTER DETECTION ----------------
async function detectPOSPrinter() {
  const win = BrowserWindow.getAllWindows()[0]
  if (!win) throw new Error('No active window')

  const printers = await win.webContents.getPrintersAsync()
  if (!printers.length) throw new Error('No printers found')

  return (
    printers.find(p => /POS80/i.test(p.name)) ||
    printers.find(p => /POS58/i.test(p.name)) ||
    printers.find(p => /thermal|receipt|pos/i.test(p.name)) ||
    printers[0]
  ).name
}

// ---------------- PRINTER HEALTH ----------------
async function checkPrinterHealth(printerName) {
  try {
    const win = BrowserWindow.getAllWindows()[0]
    const printers = await win.webContents.getPrintersAsync()
    const printer = printers.find(p => p.name === printerName)

    if (!printer) {
      return { status: 'offline', connected: false, error: 'Printer not found' }
    }

    let health = {
      status: 'online',
      connected: true,
      printerName: printer.name,
      description: printer.description || 'N/A',
      isDefault: !!printer.isDefault
    }

    if (printer.status) {
      const s = printer.status.toLowerCase()
      if (s.includes('offline')) {
        health = { ...health, status: 'offline', connected: false, error: 'Printer offline' }
      } else if (s.includes('paper') || s.includes('jam')) {
        health = { ...health, status: 'warning', warning: 'Paper issue detected' }
      } else if (s.includes('error')) {
        health = { ...health, status: 'error', error: 'Printer error detected' }
      }
    }

    return health
  } catch (err) {
    return { status: 'error', connected: false, error: err.message }
  }
}

async function getPrinterHealth(printerName, force = false) {
  const now = Date.now()

  if (
    !force &&
    printerHealthCache.printerName === printerName &&
    now - printerHealthCache.lastCheck < HEALTH_CACHE_TTL
  ) {
    return printerHealthCache.status
  }

  const health = await checkPrinterHealth(printerName)
  printerHealthCache = { printerName, lastCheck: now, status: health }
  return health
}

// ---------------- RECEIPT HTML ----------------
function buildReceiptHTML(html, width = 58, openDrawer = true, isReprint = false) {
  const drawerPulse = String.fromCharCode(27, 112, 0, 25, 250)

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
@page { margin:0; size:${width}mm auto; }
body{ font-family:Courier New, monospace; font-size:11px; margin:0; padding:4px; }
.center{text-align:center}
.line{border-top:1px dashed #000;margin:4px 0}
pre{margin:0}
</style></head>
<body>
${isReprint ? '<div class="center"><b>*** REPRINT ***</b></div>' : ''}
${html}
<div class="line"></div>
<div class="center">*** END ***</div>
${openDrawer ? `<pre>${drawerPulse}</pre>` : ''}
</body></html>`
}

// ---------------- CORE PRINT ----------------
async function printHTML(html, openDrawer = true, printerName = null, meta = {}) {
  let win
  let tmpFile

  try {
    const resolvedPrinter = printerName || await detectPOSPrinter()

    const health = await getPrinterHealth(resolvedPrinter, meta.isReprint === true)
    if (!health.connected) throw new Error(health.error || 'Printer not ready')

    win = new BrowserWindow({ show: false })

    const width = /POS80/i.test(resolvedPrinter) ? 80 : 58
    const fullHTML = buildReceiptHTML(html, width, openDrawer, meta.isReprint)

    tmpFile = path.join(os.tmpdir(), `print_${Date.now()}.html`)
    fs.writeFileSync(tmpFile, fullHTML)

    await win.loadFile(tmpFile)

    await new Promise((resolve, reject) => {
      win.webContents.print(
        { silent: true, printBackground: true, deviceName: resolvedPrinter },
        ok => (ok ? resolve() : reject(new Error('Print failed')))
      )
    })

    const historyId = addToPrintHistory({
      type: meta.type || 'print',
      status: 'success',
      printerName: resolvedPrinter,
      html
    })

    return { success: true, historyId }

  } catch (err) {
    addToPrintHistory({
      type: meta.type || 'print',
      status: 'failed',
      error: err.message
    })
    return { success: false, message: err.message }
  } finally {
    try {
      if (win && !win.isDestroyed()) win.close()
    } catch (_) {}
    try {
      if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
    } catch (_) {}
  }
}

// ---------------- IPC SETUP ----------------
function setupPrinterHandlers(ipcMain) {

  ipcMain.handle('print-receipt', async (_e, { html, openDrawer = true }) => {
    if (!html) return { success: false, message: 'No HTML provided' }
    return printHTML(html, openDrawer, null, { type: 'receipt' })
  })

  ipcMain.handle('receipt:reprint', async (_e, historyId) => {
    const entry = printHistory[historyId]
    if (!entry || !entry.html) {
      return { success: false, message: 'Invalid reprint reference' }
    }

    return printHTML(entry.html, false, entry.printerName || null, {
      type: 'reprint',
      isReprint: true
    })
  })

  ipcMain.handle('open-cash-drawer', async () => {
    return printHTML('<div></div>', true, null, { type: 'drawer' })
  })

  ipcMain.handle('check-printer-status', async () => {
    try {
      const printerName = await detectPOSPrinter()
      return await getPrinterHealth(printerName, true)
    } catch (err) {
      return { status: 'error', connected: false, error: err.message }
    }
  })
}

module.exports = { setupPrinterHandlers }
