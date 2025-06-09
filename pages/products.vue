<template>
<div class="flex flex-col p-4 ">
    <div>
<NuxtLink to="/dashboard" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg">Back to dashboard</NuxtLink>
    </div>


        <div class="flex flex-row justify-evenly my-4">
        <h1 class="font-bold">List of Products and Services</h1>
        <button class="bg-green-600 text-white rounded">New Product <span class="text-xl">+</span></button>
      </div>
  
      <div class="flex flex-row justify-center border my-4">

     <div class="grid grid-cols-2 gap-4 p-2 ">
        <button class="flex justify-between items-center bg-cyan-300 px-4 py-2 rounded shadow">Complete Blood Count <span class="text-xl">+</span></button>
        <button class="flex justify-between items-center bg-cyan-300 px-4 py-2 rounded shadow">Complete Blood Count <span class="text-xl">+</span></button>
        <button class="flex justify-between items-center bg-cyan-300 px-4 py-2 rounded shadow">Complete Blood Count <span class="text-xl">+</span></button>
        <button class="flex justify-between items-center bg-cyan-300 px-4 py-2 rounded shadow">Complete Blood Count <span class="text-xl">+</span></button>
        <button class="flex justify-between items-center bg-cyan-300 px-4 py-2 rounded shadow">Complete Blood Count <span class="text-xl">+</span></button>
        <button class="flex justify-between items-center bg-cyan-300 px-4 py-2 rounded shadow">Complete Blood Count <span class="text-xl">+</span></button>
      </div>

      <!-- Quantity Selection -->
      <div class="bg-white rounded shadow gap-4 p-2">
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
      </div>

       <div class="ml-4 justify-center p-2">
          <button class="bg-red-400 px-4 py-2 text-white rounded ">CANCEL</button>
          <button class="bg-green-600 px-4 py-2 text-white rounded">Add to Order</button>
        </div>
      </div>


 <div class="grid grid-cols-3 gap-4 border p-2 my-4">
   <div>
        <label class="block text-sm font-medium">Product Name</label>
        <input type="text" class="w-full p-2 border rounded" value="Product" />
      </div>

   <div>
        <label class="block text-sm font-medium">Price</label>
        <input type="text" class="w-full p-2 border rounded" value="P" />
      </div>

   <div>
        <label class="block text-sm font-medium">Status</label>
        <select class="w-full p-2 border rounded">
          <option>Active</option> 
        </select>
      </div>

 </div>
 </div>
    
</template>