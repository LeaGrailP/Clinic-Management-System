
<script setup>
import { defineProps, defineEmits } from 'vue'
import { Menu, ChevronLeft, ArrowLeftRight, Info, User, Home } from 'lucide-vue-next'

const props = defineProps({ collapsed: Boolean })
const emit = defineEmits(['toggle'])
</script>

<template>
  <aside
    :class="[
      'h-full flex flex-col transition-all duration-300 bg-white border-r',
      props.collapsed ? 'w-16' : 'w-64'
    ]"
  >
    <div class="flex items-center justify-between p-4 border-b">
      <button @click="$emit('toggle')" class="text-gray-600 hover:text-black">
        <component :is="props.collapsed ? Menu : ChevronLeft" class="w-5 h-5" />
      </button>
    </div>

    <nav class="flex-1 p-2 space-y-1">
      <NuxtLink to="/dashboard" class="flex items-center space-x-3 px-3 py-2 hover:bg-gray-200 rounded-md">
        <Home class="w-5 h-5" /><span v-if="!props.collapsed">Dashboard</span>
      </NuxtLink>
      <NuxtLink to="/transactions" class="flex items-center space-x-3 px-3 py-2 hover:bg-gray-200 rounded-md">
        <ArrowLeftRight class="w-5 h-5" /><span v-if="!props.collapsed">Transactions</span>
      </NuxtLink>
      <NuxtLink to="/customer" class="flex items-center space-x-3 px-3 py-2 hover:bg-gray-200 rounded-md">
        <User class="w-5 h-5" /><span v-if="!props.collapsed">Customer</span>
      </NuxtLink>
      <NuxtLink to="/about" class="flex items-center space-x-3 px-3 py-2 hover:bg-gray-200 rounded-md">
        <Info class="w-5 h-5" /><span v-if="!props.collapsed">About</span>
      </NuxtLink>
    </nav>
  </aside>
</template>
