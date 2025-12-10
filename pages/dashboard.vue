<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import BaseInput from '@/components/BaseInput.vue'

definePageMeta({ showFooter: true })

// ---------- STATE ----------
const invoiceData = reactive({
  invoiceNumber: '',
  issuedBy: localStorage.getItem('name') || 'Unknown User',
  invoiceDate: '',
  invoiceTime: ''
})

const showPreview = ref(false)
const productSearch = ref('')
const debouncedSearch = ref('')
let searchDebounceTimer = null

const products = ref([])
const selectedProducts = ref([])

const totals = reactive({
  subtotal: 0,
  vat_sales: 0,
  vat_amount: 0,
  vat_exempt_sales: 0,
  zero_rated_sales: 0,
  discount: 0, 
  total: 0
})

const discount = reactive({
  type: '',   
  amount: 0,
  rate: 0,
  raw: ''
})

const customer = reactive({
  name: '',
  tin: ''
})

const progress = reactive({ active: false, value: 0 })
const tendered = ref(0)
const receipt = ref(null)
const isPrinting = ref(false)

//---UTILS---//
function round(val) {
  return Math.round(Number(val || 0) * 100) / 100
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount) || 0)
}

function updateClockAndDate() {
  const now = new Date()
  invoiceData.invoiceDate = now.toISOString().split('T')[0]
  invoiceData.invoiceTime = now.toTimeString().slice(0, 5)
}

watch(productSearch, val => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => debouncedSearch.value = String(val || '').trim().toLowerCase(), 250)
})

// --- PROGRESS BAR --- //
function startProgress(duration = 600) {
  return new Promise(resolve => {

    progress.active = true
    progress.value = 0

    const start = performance.now()

    function animate(now) {
      const elapsed = now - start
      const percent = Math.min(80, (elapsed / duration) * 80)

      progress.value = percent

      if (percent < 80) {
        requestAnimationFrame(animate)
      } else {
        resolve()
      }
    }

    requestAnimationFrame(animate)
  })
}



//--OPEN DRAWER(Admin use only)--//
const user = {
  name: localStorage.getItem('name'),
  role: localStorage.getItem('role')
}

async function openCashDrawer() {
  console.log("ROLE:", user.role)

  if (user.role !== 'admin') {
    return alert('❌ Only admins can open the cash drawer.')
  }

  try {
    await window.electron.invoke('open-cash-drawer')
    alert('✅ Cash drawer opened!')
  } catch (err) {
    alert('Failed to open drawer: ' + (err?.message || err))
  }
}



//---CUSTOMER---//

const patientSearch = ref('')
const patientResults = ref([])

// Debounce search
let patientDebounceTimer = null
watch(patientSearch, (val) => {
  if (patientDebounceTimer) clearTimeout(patientDebounceTimer)
  patientDebounceTimer = setTimeout(() => {
    fetchPatientMatches(val)
  }, 250)
})

async function fetchPatientMatches(query) {
  if (!query) {
    patientResults.value = []
    return
  }

  try {
    const results = await window.patientAPI.searchPatients(query)
    patientResults.value = Array.isArray(results) ? results : []
  } catch (err) {
    console.error('fetchPatientMatches:', err)
    patientResults.value = []
  }
}

function selectPatient(p) {
  customer.name = `${p.firstName} ${p.middleName || ''} ${p.lastName}`.trim()
  customer.tin = p.tin || ''
  patientSearch.value = customer.name
  patientResults.value = []
}


//---PRODUCTS---//
const sortedProducts = computed(() => {
  return products.value.slice().sort((a, b) =>
    String(a.productname || '').localeCompare(String(b.productname || ''), undefined, { sensitivity: 'base' })
  )
})

const filteredProducts = computed(() => {
  if (!debouncedSearch.value) return sortedProducts.value
  const q = debouncedSearch.value
  return sortedProducts.value.filter(p =>
    (p.productname || '').toLowerCase().includes(q) ||
    (p.sku || '').toLowerCase().includes(q)
  )
})

//---FETCH AND GENERATE---//
async function fetchProducts() {
  try {
    const res = await window.electron.invoke('get-products')
    products.value = Array.isArray(res) ? res : []
  } catch (err) {
    console.error('fetchProducts:', err)
  }
}

async function generateInvoiceNumber() {
  try {
    invoiceData.invoiceNumber = await window.electron.invoke('generate-invoice-number')
  } catch (err) {
    console.error('generateInvoiceNumber:', err)
  }
}

