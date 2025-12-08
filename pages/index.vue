<script setup>
import background from '~/components/background.vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'

definePageMeta({ layout: 'login' })

const router = useRouter()

// --- Form Data ---
const name = ref('')
const password = ref('')
const loginRole = ref('admin')
const passwordVisible = ref(false)

// Forgot password data
const forgotName = ref('')
const forgotNewPassword = ref('')
const forgotLoading = ref(false)
const loading = ref(false)

// --- Single UI Controller ---
const currentView = ref('checking')  
// possible values: checking, setup, login, forgot

onMounted(async () => {
  try {
    const exists = await window.electronAPI.checkAdmin()
    currentView.value = exists ? 'login' : 'setup'
  } catch (err) {
    console.error(err)
    currentView.value = 'setup'  // fallback
  }
})

// Reset fields:
function resetFields() {
  name.value = ''
  password.value = ''
}

// ---------------------- SETUP ADMIN ----------------------
async function handleSetup() {
  try {
    const result = await window.electronAPI.createAdmin({
      name: name.value,
      password: password.value
    })

    if (result?.success) {
      alert('Admin account created!')
      resetFields()
      currentView.value = 'login'
    } else {
      alert(result?.error || 'Failed to create admin.')
    }
  } catch (err) {
    console.error(err)
  }
}

// ---------------------- LOGIN ----------------------
async function handleLogin() {
  loading.value = true
  try {
    const result = await window.electronAPI.login({
      role: loginRole.value,
      name: name.value,
      password: password.value
    })

    if (result?.success) {
      localStorage.setItem('token', 'true')
      localStorage.setItem('name', result.name)
      localStorage.setItem('role', result.role)

      const user = useState('user')
      user.value = { name: result.name, role: result.role }

      router.push('/dashboard')
    } else {
      alert(result?.error || 'Login failed.')
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

// ---------------------- FORGOT PASSWORD ----------------------
async function handleForgotPassword() {
  forgotLoading.value = true
  try {
    const result = await window.electronAPI.resetPassword({
      name: forgotName.value,
      newPassword: forgotNewPassword.value,
    })

    if (result?.success) {
      alert('Password updated!')
      currentView.value = 'login'
      forgotName.value = ''
      forgotNewPassword.value = ''
    } else {
      alert(result?.error || 'Reset failed.')
    }
  } catch (err) {
    console.error(err)
  } finally {
    forgotLoading.value = false
  }
}
</script>


<template>
  <div class="min-h-screen flex items-center justify-center relative">
    <background />

    <div class="z-10 p-8 bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl w-[380px]">

      <!-- CHECKING -->
      <template v-if="currentView === 'checking'">
        <div class="text-white text-center text-lg py-4">Loading...</div>
      </template>

      <!-- SETUP -->
      <template v-else-if="currentView === 'setup'">
        <h2 class="text-2xl font-semibold text-center text-white mb-6">
          Setup Admin Account
        </h2>

        <form @submit.prevent="handleSetup" class="space-y-4">

          <input v-model="name" type="text" placeholder="Admin Name"
                 class="w-full p-3 rounded bg-white/80 text-gray-900" />

         <div class="relative">
    <input 
      :type="passwordVisible ? 'text' : 'password'" 
      placeholder="Enter password"
      class="border px-3 py-2 rounded w-full"
    />
    <button 
      type="button"
      @click="passwordVisible = !passwordVisible"
      class="absolute right-3 top-1/2 -translate-y-1/2"
    >
      <component :is="passwordVisible ? EyeOff : Eye" class="w-5 h-5 text-black" />
    </button>
  </div>

          <button class="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
            Create Admin
          </button>
        </form>
      </template>

      <!-- LOGIN -->
      <template v-else-if="currentView === 'login'">
        <h2 class="text-2xl font-semibold text-center text-white mb-6">
          Login
        </h2>

        <form @submit.prevent="handleLogin" class="space-y-4">

          <select v-model="loginRole"
                  class="w-full p-3 rounded bg-white/80 text-gray-900">
            <option value="admin">Admin</option>
            <option value="cashier">Cashier</option>
          </select>

          <input v-model="name" type="text" placeholder="Name"
                 class="w-full p-3 rounded bg-white/80 text-gray-900" />

          <div class="relative">
            <input :type="passwordVisible ? 'text' : 'password'"
                   v-model="password" placeholder="Password"
                   class="w-full p-3 rounded bg-white/80 text-gray-900" />

            <button type="button"
                    @click="passwordVisible = !passwordVisible"
                    class="absolute right-3 top-1/2 -translate-y-1/2">
              {{ passwordVisible ? '🙈' : '👁' }}
            </button>
          </div>

          <button :disabled="loading"
                  class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
            {{ loading ? 'Processing...' : 'Login' }}
          </button>

          <p class="text-center text-white underline cursor-pointer"
             @click="currentView = 'forgot'">
            Forgot Password?
          </p>

        </form>
      </template>

      <!-- FORGOT -->
      <template v-else-if="currentView === 'forgot'">
        <h2 class="text-2xl font-semibold text-center text-white mb-6">
          Reset Password
        </h2>

        <form @submit.prevent="handleForgotPassword" class="space-y-4">

          <input v-model="forgotName" type="text"
                 placeholder="Existing Username"
                 class="w-full p-3 rounded bg-white/80 text-gray-900" />

          <input v-model="forgotNewPassword" type="password"
                 placeholder="New Password"
                 class="w-full p-3 rounded bg-white/80 text-gray-900" />

          <button :disabled="forgotLoading"
                  class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:bg-gray-400">
            {{ forgotLoading ? 'Updating...' : 'Reset Password' }}
          </button>

          <p class="text-center text-white underline cursor-pointer"
             @click="currentView = 'login'">
            Back to Login
          </p>

        </form>
      </template>

    </div>
  </div>
</template>

