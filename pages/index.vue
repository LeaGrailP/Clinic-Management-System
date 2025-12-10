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

// visibility toggles
const setupPasswordVisible = ref(false)
const loginPasswordVisible = ref(false)

// PIN
const masterPin = ref('')
const forgotPin = ref('')

// Forgot password
const forgotName = ref('')
const forgotNewPassword = ref('')
const forgotLoading = ref(false)
const loading = ref(false)

// Username change
const changeName = ref(false)
const forgotNewName = ref('')

// UI mode
const currentView = ref('checking')

// user state
const user = useState('user', () => null)

// ================= CHECK ADMIN ====================
onMounted(async () => {
  try {
    const exists = await window.electronAPI.checkAdmin()
    currentView.value = exists ? 'login' : 'setup'
  } catch (err) {
    console.error(err)
    currentView.value = 'setup'
  }
})

function resetFields() {
  name.value = ''
  password.value = ''
  masterPin.value = ''
}

// =============== PIN VALIDATION ====================
function pinIsValid(pin) {
  return /^[0-9]{6}$/.test(pin)
}

// =============== SETUP ADMIN ========================
async function handleSetup() {
  if (!name.value || !password.value)
    return alert("Please enter admin name and password.")

  if (!pinIsValid(masterPin.value))
    return alert("PIN must be exactly 6 digits.")

  try {
    const result = await window.electronAPI.createAdmin({
      name: name.value,
      password: password.value,
      pin: masterPin.value
    })

    if (result?.success) {
      alert('Admin account created!\n⚠ IMPORTANT: Remember your master PIN!')
      resetFields()
      currentView.value = 'login'
    } else {
      alert(result?.error || 'Failed to create admin.')
    }
  } catch (err) {
    console.error(err)
    alert("An error occurred.")
  }
}

// ================= LOGIN ============================
async function handleLogin() {
  if (!name.value || !password.value)
    return alert("Please enter your name and password.")

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

      user.value = { name: result.name, role: result.role }

      router.push('/dashboard')
    } else {
      alert(result?.error || 'Login failed.')
    }
  } catch (err) {
    console.error(err)
    alert("An error occurred.")
  } finally {
    loading.value = false
  }
}

// ================= FORGOT PASSWORD ===================
// Modal state
const pinModalOpen = ref(false)
const pinInput = ref('')

// Open modal
function openPinModal() {
  pinInput.value = forgotPin.value
  pinModalOpen.value = true
}

// Confirm PIN modal and submit
async function submitForgotPassword() {
  forgotPin.value = pinInput.value
  pinModalOpen.value = false
  await handleForgotPassword()
}

