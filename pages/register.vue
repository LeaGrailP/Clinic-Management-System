<template>
  <div class="min-h-screen flex items-center justify-center">
    <background />
    <div class="z-10 p-8 bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-lg w-full max-w-md">
      <h1 class="text-3xl font-bold text-center text-white mb-6">Create an Account</h1>

      <form @submit.prevent="register">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white mb-1">Full Name</label>
            <input v-model="name" type="text" placeholder="Admin" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-white mb-1">Email Address</label>
            <input v-model="email" type="email" placeholder="you@example.com" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-white mb-1">Password</label>
            <input v-model="password" type="password" placeholder="••••••••" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-white mb-1">Confirm Password</label>
            <input v-model="confirmPassword" type="password" placeholder="••••••••" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>

          <button type="submit" class="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">
            Sign Up
          </button>
        </div>
      </form>

      <p class="text-sm text-center text-gray-500 mt-6">
        Already have an account?
        <NuxtLink to="/" class="text-blue-600 hover:underline">Login here</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import background from '~/components/background.vue'
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

definePageMeta({
  layout: 'default',
  hideHeader: true,
  hideSidebar: true
})

const register = () => {
  if (password.value !== confirmPassword.value) {
    alert("Passwords do not match!")
    return
  }
  // Simulate registration
  alert(`Welcome, ${name.value}! Your account has been created.`)
}
</script>
