

<script setup>
  // ----Register with edit----
import { ref, onMounted } from 'vue'

definePageMeta({
  middleware: ['auth'],
  requiresAdmin: true
})

// --- Form fields ---
const name = ref('')
const password = ref('')

// --- Accounts list ---
const accounts = ref([])
const loading = ref(false)

// --- Edit state ---
const editingId = ref(null)
const editName = ref('')
const editPassword = ref('')

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
    const result = await window.electronAPI['auth:register']({
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

function startEdit(account) {
  editingId.value = account.id
  editName.value = account.name
  editPassword.value = ''
}

async function saveEdit() {
  if (!editName.value) return alert('Name cannot be empty!')

  try {
    const oldName = accounts.value.find(a => a.id === editingId.value).name

    if (editName.value !== oldName) {
      const res = await window.electronAPI['user:updateName']({
        oldName,
        newName: editName.value
      })
      if (!res.success) return alert('Failed to update name')
    }

    if (editPassword.value) {
      const res = await window.electronAPI['auth:register']({
        name: editName.value,
        password: editPassword.value,
        role: 'cashier'
      })
      if (!res.success) return alert('Failed to update password')
    }

    editingId.value = null
    editName.value = ''
    editPassword.value = ''
    fetchAccounts()
  } catch (err) {
    console.error(err)
    alert('❌ Update failed')
  }
}

async function deleteAccount(id) {
  if (!confirm('Are you sure you want to delete this account?')) return

  try {
    const res = await window.electronAPI.deleteAccount(id)
    if (res.success) {
      alert('Account deleted ✅')
      fetchAccounts()
    } else {
      alert('Failed to delete account')
    }
  } catch (err) {
    console.error(err)
    alert('❌ Deletion failed')
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
        <input 
          v-model="name" 
          type="text" 
          placeholder="Name" 
          class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-sky-600 transition"
          required 
        />
        <input 
          v-model="password" 
          type="password" 
          placeholder="Password" 
          class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 rounded focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-sky-600 transition"
          required 
        />
        <button 
          type="submit" 
          :disabled="loading" 
          class="bg-sky-400 dark:bg-sky-600 text-white py-2 rounded hover:bg-sky-500 dark:hover:bg-sky-700 transition"
        >
          {{ loading ? 'Registering...' : 'Register Cashier' }}
        </button>
      </form>

      <h3 class="text-xl font-semibold mb-4">Accounts</h3>
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <div 
          v-for="account in accounts" 
          :key="account.id" 
          class="p-3 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-between transition-colors duration-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          
          <div class="flex-1">
            <div v-if="editingId !== account.id">
              <strong>{{ account.name }}</strong> 
              <span class="text-sm text-gray-600 dark:text-gray-300">({{ account.role }})</span>
            </div>

            <div v-else class="flex gap-2">
              <input 
                v-model="editName" 
                type="text" 
                placeholder="New Name" 
                class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-1 rounded w-24 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-sky-600 transition"
              />
              <input 
                v-model="editPassword" 
                type="password" 
                placeholder="New Password" 
                class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-1 rounded w-28 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:focus:ring-sky-600 transition"
              />
            </div>
          </div>

          <div class="flex gap-2">
            <button 
              v-if="editingId !== account.id" 
              @click="startEdit(account)" 
              class="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Edit
            </button>
            <button 
              v-else 
              @click="saveEdit" 
              class="text-green-600 dark:text-green-400 hover:underline"
            >
              Save
            </button>
            <button 
              @click="deleteAccount(account.id)" 
              class="text-red-600 dark:text-red-400 hover:underline"
            >
              Delete
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
