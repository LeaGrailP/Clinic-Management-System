<template>

    <<NuxtLink to="/profile">Back to Profile</NuxtLink>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center p-6">
    <form
      @submit.prevent="submitForm"
      class="bg-white shadow-xl rounded-2xl p-8 w-full max-w-2xl space-y-6"
    >
      <h2 class="text-2xl font-bold text-gray-800 text-center">Edit Profile</h2>

      <!-- Image Upload -->
      <div class="flex flex-col items-center">
        <img
          v-if="previewImage"
          :src="previewImage"
          alt="Profile Preview"
          class="w-32 h-32 rounded-full object-cover mb-4"
        />
        <input type="file" @change="handleImage" class="text-sm" accept="image/*" />
      </div>

      <!-- Form Fields -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input v-model="form.name" type="text" class="input" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
          <input v-model="form.mobile" type="tel" class="input" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Age</label>
          <input v-model="form.age" type="number" class="input" min="0" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <div class="flex space-x-4">
            <label class="inline-flex items-center">
              <input v-model="form.gender" type="radio" value="Male" class="mr-1" />
              Male
            </label>
            <label class="inline-flex items-center">
              <input v-model="form.gender" type="radio" value="Female" class="mr-1" />
              Female
            </label>
            <label class="inline-flex items-center">
              <input v-model="form.gender" type="radio" value="Other" class="mr-1" />
              Other
            </label>
          </div>
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea v-model="form.address" class="input" rows="3" required></textarea>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="text-center">
        <button type="submit" class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition">
          Save Profile
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const form = ref({
  name: '',
  mobile: '',
  age: '',
  gender: '',
  address: '',
  image: null,
})

const previewImage = ref(null)

const handleImage = (e) => {
  const file = e.target.files[0]
  if (file) {
    form.value.image = file
    previewImage.value = URL.createObjectURL(file)
  }
}

const submitForm = () => {
  console.log('Submitted form data:', form.value)
  // TODO: Handle form data (e.g., send to backend or store)
}
</script>

<style scoped>
.input {
  @apply w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500;
}
</style>
