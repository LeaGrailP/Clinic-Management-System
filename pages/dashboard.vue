<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'

definePageMeta({ showFooter: true })

// --- STATE ---
const issuedBy = ref(localStorage.getItem('name') || 'Unknown User')
const invoiceDate = ref('')
const invoiceTime = ref('')
const invoiceNumber = ref('')
const showPreview = ref(false)

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

// --- UTILS ---
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0)
}

function updateClockAndDate() {
  const now = new Date()
  invoiceDate.value = now.toISOString().split('T')[0]
  invoiceTime.value = now.toTimeString().slice(0, 5)
}

// --- FETCH & GENERATE ---
async function fetchProducts() {
  try { products.value = await window.electron.invoke('get-products') } 
  catch (err) { console.error(err) }
}

async function generateInvoiceNumber() {
  try { invoiceNumber.value = await window.electron.invoke('generate-invoice-number') } 
  catch (err) { console.error(err) }
}

// --- INVOICE FUNCTIONS ---
function addProductToInvoice(product) {
  const existing = selectedProducts.value.find(p => p.id === product.id)
  if (existing) { existing.quantity++; existing.total = existing.quantity * existing.unitPrice }
  else selectedProducts.value.push({ ...product, quantity: 1, unitPrice: product.price || product.total, total: product.price || product.total })
  recalculateTotals()
}

function increaseQuantity(index) {
  const p = selectedProducts.value[index]
  p.quantity++; p.total = p.quantity * p.unitPrice
  recalculateTotals()
}

