<template>
  <div class="min-h-screen flex items-center justify-center">
    <background />
    <div class="z-10 p-8 bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-lg">
      <form @submit.prevent="handleLogin" class="p-8 rounded w-full max-w-sm">
        <h2 class="text-2xl font-bold mb-6 text-center text-white">Clinic POS</h2>

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
  </div>
</template>

<script setup>
import background from '~/components/background.vue'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'default',
  hideHeader: true,
  hideSidebar: true
})

const username = ref('')
const password = ref('')
const router = useRouter();
const isAdmin = ref(false)

onMounted(() => {
  const role = localStorage.getItem('role')
  if (role === 'admin') {
    isAdmin.value = true
  }
})

async function handleLogin() {
  try {
    const result = await window.auth.login({
      username: username.value,
      password: password.value
    })

    if (result && result.success) {
      localStorage.setItem('user', JSON.stringify(result)) // ✅ Save whole user object
      router.push('/dashboard')
    } else {
      alert(result?.error || 'Login failed.')
    }
  } catch (err) {
    console.error('Login error:', err)
    alert('Something went wrong during login.')
  }
}
</script>

<style scoped>
.dot {
  transition: transform 0.3s ease;
}
</style>