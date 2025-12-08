<script setup>
import background from '~/components/background.vue'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'login'
})

const router = useRouter()

// Form fields
const name = ref('')
const password = ref('')

// UI state
const loginRole = ref('admin')
const showSetup = ref(false)
const checkingAdmin = ref(true)
const loading = ref(false)
const passwordVisible = ref(false)     // 👁 Password toggle

// Forgot password UI state
const showForgot = ref(false)
const forgotName = ref('')
const forgotNewPassword = ref('')
const forgotLoading = ref(false)

// Reset inputs when switching forms
function resetFields() {
  name.value = ''
  password.value = ''
}

onMounted(async () => {
  try {
    const exists = await window.electronAPI.checkAdmin()
    showSetup.value = !exists
  } catch (err) {
    console.error('Error checking admin:', err)
    showSetup.value = true
  } finally {
    checkingAdmin.value = false
  }
})

// ---------------------- SETUP ADMIN ----------------------
async function handleSetup() {
  try {
    const result = await window.electronAPI.createAdmin({
      name: name.value,
      password: password.value
    })

    if (result?.success) {
      alert('Admin account created successfully!')
      showSetup.value = false
      resetFields()
    } else {
      alert(result?.error || 'Failed to create admin.')
    }
  } catch (err) {
    console.error('Setup error:', err)
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
    console.error('Login error:', err)
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
      alert('Password reset successfully!')
      showForgot.value = false
      forgotName.value = ''
      forgotNewPassword.value = ''
    } else {
      alert(result?.error || 'Reset failed.')
    }
  } catch (err) {
    console.error('Forgot password error:', err)
  } finally {
    forgotLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center relative">
    <background />

    <div class="z-10 p-8 bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl w-[380px]">

      <!-- LOADING ADMIN CHECK -->
      <template v-if="checkingAdmin">
        <div class="text-white text-center text-lg py-4">Loading...</div>
      </template>

      <!-- SETUP ADMIN FORM -->
      <template v-else-if="showSetup">

        <h2 class="text-2xl font-semibold text-center text-white mb-6">
          Setup Admin Account
        </h2>

        <form @submit.prevent="handleSetup" class="space-y-4">

          <!-- Admin Name -->
          <input v-model="name"
                 type="text"
                 placeholder="Admin Name"
                 class="w-full p-3 rounded bg-white/80 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-400" />

          <!-- Password -->
          <div class="relative">
            <input :type="passwordVisible ? 'text' : 'password'"
                   v-model="password"
                   placeholder="Password"
                   class="w-full p-3 rounded bg-white/80 text-gray-900 focus:ring-2 focus:ring-green-400" />

            <button type="button"
                    @click="passwordVisible = !passwordVisible"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
              {{ passwordVisible ? '🙈' : '👁' }}
            </button>
          </div>

          <button class="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
            Create Admin
          </button>

        </form>

      </template>

      <!-- LOGIN FORM -->
      <template v-else-if="!showForgot">

        <h2 class="text-2xl font-semibold text-center text-white mb-6">
         To Login
        </h2>

        <form @submit.prevent="handleLogin" class="space-y-4">

          <!-- Role dropdown only if admin exists -->
          <select v-model="loginRole"
                  class="w-full p-3 rounded bg-white/80 text-gray-900"
          >
            <option value="admin">Admin</option>
            <option value="cashier">Cashier</option>
          </select>

          <!-- Username -->
          <input v-model="name"
                 type="text"
                 placeholder="Name"
                 class="w-full p-3 rounded bg-white/80 text-gray-900" />

          <!-- Password w/ toggle -->
          <div class="relative">
            <input
              :type="passwordVisible ? 'text' : 'password'"
              v-model="password"
              placeholder="Password"
              class="w-full p-3 rounded bg-white/80 text-gray-900"
            />
            <button type="button"
                    @click="passwordVisible = !passwordVisible"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600">
              {{ passwordVisible ? '🙈' : '👁' }}
            </button>
          </div>

          <button :disabled="loading"
                  class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400">
            {{ loading ? 'Processing...' : 'Login' }}
          </button>

          <p class="text-center text-white underline cursor-pointer"
             @click="showForgot = true">
            Forgot Password?
          </p>

        </form>
      </template>

      <!-- FORGOT PASSWORD SCREEN -->
      <template v-else>

        <h2 class="text-2xl font-semibold text-center text-white mb-6">
          Reset Password
        </h2>

        <form @submit.prevent="handleForgotPassword" class="space-y-4">

          <input v-model="forgotName"
                 type="text"
                 placeholder="Existing Username"
                 class="w-full p-3 rounded bg-white/80 text-gray-900" />

          <input v-model="forgotNewPassword"
                 type="password"
                 placeholder="New Password"
                 class="w-full p-3 rounded bg-white/80 text-gray-900" />

          <button :disabled="forgotLoading"
                  class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:bg-gray-400">
            {{ forgotLoading ? 'Updating...' : 'Reset Password' }}
          </button>

          <p class="text-center text-white underline cursor-pointer"
             @click="showForgot = false">
            Back to Login
          </p>

        </form>

      </template>

    </div>
  </div>
</template>
