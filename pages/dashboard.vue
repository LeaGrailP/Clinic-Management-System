<template> 
  <div class="bg-slate-50 min-h-screen p-6 space-y-6">
    <!-- Invoice Info -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Invoice Number:</label>
        <input type="text" class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500" :value="invoiceNumber" readonly />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Issued By:</label>
        <input type="text" :value="issuedBy" class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500" readonly />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Invoice Date:</label>
        <input type="date" class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500" v-model="invoiceDate" readonly />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Invoice Time:</label>
        <input type="time" class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500" v-model="invoiceTime" readonly />
      </div>
    </div>

    <!-- Sales Table + Totals -->
    <div class="bg-sky-100 rounded-lg shadow p-6 border border-slate-400">
      <div class="flex flex-col lg:flex-row gap-6">

        <!-- Product List -->
        <div class="flex-1 overflow-auto">
          <table class="min-w-full border text-sm text-left">
            <thead class="bg-sky-400 text-gray-800">
              <tr>
                <th class="px-4 py-2 border border-slate-400">Product List</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="product in products"
                :key="product.id"
                class="text-center hover:bg-sky-50 cursor-pointer"
                @click="addProductToInvoice(product)"
              >
                <td class="p-2 border border-slate-400">{{ product.productname }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sales Table -->
        <div class="flex-1 overflow-auto">
          <table class="min-w-full border border-slate-400 text-sm text-left">
            <thead class="bg-sky-300 text-gray-800">
              <tr>
                <th class="px-4 py-2 border border-slate-400">Product</th>
                <th class="px-4 py-2 border border-slate-400">Quantity</th>
                <th class="px-4 py-2 border border-slate-400">Price</th>
                <th class="px-4 py-2 border border-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(p, index) in selectedProducts"
                :key="p.id"
                class="text-center hover:bg-sky-50"
              >
                <td class="p-2 border border-slate-400">{{ p.productname }}</td>
                <td class="p-2 border border-slate-400">{{ p.quantity }}</td>
                <td class="p-2 border border-slate-400">₱{{ p.total.toFixed(2) }}</td>
                <td class="p-2 space-x-2 flex justify-center items-center">
                  <button
                    @click="decreaseQuantity(index)"
                    class="px-2 py-1 bg-sky-200 rounded hover:bg-sky-400"
                  >−</button>
                  <button
                    @click="increaseQuantity(index)"
                    class="px-2 py-1 bg-sky-200 rounded hover:bg-sky-400"
                  >+</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals + Actions -->
        <div class="w-full lg:w-1/3 space-y-4">
          <div class="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-2">
            <div class="flex justify-between">
              <p class="font-bold text-lg">Total VAT Sales</p>
              <p class="text-xl">{{ formatCurrency(totals.vat_sales) }}</p>
            </div>
            <div class="flex justify-between">
              <p class="font-bold text-lg">Total VAT Amount</p>
              <p class="text-xl">{{ formatCurrency(totals.vat_amount) }}</p>
            </div>
            <div class="flex justify-between">
              <p class="font-bold text-lg">Total VAT-Exempt Sales</p>
              <p class="text-xl">{{ formatCurrency(totals.vat_exempt_sales) }}</p>
            </div>
            <div class="flex justify-between">
              <p class="font-bold text-lg">Total Zero-Rated Sales</p>
              <p class="text-xl">{{ formatCurrency(totals.zero_rated_sales) }}</p>
            </div>
          </div>

          <!-- Discount & Tendered -->
          <div class="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-2">
            <div class="flex justify-between items-center space-x-2">
              <span class="font-bold">DISCOUNT</span>
              <div class="relative w-28">
                <input
                  type="text"
                  :value="totals.discount"
                  @input="handleDiscountInput($event)"
                  placeholder="0"
                  class="w-full text-right border rounded px-6 py-1 focus:outline-sky-500"
                />
                <span class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>

            <div class="flex justify-between items-center space-x-2">
              <span class="font-bold">TENDERED</span>
              <div class="relative w-28">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                <input
                  type="text"
                  :value="tendered"
                  @input="tendered = parseFloat($event.target.value) || 0; recalculateTotals()"
                  placeholder="0.00"
                  class="w-full text-right border rounded px-6 py-1 focus:outline-sky-500"
                />
              </div>
            </div>

            <div class="flex justify-between items-center space-x-2">
              <span class="font-bold">CHANGE</span>
              <span>{{ formatCurrency(change) }}</span>
            </div>
          </div>

          <div class="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-2 flex justify-between">
            <span>TOTAL</span>
            <span>{{ formatCurrency(totals.total || 0) }}</span>
          </div>

          <div>
            <router-link to="/transactions" class="text-blue-500 hover:underline">
              View All Invoices →
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <button @click="saveInvoice" class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg shadow">Save</button>
      <button @click="clearInvoice" class="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg shadow">Cancel Transaction</button>
      <button class="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg shadow">Open Drawer</button>
      <button @click="manualOpenDrawer" class="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg shadow">Open Cash Drawer</button>
      <button @click="printReceipt" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg shadow">Print Receipt</button>
      <button @click="checkPrinter">Check Printer</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label>
      Select Printer:
      <select v-model="selectedPrinter" @change="savePrinter">
      <option v-for="p in availablePrinters" :key="p" :value="p">{{ p }}</option>
      </select>
      </label>
    </div>

<!-- POS Receipt Template (optimized for 58mm text-only printer) -->
<div ref="receipt" style="font-family: monospace; font-size:12px; width:280px;">
  <div style="text-align:center;">
    FELTHEA POS<br>
    Pico, La Trinidad<br>
    VAT REG TIN: 001-001-001-000<br>
    CASHIER: {{ issuedBy }}<br>
    DATE: {{ invoiceDate }} {{ invoiceTime }}<br>
    INVOICE #: {{ invoiceNumber }}<br>
  </div>

  <div style="text-align:center;">--------------------------------</div>

  <!-- Header -->
  <div style="font-weight:bold;">
    QTY ITEM                 AMT
  </div>
  <div style="text-align:center;">--------------------------------</div>

  <!-- Product List -->
 <div v-for="(line, i) in formattedLines" :key="i">{{ line }}</div>
  <div style="text-align:center;">--------------------------------</div>

  <!-- Totals -->
  <div>
    Discount:       {{ discount.toFixed(2).padStart(10) }}<br>
    Subtotal:       {{ subtotal.toFixed(2).padStart(10) }}<br>
    TOTAL:          {{ totals.total.toFixed(2).padStart(10) }}<br>
  </div>

  <div style="text-align:center;">--------------------------------</div>

  <!-- Payment Info -->
  <div>
    Tendered:       {{ tendered.toFixed(2).padStart(10) }}<br>
    Change:         {{ change.toFixed(2).padStart(10) }}<br>
  </div>

  <div style="text-align:center;">--------------------------------</div>

  <!-- VAT Info -->
  <div style="font-size:11px;">
    VAT SALES:      {{ totals.vat_sales.toFixed(2).padStart(10) }}<br>
    12% VAT:        {{ totals.vat_amount.toFixed(2).padStart(10) }}<br>
    VAT EXEMPT:     {{ totals.vat_exempt_sales.toFixed(2).padStart(10) }}<br>
    ZERO RATED:     {{ totals.zero_rated_sales.toFixed(2).padStart(10) }}<br>
  </div>

  <div style="text-align:center;">--------------------------------</div>

  <!-- Buyer Info -->
  <div style="font-size:11px;">
    BUYER NAME:<br>
    BUYER ADDRESS:<br>
    BUYER TIN:<br>
  </div>

  <!-- Footer -->
  <div style="text-align:center;">Thank you for shopping!</div>
  <div style="height:80px;"></div>
  <br><br><br><br><br>
</div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'

const issuedBy = ref(localStorage.getItem("name") || "Unknown User")
const invoiceDate = ref('')
const invoiceTime = ref('')
const invoiceNumber = ref('')
const products = ref([])
const selectedProducts = ref([])

const totals = reactive({
  vat_sales: 0,
  vat_amount: 0,
  vat_exempt_sales: 0,
  zero_rated_sales: 0,
  discount: 0,
  total: 0
})

const tendered = ref(0)
const receipt = ref(null)

const availablePrinters = ref([])
const selectedPrinter = ref(localStorage.getItem("printerName") || "")

// ---------- PRINTERS ----------
async function fetchPrinters() {
  try {
    const result = await window.electron.invoke("list-printers")
    if (!result.success) return console.warn("Failed to list printers:", result.message)

    availablePrinters.value = result.printers

    // Auto-select printer
    if (!selectedPrinter.value || !availablePrinters.value.includes(selectedPrinter.value)) {
      // fallback: first printer matching /pos/i
      const fallback = availablePrinters.value.find(p => /pos/i.test(p)) || availablePrinters.value[0]
      if (fallback) {
        selectedPrinter.value = fallback
        localStorage.setItem("printerName", fallback)
        console.log("Auto-selected printer:", fallback)
      } else {
        selectedPrinter.value = ""
        console.warn("No printers available for fallback")
      }
    }
  } catch (err) {
    console.error("Failed to fetch printers:", err)
  }
}

function savePrinter() {
  if (selectedPrinter.value) {
    localStorage.setItem("printerName", selectedPrinter.value)
    console.log("Printer saved:", selectedPrinter.value)
  }
}

// ---------- FORMAT & UTILS ----------
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0)
}

