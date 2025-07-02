<template>
  <div class="p-6 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">🛒 Product Manager</h1>

    <!-- Add Product Form -->
    <form @submit.prevent="addProduct" class="bg-white p-4 rounded shadow mb-6 space-y-4">
      <div>
        <label class="block font-semibold">Product Name</label>
        <input
          v-model="productname"
          class="w-full border px-3 py-2 rounded"
          placeholder="e.g. Laptop"
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
          placeholder="e.g. 1000"
          required
        />
      </div>

      <div>
        <label class="block font-semibold">VAT</label>
        <input
          v-model.number="vat"
          type="number"
          step="0.01"
          class="w-full border px-3 py-2 rounded"
          placeholder="e.g. 12"
        />
      </div>

      <button
        type="submit"
        class="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded"
      >
        ➕ Add Product
      </button>
    </form>

    <!-- Product List -->
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

      <table class="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr class="bg-gray-100 text-left">
            <th class="border p-2">ID</th>
            <th class="border p-2">Product Name</th>
            <th class="border p-2">Price</th>
            <th class="border p-2">VAT</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td class="border p-2">{{ product.id }}</td>
            <td class="border p-2">{{ product.productname }}</td>
            <td class="border p-2">{{ product.price }}</td>
            <td class="border p-2">{{ product.vat }}</td>
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
import { ref, onMounted } from 'vue';

const productname = ref('');
const price = ref(0);
const vat = ref(0);
const products = ref([]);

async function addProduct() {
  const result = await window.electron.invoke('add-products', {
    productname: productname.value,
    price: price.value,
    vat: vat.value,
  });

  if (result.success) {
    alert('✅ Product added!');
    productname.value = '';
    price.value = 0;
    vat.value = 0;
    fetchProducts(); // Refresh list
  } else {
    console.error(result.error);
    alert('❌ Failed to add product.');
  }
}

async function fetchProducts() {
  try {
    products.value = await window.electron.invoke('get-products');
  } catch (err) {
    console.error('Error fetching products:', err);
  }
}

onMounted(fetchProducts);
</script>
