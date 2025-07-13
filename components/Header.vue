<script setup>
import { defineProps, defineEmits } from 'vue'
import { Home, LogIn, Menu, User } from 'lucide-vue-next'

const props = defineProps({
  collapsed: Boolean
})

const emit = defineEmits(['toggle'])
</script>

<template>
  <header class="bg-white shadow-md p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-20 h-12">
    <!-- Sidebar toggle and brand -->
    <div class="flex items-center space-x-4">
      <span class="text-lg font-semibold">ClinicPOS</span>
    </div>

    <!-- Navigation Links -->
    <nav class="flex space-x-2">
      <NuxtLink
        to="/dashboard"
        class="flex items-center space-x-1 px-2 py-1 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <Home class="w-4 h-4" />
      </NuxtLink>
      <NuxtLink
        to="/"
        class="flex items-center space-x-1 px-2 py-1 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <LogIn class="w-4 h-4" />
      </NuxtLink>
      <NuxtLink
        to="/user"
        class="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <User class="w-4 h-4" />
      </NuxtLink>
    </nav>
  </header>
</template>