// Main handler
async function handleForgotPassword() {
  if (!forgotName.value || !forgotPin.value)
    return alert("Please enter the username and master PIN.")

  if (!pinIsValid(forgotPin.value))
    return alert("Master PIN must be exactly 6 digits.")

  // Prevent users from modifying themselves
  if (forgotName.value === user.value?.name)
    return alert("You cannot modify your own credentials. Ask another admin.")

  if (!forgotNewPassword.value)
    return alert("Please enter the new password.")

  if (changeName.value && !forgotNewName.value)
    return alert("Please enter a new username.")

  forgotLoading.value = true
  try {
    const result = await window.electronAPI.resetPassword({
      name: forgotName.value,
      newPassword: forgotNewPassword.value,
      newName: changeName.value ? forgotNewName.value : null,
      pin: forgotPin.value
    })

    if (!result?.success)
      return alert(result.error || "Update failed.")

    alert("Changes applied successfully!")

    forgotName.value = ''
    forgotNewPassword.value = ''
    forgotNewName.value = ''
    forgotPin.value = ''
    changeName.value = false
    currentView.value = 'login'

  } catch (err) {
    console.error(err)
    alert("An error occurred.")
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

      <!-- SETUP ADMIN -->
      <template v-else-if="currentView === 'setup'">
        <h2 class="text-2xl font-semibold text-center text-white mb-6">
          Setup Admin Account
        </h2>

        <p class="text-yellow-300 text-sm mb-4 text-center">
          ⚠ Please remember your Master PIN. You cannot recover it.
        </p>

        <form @submit.prevent="handleSetup" class="space-y-4">

          <input v-model="name" type="text" placeholder="Admin Name"
            class="w-full p-3 rounded bg-white/80 text-gray-900" />

          <div class="relative">
            <input 
              v-model="password"
              :type="setupPasswordVisible ? 'text' : 'password'" 
              placeholder="Admin Password"
              class="w-full p-3 rounded bg-white/80 text-gray-900"
            />
            <button 
              type="button"
              @click="setupPasswordVisible = !setupPasswordVisible"
              class="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <component :is="setupPasswordVisible ? EyeOff : Eye" class="w-5 h-5 text-black" />
            </button>
          </div>

          <input v-model="masterPin" type="password" maxlength="6"
            placeholder="Master PIN (6 digits)"
            class="w-full p-3 rounded bg-white/80 text-gray-900" />

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
            <input
              v-model="password"
              :type="loginPasswordVisible ? 'text' : 'password'"
              placeholder="Password"
              class="w-full p-3 rounded bg-white/80 text-gray-900"
            />
            <button 
              type="button"
              @click="loginPasswordVisible = !loginPasswordVisible"
              class="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <component :is="loginPasswordVisible ? EyeOff : Eye" class="w-5 h-5 text-black" />
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

      <!-- FORGOT PASSWORD -->
      <template v-else-if="currentView === 'forgot'">
        <h2 class="text-2xl font-semibold text-center text-white mb-6">
          Reset Password
        </h2>

        <form @submit.prevent="openPinModal" class="space-y-4">

          <input v-model="forgotName" type="text"
            placeholder="Existing Username"
            class="w-full p-3 rounded bg-white/80 text-gray-900" />

          <input v-model="forgotNewPassword" type="password"
            placeholder="New Password"
            class="w-full p-3 rounded bg-white/80 text-gray-900" />

          <!-- CHANGE USERNAME OPTION -->
          <div class="flex items-center gap-2 text-white mt-2">
            <input type="checkbox" v-model="changeName" />
            <label>Change username?</label>
          </div>

          <input v-if="changeName"
            v-model="forgotNewName"
            type="text"
            placeholder="New Username"
            class="w-full p-3 rounded bg-white/80 text-gray-900" />

          <!-- PIN BUTTON -->
          <button type="button"
            class="w-full p-3 rounded bg-white/20 text-white hover:bg-white/30"
            @click="openPinModal">
            Enter Master PIN
          </button>

          <button :disabled="forgotLoading"
            class="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:bg-gray-400">
            {{ forgotLoading ? 'Updating...' : 'Save' }}
          </button>

          <p class="text-center text-white underline cursor-pointer"
            @click="currentView = 'login'">
            Back to Login
          </p>

        </form>
      </template>

    </div>

    <!-- PIN POPUP MODAL -->
    <div v-if="pinModalOpen"
      class="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[999]">

      <div class="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-2xl w-[320px] text-white">
        
        <h3 class="text-xl font-semibold mb-4 text-center">
          Enter Master PIN
        </h3>

        <input
          v-model="pinInput"
          type="password"
          maxlength="6"
          placeholder="6-digit PIN"
          class="w-full p-3 mb-4 rounded bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div class="flex gap-3">
          <button class="flex-1 bg-gray-500/50 hover:bg-gray-600/70 py-2 rounded text-white font-medium transition"
            @click="pinModalOpen = false">
            Cancel
          </button>

          <button class="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded text-white font-medium transition"
            @click="submitForgotPassword">
            Confirm
          </button>
        </div>

      </div>
    </div>

  </div>
</template>