function updateClockAndDate() {
  const now = new Date()
  invoiceDate.value = now.toISOString().split('T')[0]
  invoiceTime.value = now.toTimeString().slice(0,5)
}

// ---------- PRODUCTS ----------
async function fetchProducts() {
  try {
    products.value = await window.electron.invoke('get-products')
  } catch(err) {
    console.error('Error fetching products:', err)
  }
}

// ---------- INVOICES ----------
async function generateInvoiceNumber() {
  try {
    invoiceNumber.value = await window.electron.invoke('generate-invoice-number')
  } catch(err) {
    console.error('Failed to fetch invoice number:', err)
  }
}

function addProductToInvoice(product) {
  const existing = selectedProducts.value.find(p => p.id === product.id)
  if (existing) {
    existing.quantity += 1
    existing.total = existing.quantity * existing.unitPrice
  } else {
    selectedProducts.value.push({
      ...product,
      quantity: 1,
      unitPrice: product.price || product.total, 
      total: product.price || product.total
    })
  }
  recalculateTotals()
}

function increaseQuantity(index) {
  const p = selectedProducts.value[index]
  p.quantity += 1
  p.total = p.quantity * p.unitPrice
  recalculateTotals()
}

function decreaseQuantity(index) {
  const p = selectedProducts.value[index]
  p.quantity -= 1
  if (p.quantity <= 0) selectedProducts.value.splice(index, 1)
  else p.total = p.quantity * p.unitPrice
  recalculateTotals()
}

