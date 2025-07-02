
<template>
<h1 class="text-5xl font-bold mb-4">Dashboard</h1>

    <div class="grid grid-cols-4 gap-4">

  <!--Invoice Number-->
      <div>
        <label class="block text-sm font-medium">Invoice #</label>
        <input type="text" class="w-full p-2 border rounded" /> 
      </div>
      
  <!-- options for the name user -->
      <div>
        <label class="block text-sm font-medium">Issued By</label>
        <select class="w-full p-2 border rounded">
          <option>Search Name</option> 
        </select>
      </div>

  <!-- Current Time (input function here) -->
      <div> 
        <label class="block text-sm font-medium">Invoice Time</label>
        <input type="time" class="w-full p-2 border rounded"/>
      </div>

  <!-- Current Date (input function here) -->
      <div>
        <label class="block text-sm font-medium">Invoice Date</label>
        <input type="date" class="w-full p-2 border rounded" value="2025-11-29" />
      </div>

  <!-- Costumer Name -->
      <div>
        <label class="block text-sm font-medium">Buyer Name</label>
        <input type="text" class="w-full p-2 border rounded" value="Anne Berlin" />
      </div>

  <!-- Costumer Address -->
      <div>
        <label class="block text-sm font-medium">Address</label>
        <input type="text" class="w-full p-2 border rounded" value="Pico, La Trinidad" />
      </div>
    </div>

    <!-- --------------------------------------------------------------------------------------- -->

    <!-- table and buttons-->
    <div class = "flex flex-row pt-6">

<!-- Sales Table -->
    <div class="grid-row">
      <table class="border-2 border-slate-800">
        <thead class="bg-sky-300">
          <tr>
            <th class="p-2 border">Quantity</th>
            <th class="p-2 border">Description</th>
            <th class="p-2 border">Price</th>
            <th class="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr class="text-center">
            <td class="p-2 border"></td>
            <td class="p-2 border"></td>
            <td class="p-2 border"></td>
            <td class="p-2 border">
              <button class="text-red-600 mr-2">🗑️</button>
              <button class="text-blue-600">✏️</button>
            </td>
          </tr>
          <!-- Add more rows as needed -->
        </tbody>
      </table>
    </div>

    <!-- Right Side -->
      <div class="space-y-4 ml-4 basis-2/5">

    <!--DISCOUNTS-->
        <div class="bg-white p-4 rounded shadow border-2">
          <div class="flex justify-between mb-2 space-x-4"><span>VAT Sales</span><span>₱0.00</span></div>
          <div class="flex justify-between mb-2 space-x-4"><span>VAT Exempt Sales</span><span>₱0.00</span></div>
          <div class="flex justify-between mb-2 space-x-4"><span>Zero-rated Sales</span><span>₱0.00</span></div>
          <div class="flex justify-between mb-2 space-x-4"><span>Discount</span><span>₱0.00</span></div>
        </div>

    <!-- TOTAL-->
        <div class="bg-white p-4 rounded shadow border-2 ">
          <div class="flex justify-between mb-2 space-x-4">
            <h1 class="font-medium">TOTAL</h1> <!--total-->
            <h2 class="font-medium">₱0.00</h2>
          </div>

          <div class="flex justify-between mb-2 space-x-4">
            <h1 class="font-medium">TENDERED</h1> <!--tendered-->
            <h2 class="font-medium">₱0.00</h2>
          </div>

          <div class="flex justify-between mb-2 space-x-4">
            <h1 class="font-medium">CHANGE</h1> <!--change-->
            <h2 class="font-medium">₱0.00</h2>
          </div>

        </div>

      </div>

     <!-- Save button and OTHERS-->
      <div class="space-y-4 ml-4 basis-1/5">
        <button class="w-full bg-green-400 rounded text-wrap">SAVE</button>
        <button class="w-full bg-green-400 rounded">Reset Discount</button>
        <button class="w-full bg-green-400 rounded">Edit Sales</button>
        <button class="w-full bg-green-400 rounded">Cancel Transaction</button>
        <button class="w-full bg-green-400 rounded">Open Drawer</button>
        <button class="w-full bg-green-400 rounded">Print Receipt</button>
      </div>
    </div>

  <!-- --------------------------------------------------------------------------------------- -->

    <!-- Services -->
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">🧾 Product List</h2>
    <button @click="fetchProducts" class="mb-4 bg-blue-600 text-white px-4 py-2 rounded">
      Refresh
    </button>

    <div v-if="products.length === 0" class="text-gray-500">No products found.</div>
      <div v-for="product in products" :key="product.id">
        <div class="grid grid-cols-5">
           <h1 class="border p-2">{{ product.productname }}</h1>
        <p class="border p-2">{{ product.price }}</p>
        <p class="border p-2">{{ product.vat }}</p>
        </div>
       

      </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const products = ref([]);

async function fetchProducts() {
  try {
    const result = await window.electron.invoke('get-products');
    products.value = result;
  } catch (error) {
    console.error('❌ Failed to fetch products:', error);
  }
}

onMounted(() => {
  fetchProducts();
});
</script>


