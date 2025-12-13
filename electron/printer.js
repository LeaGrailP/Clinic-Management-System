// printer.js
const fs = require('fs')
const os = require('os')
const path = require('path')

function setupPrinterHandlers(ipcMain, BrowserWindow, app) {

  /**
   * Detect available POS printers (POS58, POS80)
   * Returns the first available POS printer by type
   */
  async function detectPOSPrinter() {
    const win = BrowserWindow.getAllWindows()[0];
    if (!win) throw new Error("No active window");

    const printers = await win.webContents.getPrintersAsync();
    console.log("🖨 Installed printers:", printers.map(p => p.name));

    // Prefer POS80, then POS58
    let posPrinter = printers.find(p => /POS80/i.test(p.name)) ||
                     printers.find(p => /POS58/i.test(p.name)) ||
                     printers[0]; // fallback to any printer

    if (!posPrinter) throw new Error("No printers found");
    return posPrinter.name;
  }

  /**
   * Generate receipt HTML with ESC/POS drawer command
   */
  function buildReceiptHTML(contentHTML, paperWidth = 58, openDrawer = true) {
    const drawerPulse = String.fromCharCode(27, 112, 0, 25, 250);
    const widthPx = paperWidth === 80 ? 80 : 58;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            @page { margin: 0; size: ${widthPx}mm auto; }
            body { font-family: 'Courier New', monospace; font-size: 11px; width: ${widthPx}mm; padding: 4px; margin: 0; white-space: pre-wrap; line-height: 1.2; }
            div, p, span { margin: 0; padding: 0; }
            .center { text-align: center; }
            .line { border-top: 1px dashed #000; margin: 4px 0; }
            pre.drawer { display:none; }
          </style>
        </head>
        <body>
          ${contentHTML}
          <div class="center line"></div>
          <div class="center">*** END OF RECEIPT ***</div>
          ${openDrawer ? `<pre class="drawer">${drawerPulse}</pre>` : ''}
          <div style="height:40px;"></div>
        </body>
      </html>
    `;
  }

  // ---------------- CHECK PRINTER STATUS ----------------
  ipcMain.handle("check-printer-status", async () => {
    try {
      const printerName = await detectPOSPrinter();
      console.log("✅ POS printer detected:", printerName);
      return { success: true, connected: true, printerName };
    } catch (err) {
      console.error("Printer detection error:", err);
      return { success: false, connected: false, message: err.message };
    }
  });

  // ---------------- PRINT RECEIPT ----------------
  ipcMain.handle("print-receipt", async (event, { html, openDrawer = true }) => {
    console.log("🧾 Received print request from renderer");

    try {
      const printerName = await detectPOSPrinter();
      const win = new BrowserWindow({ width: 300, height: 600, show: false });

      const styledHTML = buildReceiptHTML(html, /POS80/i.test(printerName) ? 80 : 58, openDrawer);
      const tmpFile = path.join(os.tmpdir(), "receipt_preview.html");
      fs.writeFileSync(tmpFile, styledHTML, "utf8");

      await win.loadFile(tmpFile);

      await new Promise((resolve) => {
        win.webContents.print(
          { silent: true, printBackground: true, deviceName: printerName },
          (success, failureReason) => {
            if (!success) {
              console.error("Print failed:", failureReason);
              resolve({ success: false, message: failureReason });
            } else {
              console.log(`Receipt printed on ${printerName} successfully`);
              if (openDrawer) console.log("Cash drawer triggered automatically");
              resolve({ success: true });
            }
            setTimeout(() => win.close(), 1000);
          }
        );
      });

      return { success: true, message: "Printed successfully" };
    } catch (err) {
      console.error("Print handler error:", err);
      return { success: false, message: err.message };
    }
  });
  // ---------------- REPORTS ----------------
  ipcMain.handle("z-reading:print", async (_e, totals) => {
  const html = `
    <div class="center"><b>Z-READING</b></div>
    <div class="line"></div>
    First Invoice: ${totals.first_inv}<br/>
    Last Invoice: ${totals.last_inv}<br/>
    VAT Sales: ${totals.vat_sales.toFixed(2)}<br/>
    VAT Amount: ${totals.vat_amount.toFixed(2)}<br/>
    VAT Exempt: ${totals.vat_exempt.toFixed(2)}<br/>
    Zero Rated: ${totals.zero_rated.toFixed(2)}<br/>
    Discount: ${totals.discount.toFixed(2)}
    <div class="line"></div>
    <b>TOTAL:</b> ${totals.total.toFixed(2)}
  `

  return await ipcMain.emit("print-receipt", null, {
    html,
    openDrawer: false
  })
})

ipcMain.handle("receipt:reprint", async (_e, invoice) => {
  const items = invoice.items.map(i =>
    `${i.productname} x${i.quantity}  ${i.total.toFixed(2)}`
  ).join("<br/>")

  const html = `
    <div class="center"><b>REPRINT</b></div>
    <div>${invoice.invoice_number}</div>
    <div class="line"></div>
    ${items}
    <div class="line"></div>
    TOTAL: ${invoice.total.toFixed(2)}
  `

  return await ipcMain.emit("print-receipt", null, {
    html,
    openDrawer: false
  })
})

  // ---------------- OPEN CASH DRAWER ----------------
  ipcMain.handle("open-cash-drawer", async () => {
  try {
    const printerName = await detectPOSPrinter();
    const win = new BrowserWindow({ width: 10, height: 10, show: false });

    const drawerPulse = String.fromCharCode(27, 112, 0, 25, 250);

    const html = `
      <pre>${drawerPulse}</pre>
    `;

    const tmp = path.join(os.tmpdir(), "drawer.html");
    fs.writeFileSync(tmp, html, "utf8");

    await win.loadFile(tmp);

    await new Promise((resolve) => {
      win.webContents.print(
        { silent: true, printBackground: false, deviceName: printerName },
        () => resolve()
      );
    });

    setTimeout(() => win.close(), 500);

    return { success: true }
  } catch (err) {
    return { success: false, message: err.message }
  }
  });

}

module.exports = {
  setupPrinterHandlers
}
