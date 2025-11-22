<template>
  <div class="p-6 mx-auto">
    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="bg-slate-50 dark:bg-slate-600 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 p-4 rounded shadow mb-6 space-y-4">
      <!-- Name -->
      <div>
        <label class="block font-semibold ">Product Name</label>
        <input
          v-model="productname"
          class="w-full border-gray-400 px-3 py-2 rounded bg-slate-50 dark:bg-slate-800"
          placeholder="e.g. Services"
          required
        />
      </div>
      <!-- Price -->
      <div>
        <label class="block font-semibold ">Price</label>
        <input
          v-model.number="price"
          type="number"
          step="0.01"
          class="w-full border-gray-400 px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          required
        />
      </div>

      <!-- VAT Type -->
      <div class="text-slate-800 dark:text-slate-100">
        <label class="block font-semibold">VAT Classification</label>
        <select
          v-model="vatType"
          class="w-full border-gray-400 px-3 py-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
          required>
          <option disabled value="">-- Select VAT Type --</option>
          <option value="vatable">VATable (12%)</option>
          <option value="exempt">VAT-Exempt</option>
          <option value="zero">Zero-Rated</option>
        </select>
      </div>

      <!-- Computed Fields -->
      <div class="mt-2 space-y-1 ">
        <p>VAT Sales: <strong>₱{{ vatSales.toFixed(2) }}</strong></p>
        <p>VAT Amount: <strong>₱{{ vatAmount.toFixed(2) }}</strong></p>
        <p>VAT-Exempt Sales: <strong>₱{{ vatExempt.toFixed(2) }}</strong></p>
        <p>Zero-Rated Sales: <strong>₱{{ zeroRated.toFixed(2) }}</strong></p>
        <p>Total Price: <strong>₱{{ total.toFixed(2) }}</strong></p>
      </div>

      <div class="flex items-center gap-2 mt-4">
        <button
          type="submit"
          class="bg-sky-400 hover:bg-sky-600 font-semibold px-4 py-2 rounded"
        >SAVE</button>

        <button
          v-if="editingId"
          @click="cancelEdit"
          type="button"
          class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
          CANCEL
        </button>
      </div>
    </form>

    <!-- Table -->
    <div class="bg-slate-50 dark:bg-slate-600 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 p-4 rounded shadow">
      <div class="flex justify-between items-center mb-4">
        <button
          @click="fetchProducts"
          class="bg-sky-400 hover:bg-sky-600 px-2 py-1 rounded text-lg"
        >
          <RefreshCw class="w-4 h-4" />
        </button>
      </div>

      <table class="table-auto w-full border-gray-400 text-sm">
        <thead>
          <tr class="dark:bg-slate-800 text-left">
            <th class="border p-2">Name</th>
            <th class="border p-2">VAT Type</th>
            <th class="border p-2">Price</th>
            <th class="border p-2">VAT Sales</th>
            <th class="border p-2">VAT Amount</th>
            <th class="border p-2">VAT-Exempt</th>
            <th class="border p-2">Zero-Rated</th>
            <th class="border p-2">Total</th>
            <th class="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td class="border p-2">{{ product.productname }}</td>
            <td class="border p-2">{{ product.vatType }}</td>
            <td class="border p-2">₱{{ Number(product.price || 0).toFixed(2) }}</td>
            <td class="border p-2">₱{{ Number(product.vatSales || 0).toFixed(2) }}</td>
            <td class="border p-2">₱{{ Number(product.vatAmount || 0).toFixed(2) }}</td>
            <td class="border p-2">₱{{ Number(product.vatExempt || 0).toFixed(2) }}</td>
            <td class="border p-2">₱{{ Number(product.zeroRated || 0).toFixed(2) }}</td>
            <td class="border p-2">₱{{ Number(product.total || 0).toFixed(2) }}</td>
            <td class="border p-2 space-x-2">
              <button @click="startEdit(product)" class="text-sky-600 hover:underline text-sm">
                <Pencil class="w-4 h-4" />
              </button>
              <button @click="deleteProduct(product.id)" class="text-red-600 hover:underline text-sm">
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '~/composables/useUser'
import { Trash2, Pencil, RefreshCw } from 'lucide-vue-next'

const productname = ref('')
const price = ref(0)
const vatType = ref('')
const products = ref([])
const editingId = ref(null)

definePageMeta({ layout: 'default' })
const router = useRouter()
const { isAdmin } = useUser()

onMounted(() => {
  if (!isAdmin.value) {
    alert('Access denied. Admins only.')
    router.push('/')
  }
})

// VAT COMPUTATIONS
const vatSales = computed(() => (vatType.value === 'vatable' ? price.value : 0))
const vatAmount = computed(() =>
  vatType.value === 'vatable' ? (price.value * 0.12) : 0
)
const vatExempt = computed(() => (vatType.value === 'exempt' ? price.value : 0))
const zeroRated = computed(() => (vatType.value === 'zero' ? price.value : 0))
const total = computed(() => price.value + vatAmount.value)

function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file) // 🟢 Preview before save
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
    vatType: vatType.value,
    vatSales: vatSales.value,
    vatAmount: vatAmount.value,
    vatExempt: vatExempt.value,
    zeroRated: zeroRated.value,
    total: total.value,
  }

  if (editingId.value) {
    payload.id = editingId.value
    await window.electron.invoke('update-product', payload)
  } else {
    await window.electron.invoke('add-product', payload)
  }

  clearForm()
  fetchProducts()
}

function startEdit(product) {
  editingId.value = product.id
  productname.value = product.productname
  price.value = product.price
  vatType.value = product.vatType
}

function cancelEdit() {
  clearForm()
}

function clearForm() {
  editingId.value = null
  productname.value = ''
  price.value = 0
  vatType.value = ''
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return
  await window.electron.invoke('delete-product', id)
  fetchProducts()
}

onMounted(fetchProducts)
</script>
