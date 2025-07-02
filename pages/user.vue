<!-- pages/input.vue -->
<template>
  <div class="p-4">
    <input v-model="name" type="text" placeholder="Enter Name" class="border p-2" />
    <button @click="submit" class="bg-blue-500 text-white px-4 py-2 ml-2">Save</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const name = ref('')

const submit = async () => {
  try {
    await window.electron.invoke('add-user', { name: name.value })
    alert('Saved to DB!')
  } catch (err) {
    console.error('Error saving:', err)
  }
}
</script>
