<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import Footer from '@/components/Footer.vue'

const collapsed = ref(false)
const route = useRoute()

function toggleSidebar() {
  collapsed.value = !collapsed.value
}

// Emit events from layout to page
import { defineEmits } from 'vue'
const emit = defineEmits([
  'save',
  'cancel',
  'open-drawer',
  'print',
  'check-printer',
  'preview-receipt'
])

function forwardEvent(event) {
  emit(event)
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-800">
    <Header
      v-if="!route.meta.hideHeader"
      class="fixed top-0 left-0 right-0 h-12 z-20 "
    />

    <div class="pt-12 pb-8 flex">
      <Sidebar
        v-if="!route.meta.hideSidebar"
        class="fixed top-12 bottom-8 left-0 z-10 bg-sky-200 dark:bg-gray-800 border-r transition-all duration-300"
        :collapsed="collapsed"
        @toggle="toggleSidebar"
      />

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

      <!-- FOOTER (only if showFooter meta is true) -->
      <Footer
        v-if="route.meta.showFooter"
        @save="forwardEvent('save')"
        @cancel="forwardEvent('cancel')"
        @open-drawer="forwardEvent('open-drawer')"
        @print="forwardEvent('print')"
        @check-printer="forwardEvent('check-printer')"
        @preview-receipt="forwardEvent('preview-receipt')"
      />
    </div>
  </div>
</template>

<style scoped>
</style>
