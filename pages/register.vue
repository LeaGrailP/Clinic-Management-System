<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 px-4">
    <div class="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
      <h1 class="text-3xl font-bold text-center text-gray-800 mb-6">Create an Account</h1>

      <form @submit.prevent="register">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input v-model="name" type="text" placeholder="Admin" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input v-model="email" type="email" placeholder="you@example.com" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input v-model="password" type="password" placeholder="••••••••" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input v-model="confirmPassword" type="password" placeholder="••••••••" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>

          <button type="submit" class="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">
            Sign Up
          </button>
        </div>
      </form>

      <p class="text-sm text-center text-gray-500 mt-6">
        Already have an account?
        <NuxtLink to="/login" class="text-blue-600 hover:underline">Login here</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const register = () => {
  if (password.value !== confirmPassword.value) {
    alert("Passwords do not match!")
    return
  }
  // Simulate registration
  alert(`Welcome, ${name.value}! Your account has been created.`)
}
</script>
