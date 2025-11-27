<script setup>
import { defineProps, computed } from 'vue'
import { Menu, ChevronLeft, ShoppingCart, ArrowLeftRight, Info, User, Home, LogIn } from 'lucide-vue-next'

const props = defineProps({
  collapsed: Boolean,
  role: String
})

const menuItems = computed(() => {
  const adminMenu = [
    { label: "Dashboard", icon: Home, to: "/dashboard" },
    { label: "Transactions", icon: ArrowLeftRight, to: "/transactions" },
    { label: "Customer", icon: User, to: "/customer" },
    { label: "Products", icon: ShoppingCart, to: "/products" },
    { label: "Create Account", icon: LogIn, to: "/register" },
    { label: "About", icon: Info, to: "/about" }
  ]

  const cashierMenu = [
    { label: "Dashboard", icon: Home, to: "/dashboard" },
    { label: "Transactions", icon: ArrowLeftRight, to: "/transactions" },
    { label: "Customer", icon: User, to: "/customer" },
    { label: "About", icon: Info, to: "/about" }
  ]

  return props.role === "admin" ? adminMenu : cashierMenu
})
</script>

<template>
  <aside
    :class="[
      'h-full flex flex-col transition-all duration-300 bg-slate-50 border-r',
      props.collapsed ? 'w-16' : 'w-64'
    ]">
    <div class="flex items-center justify-between p-4 border-b">
      <button @click="$emit('toggle')" class="text-gray-600 hover:text-slate-800 dark:text-gray-300">
        <component :is="props.collapsed ? Menu : ChevronLeft" class="w-5 h-5" />
      </button>
    </div>

    <nav class="flex-1 p-2 space-y-1">
      <NuxtLink
        v-for="item in menuItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-sky-50 hover:text-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white"
        exact-active-class="bg-sky-100 text-black font-semibold dark:bg-slate-700 dark:text-white" >
        <component :is="item.icon" class="w-5 h-5" />
        <span v-if="!props.collapsed">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </aside>
</template>
