<template>
  <div class="p-6 bg-gray-100 min-h-screen">
    <!-- Page Title -->
    <h1 class="text-2xl font-bold mb-4">Patient Records</h1>

    <!-- Add Patient Button -->
    <button
      @click="showModal = true"
      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mb-6"
    >
      Add New Patient
    </button>

    <!-- Patient Table -->
    <div class="bg-white shadow rounded-lg overflow-x-auto">
      <table class="w-full border-collapse">
        <thead class="bg-gray-200">
          <tr>
            <th class="px-4 py-2 text-left">First Name</th>
            <th class="px-4 py-2 text-left">Last Name</th>
            <th class="px-4 py-2 text-left">Middle Name</th>
            <th class="px-4 py-2 text-left">Address</th>
            <th class="px-4 py-2 text-left">Phone</th>
            <th class="px-4 py-2 text-left">Business Style</th>
            <th class="px-4 py-2 text-left">TIN</th>
            <th class="px-4 py-2 text-left">Senior</th>
            <th class="px-4 py-2 text-left">Senior ID Number</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(clinicPT, index) in clinicpatients"
            :key="index"
            class="border-b"
          >
            <td class="px-4 py-2">{{ clinicPT.firstName }}</td>
            <td class="px-4 py-2">{{ clinicPT.lastName }}</td>
            <td class="px-4 py-2">{{ clinicPT.middleName }}</td>
            <td class="px-4 py-2">{{ clinicPT.address }}</td>
            <td class="px-4 py-2">{{ clinicPT.phone }}</td>
            <td class="px-4 py-2">{{ clinicPT.businessStyle }}</td>
            <td class="px-4 py-2">{{ clinicPT.tin }}</td>
            <td class="px-4 py-2">{{ clinicPT.isSenior ? "Yes" : "No" }}</td>
            <td class="px-4 py-2">
              {{ clinicPT.isSenior ? clinicPT.seniorIdNumber : "-" }}
            </td>
          </tr>
          <tr v-if="clinicpatients.length === 0">
            <td colspan="9" class="text-center py-4 text-gray-500">
              No patient records yet.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div
        class="bg-white p-6 rounded-md shadow-md w-full max-w-3xl relative"
      >
        <!-- Close Button -->
        <button
          @click="showModal = false"
          class="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          ✖
        </button>

        <h2 class="text-lg font-semibold mb-4">Add New Patient</h2>

        <form @submit.prevent="submitForm" class="grid grid-cols-3 gap-4">
          <!-- First Name -->
          <div>
            <label class="block text-sm font-medium mb-1">First Name</label>
            <input
              v-model="form.firstName"
              type="text"
              placeholder="Michael"
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <!-- Last Name -->
          <div>
            <label class="block text-sm font-medium mb-1">Last Name</label>
            <input
              v-model="form.lastName"
              type="text"
              placeholder="Johnson"
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <!-- Middle Name -->
          <div>
            <label class="block text-sm font-medium mb-1">Middle Name</label>
            <input
              v-model="form.middleName"
              type="text"
              placeholder="(Optional)"
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Address -->
          <div>
            <label class="block text-sm font-medium mb-1">Address</label>
            <input
              v-model="form.address"
              type="text"
              placeholder="Baguio City"
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-sm font-medium mb-1">Phone</label>
            <input
              v-model="form.phone"
              type="text"
              placeholder="09234567890"
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <!-- Business Style -->
          <div>
            <label class="block text-sm font-medium mb-1">Business Style</label>
            <input
              v-model="form.businessStyle"
              type="text"
              placeholder="Retail"
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- TIN -->
          <div>
            <label class="block text-sm font-medium mb-1">TIN</label>
            <input
              v-model="form.tin"
              type="text"
              placeholder="1234 1234 1234"
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Senior Checkbox -->
          <div class="col-span-3 flex items-center mt-2">
            <input
              v-model="form.isSenior"
              type="checkbox"
              id="senior"
              class="mr-2"
            />
            <label for="senior" class="text-sm">Senior</label>
          </div>

          <!-- Senior ID Number -->
          <div v-if="form.isSenior" class="col-span-3">
            <label class="block text-sm font-medium mb-1"
              >Senior ID Number</label
            >
            <input
              v-model="form.seniorIdNumber"
              type="text"
              placeholder="Enter Senior ID Number"
              :required="form.isSenior"
              class="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- Buttons -->
          <div class="col-span-3 mt-6 flex items-center space-x-4">
            <button
              type="submit"
              class="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded"
            >
              Save Patient
            </button>
            <button
              type="button"
              @click="showModal = false"
              class="text-blue-600 hover:underline"
            >
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

const showModal = ref(false) // 👈 this fixes the error

const form = ref({
  firstName: '',
  lastName: '',
  middleName: '',
  address: '',
  phone: '',
  businessStyle: '',
  tin: '',
  isSenior: false,
  seniorIdNumber: ''
})

const clinicpatients = ref([])

async function fetchPatients() {
  clinicpatients.value = await window.patientAPI.get()
}

async function submitForm() {
  try {
    const plainData = JSON.parse(JSON.stringify(form.value)) // strip reactivity
    await window.patientAPI.add(plainData)
    await fetchPatients()
    form.value = {
      firstName: '',
      lastName: '',
      middleName: '',
      address: '',
      phone: '',
      businessStyle: '',
      tin: '',
      isSenior: false,
      seniorIdNumber: ''
    }
    showModal.value = false
  } catch (err) {
    console.error('Error adding patient:', err)
  }
}


onMounted(() => {
  fetchPatients()
})
</script>



