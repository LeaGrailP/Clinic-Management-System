<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <aside class="w-60 bg-white border-r">
      <div class="p-4 text-lg font-bold">Dashboard</div>
      <nav class="space-y-2 grid grid cols">
        <NuxtLink to="/" class="block px-4 py-2 bg-pink-200 text-red-600 font-semibold">Sign IN</NuxtLink>
      </nav>
    </aside>

    <!-- Main content -->
    <div class="flex-1 bg-pink-100 p-4 overflow-auto">
      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-2 space-y-4">
          <!-- Invoice Info -->
          <div class="grid grid-cols-2 gap-4 bg-pink-200 p-4 rounded">
            <div>
              <label>Invoice #</label>
              <input type="text" class="w-full p-2 border" value="235213567890" />
              <label>Buyer Name</label>
              <input type="text" class="w-full p-2 border" value="Anne Berlin" />
            </div>
            <div>
              <label>Issued By</label>
              <select class="w-full p-2 border">
                <option>Niko Hashimura</option>
              </select>
              <label>Address</label>
              <input type="text" class="w-full p-2 border" value="Pico, La Trinidad" />
            </div>
          </div>

          <!-- Table -->
          <table class="w-full border text-center">
            <thead>
              <tr class="bg-pink-300">
                <th>Qty</th>
                <th>Description</th>
                <th>Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="n in 5" :key="n">
                <td></td>
                <td></td>
                <td></td>
                <td class="space-x-2">
                  <button class="text-red-600">🗑️</button>
                  <button class="text-blue-600">✏️</button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Services Section -->
          <div class="bg-pink-200 p-4 rounded">
            <div class="mb-2 font-semibold">SERVICES</div>
            <input type="text" placeholder="Search..." class="w-full p-2 mb-4 border rounded" />
            <div class="grid grid-cols-3 gap-2">
              <button v-for="n in 9" :key="n" class="bg-white border p-2 rounded flex justify-between items-center">
                <span>Complete Blood Count</span>
                <span>+</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Summary and Quantity Selector -->
        <div class="space-y-4">
          <!-- Invoice Summary -->
          <div class="bg-pink-200 p-4 rounded space-y-2">
            <div>Invoice Time: <input type="time" value="12:30" class="p-2 border rounded" /></div>
            <div>Invoice Date: <input type="date" value="2025-11-29" class="p-2 border rounded" /></div>
            <div class="space-y-1">
              <div>VAT Sales: ₱0.00</div>
              <div>VAT Exempt Sales: ₱0.00</div>
              <div>Zero-rated Sales: ₱0.00</div>
              <div>Discount: <input type="text" value="₱0.00" class="p-1 border rounded" /></div>
            </div>
            <div class="space-y-1 font-bold">
              <div>TOTAL: ₱0.00</div>
              <div>TENDERED: <input type="text" value="₱0.00" class="p-1 border rounded" /></div>
              <div>CHANGE: ₱0.00</div>
            </div>
            <div class="space-y-2">
              <button class="w-full bg-green-600 text-white p-2 rounded">SAVE</button>
              <button class="w-full bg-green-600 text-white p-2 rounded">Reset Discount</button>
              <button class="w-full bg-green-600 text-white p-2 rounded">Edit Sales</button>
              <button class="w-full bg-green-600 text-white p-2 rounded">Cancel Transaction</button>
              <button class="w-full bg-green-600 text-white p-2 rounded">Open Drawer</button>
              <button class="w-full bg-green-600 text-white p-2 rounded">Print Receipt</button>
            </div>
          </div>

          <!-- Select Quantity -->
          <div class="bg-pink-200 p-4 rounded">
            <div class="flex justify-between items-center">
              <span class="font-semibold">Select Quantity</span>
              <button>❌</button>
            </div>
            <div class="flex flex-col items-center">
              <div class="h-24 w-24 bg-white border rounded my-2"></div>
              <div class="font-semibold">Complete Blood Count</div>
              <div class="text-gray-600">PHP 200.00</div>
              <div class="flex items-center space-x-2 mt-2">
                <button class="px-2 py-1 border">-</button>
                <input type="number" value="1" class="w-12 text-center border" />
                <button class="px-2 py-1 border">+</button>
              </div>
              <div class="flex space-x-2 mt-4">
                <button class="bg-green-600 text-white px-4 py-2 rounded">Add to Order</button>
                <button class="bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Add your interactivity logic here
</script>

<style scoped>
/* Add custom styling here */
</style>
