<template>
  <div class="p-6">
    <button
      @click="openModal()"
      class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
    >
      New Patient
    </button>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center">
      <div class="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 class="text-xl font-semibold mb-4">{{ isEdit ? 'Edit Patient' : 'New Patient' }}</h2>
        <form @submit.prevent="savePatient">
          <input v-model="patient.patientname" type="text" class="mb-2 w-full border px-3 py-2 rounded" placeholder="Name" />
          <input v-model="patient.address" type="text" class="mb-2 w-full border px-3 py-2 rounded" placeholder="Address" />
          <input v-model="patient.number" type="text" class="mb-2 w-full border px-3 py-2 rounded" placeholder="Number" />
          <input v-model="patient.business" type="text" class="mb-2 w-full border px-3 py-2 rounded" placeholder="Business Style" />
          <input v-model="patient.tin" type="text" class="mb-4 w-full border px-3 py-2 rounded" placeholder="TIN" />

          <div class="flex justify-end space-x-2">
            <button type="button" @click="closeModal" class="px-4 py-2 rounded border">Cancel</button>
            <button type="submit" class="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Table -->
    <div class="mt-6">
      <h2 class="text-lg font-bold mb-2">Patients</h2>
      <table class="w-full text-left border">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-2">Name</th>
            <th class="p-2">Address</th>
            <th class="p-2">Number</th>
            <th class="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in patients" :key="p.id">
            <td class="p-2">{{ p.patientname }}</td>
            <td class="p-2">{{ p.address }}</td>
            <td class="p-2">{{ p.number }}</td>
            <td class="p-2 space-x-2">
              <button @click="openModal(p)" class="text-blue-600">Edit</button>
              <button @click="deletePatient(p.id)" class="text-red-600">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showModal = ref(false)
const isEdit = ref(false)
const patients = ref([])
const patient = ref({
  id: null,
  patientname: '',
  address: '',
  number: '',
  business: '',
  tin: ''
})

function openModal(data = null) {
  if (data) {
    isEdit.value = true
    patient.value = { ...data }
  } else {
    isEdit.value = false
    patient.value = {
      id: null,
      patientname: '',
      address: '',
      number: '',
      business: '',
      tin: ''
    }
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function fetchPatients() {
  const result = await window.electron.invoke('get-patients')
  patients.value = result || []
}

async function savePatient() {
  if (isEdit.value) {
    await window.electron.invoke('update-patient', { ...patient.value})
  } else {
    await window.electron.invoke('add-patient', { ...patient.value })
  }
  closeModal()
  fetchPatients()
}

async function deletePatient(id) {
  if (confirm('Are you sure you want to delete this patient?')) {
    await window.electron.invoke('delete-patient', id)
    fetchPatients()
  }
}

onMounted(fetchPatients)
</script>
