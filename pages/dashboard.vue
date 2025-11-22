<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import BaseInput from '@/components/BaseInput.vue'

definePageMeta({ showFooter: true })

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
  vat_sales: 0,
  vat_amount: 0,
  vat_exempt_sales: 0,
  zero_rated_sales: 0,
  discount: 0, 
  total: 0
})

const discount = reactive({
  type: '',   
  name: '',
  id_no: '',
  manual: ''  
})

const customer = reactive({
  name: '',
  tin: ''
})

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

watch(productSearch, (val) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    debouncedSearch.value = String(val || '').trim().toLowerCase()
  }, 250)
})
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
  if (existing) {
    existing.quantity += 1
    existing.total = +(existing.quantity * existing.unitPrice)
  } else {
    const unitPrice = Number(product.price ?? product.total ?? 0)
    selectedProducts.value.push({
      ...product,
      quantity: 1,
      unitPrice,
      total: unitPrice
    })
  }
}

function increaseQuantity(i) {
  const p = selectedProducts.value[i]
  p.quantity++
  p.total = round(p.quantity * p.price)
  recalcTotals()
}

function decreaseQuantity(i) {
  const p = selectedProducts.value[i]
  if (p.quantity > 1) {
    p.quantity--
    p.total = round(p.quantity * p.price)
    recalcTotals()
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
  const subtotal = totals.subtotal

  // Reset
  discount.amount = 0
  discount.rate = 0

  if (!discount.type || subtotal === 0) return

  // Senior Citizen / PWD (20% + VAT-exempt rule)
  if (discount.type === 'SC' || discount.type === 'PWD') {
    // Remove VAT first (divide by 1.12)
    const base = subtotal / 1.12
    discount.rate = 0.20
    discount.amount = base * discount.rate
    return
  }

  // Manual discount
  if (discount.type === 'MANUAL') {
    const raw = discount.raw.trim()

    // If contains %, example: “10%”
    if (raw.endsWith('%')) {
      const num = parseFloat(raw.replace('%', ''))
      if (!isNaN(num)) {
        discount.rate = num / 100
        discount.amount = subtotal * discount.rate
      }
    } 

    // If fixed amount “50” or “100”
    else {
      const num = parseFloat(raw)
      if (!isNaN(num)) {
        discount.amount = num
      }
    }
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
    const unit = Number(p.unitPrice || p.price || 0)
    const line = round(unit * qty)
    p.total = line 
    subtotalVal += line

    vat_sales += (Number(p.vatSales || 0) * qty)
    vat_amount += (Number(p.vatAmount || 0) * qty)
    vat_exempt_sales += (Number(p.vatExempt || 0) * qty)
    zero_rated_sales += (Number(p.zeroRated || 0) * qty)
  }

  let discountAmount = 0
  if (discount.type === 'SC' || discount.type === 'PWD') {
    const base = vat_sales
    discountAmount = round(base * 0.20)
  } else if (discount.type === 'MANUAL') {
    discountAmount = round(parseManualDiscount(discount.manual, subtotalVal))
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
  if (discount.type === 'MANUAL') return parseManualDiscount(discount.manual, subtotalVal)
  return +(subtotalVal * (Number(totals.discount || 0) / 100))
})

const change = computed(() => {
  const numTender = Number(tendered.value || 0)
  return Math.max(0, numTender - Number(totals.total || 0))
})

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
  discount.manual = ''
  tendered.value = 0
  customer.name = ''
  customer.tin = ''
  recalcTotalsInternal()
}

