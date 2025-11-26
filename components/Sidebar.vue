<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminSidebar from '~/components/AdminSidebar.vue'
import CashierSidebar from '~/components/CashierSidebar.vue'

const collapsed = ref(false)
const user = ref({ role: null })

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

const sidebarComponent = computed(() => {
  if (user.value.role === 'admin') return AdminSidebar
  if (user.value.role === 'cashier') return CashierSidebar
  return null
})
</script>

<template>
  <component
    :is="sidebarComponent"
    v-if="sidebarComponent"
    :collapsed="collapsed"
    @toggle="collapsed = !collapsed"
  />
</template>
