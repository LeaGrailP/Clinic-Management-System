<script setup>
import { defineProps, defineEmits, ref, onMounted } from 'vue'
import { Menu, ChevronLeft, ShoppingCart, ArrowLeftRight, Info, User, Home, LogIn, ListTodo } from 'lucide-vue-next'

const props = defineProps({
  collapsed: Boolean
})

const emit = defineEmits(['toggle'])
const user = ref({ role: '' })

onMounted(() => {
  const stored = localStorage.getItem('user')
  if (stored) {
    try {
      user.value = JSON.parse(stored)
    } catch {
      user.value = { role: '' }
    }
  }
})
</script>

<template>
  <aside
    :class="[
      'h-full flex flex-col transition-all duration-300',
      props.collapsed ? 'w-16' : 'w-64'
    ]"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b">
      <button @click="$emit('toggle')" class="text-gray-600 hover:text-black dark:text-slate-100">
        <component :is="props.collapsed ? Menu : ChevronLeft" class="w-5 h-5" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-2 space-y-1">
        <NuxtLink
        to="/dashboard"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-sky-50 hover:text-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white"
        exact-active-class="bg-sky-100 text-black font-semibold dark:bg-slate-700 dark:text-white" >
        <Home class="w-5 h-5" />
        <span v-if="!props.collapsed">Dashboard</span>
      </NuxtLink>

      <NuxtLink
        v-if="user.role === 'admin'"
        to="/products"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-sky-50 hover:text-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white"
        exact-active-class="bg-sky-100 text-black font-semibold dark:bg-slate-700 dark:text-white" >
        <ShoppingCart class="w-5 h-5" />
        <span v-if="!props.collapsed">Products</span>
      </NuxtLink>
      <NuxtLink
        to="/customer"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-sky-50 hover:text-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white"
        exact-active-class="bg-sky-100 text-black font-semibold dark:bg-slate-700 dark:text-white" >
        <User class="w-5 h-5" />
        <span v-if="!props.collapsed">Customer</span>
      </NuxtLink>
      <NuxtLink
        to="/transactions"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-sky-50 hover:text-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white"
        exact-active-class="bg-sky-100 text-black font-semibold dark:bg-slate-700 dark:text-white" >
        <ArrowLeftRight class="w-5 h-5" />
        <span v-if="!props.collapsed">Transactions</span>
      </NuxtLink>
      <NuxtLink
        v-if="user.role === 'admin'"
        to="/register"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-sky-50 hover:text-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white"
        exact-active-class="bg-sky-100 text-black font-semibold dark:bg-slate-700 dark:text-white" >
        <LogIn class="w-5 h-5" />
        <span v-if="!props.collapsed">Create Account</span>
      </NuxtLink> 
      <NuxtLink
        to="/about"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-sky-50 hover:text-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 dark:hover:text-white"
        exact-active-class="bg-sky-100 text-black font-semibold dark:bg-slate-700 dark:text-white" >
        <Info class="w-5 h-5" />
        <span v-if="!props.collapsed">About</span>
      </Nuxtlink>
    </nav>
  </aside>
</template>
