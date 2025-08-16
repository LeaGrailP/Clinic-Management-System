<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const collapsed = ref(false)
const route = useRoute() // ✅ Get the route object

function toggleSidebar() {
  collapsed.value = !collapsed.value
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Fixed Header -->
    <Header
     v-if="!route.meta.hideHeader"
      class="fixed top-0 left-0 right-0 h-12 z-20 bg-slate-50 shadow"
    />

    <!-- Layout Body -->
    <div class="pt-12 pb-8 flex">
      <!-- Fixed Sidebar -->
      <Sidebar
  v-if="!route.meta.hideSidebar"
  class="fixed top-12 bottom-8 left-0 z-10 bg-slate-100 border-r transition-all duration-300"
  :collapsed="collapsed"
  @toggle="toggleSidebar"
/>

      <!-- Main Content Area -->
      <main
  :class="[
    route.meta.hideSidebar
      ? 'ml-0'
      : collapsed
        ? 'ml-16'
        : 'ml-64',
    'flex-1 p-4 transition-all duration-300 w-full'
  ]"
>
  <slot />
</main>
    </div>
  </div>
</template>