//---CART AND QUANTITY---//
function addProductToInvoice(product) {
  if (!product || !product.id) return
  const existing = selectedProducts.value.find(p => p.id === product.id)
  const price = Number(product.price ?? product.unitPrice ?? product.total ?? 0)

  if (existing) {
    existing.quantity = Number(existing.quantity || 0) + 1
    existing.total = round(existing.quantity * (existing.unitPrice || existing.price || price))
  } else {
    selectedProducts.value.push({
      id: product.id,
      productname: product.productname || product.name || 'Unnamed',
      quantity: 1,
      unitPrice: price,
      price: price,
      total: round(price)
    })
  }
  recalcTotalsInternal()
}

function increaseQuantity(i) {
  const p = selectedProducts.value[i]
  if (!p) return
  p.quantity = Number(p.quantity || 0) + 1
  p.total = round(p.quantity * (p.unitPrice || p.price || 0))
  recalcTotalsInternal()
}

function decreaseQuantity(i) {
  const p = selectedProducts.value[i]
  if (!p) return

  if (p.quantity > 1) {
    p.quantity = Number(p.quantity) - 1
    p.total = round(p.quantity * (p.unitPrice || p.price || 0))
  } else {
    // remove when quantity reaches zero
    selectedProducts.value.splice(i, 1)
  }
  recalcTotalsInternal()
}

function removeProduct(i) {
  if (i >= 0 && i < selectedProducts.value.length) {
    selectedProducts.value.splice(i, 1)
    recalcTotalsInternal()
  }
}

//---CALCULATIONS---//
function parseManualDiscount(value, baseAmount) {
  if (value === null || value === undefined || value === '') return 0
  const str = String(value).trim()
  if (str.endsWith('%')) {
    const pct = parseFloat(str.slice(0, -1))
    if (isNaN(pct)) return 0
    return Math.max(0, (baseAmount * pct) / 100)
  }
  const num = parseFloat(str)
  if (isNaN(num)) return 0
  if (num > 0 && num <= 100) {
    return Math.max(0, (baseAmount * num) / 100)
  }
  return Math.max(0, num)
}

function calculateDiscount() {
  const subtotalVal = totals.subtotal

  // Reset
  discount.amount = 0
  discount.rate = 0

  if (!discount.type || subtotalVal === 0) return

  if (discount.type === 'SC' || discount.type === 'PWD') {
    const base = subtotalVal / 1.12
    discount.rate = 0.20
    discount.amount = base * discount.rate
    return
  }
}

function recalcTotalsInternal() {
  let subtotalVal = 0
  let vat_sales = 0
  let vat_amount = 0
  let vat_exempt_sales = 0
  let zero_rated_sales = 0

  for (const p of selectedProducts.value) {
    const qty = Number(p.quantity || 0)
    const unit = Number(p.unitPrice ?? p.price ?? 0)
    const line = round(unit * qty)
    p.total = line 
    subtotalVal += line

    vat_sales += (Number(p.vatSales || 0) * qty)
    vat_amount += (Number(p.vatAmount || 0) * qty)
    vat_exempt_sales += (Number(p.vatExempt || 0) * qty)
    zero_rated_sales += (Number(p.zeroRated || 0) * qty)
  }

  totals.subtotal = round(subtotalVal)

  let discountAmount = 0
  if (discount.type === 'SC' || discount.type === 'PWD') {
    const base = vat_sales
    discountAmount = round(base * 0.20)
  } else {
    discountAmount = round(subtotalVal * (Number(totals.discount || 0) / 100))
  }

  if (discountAmount < 0) discountAmount = 0
  if (discountAmount > subtotalVal) discountAmount = subtotalVal

  const totalAfterDiscount = round(Math.max(0, subtotalVal - discountAmount))
  const discountRatio = subtotalVal > 0 ? (totalAfterDiscount / subtotalVal) : 1

  totals.vat_sales = round(vat_sales * discountRatio)
  totals.vat_amount = round(vat_amount * discountRatio)
  totals.vat_exempt_sales = round(vat_exempt_sales * discountRatio)
  totals.zero_rated_sales = round(zero_rated_sales * discountRatio)
  totals.total = totalAfterDiscount
  totals._discountAmount = discountAmount
}

watch(selectedProducts, () => recalcTotalsInternal(), { deep: true })
watch(() => [discount.type, discount.manual, totals.discount], () => recalcTotalsInternal())

