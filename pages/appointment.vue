<template>
  <div class="min-h-screen p-8 bg-gray-50">
    <h1 class="text-3xl font-bold mb-6">Schedule Appointment</h1>

    <!-- Appointment Form -->
    <form @submit.prevent="scheduleAppointment" class="space-y-4 bg-white p-6 rounded-lg shadow-md max-w-lg">
      <div>
        <label class="block text-sm font-medium">Patient Name</label>
        <input v-model="form.patient" type="text" required placeholder="e.g., Maria Santos"
               class="w-full px-4 py-2 border rounded" />
      </div>

      <div>
        <label class="block text-sm font-medium">Date & Time</label>
        <input v-model="form.datetime" type="datetime-local" required
               class="w-full px-4 py-2 border rounded" />
      </div>

      <div>
        <label class="block text-sm font-medium">Reason</label>
        <textarea v-model="form.reason" placeholder="Reason for appointment"
                  class="w-full px-4 py-2 border rounded"></textarea>
      </div>

      <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        Schedule Appointment
      </button>
    </form>

    <!-- Calendar View -->
    <div class="mt-10">
      <h2 class="text-xl font-semibold mb-4">Appointment Calendar</h2>
      <v-calendar
        is-expanded
        :attributes="calendarAttributes"
        @dayclick="onDayClick"
        class="max-w-3xl bg-white rounded-lg shadow p-4"
      />
    </div>

    <!-- Selected Date Appointments -->
    <div v-if="selectedAppointments.length" class="mt-6 bg-white p-4 rounded shadow max-w-2xl">
      <h3 class="text-lg font-bold mb-2">Appointments for {{ formatDate(selectedDate) }}</h3>
      <div v-for="(appt, index) in selectedAppointments" :key="index" class="border-b py-2">
        <p><strong>Patient:</strong> {{ appt.patient }}</p>
        <p><strong>Time:</strong> {{ new Date(appt.datetime).toLocaleTimeString() }}</p>
        <p><strong>Reason:</strong> {{ appt.reason }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUser } from '~/composables/useUser'
import { setupCalendar } from 'v-calendar'

const { role } = useUser()
const router = useRouter()

onMounted(() => {
  if (!['admin', 'cashier'].includes(role.value)) {
    alert("Access denied.")
    router.push('/')
  }
})

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

const selectedDate = ref(null)
const selectedAppointments = computed(() => {
  if (!selectedDate.value) return []
  return appointments.value.filter(appt =>
    new Date(appt.datetime).toDateString() === new Date(selectedDate.value).toDateString()
  )
})

function onDayClick(day) {
  selectedDate.value = day.date
}

const calendarAttributes = computed(() => {
  return appointments.value.map(appt => ({
    key: appt.datetime,
    dates: new Date(appt.datetime),
    dot: { color: 'blue' },
    popover: {
      label: `${appt.patient} at ${new Date(appt.datetime).toLocaleTimeString()}`
    }
  }))
})

function formatDate(date) {
  return new Date(date).toLocaleDateString()
}
</script>