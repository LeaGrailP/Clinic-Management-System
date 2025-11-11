<template>
  <footer class="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-300 p-4 z-50">
    <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-4">

      <button @click="emitEvent('footer-save')" class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg shadow">Save</button>
      <button @click="emitEvent('footer-cancel')" class="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg shadow">Cancel Transaction</button>
      <button @click="emitEvent('footer-open-drawer')" class="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg shadow">Open Drawer</button>
      <button @click="emitEvent('footer-print')" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg shadow">Print Receipt</button>
      <button @click="emitEvent('footer-check-printer')" class="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg shadow">Check Printer</button>
      <button @click="emitEvent('footer-preview-receipt')" class="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg shadow">Preview Receipt</button>

    </div>
  </footer>
</template>

<script setup>
function emitEvent(eventName) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(eventName))
  }
}
</script>

<style scoped>
footer {
  backdrop-filter: blur(4px);
}
</style>
