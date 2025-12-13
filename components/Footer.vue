<template>
  <footer
    class="fixed bottom-0 left-0 right-0 p-4 z-50 backdrop-blur
           bg-slate-100 border-t border-gray-300 shadow-lg
           dark:bg-slate-800 dark:border-slate-700 dark:shadow-black/20">

    <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-6 gap-4">

      <button @click="emitEvent('footer-cancel')"
        class="w-full py-2 px-4 rounded-lg shadow text-slate-100
               bg-red-600 hover:bg-red-700">
        Cancel Transaction
      </button>

      <button @click="emitEvent('footer-open-drawer')"
        class="w-full py-2 px-4 rounded-lg shadow text-slate-100
               bg-gray-600 hover:bg-gray-700">
        Open Drawer
      </button>

      <button @click="emitEvent('footer-check-printer')"
        class="w-full py-2 px-4 rounded-lg shadow text-slate-100 
               bg-yellow-600 hover:bg-yellow-700">
        Check Printer
      </button>

      <button @click="emitEvent('footer-preview-receipt')"
        class="w-full py-2 px-4 rounded-lg shadow text-slate-100 
               bg-purple-600 hover:bg-purple-700">
        Preview Receipt
      </button>

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