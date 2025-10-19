<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Menu,
  ChevronLeft,
  ShoppingCart,
  ArrowLeftRight,
  Info,
  User,
  Home,
  LogIn,
} from 'lucide-vue-next'

const props = defineProps({ collapsed: Boolean })
const emit = defineEmits(['toggle'])

const user = ref({ role: null })

// Load user role from localStorage
onMounted(() => {
  const stored = localStorage.getItem('user')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      user.value = parsed.role ? parsed : { role: stored }
    } catch {
      user.value = { role: stored }
    }
  }
})

// Define all sidebar items for both roles
const menuItems = [
  { label: 'Dashboard', icon: Home, to: '/dashboard', roles: ['admin', 'cashier'] },
  { label: 'Transactions', icon: ArrowLeftRight, to: '/transactions', roles: ['admin', 'cashier'] },
  { label: 'Customer', icon: User, to: '/customer', roles: ['admin', 'cashier'] },
  { label: 'Products', icon: ShoppingCart, to: '/products', roles: ['admin'] },
  { label: 'Create Account', icon: LogIn, to: '/register', roles: ['admin'] },
  { label: 'About', icon: Info, to: '/about', roles: ['admin', 'cashier'] },
]

// Filter visible menu items by current role
const visibleMenu = computed(() => menuItems.filter(item => item.roles.includes(user.value.role)))
</script>

<template>
  <aside
    :class="[
      'h-full flex flex-col transition-all duration-300 bg-white border-r',
      props.collapsed ? 'w-16' : 'w-64'
    ]"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b">
      <button @click="emit('toggle')" class="text-gray-600 hover:text-black">
        <component :is="props.collapsed ? Menu : ChevronLeft" class="w-5 h-5" />
      </button>
      <span v-if="!props.collapsed" class="text-gray-700 font-semibold capitalize">
        {{ user.role || 'User' }}
      </span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-2 space-y-1">
      <NuxtLink
        v-for="item in visibleMenu"
        :key="item.to"
        :to="item.to"
        class="flex items-center space-x-3 px-3 py-2 hover:bg-gray-200 rounded-md"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span v-if="!props.collapsed">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </aside>
</template>

<style scoped>
aside {
  min-height: 100vh;
}
</style>
