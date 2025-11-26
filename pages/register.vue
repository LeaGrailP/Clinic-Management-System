<script setup>
import { ref } from 'vue'

definePageMeta({
  middleware: ['auth'],
  requiresAdmin: true
})

const name = ref('')
const password = ref('')
const role = ref('cashier') // ✅ automatically assign cashier role

async function handleRegister() {
  try {
    const result = await window.electronAPI.register({
      name: name.value,
      password: password.value,
      role: role.value, // now always 'cashier'
      currentUser: { role: 'admin' } // ensure only admin can register
    })

    if (result.success) {
      alert('✅ Cashier registered successfully!')
      // clear form
      name.value = ''
      password.value = ''
    } else {
      alert('❌ ' + result.error)
    }
  } catch (err) {
    console.error('Register error:', err)
    alert('❌ Registration failed: ' + err.message)
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-800 py-12 px-6">
    <div class="max-w-xl mx-auto dark:bg-slate-600 bg-sky-200 shadow rounded-lg p-8 text-slate-800 dark:text-slate-100">
    <h2 class="text-2xl font-bold mb-6 text-center">Register New Cashier</h2>
    <form @submit.prevent="handleRegister" class="flex flex-col gap-4">
      <input
        v-model="name"
        type="text"
        placeholder="Name"
        class="border p-2 rounded"
        required
      />
      <input
        v-model="password"
        type="password"
        placeholder="Password"
        class="border p-2 rounded"
        required
      />

      <input v-model="role" type="hidden" />

      <button
        type="submit"
        class="bg-sky-400  py-2 rounded hover:bg-sky-600 transition"
      >
        Register Cashier
      </button>
    </form>
  </div>
  </div>
</template>