function recalculateTotals() {
  totals.vat_sales = 0
  totals.vat_amount = 0
  totals.vat_exempt_sales = 0
  totals.zero_rated_sales = 0

  let subtotalVal = 0

  selectedProducts.value.forEach(p => {
    subtotalVal += p.total || 0
    totals.vat_sales += (p.vatSales || 0) * (p.quantity || 1)
    totals.vat_amount += (p.vatAmount || 0) * (p.quantity || 1)
    totals.vat_exempt_sales += (p.vatExempt || 0) * (p.quantity || 1)
    totals.zero_rated_sales += (p.zeroRated || 0) * (p.quantity || 1)
  })

  totals.total = Math.max(subtotalVal - (subtotalVal * (totals.discount / 100)), 0)
}

function handleDiscountInput(e) {
  let val = parseFloat(e.target.value)
  if (isNaN(val) || val < 0) val = 0
  if (val > 100) val = 100
  totals.discount = val
  recalculateTotals()
}

const subtotal = computed(() => selectedProducts.value.reduce((sum, p) => sum + p.total, 0))
const discount = computed(() => subtotal.value * (totals.discount / 100))
const change = computed(() => Math.max(tendered.value - totals.total, 0))

function clearInvoice() {
  selectedProducts.value = []
  totals.discount = 0
  tendered.value = 0
  recalculateTotals()
}

async function saveInvoice() {
  if (!selectedProducts.value.length) return alert("No products added!")

  const payload = {
    date: invoiceDate.value,
    total: totals.total,
    discount: totals.discount,
    vat_sales: totals.vat_sales,
    vat_amount: totals.vat_amount,
    vat_exempt_sales: totals.vat_exempt_sales,
    zero_rated_sales: totals.zero_rated_sales,
    customer_name: issuedBy.value,
    items: JSON.stringify(selectedProducts.value),
  }

  try {
    const result = await window.electron.invoke("add-invoice", payload)
    alert(`Invoice saved! Number: ${result.invoice_number}`)
    clearInvoice()
    generateInvoiceNumber()
  } catch (err) {
    console.error("Failed to save invoice:", err)
  }
}

// ---------- PRINT ----------
async function printReceipt() {
  try {
    if (!selectedPrinter.value) return alert("No printer selected!")

    const html = receipt.value?.outerHTML
    if (!html) return alert("Receipt template not found!")

    const result = await window.electron.invoke("print-receipt", {
      html,
      printerName: selectedPrinter.value
    })

    if (!result.success) console.error("Print failed:", result.message)
    else console.log("🖨 Receipt printed successfully")
  } catch (err) {
    console.error("❌ Error printing:", err)
  }
}
async function manualOpenDrawer() {
  try {
    const result = await window.electron.invoke("open-cash-drawer", selectedPrinter.value);
    if (!result.success) {
      alert("Failed to open drawer: " + result.message);
    }
  } catch (err) {
    console.error(err);
    alert("Error opening drawer: " + err.message);
  }
}

function formatLine(qty, name, total) {
  qty = qty || 0
  name = name || ''
  total = total || 0
  const qtyStr = String(qty).padEnd(4, ' ')
  const nameStr = name.length > 18 ? name.slice(0, 18) : name.padEnd(18, ' ')
  const totalStr = total.toFixed(2).padStart(10, ' ')
  return `${qtyStr}${nameStr}${totalStr}`
}

const formattedLines = computed(() =>
  selectedProducts.value.map(p => formatLine(p.quantity, p.productname, p.total))
)

// ---------- INIT ----------
onMounted(() => {
  fetchPrinters()
  fetchProducts()
  generateInvoiceNumber()
  updateClockAndDate()
  const clockInterval = setInterval(updateClockAndDate, 1000)
  onBeforeUnmount(() => clearInterval(clockInterval))

  // Optional: auto-refresh printers every 5 minutes
  setInterval(fetchPrinters, 5 * 60 * 1000)
})
</script>

<style scoped>
.receipt-container {
  width: 280px;
  font-size: 12px;
  line-height: 1.4;
  padding: 8px;
}

.flex {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

hr {
  border: none;
  border-top: 1px dashed black;
  margin: 6px 0;
}

.text-center {
  text-align: center;
}

.space-y-1 > * + * {
  margin-top: 4px;
}

.mb-1 {
  margin-bottom: 4px;
}
</style>