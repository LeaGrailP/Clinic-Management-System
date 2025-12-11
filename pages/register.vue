<script setup>
import { ref, onMounted, computed } from 'vue'

definePageMeta({
  middleware: ['auth'],
  requiresAdmin: true
})

const name = ref('')
const password = ref('')
const accounts = ref([])
const loading = ref(false)

const showPinModal = ref(false)
const pin = ref('')
const accountToDelete = ref(null)

// Filter out admin accounts
const nonAdminAccounts = computed(() => accounts.value.filter(a => a.role !== 'admin'))

// ------------------- METHODS -------------------
async function fetchAccounts() {
  try {
    accounts.value = await window.electronAPI.getAccounts()
  } catch (err) {
    console.error('Failed to fetch accounts:', err)
  }
}

async function handleRegister() {
  if (!name.value || !password.value) return alert('Enter name & password!')
  loading.value = true
  try {
    const result = await window.electronAPI.register({
  name: name.value,
  password: password.value,
  role: 'cashier'
})

    if (result.success) {
      alert('✅ Cashier registered successfully!')
      name.value = ''
      password.value = ''
      fetchAccounts()
    } else {
      alert('❌ ' + result.error)
    }
  } catch (err) {
    console.error(err)
    alert('❌ Registration failed')
  } finally {
    loading.value = false
  }
}

function confirmDelete(account) {
  accountToDelete.value = account
  pin.value = ''
  showPinModal.value = true
}

async function deleteAccount() {
  if (!pin.value) return alert('Enter master PIN!')

  try {
    const res = await window.electronAPI.deleteAccount({ id: accountToDelete.value.id, pin: pin.value })
    if (res.success) {
      alert('Account deleted ✅')
      fetchAccounts()
    } else {
      alert('❌ ' + res.error)
    }
  } catch (err) {
    console.error(err)
    alert('❌ Deletion failed')
  } finally {
    showPinModal.value = false
  }
}

// ------------------- LIFECYCLE -------------------
onMounted(() => {
  fetchAccounts()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-6 transition-colors duration-300">
    <div class="max-w-xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      <h2 class="text-2xl font-bold mb-6 text-center">Register New Cashier</h2>
      <form @submit.prevent="handleRegister" class="flex flex-col gap-4 mb-6">
        <input v-model="name" type="text" placeholder="Name" class="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
        <input v-model="password" type="password" placeholder="Password" class="border p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" required />
        <button type="submit" :disabled="loading" class="bg-sky-400 dark:bg-sky-600 text-white py-2 rounded hover:bg-sky-500 dark:hover:bg-sky-700 transition">
          {{ loading ? 'Registering...' : 'Register Cashier' }}
        </button>
      </form>

      <h3 class="text-xl font-semibold mb-4">Accounts</h3>
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <div v-for="account in nonAdminAccounts" :key="account.id" class="p-3 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-between transition-colors duration-300 hover:bg-gray-200 dark:hover:bg-gray-600">
          <div>
            <strong>{{ account.name }}</strong> 
            <span class="text-sm text-gray-600 dark:text-gray-300">({{ account.role }})</span>
          </div>

          <button @click="confirmDelete(account)" class="text-red-600 dark:text-red-400 hover:underline">
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Master PIN Modal -->
    <div v-if="showPinModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-80">
        <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Enter Master PIN</h3>
        <input v-model="pin" type="password" placeholder="Master PIN" class="w-full border p-2 rounded mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100" />
        <div class="flex justify-end gap-2">
          <button @click="showPinModal = false" class="px-3 py-1 rounded bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 transition">Cancel</button>
          <button @click="deleteAccount" class="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
