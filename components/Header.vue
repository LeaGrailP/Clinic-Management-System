<script setup>
import { ref } from 'vue'
import { Home, User, LogOut, ArrowLeft, Sun, Moon } from 'lucide-vue-next'
import { useTheme } from "@/composables/useTheme"
import { useRouter } from 'vue-router'

const { isDark, toggleTheme } = useTheme()
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
  <header class="shadow-md p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-20 h-12 bg-sky-100 dark:bg-slate-800">
    <div class="flex items-center space-x-4">
      <span class="text-lg font-semibold text-slate-800 dark:text-slate-100">FELTHEA POS</span>
    </div>

    <nav class="flex space-x-2">
      <button
      @click="toggleTheme"
      class="flex items-center space-x-1 px-2 py-1 rounded-md text-slate-800 dark:text-slate-100 hover:bg-sky-200 hover:text-slate-800 transition-colors"
    >
      <Sun v-if="!isDark" class="w-5 h-5" />
      <Moon v-else class="w-5 h-5" />
    </button>

      <button
        @click="goBack"
        class="flex items-center space-x-1 px-2 py-1 rounded-md  text-slate-800 dark:text-slate-100 hover:bg-sky-200 hover:text-slate-800"
      >
        <ArrowLeft class="w-5 h-5" />
        <span class="hidden sm:inline text-sm font-medium"></span>
      </button>

      <NuxtLink
        to="/dashboard"
        class="flex items-center space-x-1 px-2 py-1 rounded-md text-slate-800 dark:text-slate-100 hover:bg-sky-200 hover:text-slate-800"
        exact-active-class="bg-sky-200 text-black font-semibold"
      >
        <Home class="w-6 h-6" />
      </NuxtLink>

      <NuxtLink
        to="/profile"
        class="flex items-center space-x-1 px-2 py-1 rounded-md text-slate-800 dark:text-slate-100 hover:bg-sky-200 hover:text-slate-800"
        exact-active-class="bg-sky-200 text-black font-semibold"
      >
        <User class="w-6 h-6" />
      </NuxtLink>

      <NuxtLink
        to="/"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-slate-800 dark:text-slate-100 hover:bg-sky-200 hover:text-slate-800"
        exact-active-class="bg-sky-200 text-black font-semibold"
      >
        <LogOut class="w-5 h-5" />
      </NuxtLink>
    </nav>
  </header>
</template>