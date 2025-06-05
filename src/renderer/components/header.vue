<template>
  <header class="bg-[#364758] text-white shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo or Title -->
        <div class="text-xl font-bold">Clinic POS</div>

        <!-- Desktop Nav -->
        <div class="hidden md:flex space-x-6">
          <nuxt-link to="/" class="flex items-center space-x-2 hover:text-gray-300">
            <HomeIcon class="w-5 h-5" />
            <span>Home</span>
          </nuxt-link>
          <nuxt-link to="/settings" class="flex items-center space-x-2 hover:text-gray-300">
            <SettingsIcon class="w-5 h-5" />
            <span>Settings</span>
          </nuxt-link>
          <nuxt-link to="/profile" class="flex items-center space-x-2 hover:text-gray-300">
            <ProfileIcon class="w-5 h-5" />
            <span>Profile</span>
          </nuxt-link>
        </div>

        <!-- Mobile Hamburger -->
        <div class="md:hidden">
          <button @click="isOpen = !isOpen" class="focus:outline-none">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path :class="isOpen ? 'hidden' : 'inline-flex'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16" />
              <path :class="isOpen ? 'inline-flex' : 'hidden'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Nav -->
    <div v-if="isOpen" class="md:hidden bg-[#2c3e50] px-4 py-2 space-y-2">
      <nuxt-link to="/" class="flex items-center space-x-2 hover:text-gray-300">
        <HomeIcon class="w-5 h-5" />
        <span>Home</span>
      </nuxt-link>
      <nuxt-link to="/settings" class="flex items-center space-x-2 hover:text-gray-300">
        <SettingsIcon class="w-5 h-5" />
        <span>Settings</span>
      </nuxt-link>
      <nuxt-link to="/profile" class="flex items-center space-x-2 hover:text-gray-300">
        <ProfileIcon class="w-5 h-5" />
        <span>Profile</span>
      </nuxt-link>
    </div>
  </header>
</template>

<script>
export default {
  name: 'HeaderComponent',
  data() {
    return {
      isOpen: false
    }
  },
  components: {
    HomeIcon: {
      template: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 9l9-7 9 7v11a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 01-2 2H1"/>
      </svg>`
    },
    SettingsIcon: {
      template: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 
                 4-1.79 4-4-1.79-4-4-4zm8.94 4c0 .64-.05 1.27-.14 1.88l2.06 1.62c.17.13.21.38.08.56l-1.96 3.4a.39.39 0 01-.53.15l-2.44-1c-.56.42-1.17.78-1.82 1.05l-.37 2.6a.39.39 0 01-.39.32h-4a.39.39 0 01-.39-.32l-.37-2.6a7.937 7.937 0 01-1.82-1.05l-2.44 1a.39.39 0 01-.53-.15l-1.96-3.4a.39.39 0 01.08-.56l2.06-1.62A7.931 7.931 0 014 12c0-.64.05-1.27.14-1.88L2.08 8.5a.39.39 0 01-.08-.56l1.96-3.4c.13-.18.38-.21.53-.15l2.44 1a7.937 7.937 0 011.82-1.05l.37-2.6A.39.39 0 0110.5 2h4c.2 0 .36.14.39.32l.37 2.6c.65.27 1.26.63 1.82 1.05l2.44-1a.39.39 0 01.53.15l1.96 3.4c.13.18.09.43-.08.56l-2.06 1.62c.09.61.14 1.24.14 1.88z"/>
      </svg>`
    },
    ProfileIcon: {
      template: `<svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M5.121 17.804A8.954 8.954 0 0112 15c2.485 0 4.74.996 6.879 2.804M15 11a3 3 0 10-6 0 3 3 0 006 0z"/>
      </svg>`
    }
  }
}
</script>

<style scoped>
/* Optional: Add any additional styling */
</style>
