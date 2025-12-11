<template>
  <div class="p-6 min-h-screen">
    <!-- Add Patient Button -->
    <button
      @click="showModal = true"
      class="bg-sky-600 hover:bg-sky-700 text-slate-50 px-4 py-2 rounded mb-6"
    >
      ADD NEW PATIENT
    </button>

    <!-- Patients Table -->
    <div class="bg-slate-50 dark:bg-slate-600 border border-gray-400 text-slate-800 dark:text-slate-100 p-4 rounded shadow">
      <table class="w-full">
        <thead class="bg-slate-400 border-gray-400">
  <tr>
    <th class="px-5 py-3 text-left font-medium">First Name</th>
    <th class="px-5 py-3 text-left font-medium">Middle Name</th>
    <th class="px-5 py-3 text-left font-medium">Last Name</th>
    <th class="px-5 py-3 text-left font-medium">Phone</th>
    <th class="px-5 py-3 text-left font-medium">Business Style</th>
    <th class="px-5 py-3 text-left font-medium">TIN</th>
    <th class="px-5 py-3 text-left font-medium">   </th>
    <th class="px-5 py-3"></th>
  </tr>
</thead>


       <tbody>
  <template v-for="patient in clinicpatients" :key="patient.id">
    <!-- MAIN ROW -->
    <tr
      class="border-b hover:bg-sky-200 cursor-pointer transition"
      @click="toggleExpand(patient.id)"
      :aria-expanded="expandedPatients.has(patient.id)"
    >
      <td class="px-5 py-3">{{ patient.firstName }}</td>
      <td class="px-5 py-3">{{ patient.middleName || '-' }}</td>
      <td class="px-5 py-3">{{ patient.lastName }}</td>
      <td class="px-5 py-3">{{ patient.phone }}</td>
      <td class="px-5 py-3">{{ patient.businessStyle || '-' }}</td>
      <td class="px-5 py-3">{{ patient.tin || '-' }}</td>

      <!-- ACTIONS -->
      <td class="px-5 py-3 flex gap-2">
        <button
          @click.stop="confirmDelete(patient.id)"
          class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete
        </button>
      </td>

      <!-- DROPDOWN ARROW -->
      <td class="px-5 py-3 text-right text-slate-400">
        <span
          class="inline-block transition-transform"
          :class="{ 'rotate-180': expandedPatients.has(patient.id) }"
        >
          ▼
        </span>
      </td>
    </tr>

    <!-- EXPANDED ROW -->
    <tr v-show="expandedPatients.has(patient.id)" class="bg-slate-50 dark:bg-slate-800">
      <td colspan="8" class="px-6 py-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm">Address</p>
            <p class="font-medium">{{ patient.address }}</p>
          </div>
          <div>
            <p class="text-sm">Senior ID</p>
            <p class="font-medium">{{ patient.isSenior ? patient.seniorId : '-' }}</p>
          </div>
          <div>
            <p class="text-sm">PWD ID</p>
            <p class="font-medium">{{ patient.isPWD ? patient.pwdId : '-' }}</p>
          </div>
        </div>
      </td>
    </tr>
  </template>

  <!-- EMPTY STATE -->
  <tr v-if="clinicpatients.length === 0">
    <td colspan="8" class="text-center py-6">No patient records yet.</td>
  </tr>
