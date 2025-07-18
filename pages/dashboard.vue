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
    </div>

    <!--                 Costumer           -->

    <div class="p-6">
      INSERT SEARCH INPUT FOR REGISTERED PATIENTS
      <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Register New Patient</button>
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
              <button class="text-red-600 mr-2"><Trash class="w- h-4" /></button>
              <button class="text-blue-600"><Pencil class="w- h-4" /></button>
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
   <div class="flex flex-row p-2">
    <div v-for="product in products" :key="product.id" class="grid grid-rows-4 p-4 border-2 border-blue-500 rounded-lg">
          <h1 class = "m-2">{{ product.productname }}</h1>
          <p class="m-2">₱{{ Number(product.total || 0).toFixed(2) }}</p>

    </div>

   </div>

    <!-- Services -->
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
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="products.length === 0" class="text-gray-500 text-sm mt-2">
        No products found.
      </div>
      </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue';
import { Pencil, Trash } from 'lucide-vue-next'

defineProps({
  show: Boolean,
})
const emit = defineEmits(['close', 'save'])

const form = reactive({
  date: '',
  name: '',
  businessStyle: '',
  address: '',
  tin: ''
})

const save = () => {
  emit('save', { ...form })
  emit('close')
}

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

onMounted(fetchProducts);
</script>


