<script setup>
import { ref, computed, onMounted } from 'vue'
import { Trash2, Pencil } from 'lucide-vue-next'

// --- STATE ---
const productname = ref('')
const price = ref(0)
const vatType = ref('')
const products = ref([])
const editingId = ref(null)
const loading = ref(false)

// --- COMPUTED VAT FIELDS FOR FORM ---
const vatSales = computed(() => (vatType.value === 'vatable' ? price.value : 0))
const vatAmount = computed(() => (vatType.value === 'vatable' ? price.value * 0.12 : 0))
const vatExempt = computed(() => (vatType.value === 'exempt' ? price.value : 0))
const zeroRated = computed(() => (vatType.value === 'zero' ? price.value : 0))
const total = computed(() => price.value + vatAmount.value)

// --- FUNCTIONS ---
async function fetchProducts() {
  loading.value = true
  try {
    products.value = await window.productAPI.get()
    console.log('Fetched products:', products.value)
  } catch (err) {
    console.error('Error fetching products:', err)
    alert('Failed to fetch products.')
  } finally {
    loading.value = false
  }
}

function clearForm() {
  editingId.value = null
  productname.value = ''
  price.value = 0
  vatType.value = ''
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

async function handleSubmit() {
  loading.value = true
  const payload = {
    productname: productname.value,
    price: price.value,
    vatType: vatType.value,
    vatSales: vatSales.value,
    vatAmount: vatAmount.value,
    vatExempt: vatExempt.value,
    zeroRated: zeroRated.value,
    total: total.value,
    image: null
  }

  try {
    if (editingId.value) {
      payload.id = editingId.value
      await window.productAPI.update(payload)
    } else {
      await window.productAPI.add(payload)
    }

    clearForm()
    await fetchProducts()
  } catch (err) {
    console.error('Product save error:', err)
    alert('Failed to save product.')
  } finally {
    loading.value = false
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return
  loading.value = true
  try {
    await window.productAPI.delete(id)
    await fetchProducts()
  } catch (err) {
    console.error('Product delete error:', err)
    alert('Failed to delete product.')
  } finally {
    loading.value = false
  }
}

// --- ON MOUNT ---
onMounted(fetchProducts)
</script>

<template>
  <div class="p-4">
    <!-- Product Form -->
    <form @submit.prevent="handleSubmit" class="mb-6 border rounded p-4 space-y-2">
      <div>
        <label>Product Name</label>
        <input v-model="productname" type="text" class="border rounded px-2 py-1 w-full" required />
      </div>
      <div>
        <label>Price</label>
        <input v-model.number="price" type="number" class="border rounded px-2 py-1 w-full" required />
      </div>
      <div>
        <label>VAT Type</label>
        <select v-model="vatType" class="border rounded px-2 py-1 w-full">
          <option value="">Select</option>
          <option value="vatable">Vatable</option>
          <option value="exempt">Exempt</option>
          <option value="zero">Zero Rated</option>
        </select>
      </div>

      <!-- Computed Values Preview -->
      <div class="flex gap-4 mt-2">
        <div>VAT Sales: {{ vatSales.toFixed(2) }}</div>
        <div>VAT Amount: {{ vatAmount.toFixed(2) }}</div>
        <div>VAT Exempt: {{ vatExempt.toFixed(2) }}</div>
        <div>Zero Rated: {{ zeroRated.toFixed(2) }}</div>
        <div>Total: {{ total.toFixed(2) }}</div>
      </div>

      <div class="flex gap-2 mt-2">
        <button type="submit" class="bg-blue-500 text-white px-3 py-1 rounded">
          {{ editingId ? 'Update' : 'Add' }}
        </button>
        <button type="button" @click="cancelEdit" class="bg-gray-300 px-3 py-1 rounded">Cancel</button>
      </div>
    </form>

    <!-- Loading / Table -->
    <div v-if="loading" class="text-center py-4">Loading products...</div>

    <table v-else class="w-full border-collapse border">
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-2 py-1">Name</th>
          <th class="border px-2 py-1">Price</th>
          <th class="border px-2 py-1">VAT Type</th>
          <th class="border px-2 py-1">VAT Sales</th>
          <th class="border px-2 py-1">VAT Amount</th>
          <th class="border px-2 py-1">VAT Exempt</th>
          <th class="border px-2 py-1">Zero Rated</th>
          <th class="border px-2 py-1">Total</th>
          <th class="border px-2 py-1">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td class="border px-2 py-1">{{ product.productname }}</td>
          <td class="border px-2 py-1">{{ product.price.toFixed(2) }}</td>
          <td class="border px-2 py-1">{{ product.vatType }}</td>
          <td class="border px-2 py-1">{{ product.vatSales.toFixed(2) }}</td>
          <td class="border px-2 py-1">{{ product.vatAmount.toFixed(2) }}</td>
          <td class="border px-2 py-1">{{ product.vatExempt.toFixed(2) }}</td>
          <td class="border px-2 py-1">{{ product.zeroRated.toFixed(2) }}</td>
          <td class="border px-2 py-1">{{ product.total.toFixed(2) }}</td>
          <td class="border px-2 py-1 flex gap-2">
            <button @click="startEdit(product)" class="text-blue-500"><Pencil /></button>
            <button @click="deleteProduct(product.id)" class="text-red-500"><Trash2 /></button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="!loading && products.length === 0" class="mt-4 text-center">No products found.</p>
  </div>
</template>
