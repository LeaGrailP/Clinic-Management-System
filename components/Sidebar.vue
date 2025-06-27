<script setup>
import { defineProps, defineEmits } from 'vue'
import { Menu, ChevronLeft, ShoppingCart, ArrowLeftRight, Info, User, Home } from 'lucide-vue-next'

const props = defineProps({
  collapsed: Boolean
})

const emit = defineEmits(['toggle'])
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

      <NuxtLink
        to="/products"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <ShoppingCart class="w-5 h-5" />
        <span v-if="!props.collapsed">Products</span>
      </NuxtLink>
      <NuxtLink
        to="/customer"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <User class="w-5 h-5" />
        <span v-if="!props.collapsed">Customer</span>
      </NuxtLink>

            <NuxtLink
        to="/profile"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <User class="w-5 h-5" />
        <span v-if="!props.collapsed">Profile</span>
      </NuxtLink>
      <NuxtLink
        to="/transactions"
        class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 hover:bg-gray-200 hover:text-black"
        exact-active-class="bg-gray-200 text-black font-semibold"
      >
        <ArrowLeftRight class="w-5 h-5" />
        <span v-if="!props.collapsed">Transactions</span>
      </NuxtLink>

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
