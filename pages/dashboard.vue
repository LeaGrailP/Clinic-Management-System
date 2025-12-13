<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { calculatePOS } from '@/electron/calculator.js'
import BaseInput from '@/components/BaseInput.vue'
import { UserRoundPlus } from 'lucide-vue-next'

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
  total: 0,
  _discountAmount: 0
})

const discount = reactive({
  type: '',   // '', 'SC', 'PWD', 'PERCENT', 'AMOUNT'
  amount: 0,  // fixed amount
  rate: 0,    // percent number (eg 10 for 10%)
  raw: ''     // raw user input if you prefer
})

const customer = reactive({ name: '', tin: '' })

const progress = reactive({ active: false, value: 0 })
const tendered = ref(0)
const receipt = ref(null)
const isPrinting = ref(false)

// lifecycle helpers
let clockInterval = null
let handlers = {}
let patientDebounceTimer = null

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

// search debounce for products
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
      if (percent < 80) requestAnimationFrame(animate)
      else resolve()
    }
    requestAnimationFrame(animate)
  })
}

async function finishProgress() {
  progress.value = 100
  setTimeout(() => {
    progress.active = false
    progress.value = 0
  }, 150)
}

//--OPEN DRAWER(Admin use only)--//
const user = {
  name: localStorage.getItem('name'),
  role: localStorage.getItem('role')
}

async function openCashDrawer() {
  if (user.role !== 'admin') return alert('❌ Only admins can open the cash drawer.')
  try {
    await window.electron.invoke('open-cash-drawer')
    alert('✅ Cash drawer opened!')
  } catch (err) {
    alert('Failed to open drawer: ' + (err?.message || err))
  }
}

//---CUSTOMER / PATIENT---//
const patientSearch = ref('')
const patientResults = ref([])

watch(patientSearch, (val) => {
  if (patientDebounceTimer) clearTimeout(patientDebounceTimer)
  patientDebounceTimer = setTimeout(() => fetchPatientMatches(val), 250)
})

async function fetchPatientMatches(query) {
  if (!query) { patientResults.value = []; return }
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
const sortedProducts = computed(() => products.value.slice().sort((a, b) =>
  String(a.productname || '').localeCompare(String(b.productname || ''), undefined, { sensitivity: 'base' })
))

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
  } catch (err) { console.error('fetchProducts:', err) }
}

async function generateInvoiceNumber() {
  try { invoiceData.invoiceNumber = await window.electron.invoke('generate-invoice-number') }
  catch (err) { console.error('generateInvoiceNumber:', err) }
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
      // optional tax fields expected by calculator.js
      vatSales: Number(product.vatSales || 0),
      vatAmount: Number(product.vatAmount || 0),
      vatExempt: Number(product.vatExempt || 0),
      zeroRated: Number(product.zeroRated || 0),
      total: round(price)
    })
  }
  recalcTotals()
}

function increaseQuantity(i) {
  const p = selectedProducts.value[i]
  if (!p) return
  p.quantity = Number(p.quantity || 0) + 1
  p.total = round(p.quantity * (p.unitPrice || p.price || 0))
  recalcTotals()
}

function decreaseQuantity(i) {
  const p = selectedProducts.value[i]
  if (!p) return
  if (p.quantity > 1) {
    p.quantity = Number(p.quantity) - 1
    p.total = round(p.quantity * (p.unitPrice || p.price || 0))
  } else {
    selectedProducts.value.splice(i, 1)
  }
  recalcTotals()
}

function removeProduct(i) {
  if (i >= 0 && i < selectedProducts.value.length) {
    selectedProducts.value.splice(i, 1)
    recalcTotals()
  }
}

//---CALCULATIONS (uses external calculatePOS)---//
function getDiscountValueForCalculator() {
  if (!discount.type) return 0
  if (discount.type === 'SC' || discount.type === 'PWD') return 0 // calculator handles SC/PWD by type
  if (discount.type === 'PERCENT') return Number(discount.rate || 0)
  if (discount.type === 'AMOUNT') return Number(discount.amount || 0)
  // fallback: if user typed raw numeric
  const parsed = parseFloat(discount.raw)
  return isNaN(parsed) ? 0 : parsed
}

