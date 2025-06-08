<script setup lang="ts">
import { toValue } from 'vue';

</script>

<template>

<div class ="p-4">
<h1 class="text-5xl font-bold mb-4">Dashboard</h1>

<!-- --------------------------------------------------------------------------------------- -->

   <!-- Inputs -->
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
    <div class = "flex flex-row p-4">

<!-- Sales Table -->
    <div class="grid-row ">
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
    <div class="flex flex-row ml-4">

      <div class="space-y-4">
    <!--DISCOUNTS-->
        <div class="bg-white p-2 rounded shadow border-2">
          <div class="flex justify-between"><span>VAT Sales</span><span>₱0.00</span></div>
          <div class="flex justify-between"><span>VAT Exempt Sales</span><span>₱0.00</span></div>
          <div class="flex justify-between"><span>Zero-rated Sales</span><span>₱0.00</span></div>
          <div class="flex justify-between"><span>Discount</span><span>₱0.00</span></div>
        </div>

    <!-- TOTAL-->
        <div class="bg-white p-2 rounded shadow border-2">
          <div class="flex justify-between font-bold"><span>TOTAL</span><span>₱0.00</span></div>
          <div class="flex justify-between"><span>TENDERED</span><span>₱0.00</span></div>
          <div class="flex justify-between"><span>CHANGE</span><span>₱0.00</span></div>
        </div>
      </div>

      <!-- Save button and OTHERS-->
      <div class="space-y-4 ml-4">
        <button class="w-full bg-cyan-500 rounded text-wrap">SAVE</button>
        <button class="w-full bg-cyan-500 rounded">Reset Discount</button>
        <button class="w-full bg-cyan-500 rounded">Edit Sales</button>
        <button class="w-full bg-cyan-500 rounded">Cancel Transaction</button>
        <button class="w-full bg-cyan-500 rounded">Open Drawer</button>
        <button class="w-full bg-cyan-500 rounded">Print Receipt</button>
      </div>
    </div>
    </div>

  <!-- --------------------------------------------------------------------------------------- -->

    <!-- Services -->
    <div class="mt-8">
      <div class="flex items-center space-x-2">
        <span class="font-semibold">SERVICES</span>
        <input type="text" class="flex-1 p-2 border rounded" placeholder="Search services..." />
        <button class="p-2">🔍</button>
      </div>

      <div class="flex flex-row p-4 justify-center ">

     <div class="grid grid-cols-2 gap-4 p-4">
        <button class="flex justify-between items-center bg-cyan-500 px-4 py-2 rounded shadow">Complete Blood Count <span class="text-xl">+</span></button>
        <button class="flex justify-between items-center bg-cyan-500 px-4 py-2 rounded shadow">Complete Blood Count <span class="text-xl">+</span></button>
        <button class="flex justify-between items-center bg-cyan-500 px-4 py-2 rounded shadow">Complete Blood Count <span class="text-xl">+</span></button>
        <button class="flex justify-between items-center bg-cyan-500 px-4 py-2 rounded shadow">Complete Blood Count <span class="text-xl">+</span></button>
        <button class="flex justify-between items-center bg-cyan-500 px-4 py-2 rounded shadow">Complete Blood Count <span class="text-xl">+</span></button>
        <button class="flex justify-between items-center bg-cyan-500 px-4 py-2 rounded shadow">Complete Blood Count <span class="text-xl">+</span></button>
      </div>

      <!-- Quantity Selection -->
      <div class="max-w-sm bg-white rounded shadow gap-4 p-4">
        <button class="absolute top-2 right-2">✖</button>
        <p class="mb-2 font-semibold">Select Quantity</p>
        <div class="h-24 w-full bg-gray-200 mb-2 flex items-center justify-center">Image</div>
        <p class="text-center font-semibold">Complete Blood Count</p>
        <p class="text-center text-sm text-gray-600">PHP 200.00</p>
        <div class="flex justify-center items-center space-x-2 mt-2">
          <button class="px-3 py-1 bg-gray-300 rounded">-</button>
          <input type="text" class="w-12 text-center border rounded" value="1" />
          <button class="px-3 py-1 bg-gray-300 rounded">+</button>
        </div>
        <div class="gap-4 m-4">
          <button class="bg-red-400 px-4 py-2 text-white rounded ">CANCEL</button>
          <button class="bg-green-600 px-4 py-2 text-white rounded">Add to Order</button>
        </div>
      </div>
      </div>
 </div>

    </div>
</template>