async function saveInvoice() {
  if (!selectedProducts.value.length) return alert('No products added!')
  const payload = {
  date: invoiceData.invoiceDate,
  total: totals.total,
  discount_amount: discountAmount.value,
  discount_type: discount.type || 'NONE',
  vat_sales: totals.vat_sales,
  vat_amount: totals.vat_amount,
  vat_exempt_sales: totals.vat_exempt_sales,
  zero_rated_sales: totals.zero_rated_sales,
  customer_name: customer.name || invoiceData.issuedBy,
  items: JSON.stringify(selectedProducts.value)
}
  try {
    const result = await window.electron.invoke('add-invoice', payload)
    alert(`Invoice saved! Number: ${result.invoice_number}`)
    clearInvoice()
    generateInvoiceNumber()
  } catch (err) { console.error('saveInvoice:', err) }
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

async function openCashDrawer() {
  try {
    await window.electron.invoke('open-cash-drawer')
    alert('Cash drawer opened!')
  } catch (err) { alert('Failed to open drawer: ' + (err && err.message ? err.message : err)) }
}
//---LIFECYCLE---//
onMounted(() => {
  updateClockAndDate()
  const clockInterval = setInterval(updateClockAndDate, 1000)

  fetchProducts()
  generateInvoiceNumber()
  recalcTotalsInternal()

  const handlers = {
    save: saveInvoice,
    cancel: clearInvoice,
    drawer: openCashDrawer,
    checkPrinter,
    preview: () => (showPreview.value = true)
  }

  window.addEventListener('footer-save', handlers.save)
  window.addEventListener('footer-cancel', handlers.cancel)
  window.addEventListener('footer-open-drawer', handlers.drawer)
  window.addEventListener('footer-check-printer', handlers.checkPrinter)
  window.addEventListener('footer-preview-receipt', handlers.preview)

  onBeforeUnmount(() => {
    clearInterval(clockInterval)
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
    window.removeEventListener('footer-save', handlers.save)
    window.removeEventListener('footer-cancel', handlers.cancel)
    window.removeEventListener('footer-open-drawer', handlers.drawer)
    window.removeEventListener('footer-check-printer', handlers.checkPrinter)
    window.removeEventListener('footer-preview-receipt', handlers.preview)
  })
})

const invoiceFields = [
  { label: 'Invoice Number', key: 'invoiceNumber' },
  { label: 'Issued By', key: 'issuedBy' },
  { label: 'Date', key: 'invoiceDate' },
  { label: 'Time', key: 'invoiceTime' }
]
</script>

<template>
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
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TOTALS / DISCOUNT / CUSTOMER CARD -->
      <div class="flex flex-col gap-4">

        <!-- CUSTOMER -->
        <div class="p-4 rounded-xl shadow border bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 space-y-3">
          <h2 class="font-semibold text-lg text-slate-800 dark:text-slate-100">Customer</h2>
          <input v-model="customer.name" placeholder="Customer Name (Optional)"
                 class="w-full text-sm px-3 py-2 rounded border bg-white dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100" />
          <input v-model="customer.tin" placeholder="TIN (Optional)"
                 class="w-full text-sm px-3 py-2 rounded border bg-white dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100" />
        </div>

        <!-- DISCOUNT -->
        <div class="p-4 rounded-xl shadow border bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 space-y-3">
          <div class="flex justify-between items-center">
            <h2 class="font-semibold text-lg text-slate-800 dark:text-slate-100">Discount Type</h2>
            <select v-model="discount.type" class="px-2 py-1 rounded border text-sm bg-white dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100">
              <option value="">None</option>
              <option value="SC">Senior Citizen (20%)</option>
              <option value="PWD">PWD (20%)</option>
              <option value="MANUAL">Manual Discount (₱ or %)</option>
            </select>
          </div>

          <div v-if="discount.type === 'SC' || discount.type === 'PWD'" class="space-y-2 border-gray-400">
            <input v-model="discount.name" placeholder="Name on ID" class="w-full text-sm px-3 py-2 rounded border bg-slate-50 dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100" />
            <input v-model="discount.id_no" placeholder="ID Number" class="w-full text-sm px-3 py-2 rounded border bg-slate-50 dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100" />
          </div>

          <div v-if="discount.type === 'MANUAL'" class="flex justify-between items-center">
            <span class="text-slate-700 dark:text-slate-200">Discount Amount</span>
            <input v-model="discount.manual" placeholder="0 or 10%" @input="recalcTotalsInternal()" class="w-28 text-right px-2 py-1 rounded border text-sm bg-slate-50 dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100" />
          </div>

          <!-- legacy percent discount -->
          <div v-if="!discount.type" class="flex justify-between items-center">
            <span class="text-slate-700 dark:text-slate-200">Discount %</span>
            <input :value="totals.discount" @input="handleDiscountInput($event)" placeholder="0" class="w-28 text-right px-2 py-1 rounded border text-sm bg-slate-50 dark:bg-slate-800 border-gray-400 text-gray-900 dark:text-gray-100" />
          </div>
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

    <!-- Receipt Preview Modal (unchanged layout, uses invoiceData & customer) -->
    <div v-if="showPreview" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="p-4 rounded-lg shadow-lg w-[320px] max-h-[90vh] overflow-auto bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
        <h2 class="text-lg font-bold mb-3 text-center">Receipt Preview</h2>

        <div ref="receipt">
          <div style="font-family: monospace; font-size:12px; width:280px;">
            <div class="text-center">
              FELTHEA POS<br>
              Pico, La Trinidad<br>
              VAT REG TIN: 001-001-001-000<br>
              CASHIER: {{ invoiceData.issuedBy }}<br>
              DATE: {{ invoiceData.invoiceDate }} {{ invoiceData.invoiceTime }}<br>
              INVOICE #: {{ invoiceData.invoiceNumber }}<br>
            </div>

            <div class="text-center">--------------------------------</div>
            <div class="font-bold">QTY ITEM                 AMT</div>
            <div class="text-center">--------------------------------</div>

            <div v-for="(line,i) in formattedLines" :key="i">{{ line }}</div>

            <div class="text-center">--------------------------------</div>
            <div>
              Discount ({{ discount.type || 'None' }}):
                    {{ discountAmount.toFixed(2).padStart(10) }}<br>
              Subtotal:  {{ subtotal.toFixed(2).padStart(10) }}<br>
              TOTAL:     {{ totals.total.toFixed(2).padStart(10) }}<br>
            </div>

            <div class="text-center">--------------------------------</div>
            <div>
              Tendered:  {{ Number(tendered).toFixed(2).padStart(10) }}<br>
              Change:    {{ change.toFixed(2).padStart(10) }}<br>
            </div>

            <div class="text-center">--------------------------------</div>
            <div style="font-size:11px;">
              VAT SALES:  {{ totals.vat_sales.toFixed(2).padStart(10) }}<br>
              12% VAT:    {{ totals.vat_amount.toFixed(2).padStart(10) }}<br>
              VAT EXEMPT: {{ totals.vat_exempt_sales.toFixed(2).padStart(10) }}<br>
              ZERO RATED: {{ totals.zero_rated_sales.toFixed(2).padStart(10) }}<br>
            </div>

            <div class="text-center">--------------------------------</div>
            <div style="font-size:11px;">
              BUYER NAME: {{ customer.name || '' }}<br>
              BUYER TIN: {{ customer.tin || '' }}<br>
            </div>
            <div class="text-center">Thank you for shopping!</div>
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
