<script setup>
import { ref, computed, onMounted } from 'vue'
import { Trash2, Pencil, RefreshCw } from 'lucide-vue-next'

// --- STATE ---
const productname = ref('')
const price = ref(0)
const vatType = ref('')
const products = ref([])
const editingId = ref(null)
const loading = ref(false)

// --- COMPUTED VAT FIELDS ---
const vatSales = computed(() => (vatType.value === 'vatable' ? price.value : 0))
const vatAmount = computed(() => (vatType.value === 'vatable' ? price.value * 0.12 : 0))
const vatExempt = computed(() => (vatType.value === 'exempt' ? price.value : 0))
const zeroRated = computed(() => (vatType.value === 'zero' ? price.value : 0))
const total = computed(() => price.value + vatAmount.value)

// --- FUNCTIONS ---
async function fetchProducts() {
  try {
    products.value = await window.electronAPI.getProducts()
  } catch (err) {
    console.error('Error fetching products:', err)
    alert('Failed to fetch products.')
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
    total: total.value
  }

  try {
    if (editingId.value) {
      payload.id = editingId.value
      await window.electronAPI.updateProduct(payload)
    } else {
      await window.electronAPI.addProduct(payload)
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
  try {
    await window.electronAPI.deleteProduct(id)
    await fetchProducts()
  } catch (err) {
    console.error('Product delete error:', err)
    alert('Failed to delete product.')
  }
}

// --- ON MOUNT ---
onMounted(fetchProducts)
</script>
