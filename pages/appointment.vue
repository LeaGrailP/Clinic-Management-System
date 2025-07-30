<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '~/composables/useUser'

// Appointment Form Logic
const form = ref({
  patient: '',
  datetime: '',
  reason: ''
})

const appointments = ref([])

function scheduleAppointment() {
  appointments.value.push({ ...form.value })
  form.value = { patient: '', datetime: '', reason: '' }
  alert('Appointment scheduled!')
}

// Calendar Logic
const today = new Date()
const selectedDate = ref(today)
const currentMonth = ref(today.getMonth())
const currentYear = ref(today.getFullYear())

const daysInMonth = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1).getDay()
  const numDays = new Date(year, month + 1, 0).getDate()

  return Array.from({ length: firstDay + numDays }, (_, i) =>
    i < firstDay ? null : new Date(year, month, i - firstDay + 1)
  )
})

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const selectedAppointments = computed(() =>
  appointments.value.filter(appt =>
    new Date(appt.datetime).toDateString() === selectedDate.value.toDateString()
  )
)
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <h1 class="text-3xl font-bold mb-6">Schedule Appointment</h1>

    <!-- Appointment Form -->
    <form @submit.prevent="scheduleAppointment" class="bg-white p-6 rounded shadow max-w-lg space-y-4">
      <div>
        <label class="block text-sm font-medium">Patient Name</label>
        <input v-model="form.patient" type="text" required class="w-full p-2 border rounded" />
      </div>

      <div>
        <label class="block text-sm font-medium">Date & Time</label>
        <input v-model="form.datetime" type="datetime-local" required class="w-full p-2 border rounded" />
      </div>

      <div>
        <label class="block text-sm font-medium">Reason</label>
        <textarea v-model="form.reason" class="w-full p-2 border rounded" />
      </div>

      <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        Schedule Appointment
      </button>
    </form>

    <!-- Custom Calendar -->
    <div class="mt-10">
      <div class="flex justify-between items-center mb-4">
        <button @click="prevMonth" class="px-3 py-1 bg-gray-300 rounded">‹</button>
        <h2 class="text-xl font-bold">
          {{ new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }) }}
          {{ currentYear }}
        </h2>
        <button @click="nextMonth" class="px-3 py-1 bg-gray-300 rounded">›</button>
      </div>

      <div class="grid grid-cols-7 gap-2 bg-white p-4 rounded shadow">
        <div class="text-center font-bold" v-for="day in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']" :key="day">
          {{ day }}
        </div>

        <div
          v-for="(day, index) in daysInMonth"
          :key="index"
          @click="() => day && (selectedDate = day)"
          :class="[
            'h-20 p-1 border rounded cursor-pointer text-center',
            {
              'bg-blue-200': day && day.toDateString() === selectedDate.toDateString(),
              'text-gray-400': !day,
              'hover:bg-blue-100': day
            }
          ]"
        >
          <div v-if="day">{{ day.getDate() }}</div>
          <div
            v-if="day && appointments.some(a => new Date(a.datetime).toDateString() === day.toDateString())"
            class="mt-1 text-xs text-blue-600"
          >
            ●
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Date Appointments -->
    <div v-if="selectedAppointments.length" class="mt-8 bg-white p-6 rounded shadow max-w-2xl">
      <h3 class="text-lg font-bold mb-4">
        Appointments for {{ selectedDate.toLocaleDateString() }}
      </h3>
      <div v-for="(appt, i) in selectedAppointments" :key="i" class="border-b py-2">
        <p><strong>Patient:</strong> {{ appt.patient }}</p>
        <p><strong>Time:</strong> {{ new Date(appt.datetime).toLocaleTimeString() }}</p>
        <p><strong>Reason:</strong> {{ appt.reason }}</p>
      </div>
    </div>
  </div>
</template>
