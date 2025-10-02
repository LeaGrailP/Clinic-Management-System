<script setup>
import { defineProps, defineEmits, ref, onMounted } from 'vue'
import { Menu, ChevronLeft, ShoppingCart, ArrowLeftRight, Info, User, Home, LogIn, ListTodo } from 'lucide-vue-next'

const props = defineProps({
  collapsed: Boolean
})

const emit = defineEmits(['toggle'])
const user = ref({ role: 'cashier' }) // default role

onMounted(() => {
  const stored = localStorage.getItem('user')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)

      // If parsed is an object with a role
      if (parsed && typeof parsed === 'object' && parsed.role) {
        user.value = parsed
      } else {
        // If it's just a string like "admin" or "cashier"
        user.value = { role: parsed }
      }
    } catch {
      // Fallback if JSON.parse fails
      user.value = { role: stored }
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
      <button @click="$emit('toggle')" class="text-gray-600 hover:text-black">
        <component :is="props.collapsed ? Menu : ChevronLeft" class="w-5 h-5" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-2 space-y-1">
      <NuxtLink
        to="/dashboard"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <Home class="w-5 h-5" />
        <span v-if="!props.collapsed">Dashboard</span>
      </NuxtLink>

      <!-- Shared -->
      

      <NuxtLink
        to="/transactions"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <ArrowLeftRight class="w-5 h-5" />
        <span v-if="!props.collapsed">Transactions</span>
      </NuxtLink>

      <NuxtLink
        to="/customer"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <User class="w-5 h-5" />
        <span v-if="!props.collapsed">Customer</span>
      </NuxtLink>

<!-- Only Admin -->
      <NuxtLink
        v-if="user.role === 'admin'"
        to="/products"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <ShoppingCart class="w-5 h-5" />
        <span v-if="!props.collapsed">Products</span>
      </NuxtLink>

<NuxtLink
  v-if="user.role && user.role.toLowerCase() === 'admin'"
  to="/register"
  class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
  exact-active-class="bg-gray-200 text-black font-semibold"
>
  <LogIn class="w-5 h-5" />
  <span v-if="!props.collapsed">Create Account</span>
</NuxtLink>


      
      <!--
      !-- Only Admin --
      <NuxtLink
       v-if="user.role === 'admin'"
        to="/appointment"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <ListTodo class="w-5 h-5" />
        <span v-if="!props.collapsed">Appointment</span>
      </NuxtLink>
      -->

      <!-- Shared -->
      <NuxtLink
        to="/about"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <Info class="w-5 h-5" />
        <span v-if="!props.collapsed">About</span>
      </NuxtLink>
    </nav>
  </aside>
</template>
