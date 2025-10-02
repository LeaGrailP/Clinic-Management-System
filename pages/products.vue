<template>
  <div class="p-6 mx-auto">
    <h1 class="text-2xl font-bold mb-6">PRODUCT MANAGER</h1>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="bg-white p-4 rounded shadow mb-6 space-y-4">
      <!-- Name -->
      <div>
        <label class="block font-semibold">Product Name</label>
        <input
          v-model="productname"
          class="w-full border px-3 py-2 rounded"
          placeholder="e.g. Services"
          required
        />
      </div>

      <!-- Image -->
      <div>
        <label class="block font-semibold">Product Image</label>
        <input
          type="file"
          accept="image/*"
          @change="handleImageUpload"
          class="w-full border px-3 py-2 rounded"
        />
        <div v-if="imagePreview" class="mt-2">
          <img :src="imagePreview" alt="Preview" class="w-20 h-20 object-cover rounded border" />
        </div>
      </div>

      <!-- Price -->
      <div>
        <label class="block font-semibold">Price</label>
        <input
          v-model.number="price"
          type="number"
          step="0.01"
          class="w-full border px-3 py-2 rounded"
          required
        />
      </div>

      <!-- VAT Type -->
      <div>
        <label class="block font-semibold">VAT Classification</label>
        <select
          v-model="vatType"
          class="w-full border px-3 py-2 rounded"
          required
        >
          <option disabled value="">-- Select VAT Type --</option>
          <option value="vatable">VATable (12%)</option>
          <option value="exempt">VAT-Exempt</option>
          <option value="zero">Zero-Rated</option>
        </select>
      </div>

      <!-- Computed Fields -->
      <div class="mt-2 space-y-1">
        <p>VAT Sales: <strong>₱{{ vatSales.toFixed(2) }}</strong></p>
        <p>VAT Amount: <strong>₱{{ vatAmount.toFixed(2) }}</strong></p>
        <p>VAT-Exempt Sales: <strong>₱{{ vatExempt.toFixed(2) }}</strong></p>
        <p>Zero-Rated Sales: <strong>₱{{ zeroRated.toFixed(2) }}</strong></p>
        <p>Total Price: <strong>₱{{ total.toFixed(2) }}</strong></p>
      </div>

      <!-- Buttons -->
      <div class="flex items-center gap-2 mt-4">
        <button
          type="submit"
          class="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded"
        >Save</button>

        <button
          v-if="editingId"
          @click="cancelEdit"
          type="button"
          class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </form>

    <!-- Table -->
    <div class="bg-white p-4 rounded shadow">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">Product List</h2>
        <button
          @click="fetchProducts"
          class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
        >
          <RefreshCw class="w-4 h-4" />
        </button>
      </div>

      <table class="table-auto w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr class="bg-gray-100 text-left">
            <th class="border p-2">Image</th>
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
            <td class="border p-2">
              <img v-if="product.image" :src="product.image" class="w-12 h-12 object-cover rounded" />
              <span v-else class="text-gray-400 italic">No Image</span>
            </td>
            <td class="border p-2">{{ product.productname }}</td>
            <td class="border p-2">{{ product.vatType }}</td>
            <td class="border p-2">₱{{ Number(product.price || 0).toFixed(2) }}</td>
            <td class="border p-2">₱{{ Number(product.vatSales || 0).toFixed(2) }}</td>
            <td class="border p-2">₱{{ Number(product.vatAmount || 0).toFixed(2) }}</td>
            <td class="border p-2">₱{{ Number(product.vatExempt || 0).toFixed(2) }}</td>
            <td class="border p-2">₱{{ Number(product.zeroRated || 0).toFixed(2) }}</td>
            <td class="border p-2">₱{{ Number(product.total || 0).toFixed(2) }}</td>
            <td class="border p-2 space-x-2">
              <button @click="startEdit(product)" class="text-blue-600 hover:underline text-sm">
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
definePageMeta({
  middleware: ['auth'],
  requiresAdmin: true
})

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Trash2, Pencil, RefreshCw } from 'lucide-vue-next'

// ✅ Declare refs
const productname = ref('')
const price = ref(0)
const vatType = ref('')
const products = ref([])
const editingId = ref(null)
const imageFile = ref(null)
const imagePreview = ref(null)

const router = useRouter()

// ✅ Example role check (replace with real composable if available)
const user = ref(JSON.parse(localStorage.getItem('user') || '{"role":"cashier"}'))
const isAdmin = computed(() => user.value.role === 'admin')

onMounted(() => {
  if (!isAdmin.value) {
    alert('Access denied. Admins only.')
    router.push('/')
  }
})

// VAT Computations
const vatSales = computed(() => (vatType.value === 'vatable' ? price.value : 0))
const vatAmount = computed(() => (vatType.value === 'vatable' ? price.value * 0.12 : 0))
const vatExempt = computed(() => (vatType.value === 'exempt' ? price.value : 0))
const zeroRated = computed(() => (vatType.value === 'zero' ? price.value : 0))
const total = computed(() => price.value + vatAmount.value)

function handleImageUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

async function fetchProducts() {
  try {
    products.value = await window.electron.invoke('get-products')
  } catch (err) {
    console.error('Error fetching products:', err)
  }
}

async function handleSubmit() {
  let imagePath = null
  if (imageFile.value) {
    const buffer = await imageFile.value.arrayBuffer()
    const imageName = `${Date.now()}_${imageFile.value.name}`
    imagePath = await window.electron.invoke('save-product-image', {
      imageName,
      buffer: [...new Uint8Array(buffer)]
    })
  }

  const payload = {
    productname: productname.value,
    price: price.value,
    vatType: vatType.value,
    vatSales: vatSales.value,
    vatAmount: vatAmount.value,
    vatExempt: vatExempt.value,
    zeroRated: zeroRated.value,
    total: total.value,
    image: imagePath
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
  imagePreview.value = product.image
}

function cancelEdit() {
  clearForm()
}

function clearForm() {
  editingId.value = null
  productname.value = ''
  price.value = 0
  vatType.value = ''
  imageFile.value = null
  imagePreview.value = null
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return
  await window.electron.invoke('delete-product', id)
  fetchProducts()
}

onMounted(fetchProducts)
</script>
