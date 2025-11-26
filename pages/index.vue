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

// 🔍 Check if admin exists on mount
onMounted(async () => {
  try {
    const exists = await window.electronAPI.checkAdmin()
    showSetup.value = !exists
  } catch (err) {
    console.error('Error checking admin:', err) 
  }
})

/** 🛠 Setup Admin Account */
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

/** 🔑 Handle normal login */
async function handleLogin() {
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

      const user = useState('user', () => null)
      user.value = { name: result.name, role: result.role }

      if (result.role === 'admin') router.push('/dashboard')
      else if (result.role === 'cashier') router.push('/dashboard')
    } else {
      alert(result?.error || 'Login failed.')
    }
  } catch (err) {
    console.error('Login error:', err)
    alert('Something went wrong during login.')
  }
}
</script>


<template>
  <div class="min-h-screen flex items-center justify-center">
    <background />
    <div class="z-10 p-8 bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-lg">
      
      <!-- 🔑 Setup Admin Form (shown only if no admin exists) -->
      <form v-if="showSetup" @submit.prevent="handleSetup" class="p-8 rounded w-full max-w-sm">
        <h2 class="text-2xl font-bold mb-6 text-center text-white">
          Setup Admin Account
        </h2>
        <input
          v-model="name"
          type="text"
          placeholder="Admin Name"
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
          class="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
        >
          Create Admin
        </button>
      </form>

      <!-- 🔑 Normal Login Form -->
      <form v-else @submit.prevent="handleLogin" class="p-8 rounded w-full max-w-sm">
        <h2 class="text-2xl font-bold mb-6 text-center text-white">
          {{ loginRole.charAt(0).toUpperCase() + loginRole.slice(1) }} Login
        </h2>

        <!-- Role chooser -->
        <select
          v-model="loginRole"
          class="w-full p-2 border border-gray-300 rounded mb-4 bg-white text-black"
        >
          <option value="admin">Admin</option>
          <option value="cashier">Cashier</option>
        </select>

        <input
          v-model="name"
          type="text"
          placeholder="Name"
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
