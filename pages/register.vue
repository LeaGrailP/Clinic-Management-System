<script setup>
import { ref } from 'vue'

const name = ref('')
const password = ref('')
const role = ref('') // or whatever role you want

async function handleRegister() {
  try {
    const result = await window.electronAPI.register({
      name: name.value,
      password: password.value,
      role: role.value,
      currentUser: { role: 'admin' } // make sure only admin can create others
    })

    if (result.success) {
      alert('✅ User registered successfully')
    } else {
      alert('❌ ' + result.error)
    }
  } catch (err) {
    console.error('Register error:', err)
  }
}
</script>

<template>
  <div class="p-6 max-w-md mx-auto">
    <h2 class="text-xl font-bold mb-4">Register New Account</h2>
    <form @submit.prevent="handleRegister" class="flex flex-col gap-4">
      <input v-model="name" type="text" placeholder="Name" class="border p-2 rounded" />
      <input v-model="password" type="password" placeholder="Password" class="border p-2 rounded" />
      <button type="submit" class="bg-blue-500 text-white py-2 rounded">Register</button>
    </form>
  </div>
</template>