function decreaseQuantity(index) {
  const p = selectedProducts.value[index]
  p.quantity--; if (p.quantity <= 0) selectedProducts.value.splice(index, 1)
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

// --- COMPUTED ---
const subtotal = computed(() => selectedProducts.value.reduce((sum, p) => sum + p.total, 0))
const discount = computed(() => subtotal.value * (totals.discount / 100))
const change = computed(() => Math.max(tendered.value - totals.total, 0))

const formattedLines = computed(() =>
  selectedProducts.value.map(p => formatLine(p.quantity, p.productname, p.total))
)

function formatLine(qty, name, total) {
  const qtyStr = String(qty).padEnd(4, ' ')
  const nameStr = name.length > 18 ? name.slice(0, 18) : name.padEnd(18, ' ')
  const totalStr = total.toFixed(2).padStart(10, ' ')
  return `${qtyStr}${nameStr}${totalStr}`
}

// --- ACTIONS ---
function clearInvoice() {
  selectedProducts.value = []
  totals.discount = 0
  tendered.value = 0
  recalculateTotals()
}

async function saveInvoice() {
  if (!selectedProducts.value.length) return alert('No products added!')

  const payload = {
    date: invoiceDate.value,
    total: totals.total,
    discount: totals.discount,
    vat_sales: totals.vat_sales,
    vat_amount: totals.vat_amount,
    vat_exempt_sales: totals.vat_exempt_sales,
    zero_rated_sales: totals.zero_rated_sales,
    customer_name: issuedBy.value,
    items: JSON.stringify(selectedProducts.value)
  }

  try {
    const result = await window.electron.invoke('add-invoice', payload)
    alert(`Invoice saved! Number: ${result.invoice_number}`)
    clearInvoice()
    generateInvoiceNumber()
  } catch (err) { console.error(err) }
}

async function checkPrinter() {
  try {
    const result = await window.electron.invoke('check-printer-status')
    alert(result.connected ? '✅ Printer detected!' : '❌ Printer not detected.')
  } catch (err) { console.error(err) }
}

async function printReceipt() {
  if (!receipt.value) return alert('Receipt template not found!')
  try {
    const html = receipt.value.outerHTML
    const result = await window.electron.printReceipt(html)
    alert(result.success ? '🖨 Receipt printed successfully!' : '❌ Print failed!')
  } catch (err) {
    console.error(err)
    alert('Error printing: ' + err.message)
  }
}

async function openCashDrawer() {
  try {
    await window.electron.invoke('open-cash-drawer')
    alert('Cash drawer opened!')
  } catch (err) { alert('Failed to open drawer: ' + err.message) }
}

// --- LIFECYCLE ---
onMounted(() => {
  updateClockAndDate()
  const clockInterval = setInterval(updateClockAndDate, 1000)
  onBeforeUnmount(() => clearInterval(clockInterval))

  fetchProducts()
  generateInvoiceNumber()
})
onMounted(() => {
  updateClockAndDate()
  const clockInterval = setInterval(updateClockAndDate, 1000)

  fetchProducts()
  generateInvoiceNumber()

  // --- Listen to footer events ---
  window.addEventListener('footer-save', saveInvoice)
  window.addEventListener('footer-cancel', clearInvoice)
  window.addEventListener('footer-open-drawer', openCashDrawer)
  window.addEventListener('footer-print', printReceipt)
  window.addEventListener('footer-check-printer', checkPrinter)
  window.addEventListener('footer-preview-receipt', () => showPreview.value = true)

  onBeforeUnmount(() => {
    clearInterval(clockInterval)
    window.removeEventListener('footer-save', saveInvoice)
    window.removeEventListener('footer-cancel', clearInvoice)
    window.removeEventListener('footer-open-drawer', openCashDrawer)
    window.removeEventListener('footer-print', printReceipt)
    window.removeEventListener('footer-check-printer', checkPrinter)
    window.removeEventListener('footer-preview-receipt', () => showPreview.value = true)
  })
})
</script>

<template>
  <div class="bg-slate-50 min-h-screen p-6 space-y-6 pb-32">
    <!-- Invoice Info -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Invoice Number:</label>
        <input type="text" :value="invoiceNumber" readonly class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500"/>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Issued By:</label>
        <input type="text" :value="issuedBy" readonly class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500"/>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Invoice Date:</label>
        <input type="date" v-model="invoiceDate" readonly class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500"/>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Invoice Time:</label>
        <input type="time" v-model="invoiceTime" readonly class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500"/>
      </div>
    </div>

    <!-- Sales Table & Totals -->
    <div class="bg-sky-200 rounded-lg shadow p-6 border border-slate-200 flex flex-col lg:flex-row gap-6">
      <!-- Product List -->
      <div class="flex-1 overflow-auto">
        <table class="min-w-full border text-sm text-left">
          <thead class="bg-slate-200 text-gray-800">
            <tr><th class="px-4 py-2 border border-slate-400">Product List</th></tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id" class="text-center hover:bg-slate-200 cursor-pointer" @click="addProductToInvoice(product)">
              <td class="p-2 border border-slate-400">{{ product.productname }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Sales Table -->
      <div class="flex-1 overflow-auto">
        <table class="min-w-full border border-slate-400 text-sm text-left">
          <thead class="bg-slate-200 text-gray-800">
            <tr>
              <th class="px-4 py-2 border border-slate-400">Product</th>
              <th class="px-4 py-2 border border-slate-400">Quantity</th>
              <th class="px-4 py-2 border border-slate-400">Price</th>
              <th class="px-4 py-2 border border-slate-400">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p,index) in selectedProducts" :key="p.id" class="text-center hover:bg-slate-200">
              <td class="p-2 border border-slate-400">{{ p.productname }}</td>
              <td class="p-2 border border-slate-400">{{ p.quantity }}</td>
              <td class="p-2 border border-slate-400">₱{{ p.total.toFixed(2) }}</td>
              <td class="p-2 flex justify-center space-x-2">
                <button @click="decreaseQuantity(index)" class="px-2 py-1 bg-sky-200 rounded hover:bg-sky-400">−</button>
                <button @click="increaseQuantity(index)" class="px-2 py-1 bg-sky-200 rounded hover:bg-sky-400">+</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Totals & Actions -->
      <div class="w-full lg:w-1/3 space-y-4">
        <div class="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-2">
          <div class="flex justify-between"><p class="font-bold text-lg">Total VAT Sales</p><p class="text-xl">{{ formatCurrency(totals.vat_sales) }}</p></div>
          <div class="flex justify-between"><p class="font-bold text-lg">Total VAT Amount</p><p class="text-xl">{{ formatCurrency(totals.vat_amount) }}</p></div>
          <div class="flex justify-between"><p class="font-bold text-lg">Total VAT-Exempt Sales</p><p class="text-xl">{{ formatCurrency(totals.vat_exempt_sales) }}</p></div>
          <div class="flex justify-between"><p class="font-bold text-lg">Total Zero-Rated Sales</p><p class="text-xl">{{ formatCurrency(totals.zero_rated_sales) }}</p></div>
        </div>

        <div class="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-2">
          <div class="flex justify-between items-center">
            <span class="font-bold">DISCOUNT</span>
            <input type="text" :value="totals.discount" @input="handleDiscountInput($event)" placeholder="0" class="w-28 text-right border rounded px-2 py-1"/>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-bold">TENDERED</span>
            <input type="text" :value="tendered" @input="tendered = parseFloat($event.target.value) || 0; recalculateTotals()" placeholder="0.00" class="w-28 text-right border rounded px-2 py-1"/>
          </div>
          <div class="flex justify-between items-center"><span class="font-bold">CHANGE</span><span>{{ formatCurrency(change) }}</span></div>
        </div>

        <div class="bg-white p-4 rounded-lg shadow border border-gray-200 flex justify-between">
          <span>TOTAL</span><span>{{ formatCurrency(totals.total || 0) }}</span>
        </div>

        <div><router-link to="/transactions" class="text-blue-500 hover:underline">View All Invoices →</router-link></div>
      </div>
    </div>

    <!-- Receipt Preview Modal -->
<div
  v-if="showPreview"
  class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
>
  <div class="bg-white p-4 rounded-lg shadow-lg w-[320px] max-h-[90vh] overflow-auto">
    <h2 class="text-lg font-bold mb-3 text-center">Receipt Preview</h2>

    <div ref="receipt">
      <!-- Only place where receipt template exists -->
      <div style="font-family: monospace; font-size:12px; width:280px;">
        <div style="text-align:center;">
          FELTHEA POS<br>
          Pico, La Trinidad<br>
          VAT REG TIN: 001-001-001-000<br>
          CASHIER: {{ issuedBy }}<br>
          DATE: {{ invoiceDate }} {{ invoiceTime }}<br>
          INVOICE #: {{ invoiceNumber }}<br>
        </div>
        <div style="text-align:center;">--------------------------------</div>
        <div style="font-weight:bold;">QTY ITEM                 AMT</div>
        <div style="text-align:center;">--------------------------------</div>
        <div v-for="(line,i) in formattedLines" :key="i">{{ line }}</div>
        <div style="text-align:center;">--------------------------------</div>
        <div>
          Discount:       {{ discount.toFixed(2).padStart(10) }}<br>
          Subtotal:       {{ subtotal.toFixed(2).padStart(10) }}<br>
          TOTAL:          {{ totals.total.toFixed(2).padStart(10) }}<br>
        </div>
        <div style="text-align:center;">--------------------------------</div>
        <div>
          Tendered:       {{ tendered.toFixed(2).padStart(10) }}<br>
          Change:         {{ change.toFixed(2).padStart(10) }}<br>
        </div>
        <div style="text-align:center;">--------------------------------</div>
        <div style="font-size:11px;">
          VAT SALES:      {{ totals.vat_sales.toFixed(2).padStart(10) }}<br>
          12% VAT:        {{ totals.vat_amount.toFixed(2).padStart(10) }}<br>
          VAT EXEMPT:     {{ totals.vat_exempt_sales.toFixed(2).padStart(10) }}<br>
          ZERO RATED:     {{ totals.zero_rated_sales.toFixed(2).padStart(10) }}<br>
        </div>
        <div style="text-align:center;">--------------------------------</div>
        <div style="font-size:11px;">
          BUYER NAME:<br>
          BUYER ADDRESS:<br>
          BUYER TIN:<br>
        </div>
        <div style="text-align:center;">Thank you for shopping!</div>
      </div>
    </div>

    <!-- Modal buttons -->
    <div class="flex justify-between mt-4">
      <button
        @click="showPreview = false"
        class="w-1/2 mr-2 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded shadow"
      >
        Cancel
      </button>

      <button
        @click="printReceipt(); showPreview = false"
        class="w-1/2 ml-2 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded shadow"
      >
        Confirm
      </button>
    </div>
  </div>
</div>
  </div>
</template>
