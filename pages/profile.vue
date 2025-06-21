chack if this is correct since it doesnt enter the data

<script setup>
import { ref, onMounted } from 'vue'

const name = ref('')
const age = ref('')
const address = ref('')
const users = ref([])

const fetchUsers = async () => {
  users.value = await window.electron.getUsers()
}

const addUser = async () => {
  await window.electron.addUser({
    name: name.value,
    address: address.value,
    age: parseInt(age.value)
  })

  name.value = ''
  address.value = ''
  age.value = ''
  fetchUsers()
}

onMounted(fetchUsers)
</script>

<template>
  <div class="p-8 max-w-xl mx-auto">

    <<NuxtLink to="/user">Client Input</NuxtLink>
    <h1 class="text-2xl font-bold mb-4">User List</h1>

    <div class="flex flex-col gap-2 mb-4">
      <input v-model="name" placeholder="Name" class="border px-3 py-2 rounded" />
      <input v-model="address" placeholder="Address" class="border px-3 py-2 rounded" />
      <input v-model="age" placeholder="Age" type="number" class="border px-3 py-2 rounded" />
      <button @click="addUser" class="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
    </div>

    <ul class="space-y-1">
      <li v-for="user in users" :key="user.id" class="bg-gray-100 p-2 rounded">
        {{ user.id }}. {{ user.name }}. {{ user.address }} {{ user.age }}
      </li>
    </ul>
  </div>
</template>
