<script setup>
import { ref } from 'vue'
import { Home, Menu, User, LogOut } from 'lucide-vue-next'

</script>

<template>
  <header class="shadow-md p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-20 h-12">
    <div class="flex items-center space-x-4">
      <span class="text-lg font-semibold">FETHEA POS</span>
    </div>

    <nav class="flex space-x-2">
      <NuxtLink
        to="/dashboard"
        class="flex items-center space-x-1 px-2 py-1 rounded-md text-gray-700 hover:bg-sky-200 hover:text-black"
        exact-active-class="bg-sky-200 text-black font-semibold"
      >
        <Home class="w-6 h-6" />
      </NuxtLink>

      <NuxtLink
        to="/profile"
        class="flex items-center space-x-1 px-2 py-1 rounded-md text-gray-700 hover:bg-sky-200 hover:text-black"
        exact-active-class="bg-sky-200 text-black font-semibold"
      >
        <User class="w-6 h-6" />
      </NuxtLink>
      <NuxtLink
        to="/"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-sky-200 hover:text-black"
        exact-active-class="bg-sky-200 text-black font-semibold"
      >
        <LogOut class="w-5 h-5" />
      </NuxtLink>
    </nav>
  </header>
</template>