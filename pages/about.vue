<template>

    <div>
<NuxtLink to="/dashboard" class="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg">Back to dashboard</NuxtLink>
    </div>
    
  <div class="min-h-screen bg-gray-50 text-gray-800">
    <!-- Hero Section -->
    <section class="bg-white py-16 px-6 md:px-12 text-center shadow">
      <h1 class="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
      <p class="text-lg md:text-xl max-w-2xl mx-auto text-gray-600">
        We’re on a mission to create meaningful digital experiences through thoughtful design and cutting-edge technology.
      </p>
    </section>

    <!-- Our Story -->
    <section class="py-16 px-6 md:px-12">
      <div class="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <img src="https://plus.unsplash.com/premium_photo-1744229997432-83b7efa3b70e?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHwyNXx8fGVufDB8fHx8fA%3D%3D" alt="Our story" class="rounded-xl shadow-md" />
        <div>
          <h2 class="text-3xl font-semibold mb-4">Our Story</h2>
          <p class="text-gray-600 mb-4">
            Started in a ..............................................................................................
          </p>
          <p class="text-gray-600">
            From humble beginnings to working with global clients, we continue to value creativity, collaboration, and community.
          </p>
        </div>
      </div>
    </section>

    <!-- Team Section -->
    <section class="bg-white py-16 px-6 md:px-12">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-semibold">Meet the Team</h2>
        <p class="text-gray-600 mt-2">The heart and brains behind the magic.</p>
      </div>
      <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        <div v-for="person in team" :key="person.name" class="bg-gray-100 p-6 rounded-xl text-center shadow">
          <img :src="person.image" :alt="person.name" class="w-24 h-24 mx-auto rounded-full mb-4 object-cover" />
          <h3 class="text-lg font-bold">{{ person.name }}</h3>
          <p class="text-sm text-gray-500">{{ person.role }}</p>
         
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const team = [
  {
    name: 'Li_Yumzz',
    role: 'Full Stack Developer',
    image: 'https://plus.unsplash.com/premium_photo-1688045802023-60a42a082776?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c3VuZmxvd2VyfGVufDB8fDB8fHww',
  },
  {
    name: 'Chillah_Lah',
    role: 'Full Stack Developer',
    image: 'https://plus.unsplash.com/premium_photo-1688045802023-60a42a082776?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8c3VuZmxvd2VyfGVufDB8fDB8fHww',
  }
]
</script>
