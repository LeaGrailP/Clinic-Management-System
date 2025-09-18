<template> 
  <div class="bg-slate-50 min-h-screen p-6 space-y-6">
    <!-- Invoice Info -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Invoice #</label>
        <input type="text" class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500" :value="invoiceNumber" readonly />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Issued By</label>
        <input type="text" :value="issuedBy" class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500" readonly />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Invoice Date</label>
        <input type="date" class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500" v-model="invoiceDate" readonly />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Invoice Time</label>
        <input type="time" class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500" v-model="invoiceTime" readonly />
      </div>

  <div class="relative" ref="dropdownRef">
    <label class="block text-sm font-medium text-gray-700 mb-1">Customer</label>
    <div class="relative">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Search customer..."
        @input="dropdownOpen = true"
        class="w-full rounded-lg border-gray-300 shadow-sm focus:ring-sky-500 focus:border-sky-500 pl-3 pr-8 py-2"
      />

      <!-- Dropdown -->
      <ul
        v-if="dropdownOpen && filteredPatients.length > 0 && searchQuery"
        class="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto"
      >
        <li
          v-for="patient in filteredPatients"
          :key="patient.id"
          @click="selectPatient(patient)"
          class="px-4 py-2 cursor-pointer hover:bg-sky-100"
        >
          {{ patient.firstName }} {{ patient.lastName }}
        </li>
      </ul>
    </div>
  </div>

  <!-- Add New Patient -->
  <div>
    <router-link
      to="/customer"
      class="mt-4 inline-block px-4 py-2 bg-sky-500 text-white rounded-lg shadow hover:bg-sky-600"
    >
      + Add New Customer
    </router-link>
  </div>


