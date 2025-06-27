<template>
  <div class="p-6 max-w-2xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">User Registration</h1>

    <form @submit.prevent="addUser" class="space-y-4">
      <input v-model="user.name" type="text" placeholder="Name" class="input" required />
      <input v-model="user.address" type="text" placeholder="Address" class="input" />
      <input v-model.number="user.age" type="number" placeholder="Age" class="input" />
      <input v-model="user.contact" type="text" placeholder="Contact Number" class="input" />
      <select v-model="user.gender" class="input" required>
        <option disabled value="">Select Gender</option>
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
      <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add User</button>
    </form>

    <div class="mt-8">
      <h1 class="text-xl font-semibold mb-2">User List</h1>
      <div class="divide-y border rounded">
        <h2 v-for="u in users" :key="u.id" class="p-2">
          <p>Name: {{ u.name }}</p>
          <p>Age: {{ u.age }}</p>
          <p>Address: {{ u.address }}</p>
          <p>Gender: {{ u.gender }}</p>
          <p>Contact Number: {{ u.contact }}</p>
        </h2>
      </div>
    </div>
  </div>
</template>

<script setup>

const user = reactive({
  name: '',
  address: '',
  age: null,
  contact: '',
  gender: ''
})

const users = ref([])

async function addUser() {
  const res = await window.api.addUser({ ...user });
  if (res.success) {
    await fetchUsers()
    Object.assign(user, { name: '', address: '', age: null, contact: '', gender: '' })
  } else {
    console.error('Add user failed:', res.error)
  }
}

async function fetchUsers() {
users.value = await window.api.getUsers();
}

onMounted(fetchUsers)
</script>

<style scoped>
.input {
  @apply border border-gray-300 rounded px-3 py-2 w-full;
}
</style>
