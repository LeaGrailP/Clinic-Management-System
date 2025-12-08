<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useState } from '#app'

const router = useRouter()

// Get logged-in user
const user = useState('user')

// Local ref for editing name
const newName = ref(user.value?.name || '')

// Loading state
const saving = ref(false)

// Save new name function
function saveName() {
  if (!newName.value.trim()) {
    alert('Name cannot be empty')
    return
  }

  saving.value = true
  try {
    // Update global state
    user.value.name = newName.value.trim()

    // Optional: persist to localStorage
    localStorage.setItem('name', newName.value.trim())

    alert('Name updated successfully!')
  } catch (err) {
    console.error('Failed to update name:', err)
    alert('Failed to update name')
  } finally {
    saving.value = false
  }
}

// Optional: go back button
function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/dashboard')
}
</script>

<template>
  <div class="p-4 mt-16 max-w-md mx-auto">
    <h1 class="text-2xl font-bold mb-4">Profile</h1>

    <div class="mb-4">
      <label class="block font-semibold mb-1">Name:</label>
      <input
        v-model="newName"
        type="text"
        class="border px-3 py-2 rounded w-full"
        placeholder="Enter your name"
      />
    </div>

    <div class="mb-4">
      <label class="block font-semibold mb-1">Role:</label>
      <p class="px-3 py-2 bg-gray-100 rounded">{{ user.value?.role || 'N/A' }}</p>
    </div>

    <div class="flex gap-2">
      <button
        @click="saveName"
        :disabled="saving"
        class="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
      <button @click="goBack" class="bg-gray-300 px-4 py-2 rounded">Back</button>
    </div>
  </div>
</template>