</div>
    <!-- Sales Table + Totals -->
    <div class="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div class="flex flex-col lg:flex-row gap-6">

        <!-- Product List -->
        <div class="flex-1 overflow-auto">
          <table class="min-w-full border border-gray-300 text-sm text-left">
            <thead class="bg-sky-300 text-gray-800">
              <tr>
                <th class="px-4 py-2 border">Product List</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="product in products"
                :key="product.id"
                class="text-center hover:bg-gray-50 cursor-pointer"
                @click="addProductToInvoice(product)"
              >
                <td class="p-2 border">{{ product.productname }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Sales Table -->
        <div class="flex-1 overflow-auto">
          <table class="min-w-full border border-gray-300 text-sm text-left">
            <thead class="bg-sky-300 text-gray-800">
              <tr>
                <th class="px-4 py-2 border">Product</th>
                <th class="px-4 py-2 border">Quantity</th>
                <th class="px-4 py-2 border">Price</th>
                <th class="px-4 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(p, index) in selectedProducts"
                :key="p.id"
                class="text-center hover:bg-gray-50"
              >
                <td class="p-2 border">{{ p.productname }}</td>
                <td class="p-2 border">{{ p.quantity }}</td>
                <td class="p-2 border">₱{{ p.total.toFixed(2) }}</td>
                <td class="p-2 border space-x-2 flex justify-center items-center">
                  <button
                    @click="decreaseQuantity(index)"
                    class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                  >−</button>
                  <button
                    @click="increaseQuantity(index)"
                    class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
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
      <button @click="saveInvoice" class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg shadow">Save and Print Reciept</button>
      <button @click="clearInvoice" class="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg shadow">Cancel Transaction</button>
      <button class="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg shadow">Open Drawer</button>
       </div>

<!-- POS Receipt Template (hidden, for printing) -->
<div ref="receipt" class="receipt-container p-4 font-mono hidden">
  <div class="text-center mb-2">
    <div class="text-lg font-bold">FETHEA POS</div>
    <div>Pico, La Trinidad</div>
    <div>VAT REG TIN: 001-001-001-000</div>
    <div>CASHIER: {{ issuedBy }}</div>
    <div>Date: {{ invoiceDate }} {{ invoiceTime }}</div>
    <div>Invoice #: {{ invoiceNumber }}</div>
  </div>

  <hr />

  <!-- Receipt Header -->
  <div class="flex font-bold border-b border-black pb-1 mb-1">
    <span class="w-8 text-left">Qty</span>
    <span class="flex-1 text-left">Description</span>
    <span class="w-12 text-right">Price</span>
    <span class="w-12 text-right">Amount</span>
  </div>

  <!-- Receipt Items -->
  <div v-for="p in selectedProducts" :key="p.id" class="mb-1">
    <div class="flex">
      <span class="w-8">{{ p.quantity }}</span>
      <span class="flex-1 break-words">
        {{ p.productname }}
      </span>
      <span class="w-12 text-right">{{ formatCurrency(p.price) }}</span>
      <span class="w-12 text-right">{{ formatCurrency(p.total) }}</span>
    </div>
  </div>

  <hr />

  <!-- Totals -->
  <div class="flex justify-between"><span>Discount:</span><span>{{ formatCurrency(discount) }}</span></div>
  <div class="flex justify-between"><span>Subtotal:</span><span>{{ formatCurrency(subtotal) }}</span></div>
  <div class="flex justify-between font-bold text-lg"><span>Total:</span><span>{{ formatCurrency(totals.total) }}</span></div>

  <hr />

  <!-- Payment -->
  <div class="flex justify-between"><span>Payment:</span><span>Cash</span></div>
  <div class="flex justify-between"><span>Tendered:</span><span>{{ formatCurrency(tendered) }}</span></div>
  <div class="flex justify-between"><span>Change:</span><span>{{ formatCurrency(change) }}</span></div>

  <hr />

  <!-- VAT breakdown -->
  <div class="flex justify-between"><span>VAT SALES:</span><span>{{ formatCurrency(totals.vat_sales) }}</span></div>
  <div class="flex justify-between"><span>12% VAT Amount:</span><span>{{ formatCurrency(totals.vat_amount) }}</span></div>
  <div class="flex justify-between"><span>VAT EXEMPT SALES:</span><span>{{ formatCurrency(totals.vat_exempt_sales) }}</span></div>
  <div class="flex justify-between"><span>ZERO RATED SALES:</span><span>{{ formatCurrency(totals.zero_rated_sales) }}</span></div>

  <hr />

  <div class="text-center text-sm mt-2">
    Thank you for shopping!<br/>
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
      unitPrice: product.price || product.total, // ensure per-unit price
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
  if (!selectedProducts.value.length) return alert('No products added!')
  const payload = {
    date: invoiceDate.value,
    total: totals.total,
    items: JSON.stringify(selectedProducts.value)
  }
  try {
    const result = await window.electron.invoke('add-invoice', payload)
    alert(`Invoice saved! Number: ${result.invoice_number}`)

    // ✅ Call print right after saving
    printReceipt()

    clearInvoice()
    generateInvoiceNumber()
  } catch (err) {
    console.error('Failed to save invoice:', err)
  }
}

function printReceipt() {
  const printWindow = window.open('', '', 'width=300,height=600')
  printWindow.document.write('<html><head><title>Receipt</title><style>')
  printWindow.document.write(`
    body { font-family: monospace; font-size: 12px; }
    .flex { display: flex; justify-content: space-between; }
    .truncate { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
    hr { border: none; border-top: 1px dashed black; margin: 2px 0; }
  `)
  printWindow.document.write('</style></head><body>')
  printWindow.document.write(receipt.value.innerHTML)
  printWindow.document.write('</body></html>')
  printWindow.document.close()
  printWindow.print()
}

onMounted(() => {
  updateClockAndDate()
  const clockInterval = setInterval(updateClockAndDate, 1000)
  onBeforeUnmount(() => clearInterval(clockInterval))

  fetchClinicpatients()
  fetchProducts()
  generateInvoiceNumber()
})
</script>

<style scoped>
.receipt-container {
  width: 280px;
  font-size: 12px;
  line-height: 1.2;
}
.flex {
  display: flex;
  justify-content: space-between;
}
.break-words {
  white-space: normal;
  word-break: break-word;
}
hr {
  border: none;
  border-top: 1px dashed black;
  margin: 4px 0;
}
</style>