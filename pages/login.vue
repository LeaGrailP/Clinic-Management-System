<template>
  <div class="min-h-screen flex items-center justify-center">
    <background />
    <div class="z-10 p-8 bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-lg">
    <form @submit.prevent="handleLogin" class="p-8 rounded shadow-md w-full max-w-sm">
      <h2 class="text-2xl font-bold mb-6 text-center">Clinic POS</h2>
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

    <NuxtLink to="/register" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg">Create an Account</NuxtLink>
  </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  hideHeader: true
})

import background from '~/components/background.vue'
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
