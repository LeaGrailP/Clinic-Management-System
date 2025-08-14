<template>
  <div class="bg-slate-50 min-h-screen p-6 space-y-6">
    <!-- Page Title -->
    <h1 class="text-5xl font-bold text-gray-800">Dashboard</h1>

    <!-- Invoice Info -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Invoice #</label>
        <input type="text" class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" :value="invoiceNumber" readonly />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Issued By</label>
        <input type="text" :value="issuedBy" class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" readonly />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Invoice Date</label>
        <input type="date" class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" v-model="invoiceDate" readonly />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700">Invoice Time</label>
        <input type="time" class="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500" v-model="invoiceTime" readonly />
      </div>
    </div>

    <!-- Sales Table + Totals -->
    <div class="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div class="flex flex-col lg:flex-row gap-6">

        <!--Product Table-->
        <div class="flex-1 overflow-auto">
          <table class="min-w-full border border-gray-300 text-sm text-left">
            <thead class="bg-sky-300 text-gray-800">
              <tr>
                <th class="px-4 py-2 border">Product List</th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-center hover:bg-gray-50">
                <td class="p-2 border"></td>
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
              <tr class="text-center hover:bg-gray-50">
                <td class="p-2 border"></td>
                <td class="p-2 border"></td>
                <td class="p-2 border"></td>
                <td class="p-2 border space-x-2">
                  <button class="text-red-600 hover:text-red-800">
                    <Trash class="w-4 h-4" />
                  </button>
                  <button class="text-blue-600 hover:text-blue-800">
                    <Pencil class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals + Buttons -->
        <div class="w-full lg:w-1/3 space-y-4">
          <!-- Totals Card -->
          <div>
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
          </div>
          <div class="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-2 flex justify-between">
              <p class="font-bold text-lg">Discount</p>
              <p class="text-xl">{{ formatCurrency(totals.discount || 0) }}</p>
               <td class="p-2 border space-x-2">
                  <button class="text-red-600 hover:text-red-800">
                    <Trash class="w-4 h-4" />
                  </button>
                  <button class="text-blue-600 hover:text-blue-800">
                    <Pencil class="w-4 h-4" />
                  </button>
                </td>
          </div>
          <!-- Totals -->
          <div class="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-2">
            <div class="flex justify-between font-semibold"><span>TOTAL</span><span>{{ formatCurrency(totals.total || 0) }}</span></div>
            <div class="flex justify-between"><span>TENDERED</span><span>₱0.00</span></div>
            <div class="flex justify-between"><span>CHANGE</span><span>₱0.00</span></div>
          </div>
        </div>
      </div>
    </div>
    <!-- Action Buttons -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="space-y-2">
          <button class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg shadow">Save</button>
          </div>
          <div>
          <button class="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg shadow">Cancel Transaction</button>
          </div>
          <div>
          <button class="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg shadow">Open Drawer</button>
          </div>
          <div>
          <button class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg shadow">Print Receipt</button>
          </div>
    </div>
    <!-- Invoices Table -->
    <div class="bg-white shadow rounded overflow-x-auto">
      <table class="min-w-full border-collapse">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-2 border">Invoice #</th>
            <th class="px-4 py-2 border">Date</th>
            <th class="px-4 py-2 border">Customer</th>
            <th class="px-4 py-2 border">VAT Sales</th>
            <th class="px-4 py-2 border">VAT Amount</th>
            <th class="px-4 py-2 border">VAT-Exempt Sales</th>
            <th class="px-4 py-2 border">Zero-Rated Sales</th>
            <th class="px-4 py-2 border">Discount</th>
            <th class="px-4 py-2 border">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="invoice in invoices" :key="invoice.id">
            <td class="px-4 py-2 border">{{ invoice.invoice_number }}</td>
            <td class="px-4 py-2 border">{{ invoice.date }}</td>
            <td class="px-4 py-2 border">{{ invoice.customer_name }}</td>
            <td class="px-4 py-2 border">₱ {{ formatCurrency(invoice.vat_sales) }}</td>
            <td class="px-4 py-2 border">₱ {{ formatCurrency(invoice.vat_amount) }}</td>
            <td class="px-4 py-2 border">₱ {{ formatCurrency(invoice.vat_exempt_sales) }}</td>
            <td class="px-4 py-2 border">₱ {{ formatCurrency(invoice.zero_rated_sales) }}</td>
            <td class="px-4 py-2 border">₱ {{ formatCurrency(invoice.discount) }}</td>
            <td class="px-4 py-2 border">₱ {{ formatCurrency(invoice.total) }}</td>
          </tr>
          <tr v-if="invoices.length === 0">
            <td class="px-4 py-2 border text-center text-gray-500" colspan="9">No invoices found</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import { Pencil, Trash } from 'lucide-vue-next'

