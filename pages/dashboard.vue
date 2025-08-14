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
        
        <!-- Sales Table -->
        <div class="flex-1 overflow-auto">
          <table class="min-w-full border border-gray-300 text-sm text-left">
            <thead class="bg-sky-300 text-gray-800">
              <tr>
                <th class="px-4 py-2 border">Quantity</th>
                <th class="px-4 py-2 border">Description</th>
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
          <!-- Discounts -->
          <div class="bg-gray-50 p-4 rounded-lg shadow border border-gray-200">
            <div class="flex justify-between"><span>VAT Sales</span><span>₱0.00</span></div>
            <div class="flex justify-between"><span>VAT Exempt Sales</span><span>₱0.00</span></div>
            <div class="flex justify-between"><span>Zero-rated Sales</span><span>₱0.00</span></div>
            <div class="flex justify-between"><span>Discount</span><span>₱0.00</span></div>
          </div>

          <!-- Totals -->
          <div class="bg-white p-4 rounded-lg shadow border border-gray-200 space-y-2">
            <div class="flex justify-between font-semibold"><span>TOTAL</span><span>₱0.00</span></div>
            <div class="flex justify-between"><span>TENDERED</span><span>₱0.00</span></div>
            <div class="flex justify-between"><span>CHANGE</span><span>₱0.00</span></div>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-2">
            <button class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg shadow">Save</button>
            <button class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg shadow">Reset Discount</button>
            <button class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg shadow">Edit Sales</button>
            <button class="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg shadow">Cancel Transaction</button>
            <button class="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg shadow">Open Drawer</button>
            <button class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg shadow">Print Receipt</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Product List -->
    <div class="bg-white p-6 rounded-lg shadow border border-gray-200">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-800">📦 Product List</h2>
        <button @click="fetchProducts" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow text-sm">
          🔄 Refresh
        </button>
      </div>

      <table class="table-auto w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr class="bg-gray-100 text-gray-700">
            <th class="border p-2">Name</th>
            <th class="border p-2">Price</th>
            <th class="border p-2">VAT</th>
            <th class="border p-2">VAT Amount</th>
            <th class="border p-2">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id" class="hover:bg-gray-50">
            <td class="border p-2">{{ product.productname }}</td>
            <td class="border p-2">₱{{ Number(product.price || 0).toFixed(2) }}</td>
            <td class="border p-2">{{ Number(product.vat || 0).toFixed(2) }}%</td>
            <td class="border p-2">₱{{ Number(product.vatAmount || 0).toFixed(2) }}</td>
            <td class="border p-2">₱{{ Number(product.total || 0).toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="products.length === 0" class="text-gray-500 text-sm mt-2">
        No products found.
      </div>
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

// -- Invoice Date & Time (Live) --
const invoiceDate = ref('')
const invoiceTime = ref('')

function updateClockAndDate() {
  const now = new Date()
  invoiceDate.value = now.toISOString().split('T')[0] // YYYY-MM-DD
  invoiceTime.value = now.toTimeString().slice(0, 5)   // HH:MM
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

// -- Product Form + Computed Fields --
const form = reactive({ date: '', name: '', businessStyle: '', address: '', tin: '' })
const productname = ref('')
const price = ref(0)
const vat = ref(0)
const products = ref([])
const editingId = ref(null)

const vatAmount = computed(() => (price.value * vat.value) / 100 || 0)
const total = computed(() => price.value + vatAmount.value || 0)

const save = () => {
  emit('save', { ...form })
  emit('close')
}

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



