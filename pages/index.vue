<script setup>
import background from '~/components/background.vue'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'login' 
})

const router = useRouter()
const name = ref('')
const password = ref('')
const loginRole = ref('admin')
const showSetup = ref(false)
const loading = ref(false)

onMounted(async () => {
  try {
    const exists = await window.electronAPI.checkAdmin()
    showSetup.value = !exists
  } catch (err) {
    console.error('Error checking admin:', err) 
  }
})

async function handleSetup() {
  try {
    const result = await window.electronAPI.createAdmin({
      name: name.value,
      password: password.value
    })

    if (result && result.success) {
      alert('Admin account created successfully!')
      showSetup.value = false
    } else {
      alert(result?.error || 'Failed to create admin.')
    }
  } catch (err) {
    console.error('Setup error:', err)
    alert('Something went wrong while setting up admin.')
  }
}

async function handleLogin() {
  loading.value = true
  try {
    const result = await window.electronAPI.login({
      role: loginRole.value,
      name: name.value,
      password: password.value
    })

    if (result && result.success) {
      localStorage.setItem('token', 'true')
      localStorage.setItem('name', result.name)
      localStorage.setItem('role', result.role)

      const user = useState('user')
      user.value = { name: result.name, role: result.role }

      if (result.role === 'admin') router.push('/dashboard')
      else if (result.role === 'cashier') router.push('/dashboard')
    } else {
      alert(result?.error || 'Login failed.')
    }
  } catch (err) {
    console.error('Login error:', err)
    alert('Something went wrong during login.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <background />
    <div class="z-10 p-8 bg-slate-50 bg-opacity-10 backdrop-blur-md rounded-lg shadow-lg">
      <form v-if="showSetup" @submit.prevent="handleSetup" class="p-8 rounded w-full max-w-sm">
        <h2 class="text-2xl font-bold mb-6 text-center text-slate-50">
          Setup Admin Account
        </h2>
        <input
          v-model="name"
          type="text"
          placeholder="Admin Name"
          class="w-full p-2 border border-gray-400 rounded mb-4"
          required
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          class="w-full p-2 border border-gray-400 rounded mb-6"
          required
        />
        <button
          type="submit"
          class="w-full bg-green-500 text-slate-50 py-2 rounded hover:bg-green-600"
        >
          Create Admin
        </button>
      </form>
      <form @submit.prevent="handleLogin" class="p-8 rounded w-full max-w-sm">
        <!-- Progress Bar (shows on top of form, not replacing it) -->
        <div v-if="loading" class="w-full h-1 bg-gray-400 rounded overflow-hidden mb-4">
          <div class="h-full bg-sky-600 animate-pulse"></div>
        </div>

        <h2 class="text-2xl font-bold mb-6 text-center text-slate-50">
          {{ loginRole.charAt(0).toUpperCase() + loginRole.slice(1) }} Login
        </h2>

        <select
          v-model="loginRole"
          class="w-full p-2 border border-gray-400 rounded mb-4 bg-slate-50 text-slate-800"
        >
          <option value="admin">Admin</option>
          <option value="cashier">Cashier</option>
        </select>

        <input
          v-model="name"
          type="text"
          placeholder="Name"
          class="w-full p-2 border border-gray-400 rounded mb-4"
          required
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          class="w-full p-2 border border-gray-400 rounded mb-6"
          required
        />

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-sky-600 text-slate-50 py-2 rounded hover:bg-sky-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <span v-if="!loading">Login</span>
          <span v-else>Processing...</span>
        </button>
      </form>
    </div>
  </div>
</template>