//---COMPUTED VALUES---//
const subtotal = computed(() => selectedProducts.value.reduce((s, p) => s + Number(p.total || 0), 0))
const discountAmount = computed(() => {
  const subtotalVal = subtotal.value
  if (discount.type === 'SC' || discount.type === 'PWD') return +(totals.vat_sales * 0.20)
  return +(subtotalVal * (Number(totals.discount || 0) / 100))
})
const change = computed(() => Math.max(0, Number(tendered.value) - Number(totals.total || 0)))

const formattedLines = computed(() =>
  selectedProducts.value.map(p => formatLine(p.quantity, p.productname, p.total))
)

function formatLine(qty, name, total) {
  const qtyStr = String(qty).padEnd(4, ' ')
  const nameStr = name.length > 18 ? name.slice(0, 18) : name.padEnd(18, ' ')
  const totalStr = Number(total || 0).toFixed(2).padStart(10, ' ')
  return `${qtyStr}${nameStr}${totalStr}`
}

//---VALIDATION AND ACTIONS---//
const isCartEmpty = computed(() => selectedProducts.value.length === 0)
const isTenderInvalid = computed(() => !tendered.value || isNaN(tendered.value) || Number(tendered.value) <= 0)
const isInsufficientCash = computed(() => Number(tendered.value) < Number(totals.total))
const canPrint = computed(() => !isCartEmpty.value && !isTenderInvalid.value && !isInsufficientCash.value)
const isPrintDisabled = computed(() => !canPrint.value)

function clearInvoice() {
  selectedProducts.value = []
  totals.discount = 0
  discount.type = ''
  tendered.value = 0
  customer.name = ''
  customer.tin = ''
  recalcTotalsInternal()
}

async function saveInvoice() {
  if (!selectedProducts.value.length)
    return alert('No products added!')

  if (!canPrint.value)
    return alert('Tendered amount required')

  try {
    // Build payload correctly
    const payload = {
      date: invoiceData.invoiceDate,         // Correct field
      customer_name: customer.name || '',
      customer_tin: customer.tin || '',
      vat_sales: totals.vat_sales,
      vat_amount: totals.vat_amount,
      vat_exempt_sales: totals.vat_exempt_sales,
      zero_rated_sales: totals.zero_rated_sales,
      discount: totals._discountAmount || 0, // Discount applied
      total: totals.total,
      items: JSON.stringify(selectedProducts.value)
    }

    // Save only ONCE
    const result = await window.electron.invoke('add-invoice', payload)

    alert(`Invoice saved! Number: ${result.invoice_number}`)

    clearInvoice()
    generateInvoiceNumber()
  } catch (err) {
    console.error('saveInvoice:', err)
    alert('Failed to save invoice.')
  }
}


async function checkPrinter() {
  try {
    const result = await window.electron.invoke('check-printer-status')
    alert(result.connected ? '✅ Printer detected!' : '❌ Printer not detected.')
  } catch (err) { console.error('checkPrinter:', err) }
}

async function printReceipt() {
  if (!canPrint.value) return alert("Cannot print: missing or invalid inputs.")
  if (!receipt.value) return alert("Receipt template not found!")
  try {
    const html = receipt.value.outerHTML
    if (isPrinting.value) return
    isPrinting.value = true
    const result = await window.electron.invoke("print-receipt", { html, openDrawer: true })
    if (!result.success) alert("❌ Print failed!")
    else {
      alert("🖨 Receipt printed successfully!")
      clearInvoice()
      generateInvoiceNumber()
    }
  } catch (err) {
    console.error('printReceipt:', err)
    alert("Printing error: " + (err && err.message ? err.message : err))
  } finally {
    isPrinting.value = false
  }
}


function handleDiscountInput(e) {
  const val = Number(String(e.target.value).trim())
  totals.discount = isNaN(val) ? 0 : val
  recalcTotalsInternal()
}

