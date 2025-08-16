<template>
  <div class="min-h-screen bg-gray-50 py-12 px-6">
    <div class="max-w-xl mx-auto bg-white shadow rounded-lg p-8">
      <h2 class="text-2xl font-bold mb-6 text-center">My Profile</h2>

      <!-- View Mode -->
      <div v-if="!isEditing">
        <p class="mb-4"><strong>Name:</strong> {{ user.name }}</p>
        <p class="mb-4"><strong>Role:</strong> {{ user.role }}</p>

        <div class="flex justify-between mt-6">
          <button @click="isEditing = true" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Edit
          </button>
          <button @click="confirmDelete" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Delete Account
          </button>
        </div>
      </div>

      <!-- Edit Form -->
      <form v-else @submit.prevent="saveChanges">
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Name</label>
          <input v-model="form.name" class="w-full border px-3 py-2 rounded" />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium mb-1">Password</label>
          <input type="password" v-model="form.password" class="w-full border px-3 py-2 rounded" />
        </div>

        <div class="flex justify-between mt-6">
          <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Save
          </button>
          <button type="button" @click="cancelEdit" class="bg-gray-300 text-gray-800 px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref({ name: '', role: '' })
const form = ref({ name: '', password: '' })
const isEditing = ref(false)

onMounted(() => {
  const stored = localStorage.getItem('user')
  if (stored) {
    const parsed = JSON.parse(stored)
    user.value = parsed
    form.value.name = parsed.name
  } else {
    router.push('/login')
  }
})

function saveChanges() {
  if (form.value.name.trim() === '') return alert('Name required')

  // 🔹 Here you would ideally call backend/electron to update DB
  user.value.name = form.value.name
  localStorage.setItem('user', JSON.stringify(user.value))

  isEditing.value = false
  alert('Profile updated!')
}

function cancelEdit() {
  form.value.name = user.value.name
  form.value.password = ''
  isEditing.value = false
}

function confirmDelete() {
  if (confirm('Are you sure you want to delete your account?')) {
    // 🔹 You could also trigger an IPC call here to delete from SQLite
    localStorage.removeItem('user')
    alert('Account deleted.')
    router.push('/login')
  }
}
</script>