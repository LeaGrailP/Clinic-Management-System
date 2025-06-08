<template>
<div class="p-4">
    <div>
<NuxtLink to="/dashboard" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg">Back to dashboard</NuxtLink>
    </div>

 <div class="mt-8">
      <div class="flex flex-row justify-evenly">
        <h1 class="font-bold">List of Products and Services</h1>
        <button class="bg-green-600 px-4 py-2 text-white rounded">New Product <span class="text-xl">+</span></button>
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

       
      </div>
       <div class="ml-4 justify-center">
          <button class="bg-red-400 px-4 py-2 text-white rounded ">CANCEL</button>
          <button class="bg-green-600 px-4 py-2 text-white rounded">Add to Order</button>
        </div>
      </div>
 </div>
</div>
    
</template>