<template>
  <div class="p-6 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">🛒 Product Manager</h1>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="bg-white p-4 rounded shadow mb-6 space-y-4">
      <div>
        <label class="block font-semibold">Product Name</label>
        <input
          v-model="productname"
          class="w-full border px-3 py-2 rounded"
          placeholder="e.g. Services"
          required
        />
      </div>

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

      <div>
        <label class="block font-semibold">VAT (%)</label>
        <input
          v-model.number="vat"
          type="number"
          step="0.01"
          class="w-full border px-3 py-2 rounded"
        />
      </div>

      <div class="mt-2">
        <p>VAT Amount: <strong>₱{{ vatAmount.toFixed(2) }}</strong></p>
        <p>Total Price: <strong>₱{{ total.toFixed(2) }}</strong></p>
      </div>

      <button
        type="submit"
        class="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded mt-4"
      >
        {{ editingId ? '💾 Update Product' : '➕ Add Product' }}
      </button>

      <button
        v-if="editingId"
        @click="cancelEdit"
        type="button"
        class="ml-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mt-4"
      >
        ❌ Cancel
      </button>
    </form>

    <!-- Table -->
    <div class="bg-white p-4 rounded shadow">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">📦 Product List</h2>
        <button
          @click="fetchProducts"
          class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          🔄 Refresh
        </button>
      </div>

      <table class="table-auto w-full border-collapse border border-gray-300 text-sm">
        <thead>
          <tr class="bg-gray-100 text-left">
            <th class="border p-2">Name</th>
            <th class="border p-2">Price</th>
            <th class="border p-2">VAT</th>
            <th class="border p-2">VAT Amount</th>
            <th class="border p-2">Total</th>
            <th class="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td class="border p-2">{{ product.productname }}</td>
            <td class="border p-2">₱{{ Number(product.price || 0).toFixed(2) }}</td>
            <td class="border p-2">{{ Number(product.vat || 0).toFixed(2) }}%</td>
            <td class="border p-2">₱{{ Number(product.vatAmount || 0).toFixed(2) }}</td>
            <td class="border p-2">₱{{ Number(product.total || 0).toFixed(2) }}</td>
            <td class="border p-2 space-x-2">
              <button
                @click="startEdit(product)"
                class="text-blue-600 hover:underline text-sm"
              >
                ✏️ Edit
              </button>
              <button
                @click="deleteProduct(product.id)"
                class="text-red-600 hover:underline text-sm"
              >
                🗑 Delete
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
import { ref, computed, onMounted } from 'vue';

const productname = ref('');
const price = ref(0);
const vat = ref(0);
const products = ref([]);
const editingId = ref(null);

const vatAmount = computed(() => {
  const result = (price.value * vat.value) / 100;
  return isNaN(result) ? 0 : result;
});

const total = computed(() => {
  const result = price.value + vatAmount.value;
  return isNaN(result) ? 0 : result;
});

async function fetchProducts() {
  try {
    products.value = await window.electron.invoke('get-products');
  } catch (err) {
    console.error('Error fetching products:', err);
  }
}

async function handleSubmit() {
  const payload = {
    productname: productname.value,
    price: price.value,
    vat: vat.value,
    vatAmount: vatAmount.value,
    total: total.value
  };

  if (editingId.value) {
    payload.id = editingId.value;
    await window.electron.invoke('update-product', payload);
    alert('✅ Product updated!');
  } else {
    await window.electron.invoke('add-products', payload);
    alert('✅ Product added!');
  }

  clearForm();
  fetchProducts();
}

function startEdit(product) {
  editingId.value = product.id;
  productname.value = product.productname;
  price.value = product.price;
  vat.value = product.vat;
}

function cancelEdit() {
  clearForm();
}

function clearForm() {
  editingId.value = null;
  productname.value = '';
  price.value = 0;
  vat.value = 0;
}

async function deleteProduct(id) {
  const confirmDelete = confirm('Are you sure you want to delete this product?');
  if (!confirmDelete) return;

  await window.electron.invoke('delete-product', id);
  fetchProducts();
}
onMounted(fetchProducts);
</script>
