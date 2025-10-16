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
  <div class="p-6 max-w-md mx-auto">
    <h2 class="text-xl font-bold mb-4">Register New Cashier</h2>
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

      <!-- Hidden field for clarity, optional -->
      <input v-model="role" type="hidden" />

      <button
        type="submit"
        class="bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
      >
        Register Cashier
      </button>
    </form>
  </div>
</template>
