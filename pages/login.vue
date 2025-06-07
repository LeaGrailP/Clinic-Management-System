<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <form @submit.prevent="handleLogin" class="bg-white p-8 rounded shadow-md w-full max-w-sm">
      <h2 class="text-2xl font-bold mb-6 text-center">Login</h2>
      <input
        v-model="username"
        type="text"
        placeholder="Username"
        class="w-full p-2 border border-gray-300 rounded mb-4"
        required
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="w-full p-2 border border-gray-300 rounded mb-6"
        required
      />
      <button
        type="submit"
        class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        Login
      </button>
    </form>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const username = ref('')
const password = ref('')
const router = useRouter()

function handleLogin() {
  // No real validation for now
  console.log('Logging in with:', username.value, password.value)

  // Redirect to dashboard page
  router.push('/dashboard')
}
</script>
