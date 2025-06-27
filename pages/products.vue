<template>
  <div class="flex flex-col p-4">
    <!-- Header -->
    <div class="flex justify-between items-center my-4">
      <h1 class="text-xl font-bold">List of Products and Services</h1>
    </div>

    <!-- Add Button -->
    <div class="grid grid-cols-2 gap-4 p-2">
      <button
        @click="openModal"
        class="flex justify-between items-center bg-cyan-300 px-4 py-2 rounded shadow">
        Add Product
        <span class="text-xl">+</span>
      </button>
    </div>

    <!-- Modal -->
    <div
      v-if="selectedProduct"
      class="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
    >
      <div class="bg-white w-[400px] rounded-lg p-4 relative shadow-lg">
        <button @click="selectedProduct = null" class="absolute top-2 right-2 text-xl">✖</button>

        <div class="grid grid-cols-1 gap-2 mt-4">
          <div>
            <label class="block text-sm font-medium">Product Name</label>
            <input type="text" class="w-full p-2 border rounded" v-model="selectedProduct.name" />
          </div>
          <div>
            <label class="block text-sm font-medium">Price</label>
            <input type="number" step="0.01" class="w-full p-2 border rounded" v-model="selectedProduct.price" />
          </div>
          <div>
            <label class="block text-sm font-medium">VAT %</label>
            <input type="number" step="0.01" class="w-full p-2 border rounded" v-model="selectedProduct.vat" />
          </div>
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <button @click="selectedProduct = null" class="bg-red-400 px-4 py-2 text-white rounded">CANCEL</button>
          <button @click="addProduct" class="bg-green-600 px-4 py-2 text-white rounded">Add Product</button>
        </div>
      </div>
    </div>

    <!-- Products Table -->
    <div>
      <table class="border-separate border border-gray-400 mt-6">
        <thead>
          <tr>
            <th class="border border-gray-300">Product</th>
            <th class="border border-gray-300">Price</th>
            <th class="border border-gray-300">VAT %</th>
            <th class="border border-gray-300">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="prod in products" :key="prod.id">
            <td class="border border-gray-300">{{ prod.name }}</td>
            <td class="border border-gray-300">{{ prod.price }}</td>
            <td class="border border-gray-300">{{ prod.vat }}</td>
            <td class="border border-gray-300">{{ calculateTotal(prod.price, prod.vat) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const selectedProduct = ref(null)
const products = ref([])

function openModal() {
  selectedProduct.value = {
    name: '',
    price: 0,
    vat: 0
  }
}

function addProduct() {
  if (selectedProduct.value) {
    products.value.push({ 
      ...selectedProduct.value,
      id: Date.now()
    })
    selectedProduct.value = null
  }
}

function calculateTotal(price, vat) {
  const numericPrice = parseFloat(price) || 0
  const numericVAT = parseFloat(vat) || 0
  return (numericPrice + (numericPrice * numericVAT / 100)).toFixed(2)
}
</script>