function recalcTotals() {
  const discountValue = getDiscountValueForCalculator()
  const result = calculatePOS(
    selectedProducts.value,
    discount.type || '',
    discountValue,
    tendered.value
  )

  // update UI totals from single source of truth
  totals.subtotal = result.subtotal
  totals.vat_sales = result.vatSales
  totals.vat_amount = result.vatAmount
  totals.vat_exempt_sales = result.vatExempt
  totals.zero_rated_sales = result.zeroRated
  totals.total = result.total
  totals._discountAmount = result.discountAmount
}

// keep watches minimal and focused
watch(selectedProducts, recalcTotals, { deep: true })
watch(() => [discount.type, discount.amount, discount.rate, discount.raw], recalcTotals)
watch(tendered, recalcTotals)

//---COMPUTED VALUES---//
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
  totals._discountAmount = 0
  discount.type = ''
  discount.amount = 0
  discount.rate = 0
  discount.raw = ''
  tendered.value = 0
  customer.name = ''
  customer.tin = ''
  recalcTotals()
}

async function saveInvoice() {
  if (!selectedProducts.value.length) return alert('No products added!')
  if (!canPrint.value) return alert('Tendered amount required')

  try {
    const payload = {
      date: invoiceData.invoiceDate,
      customer_name: customer.name || '',
      customer_tin: customer.tin || '',
      vat_sales: totals.vat_sales,
      vat_amount: totals.vat_amount,
      vat_exempt_sales: totals.vat_exempt_sales,
      zero_rated_sales: totals.zero_rated_sales,
      discount: totals._discountAmount || 0,
      total: totals.total,
      items: JSON.stringify(selectedProducts.value),
      issued_by: invoiceData.issuedBy
    }

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
  // keep totals.discount for backward compatibility but primary source is discount object
  const val = Number(String(e.target.value).trim())
  totals.discount = isNaN(val) ? 0 : val
  recalcTotals()
}

//---LIFECYCLE---//
onMounted(() => {
  updateClockAndDate()
  clockInterval = setInterval(updateClockAndDate, 1000)

  fetchProducts()
  generateInvoiceNumber()
  recalcTotals()

  handlers = {
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

  // register handlers
  window.addEventListener('footer-save', handlers.save)
  window.addEventListener('footer-cancel', handlers.cancel)
  window.addEventListener('footer-open-drawer', handlers.drawer)
  window.addEventListener('footer-check-printer', handlers.checkPrinter)
  window.addEventListener('footer-preview-receipt', handlers.preview)
})

onBeforeUnmount(() => {
  clearInterval(clockInterval)
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  if (patientDebounceTimer) clearTimeout(patientDebounceTimer)

  // unregister handlers if present
  if (handlers.save) window.removeEventListener('footer-save', handlers.save)
  if (handlers.cancel) window.removeEventListener('footer-cancel', handlers.cancel)
  if (handlers.drawer) window.removeEventListener('footer-open-drawer', handlers.drawer)
  if (handlers.checkPrinter) window.removeEventListener('footer-check-printer', handlers.checkPrinter)
  if (handlers.preview) window.removeEventListener('footer-preview-receipt', handlers.preview)
})

// expose for footer bar
defineExpose({ progress, startProgress, finishProgress })

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
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-220px)]">

      <!-- PRODUCT CARD -->
      <div class="flex flex-col p-4 rounded-xl shadow bg-slate-100 dark:bg-slate-600 border-slate-200 dark:border-slate-700">
        <!-- SEARCH -->
        <input type="text" v-model="productSearch" placeholder="Search products..."
          class="mb-3 w-full px-3 py-2 rounded-lg border border-gray-400 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-400"/>
        <!-- PRODUCT LIST -->
        <div class="flex-1 overflow-y-auto divide-y divide-slate-300 dark:divide-slate-700">
          <button
            v-for="p in filteredProducts"
            :key="p.id"
            @click="addProductToInvoice(p)"
            class="w-full flex justify-between items-center px-3 py-3 text-left hover:bg-sky-200 dark:hover:bg-sky-600 transition">
            <div class="flex flex-col">
              <span class="font-medium text-sm">{{ p.productname }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- CART CARD -->
      <div class="flex flex-col p-4 rounded-xl shadow border bg-slate-100 dark:bg-slate-600 border-slate-200 dark:border-slate-700">
        <!-- TABLE HEADER (FIXED) -->
        <div class="border-b pb-2 mb-2">
          <div class="grid grid-cols-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span>Product</span>
            <span class="text-center">Qty</span>
            <span class="text-right">Price</span>
            <span class="text-center">Action</span>
          </div>
        </div>
        <!-- TABLE BODY (SCROLLABLE) -->
        <div class="flex-1 overflow-y-auto">
          <div
            v-for="(p, index) in selectedProducts"
            :key="p.id"
            class="grid grid-cols-4 items-center text-sm py-2 border-b 
                  hover:bg-slate-50 dark:hover:bg-slate-800 transition">
            <span class="truncate">{{ p.productname }}</span>
            <span class="text-center">{{ p.quantity }}</span>
            <span class="text-right">{{ formatCurrency(p.total) }}</span>

            <div class="flex justify-center gap-1">
              <button @click="decreaseQuantity(index)" class="px-2 py-1 rounded bg-slate-200 dark:bg-slate-700">−</button>
              <button @click="increaseQuantity(index)" class="px-2 py-1 rounded bg-sky-400 dark:bg-sky-700">+</button>
              <button @click="removeProduct(index)" class="px-2 py-1 rounded bg-red-500 text-white">×</button>
            </div>
          </div>
        </div>
      </div>

      <!-- TOTALS / DISCOUNT / CUSTOMER CARD -->
      <div class="flex flex-col gap-4 h-full">
        <!-- CUSTOMER -->
        <div class="p-4 rounded-xl shadow border bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 space-y-3">
          <div class="flex items-center justify-between">
          <h2 class="font-semibold text-lg">Customer</h2>
          <router-link
            to="/customer"
            class="flex items-center justify-center h-9 w-9 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition"
            title="Register Customer">
            <UserRoundPlus class="w-4 h-4" />
          </router-link>
        </div>
          <!-- SEARCH BAR -->
          <div class="relative">
            <input
              v-model="patientSearch"
              placeholder="Search customer name or TIN…"
              class="w-full text-sm px-3 py-2 rounded border bg-white dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100"
            />

            <!-- DROPDOWN -->
            <ul
              v-if="patientResults.length > 0"
              class="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 
                    border border-gray-300 dark:border-gray-600 rounded shadow-lg 
                    max-h-48 overflow-y-auto">
              <li
                v-for="patient in patientResults"
                :key="patient.id"
                @click="selectPatient(patient)"
                class="p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 border-b">
                <p class="text-sm font-medium">
                  {{ patient.lastName }}, {{ patient.firstName }} {{ patient.middleName }}
                </p>
                <p class="text-xs text-gray-500">TIN: {{ patient.tin || '—' }}</p>
              </li>
            </ul>
          </div>  
        </div>

        <!-- DISCOUNT -->
        <div class="p-4 rounded-xl shadow border bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 space-y-3">
          <div class="flex justify-between items-center">
            <h2 class="font-semibold text-lg text-slate-800 dark:text-slate-100">Discount Type</h2>
            <select v-model="discount.type" class="px-2 py-1 rounded border text-sm bg-slate-50 dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100">
              <option value="">None</option>
              <option value="SC">Senior Citizen</option>
              <option value="PWD">PWD</option>
            </select>
          </div>
          <div v-if="discount.type === 'SC' || discount.type === 'PWD'" class="space-y-2 border-gray-400"></div>
        </div>

        <!-- PAYMENT -->
        <div class="p-4 rounded-xl shadow border bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-lg text-slate-800 dark:text-slate-100">TENDERED</span>
            <input type="number" v-model="tendered" @input="recalcTotals()" class="w-32 text-right border rounded px-2 py-1 bg-slate-50 dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100" />
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
        <div>
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