defineProps({ show: Boolean })
const emit = defineEmits(['close', 'save'])

// -- Issued By (User) --
const issuedBy = ref('')

onMounted(() => {
  const userData = localStorage.getItem('user')
  if (userData) {
    try {
      const parsed = JSON.parse(userData)
      issuedBy.value = parsed.name || 'Unknown User'
    } catch (e) {
      console.error('Invalid user data:', e)
    }
  }
})

const invoices = ref([])
const totals = ref({
  vat_sales: 0,
  vat_amount: 0,
  vat_exempt_sales: 0,
  zero_rated_sales: 0,
  discount: 0,
  total: 0
})

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(amount || 0)
}

onMounted(async () => {
  const rows = await window.electron.invoke('get-all-invoices')
  invoices.value = rows

  // Use DB-precomputed values
  totals.value = rows.reduce((acc, inv) => {
    acc.vat_sales += inv.vat_sales || 0
    acc.vat_amount += inv.vat_amount || 0
    acc.vat_exempt_sales += inv.vat_exempt_sales || 0
    acc.zero_rated_sales += inv.zero_rated_sales || 0
    acc.discount += inv.discount || 0
    acc.total += inv.total || 0
    return acc
  }, { vat_sales: 0, vat_amount: 0, vat_exempt_sales: 0, zero_rated_sales: 0, discount: 0, total: 0 })
})

// -- Invoice Date & Time --
const invoiceDate = ref('')
const invoiceTime = ref('')

function updateClockAndDate() {
  const now = new Date()
  invoiceDate.value = now.toISOString().split('T')[0]
  invoiceTime.value = now.toTimeString().slice(0, 5)
}

onMounted(() => {
  updateClockAndDate()
  const clockInterval = setInterval(updateClockAndDate, 1000)
  onBeforeUnmount(() => clearInterval(clockInterval))
})

// -- Invoice Number --
const invoiceNumber = ref('')
onMounted(async () => {
  try {
    invoiceNumber.value = await window.electron.invoke('generate-invoice-number')
  } catch (err) {
    console.error('Failed to fetch invoice number:', err)
  }
})

// -- Product Form --
const form = reactive({ date: '', name: '', businessStyle: '', address: '', tin: '' })
const productname = ref('')
const price = ref(0)
const vat = ref(0)
const products = ref([])
const editingId = ref(null)

const vatAmount = computed(() => (price.value * vat.value) / 100 || 0)
const total = computed(() => price.value + vatAmount.value || 0)

async function fetchProducts() {
  try {
    products.value = await window.electron.invoke('get-products')
  } catch (err) {
    console.error('Error fetching products:', err)
  }
}

async function handleSubmit() {
  const payload = {
    productname: productname.value,
    price: price.value,
    vat: vat.value,
    vatAmount: vatAmount.value,
    total: total.value,
  }

  if (editingId.value) {
    payload.id = editingId.value
    await window.electron.invoke('update-product', payload)
    alert('✅ Product updated!')
  } else {
    await window.electron.invoke('add-products', payload)
    alert('✅ Product added!')
  }

  clearForm()
  fetchProducts()
}

function clearForm() {
  productname.value = ''
  price.value = 0
  vat.value = 0
  editingId.value = null
}

onMounted(fetchProducts)
</script>
