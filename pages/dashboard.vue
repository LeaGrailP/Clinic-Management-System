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
      <button @click="printReceipt" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg shadow">Print Receipt</button>
      <button @click="checkPrinter">Check Printer</button>
    </div>

<!-- POS Receipt Template (hidden, for printing) -->
<div ref="receipt" class="receipt-container font-mono hidden">
  <div class="text-center mb-2">
    <div class="text-lg font-bold">FETHEA POS</div>
    <div>Pico, La Trinidad</div>
    <div>VAT REG TIN: 001-001-001-000</div>
    <div>CASHIER: {{ issuedBy }}</div>
    <div>Date: {{ invoiceDate }} {{ invoiceTime }}</div>
    <div>Invoice #: {{ invoiceNumber }}</div>
  </div>

  <hr />

  <!-- Header -->
  <div class="flex font-bold border-b border-black pb-1 mb-1">
    <span class="w-8 text-left">Qty</span>
    <span class="flex-1 text-left">Item</span>
    <span class="w-12 text-right">Price</span>
    <span class="w-12 text-right">Total</span>
  </div>

  <!-- Items -->
  <div
    v-for="p in selectedProducts"
    :key="p.id"
    class="mb-1 flex justify-between"
  >
    <span class="w-8 text-left">{{ p.quantity }}</span>
    <span class="flex-1 text-left">{{ p.productname }}</span>
    <span class="w-12 text-right">PHP {{ p.price.toFixed(2) }}</span>
    <span class="w-12 text-right">PHP {{ p.total.toFixed(2) }}</span>
  </div>

  <hr />

  <!-- Totals -->
  <div class="space-y-1">
    <div class="flex justify-between">
      <span>Discount:</span>
      <span>PHP {{ discount.toFixed(2) }}</span>
    </div>
    <div class="flex justify-between">
      <span>Subtotal:</span>
      <span>PHP {{ subtotal.toFixed(2) }}</span>
    </div>
    <div class="flex justify-between font-bold text-lg">
      <span>Total:</span>
      <span>PHP {{ totals.total.toFixed(2) }}</span>
    </div>
  </div>

  <hr />

  <!-- Payment Info -->
  <div class="space-y-1">
    <div class="flex justify-between">
      <span>Payment:</span>
      <span>Cash</span>
    </div>
    <div class="flex justify-between">
      <span>Tendered:</span>
      <span>PHP {{ tendered.toFixed(2) }}</span>
    </div>
    <div class="flex justify-between">
      <span>Change:</span>
      <span>PHP {{ change.toFixed(2) }}</span>
    </div>
  </div>

  <hr />

  <!-- VAT -->
  <div class="space-y-1 text-xs">
    <div class="flex justify-between">
      <span>VAT Sales:</span>
      <span>PHP {{ totals.vat_sales.toFixed(2) }}</span>
    </div>
    <div class="flex justify-between">
      <span>12% VAT:</span>
      <span>PHP {{ totals.vat_amount.toFixed(2) }}</span>
    </div>
    <div class="flex justify-between">
      <span>VAT Exempt:</span>
      <span>PHP {{ totals.vat_exempt_sales.toFixed(2) }}</span>
    </div>
    <div class="flex justify-between">
      <span>Zero Rated:</span>
      <span>PHP {{ totals.zero_rated_sales.toFixed(2) }}</span>
    </div>
  </div>

  <hr />

  <!-- Footer -->
  <div class="text-center text-xs mt-2 leading-tight">
    Thank you for shopping!<br />
    No returns without receipt.
  </div>
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

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0)
}

function updateClockAndDate() {
  const now = new Date()
  invoiceDate.value = now.toISOString().split('T')[0]
  invoiceTime.value = now.toTimeString().slice(0,5)
}

async function fetchProducts() {
  try {
    products.value = await window.electron.invoke('get-products')
  } catch(err) {
    console.error('Error fetching products:', err)
  }
}

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
  if (p.quantity <= 0) {
    selectedProducts.value.splice(index, 1)
  } else {
    p.total = p.quantity * p.unitPrice
  }
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
  if (!selectedProducts.value.length) return alert("No products added!");

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
  };

  try {
    const result = await window.electron.invoke("add-invoice", payload);

    alert(`Invoice saved! Number: ${result.invoice_number}`);

    clearInvoice();
    generateInvoiceNumber();
  } catch (err) {
    console.error("Failed to save invoice:", err);
  }
}
async function checkPrinter() {
  try {
    const result = await window.electron.invoke('check-printer-status')
    if (result.success) {
      alert(result.connected ? '✅ Printer detected!' : '❌ Printer not detected.')
    } else {
      alert('⚠️ Error: ' + result.error)
    }
  } catch (err) {
    console.error('Printer check failed:', err)
  }
}
async function printReceipt() {
  try {
    console.log("🖨 printReceipt() clicked");

    const html = receipt.value?.outerHTML;
    if (!html) {
      alert("Receipt template not found!");
      return;
    }

    console.log("📤 Sending receipt HTML to main process...");
    const result = await window.electron.printReceipt(html); // send raw HTML

    console.log("✅ Result from main:", result);

    if (result === "printed successfully" || result?.success) {
      alert("🖨 Receipt printed successfully!");
    } else {
      alert("⚠️ Print failed: " + (result?.message || result));
    }
  } catch (err) {
    console.error("❌ Error printing:", err);
    alert("Error printing: " + err.message);
  }
}

onMounted(() => {
  updateClockAndDate()
  const clockInterval = setInterval(updateClockAndDate, 1000)
  onBeforeUnmount(() => clearInterval(clockInterval))

  fetchProducts()
  generateInvoiceNumber()
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