//---LIFECYCLE---//
onMounted(() => {
  updateClockAndDate()
  const clockInterval = setInterval(updateClockAndDate, 1000)

  fetchProducts()
  generateInvoiceNumber()
  recalcTotalsInternal()

  // ---------- FOOTER EVENT HANDLERS ----------
    const handlers = {
      save: async () => {
        await startProgress(800)
        await saveInvoice()
        await finishProgress()
      },
      cancel: async () => {
        await startProgress(400)
        clearInvoice()
        await finishProgress()
      },
      drawer: async () => {
        await startProgress(500)
        await openCashDrawer()
        await finishProgress()
      },
      checkPrinter: async () => {
        await startProgress(600)
        await checkPrinter()
        await finishProgress()
      },
      preview: async () => {
        if (!canPrint.value) return alert('Please enter tendered amount equal to or greater than total before previewing.')
        await startProgress(300)
        showPreview.value = true
        await finishProgress()
      }
    }

    // ---------- REGISTER EVENTS ----------
    window.addEventListener('footer-save', handlers.save)
    window.addEventListener('footer-cancel', handlers.cancel)
    window.addEventListener('footer-open-drawer', handlers.drawer)
    window.addEventListener('footer-check-printer', handlers.checkPrinter)
    window.addEventListener('footer-preview-receipt', handlers.preview)


  onBeforeUnmount(() => {
  clearInterval(clockInterval)
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (patientDebounceTimer) clearTimeout(patientDebounceTimer)

  window.removeEventListener('footer-save', handlers.save)
  window.removeEventListener('footer-cancel', handlers.cancel)
  window.removeEventListener('footer-open-drawer', handlers.drawer)
  window.removeEventListener('footer-check-printer', handlers.checkPrinter)
  window.removeEventListener('footer-preview-receipt', handlers.preview)
})

})

async function finishProgress() {
  progress.value = 100
  setTimeout(() => {
    progress.active = false
    progress.value = 0
  }, 150)
}

defineExpose({
  progress,
  startProgress,
  finishProgress
})
const invoiceFields = [
  { label: 'Invoice Number', key: 'invoiceNumber' },
  { label: 'Issued By', key: 'issuedBy' },
  { label: 'Date', key: 'invoiceDate' },
  { label: 'Time', key: 'invoiceTime' }
]
</script>

<template>
  <div v-if="progress.active"
      class="w-full h-2 bg-slate-300 dark:bg-slate-700 rounded-b">
    <div class="h-full bg-sky-500 dark:bg-sky-400 transition-all"
        :style="{ width: progress.value + '%' }"></div>
  </div>

  <div class="min-h-screen p-6 space-y-6 pb-32 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100">

    <!-- Invoice Info -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <BaseInput
        v-for="f in invoiceFields"
        :key="f.key"
        :label="f.label"
        v-model="invoiceData[f.key]"
        readonly
        class="dark:bg-slate-800 border-gray-400 dark:text-slate-100"
      />
    </div>

    <!-- Main grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- PRODUCT CARD -->
      <div class="p-4 rounded-xl shadow bg-slate-100 dark:bg-slate-600 border-slate-200 dark:border-slate-700 flex flex-col gap-4">
        <input
          type="text"
          v-model="productSearch"
          placeholder="Search products..."
          class="w-full px-3 py-2 rounded-lg border border-gray-400 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-400"
        />

        <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-auto max-h-[420px]">
          <button
            v-for="p in filteredProducts"
            :key="p.id"
            @click="addProductToInvoice(p)"
            class="p-3 rounded-lg shadow transition bg-slate-100 dark:bg-slate-800 hover:bg-sky-200 dark:hover:bg-sky-600 text-center text-sm text-slate-800 dark:text-slate-100 break-words"
          >
            {{ p.productname }}
          </button>
        </div>
      </div>

      <!-- CART CARD -->
      <div class="p-4 rounded-xl shadow border overflow-auto bg-slate-100 dark:bg-slate-600 border-slate-200 dark:border-slate-700">
        <table class="min-w-full text-sm border rounded-lg overflow-hidden text-slate-800 dark:text-slate-100 border-gray-400 dark:border-slate-700">
          <thead class="bg-slate-100 dark:bg-slate-800">
            <tr>
              <th class="px-4 py-2 border-b text-slate-800 dark:text-slate-100 dark:border-slate-600">Product</th>
              <th class="px-4 py-2 border-b text-center text-slate-800 dark:text-slate-100 dark:border-slate-600">Qty</th>
              <th class="px-4 py-2 border-b text-right text-slate-800 dark:text-slate-100 dark:border-slate-600">Price</th>
              <th class="px-4 py-2 border-b text-center text-slate-800 dark:text-slate-100 dark:border-slate-600">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(p,index) in selectedProducts" :key="p.id" class="hover:bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 transition">
              <td class="px-4 py-2 border-b text-slate-800 dark:text-slate-100 dark:border-slate-700">{{ p.productname }}</td>
              <td class="px-4 py-2 border-b text-center text-slate-800 dark:text-slate-100 dark:border-slate-700">{{ p.quantity }}</td>
              <td class="px-4 py-2 border-b text-right text-slate-800 dark:text-slate-100 dark:border-slate-700">₱{{ Number(p.total).toFixed(2) }}</td>
              <td class="px-4 py-2 border-b dark:border-slate-700">
                <div class="flex justify-center gap-2">
                  <button @click="decreaseQuantity(index)" class="px-3 py-1 rounded-md font-bold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-500">−</button>
                  <button @click="increaseQuantity(index)" class="px-3 py-1 rounded-md font-bold bg-sky-300 dark:bg-sky-700 hover:bg-sky-400 dark:hover:bg-sky-600">+</button>
                  <button @click="removeProduct(index)" class="px-3 py-1 rounded-md font-bold bg-red-400 dark:bg-red-700 hover:bg-red-500 dark:hover:bg-red-600">×</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TOTALS / DISCOUNT / CUSTOMER CARD -->
      <div class="flex flex-col gap-4">
        <!-- CUSTOMER -->
        <div class="p-4 rounded-xl shadow border bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 space-y-4">
  <h2 class="font-semibold text-lg text-slate-800 dark:text-slate-100">Customer</h2>

  <!-- SEARCH PATIENT INPUT -->
  <div class="relative">
    <!-- DROPDOWN RESULTS -->
