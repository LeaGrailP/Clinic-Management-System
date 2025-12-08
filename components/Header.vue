<script setup>
import { ref, computed } from 'vue'
import { Home, LogOut, ArrowLeft, Sun, Moon } from 'lucide-vue-next'
import { useTheme } from "@/composables/useTheme"
import { useRouter } from 'vue-router'

const { isDark, toggleTheme } = useTheme()
const router = useRouter()

// Get logged-in user from global state
const user = useState('user')

// Fallback name if not logged in
const userName = computed(() => user.value?.name || 'Guest')

// Logout handler
function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('name')
  localStorage.removeItem('role')
  
  user.value = null
  router.push('/')
}

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard')
  }
}
</script>


<template>
  <header
    class="shadow-md p-4 flex justify-between items-center fixed top-0 left-0 right-0 z-20 h-12 
           bg-sky-100 dark:bg-slate-800"
  >
    <div class="flex items-center space-x-4">
      <span class="text-lg font-semibold text-slate-800 dark:text-slate-100">
        FELTHEA POS
      </span>
    </div>

    <nav class="flex items-center space-x-3">
      <!-- Theme Toggle -->
      <button
        @click="toggleTheme"
        class="flex items-center px-2 py-1 rounded-md text-slate-800 dark:text-slate-100 
               hover:bg-sky-200 dark:hover:bg-slate-700 transition-colors"
      >
        <Sun v-if="!isDark" class="w-5 h-5" />
        <Moon v-else class="w-5 h-5" />
      </button>

      <!-- Dashboard -->
      <NuxtLink
        to="/dashboard"
        class="flex items-center px-2 py-1 rounded-md text-slate-800 dark:text-slate-100 
               hover:bg-sky-200 dark:hover:bg-slate-700"
        exact-active-class="bg-sky-200 dark:bg-slate-700 text-black font-semibold"
      >
        <Home class="w-6 h-6" />
      </NuxtLink>

      <!-- Logged-in User Name Display -->
      <NuxtLink 
      to="/profile" 
      class="px-3 py-1 text-slate-800 dark:text-slate-100 font-bold ">
        {{ userName }}
      </NuxtLink>

      <!-- Logout -->
      <button
        @click="logout"
        class="flex items-center px-3 py-1 rounded-md text-slate-800 dark:text-slate-100 
               hover:bg-sky-200 dark:hover:bg-slate-700 transition-colors"
      >
        <LogOut class="w-5 h-5" />
      </button>
    </nav>
  </header>
</template>
