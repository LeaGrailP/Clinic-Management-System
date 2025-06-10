<template>
  <div class="min-h-screen flex items-center justify-center">
    <background />

    <div class="z-10 p-8 bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-lg w-full max-w-md">
      <form @submit.prevent="handleLogin" class="space-y-6">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-white">Clinic POS</h2>
          <p class="text-white mt-2">
            Don't have an account?
            <NuxtLink to="/register" class="text-blue-300 hover:underline font-semibold">
              Create Now
            </NuxtLink>
          </p>
        </div>

        <div>
          <input
            v-model="username"
            type="text"
            placeholder="Username"
            class="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <input
            v-model="password"
            type="password"
            placeholder="Password"
            class="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          class="w-full bg-blue-500 text-white py-3 rounded hover:bg-blue-600 transition duration-200"
        >
          Login
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  hideHeader: true,
  hideSidebar: true
})

import background from '~/components/background.vue'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const username = ref('')
const password = ref('')
const router = useRouter()

function handleLogin() {
  console.log('Logging in with:', username.value, password.value)
  router.push('/dashboard')
}
</script>