</tbody>

      </table>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 flex items-center justify-center bg-slate-200 bg-opacity-50"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="bg-slate-50 dark:bg-slate-600 text-slate-800 dark:text-slate-100 p-6 rounded-md shadow-md w-full max-w-3xl relative"
      >
        <button
          @click="showModal = false"
          class="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✖
        </button>

        <h2 class="text-lg font-semibold mb-4">Add New Patient</h2>

        <form @submit.prevent="submitForm" class="grid grid-cols-3 gap-4">
          <!-- Name Fields -->
          <div>
            <label class="block text-sm font-medium mb-1">First Name</label>
            <input v-model="form.firstName" type="text" placeholder="Michael" class="input-field" required />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Last Name</label>
            <input v-model="form.lastName" type="text" placeholder="Johnson" class="input-field" required />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Middle Name</label>
            <input v-model="form.middleName" type="text" placeholder="(Optional)" class="input-field" />
          </div>

          <!-- Address, Phone, Business, TIN -->
          <div>
            <label class="block text-sm font-medium mb-1">Address</label>
            <input v-model="form.address" type="text" placeholder="Baguio City" class="input-field" required />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Phone</label>
            <input v-model="form.phone" type="text" placeholder="09234567890" class="input-field" required />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Business Style</label>
            <input v-model="form.businessStyle" type="text" placeholder="Retail" class="input-field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">TIN</label>
            <input v-model="form.tin" type="text" placeholder="1234 1234 1234" class="input-field" />
          </div>

          <!-- Senior Checkbox -->
          <div class="col-span-3 flex items-center mt-2">
            <input v-model="form.isSenior" type="checkbox" id="senior" class="mr-2" />
            <label for="senior" class="text-sm">Senior</label>
          </div>

          <div v-if="form.isSenior" class="col-span-3">
            <label class="block text-sm font-medium mb-1">Senior ID Number</label>
            <input
              v-model="form.seniorId"
              type="text"
              placeholder="Enter Senior ID Number"
              :required="form.isSenior"
              class="input-field"
            />
          </div>

          <!-- PWD Checkbox -->
          <div class="col-span-3 flex items-center mt-2">
            <input v-model="form.isPWD" type="checkbox" id="pwd" class="mr-2" />
            <label for="pwd" class="text-sm">PWD</label>
          </div>

          <div v-if="form.isPWD" class="col-span-3">
            <label class="block text-sm font-medium mb-1">PWD ID Number</label>
            <input
              v-model="form.pwdId"
              type="text"
              placeholder="Enter PWD ID Number"
              :required="form.isPWD"
              class="input-field"
            />
          </div>

          <!-- Buttons -->
          <div class="col-span-3 mt-6 flex items-center space-x-4">
            <button type="submit" class="bg-orange-400 hover:bg-orange-600 text-slate-50 px-4 py-2 rounded">
              Save Patient
            </button>
            <button type="button" @click="showModal = false" class="bg-sky-400 hover:bg-sky-600 text-slate-50 px-4 py-2 rounded">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    <!-- DELETE WITH MASTER PIN -->
<div
  v-if="showDeleteModal"
  class="fixed inset-0 bg-black/50 flex items-center justify-center"
>
  <div class="bg-white p-6 rounded shadow w-80 relative">
    <h2 class="text-lg font-semibold mb-4">Enter Master PIN</h2>

    <input type="password" v-model="masterPinInput" maxlength="6"
      class="input-field mb-4" placeholder="6-digit PIN"/>

    <div class="flex justify-end space-x-2">
      <button class="px-3 py-2 bg-gray-400 text-white rounded"
        @click="showDeleteModal = false">
        Cancel
      </button>

      <button class="px-3 py-2 bg-red-600 text-white rounded"
        @click="deletePatient">
        Confirm Delete
      </button>
    </div>
  </div>
</div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
definePageMeta({ layout: 'default' })

const showModal = ref(false)

const initialForm = {
  firstName: '',
  lastName: '',
  middleName: '',
  address: '',
  phone: '',
  businessStyle: '',
  tin: '',
  isSenior: false,
  seniorId: '',
  isPWD: false,
  pwdId: ''
}
const form = ref({ ...initialForm })

const clinicpatients = ref([])
const expandedPatients = ref(new Set())
const showDeleteModal = ref(false)
const patientToDelete = ref(null)
const masterPinInput = ref("")


function confirmDelete(id) {
  patientToDelete.value = id
  masterPinInput.value = ""
  showDeleteModal.value = true
}

async function deletePatient() {
  if (!/^[0-9]{6}$/.test(masterPinInput.value)) {
    return alert("Master PIN must be 6 digits.")
  }

  const result = await window.electron.invoke("secure-delete-patient", {
    id: patientToDelete.value,
    pin: masterPinInput.value
  })

  if (!result.success) {
    alert(result.error)
    return
  }

  showDeleteModal.value = false
  await fetchClinicpatients()
}


async function fetchClinicpatients() {
  clinicpatients.value = await window.electron.invoke('get-patients')
}

function toggleExpand(id) {
  if (expandedPatients.value.has(id)) {
    expandedPatients.value.delete(id)
  } else {
    expandedPatients.value.add(id)
  }
}

async function submitForm() {
  try {
    await window.electron.invoke('add-patient', { ...form.value })
    await fetchClinicpatients()
    form.value = { ...initialForm }
    showModal.value = false
  } catch (err) {
    console.error('Error adding patient:', err)
  }
}

onMounted(fetchClinicpatients)
</script>

<style scoped>
.input-field {
  width: 100%;
  background-color: var(--tw-bg-opacity, #f8fafc);
  border: 1px solid #9ca3af;
  border-radius: 0.375rem;
  padding: 0.5rem 0.75rem;
  outline: none;
}
.input-field:focus {
  ring: 2px solid #0ea5e9;
}
</style>
