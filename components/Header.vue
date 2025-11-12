<script setup>
import { ref } from 'vue'
import { Home, User, LogOut, ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    // fallback if no history (e.g., direct access)
    router.push('/dashboard')
  }
}
</script>

<template>
  <header class="shadow-md p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-20 h-12 bg-white">
    <div class="flex items-center space-x-4">
      <span class="text-lg font-semibold">FELTHEA POS</span>
    </div>

    <nav class="flex space-x-2">
      <!-- Back button -->
      <button
        @click="goBack"
        class="flex items-center space-x-1 px-2 py-1 rounded-md text-gray-700 hover:bg-sky-200 hover:text-black"
      >
        <ArrowLeft class="w-5 h-5" />
        <span class="hidden sm:inline text-sm font-medium"></span>
      </button>

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