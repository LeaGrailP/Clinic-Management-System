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
            <th class="px-5 py-3 text-left font-medium">Name</th>
            <th class="px-5 py-3 text-left font-medium">Phone</th>
            <th class="px-5 py-3 text-left font-medium">Senior</th>
            <th class="px-5 py-3 text-left font-medium">PWD</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>

        <tbody>
          <template v-for="patient in clinicpatients" :key="patient.id">
            <!-- Main Row -->
            <tr
              class="border-b hover:bg-sky-200 cursor-pointer transition"
              @click="toggleExpand(patient.id)"
              :aria-expanded="expandedPatients.has(patient.id)"
            >
              <td class="px-5 py-3 font-medium">
                {{ patient.firstName }} {{ patient.lastName }}
              </td>
              <td class="px-5 py-3">{{ patient.phone }}</td>
              <td class="px-5 py-3">{{ patient.isSenior ? "Yes" : "No" }}</td>
              <td class="px-5 py-3">{{ patient.isPWD ? "Yes" : "No" }}</td>
              <td class="px-5 py-3 text-right text-slate-400">
                <span
                  class="inline-block transition-transform"
                  :class="{ 'rotate-180': expandedPatients.has(patient.id) }"
                >
                  ▼
                </span>
              </td>
            </tr>

            <!-- Expanded Row -->
            <tr v-show="expandedPatients.has(patient.id)" class="bg-slate-50 dark:bg-slate-800">
              <td colspan="5" class="px-6 py-5">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-sm">Middle Name</p>
                    <p class="font-medium">{{ patient.middleName || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-sm">Address</p>
                    <p class="font-medium">{{ patient.address }}</p>
                  </div>
                  <div>
                    <p class="text-sm">Business Style</p>
                    <p class="font-medium">{{ patient.businessStyle || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-sm">TIN</p>
                    <p class="font-medium">{{ patient.tin || '-' }}</p>
                  </div>
                  <div>
                    <p class="text-sm">Senior ID</p>
                    <p class="font-medium">
                      {{ patient.isSenior ? patient.seniorId : '-' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-sm">PWD ID</p>
                    <p class="font-medium">
                      {{ patient.isPWD ? patient.pwdId : '-' }}
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <!-- Empty State -->
          <tr v-if="clinicpatients.length === 0">
            <td colspan="5" class="text-center py-6">No patient records yet.</td>
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
