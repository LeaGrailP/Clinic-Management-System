<template>
  <div>
    <Header v-if="!$route.meta.hideHeader" />
    <main><slot /></main>
    <footer class="bg-gray-200 p-4 text-center">© 2025 ClinicPOS</footer>
  </div>
</template>
