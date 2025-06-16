<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-3xl font-bold">Patients List</h1>
      <div class="flex space-x-2">
        <input v-model="search" type="text" placeholder="Search..." class="border px-3 py-2 rounded" />
        <DropdownMenu />
        <button @click="showModal = true" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Add Patient
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="min-w-full border rounded-lg">
        <thead class="bg-gray-100">
          <tr>
            <th class="px-4 py-2 text-left">Last Visit</th>
            <th class="px-4 py-2 text-left">Name</th>
            <th class="px-4 py-2 text-left">Business Style</th>
            <th class="px-4 py-2 text-left">Address</th>
            <th class="px-4 py-2 text-left">TIN</th>
            <th class="px-4 py-2 text-left">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(patient, index) in filteredPatients" :key="index" class="border-t">
            <td class="px-4 py-2">{{ patient.lastVisit }}</td>
            <td class="px-4 py-2">{{ patient.name }}</td>
            <td class="px-4 py-2">{{ patient.businessStyle }}</td>
            <td class="px-4 py-2">{{ patient.address }}</td>
            <td class="px-4 py-2">{{ patient.tin }}</td>
            <td class="px-4 py-2">
              <button @click="removePatient(index)" class="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Patient Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
      <div class="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 class="text-xl font-semibold mb-4">Add New Patient</h2>
        <form @submit.prevent="addPatient">
          <input v-model="newPatient.lastVisit" type="date" class="mb-2 w-full border px-3 py-2 rounded" placeholder="Last Visit Date" />
          <input v-model="newPatient.name" type="text" class="mb-2 w-full border px-3 py-2 rounded" placeholder="Name" />
          <input v-model="newPatient.businessStyle" type="text" class="mb-2 w-full border px-3 py-2 rounded" placeholder="Business Style" />
          <input v-model="newPatient.address" type="text" class="mb-2 w-full border px-3 py-2 rounded" placeholder="Address" />
          <input v-model="newPatient.tin" type="text" class="mb-4 w-full border px-3 py-2 rounded" placeholder="TIN" />

          <div class="flex justify-end space-x-2">
            <button type="button" @click="showModal = false" class="px-4 py-2 rounded border">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const search = ref('')
const showModal = ref(false)

const patients = ref([
  {
    lastVisit: '2025-06-15',
    name: 'John Doe',
    businessStyle: 'Retail',
    address: '123 Market St.',
    tin: '123-456-789'
  },
])

const newPatient = ref({
  lastVisit: '',
  name: '',
  businessStyle: '',
  address: '',
  tin: ''
})

const addPatient = () => {
  if (newPatient.value.name.trim()) {
    patients.value.push({ ...newPatient.value })
    newPatient.value = { lastVisit: '', name: '', businessStyle: '', address: '', tin: '' }
    showModal.value = false
  }
}

const removePatient = (index) => {
  patients.value.splice(index, 1)
}

const filteredPatients = computed(() => {
  return patients.value.filter(p =>
    p.name.toLowerCase().includes(search.value.toLowerCase()) ||
    p.businessStyle.toLowerCase().includes(search.value.toLowerCase())
  )
})
</script>

<!-- Dropdown component for file downloads -->
<script>
export default {
  components: {
    DropdownMenu: {
      template: `
        <div class="relative">
          <button class="border px-3 py-2 rounded bg-gray-200 hover:bg-gray-300">Download As</button>
          <div class="absolute bg-white shadow-md mt-1 rounded border w-32 z-10">
            <a href="#" class="block px-4 py-2 hover:bg-gray-100">PDF</a>
            <a href="#" class="block px-4 py-2 hover:bg-gray-100">TXT</a>
            <a href="#" class="block px-4 py-2 hover:bg-gray-100">DOC</a>
          </div>
        </div>
      `
    }
  }
}
</script>

<style scoped>
/* Optional: Position dropdown absolutely */
.relative:hover > div.absolute {
  display: block;
}
div.absolute {
  display: none;
}
</style>