<input
    v-model="patientSearch"
    placeholder="Search Customer..."
    class="w-full text-sm px-3 py-2 rounded border bg-white dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100"
  />

  <!-- RESULTS -->
  <ul
    v-if="patientResults.length > 0"
    class="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded shadow-lg max-h-40 overflow-y-auto"
  >
    <li
      v-for="patient in patientResults"
      :key="patient.id"
      @click="selectPatient(patient)"
      class="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 border-b"
    >
      <p class="text-sm font-medium">{{ patient.lastName }}, {{ patient.firstName }} {{ patient.middleName }}</p>
      <p class="text-xs text-gray-500">TIN: {{ patient.tin }}</p>
    </li>
  </ul>
  </div>

  <!-- SELECTED PATIENT FILLS THESE -->
  <input
    v-model="customer.tin"
    placeholder="TIN"
    class="w-full text-sm px-3 py-2 rounded border bg-white dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100"
  />

  <router-link
    to="/customer"
    class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
  >
    Register Customer
  </router-link>
</div>

        <!-- DISCOUNT -->
        <div class="p-4 rounded-xl shadow border bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 space-y-3">
          <div class="flex justify-between items-center">
            <h2 class="font-semibold text-lg text-slate-800 dark:text-slate-100">Discount Type</h2>
            <select v-model="discount.type" class="px-2 py-1 rounded border text-sm bg-slate-50 dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100">
              <option value="">None</option>
              <option value="SC">Senior Citizen (20%)</option>
              <option value="PWD">PWD (20%)</option>
            </select>
          </div>
          <div v-if="discount.type === 'SC' || discount.type === 'PWD'" class="space-y-2 border-gray-400"></div>
        </div>

        <!-- VAT SUMMARY -->
        <div class="p-4 rounded-xl shadow border bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 space-y-2">
          <h2 class="font-semibold text-lg text-slate-800 dark:text-slate-100">VAT Summary</h2>
          <div class="flex justify-between text-sm"><p class="text-slate-700 dark:text-slate-200">VATable Sales</p><p>{{ formatCurrency(totals.vat_sales) }}</p></div>
          <div class="flex justify-between text-sm"><p class="text-slate-700 dark:text-slate-200">VAT Amount (12%)</p><p>{{ formatCurrency(totals.vat_amount) }}</p></div>
          <div class="flex justify-between text-sm"><p class="text-slate-700 dark:text-slate-200">VAT Exempt</p><p>{{ formatCurrency(totals.vat_exempt_sales) }}</p></div>
          <div class="flex justify-between text-sm"><p class="text-slate-700 dark:text-slate-200">Zero-Rated</p><p>{{ formatCurrency(totals.zero_rated_sales) }}</p></div>
        </div>

        <!-- PAYMENT -->
        <div class="p-4 rounded-xl shadow border bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-lg text-slate-800 dark:text-slate-100">TENDERED</span>
            <input type="text" v-model="tendered" @input="recalcTotalsInternal()" class="w-32 text-right border rounded px-2 py-1 bg-slate-50 dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100" />
          </div>
          <div class="flex justify-between text-lg"><span class="text-slate-800 dark:text-slate-100">CHANGE</span><span class="font-semibold">{{ formatCurrency(change) }}</span></div>
        </div>

        <!-- GRAND TOTAL -->
        <div class="p-4 rounded-xl shadow border flex justify-between items-center bg-sky-400 dark:bg-sky-800 border-slate-300 dark:border-slate-700">
          <span class="text-xl font-semibold text-slate-900 dark:text-slate-100">TOTAL</span>
          <span class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ formatCurrency(totals.total || 0) }}</span>
        </div>
      </div>
    </div>

    <!-- Receipt Preview Modal -->
    <div v-if="showPreview" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="p-4 rounded-lg shadow-lg w-[320px] max-h-[90vh] overflow-auto bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
        <h2 class="text-lg font-bold mb-3 text-center">Receipt Preview</h2>
        <div ref="receipt">
          <div ref="receipt" class="receipt-container">
          <!-- HEADER -->
          <div class="text-center mb-1">
            <h3>FELTHEA STORE</h3>
            <p>123 Sample St., Barangay, City</p>
            <p>TIN: 123-456-789</p>
            <p>Tel: 0912-345-6789</p>
          </div>

          <hr />

          <!-- INVOICE INFO -->
          <div class="flex mb-1 justify-between">
            <span>Invoice #: </span>
            <span>{{ invoiceData.invoiceNumber }}</span>
          </div>
          <div class="flex mb-1 justify-between">
            <span>Date: </span>
            <span>{{ invoiceData.invoiceDate }} {{ invoiceData.invoiceTime }}</span>
          </div>
          <div class="flex mb-1 justify-between">
            <span>Cashier: </span>
            <span>{{ invoiceData.issuedBy }}</span>
          </div>

          <div v-if="customer.name" class="flex mb-1 justify-between">
            <span>Customer: </span>
            <span>{{ customer.name }}</span>
          </div>
          <div v-if="customer.tin" class="flex mb-1 justify-between">
            <span>TIN: </span>
            <span>{{ customer.tin }}</span>
          </div>

          <hr />

          <!-- ITEMIZED PRODUCTS -->
          <div v-for="p in selectedProducts" :key="p.id" class="flex justify-between mb-1">
            <span>{{ p.quantity }} x {{ p.productname }}</span>
            <span>{{ Number(p.total).toFixed(2) }}</span>
          </div>

          <hr />

          <!-- DISCOUNT -->
          <div v-if="totals._discountAmount > 0" class="flex justify-between mb-1">
            <span>Discount</span>
            <span>-{{ formatCurrency(totals._discountAmount) }}</span>
          </div>

          <!-- VAT SUMMARY -->
          <div class="flex justify-between mb-1">
            <span>VATable Sales</span>
            <span>{{ formatCurrency(totals.vat_sales) }}</span>
          </div>
          <div class="flex justify-between mb-1">
            <span>VAT (12%)</span>
            <span>{{ formatCurrency(totals.vat_amount) }}</span>
          </div>
          <div class="flex justify-between mb-1">
            <span>VAT-Exempt</span>
            <span>{{ formatCurrency(totals.vat_exempt_sales) }}</span>
          </div>
          <div class="flex justify-between mb-1">
            <span>Zero-Rated</span>
            <span>{{ formatCurrency(totals.zero_rated_sales) }}</span>
          </div>

          <hr />

          <!-- GRAND TOTAL & PAYMENT -->
          <div class="flex justify-between mb-1 font-bold">
            <span>Total</span>
            <span>{{ formatCurrency(totals.total) }}</span>
          </div>

          <div class="flex justify-between mb-1">
            <span>Tendered</span>
            <span>{{ formatCurrency(tendered) }}</span>
          </div>
          <div class="flex justify-between mb-2 font-semibold">
            <span>Change</span>
            <span>{{ formatCurrency(change) }}</span>
          </div>

          <hr />

          <!-- FOOTER -->
          <div class="text-center mt-2">
            <p>*** This serves as an official receipt ***</p>
            <p>Thank you for your purchase!</p>
          </div>
        </div>
        </div>
        <div class="flex justify-between mt-4">
          <button @click="showPreview = false" class="w-1/2 mr-2 py-2 px-4 rounded shadow bg-red-500 hover:bg-red-600 text-slate-100">Cancel</button>

          <button :disabled="isPrintDisabled" @click="if (canPrint) { printReceipt(); showPreview = false }" class="w-1/2 ml-2 py-2 px-4 rounded shadow bg-green-500 hover:bg-green-600 text-slate-100 disabled:opacity-40">Confirm</button>
        </div>
      </div>
    </div>
  </div>
</template>