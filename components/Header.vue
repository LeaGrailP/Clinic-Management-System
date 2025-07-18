<script setup>
import { onMounted, ref } from 'vue'
import { Home, Menu, User } from 'lucide-vue-next'

const user = ref({})
</script>

<template>
  <header class="bg-white shadow-md p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-20 h-12">
    <div class="flex items-center space-x-4">
      <span class="text-lg font-semibold">ClinicPOS</span>
    </div>

    <nav class="flex space-x-2">
      <NuxtLink
        to="/dashboard"
        class="flex items-center space-x-1 px-2 py-1 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <Home class="w-6 h-6" />
      </NuxtLink>

      <NuxtLink
        to="/user"
        class="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <User class="w-6 h-6" />
      </NuxtLink>
    </nav>
  </header>
</template>