<template>
  <div class="min-h-screen flex items-center justify-center">
    <background />
    <div class="z-10 p-8 bg-white bg-opacity-10 backdrop-blur-md rounded-lg shadow-lg w-full max-w-md">
      <h1 class="text-3xl font-bold text-center text-white mb-6">Create an Account</h1>

      <form @submit.prevent="register">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-white mb-1">Full Name</label>
            <input v-model="name" type="text" placeholder="Juan De la Cruz" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div> 
          <div>
            <label class="block text-sm font-medium text-white mb-1">Username</label>
            <input v-model="email" type="text" placeholder="cashier@example.com" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-white mb-1">Role</label>
            <select v-model="role" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none">
            <option disabled value="">Select role</option>
            <option value="admin">Admin</option>
            <option value="cashier">Cashier</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-white mb-1">Password</label>
            <input v-model="password" type="password" placeholder="••••••••" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-white mb-1">Confirm Password</label>
            <input v-model="confirmPassword" type="password" placeholder="••••••••" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none" />
          </div>

          <button type="submit" class="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">
            Sign Up
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import background from '~/components/background.vue'
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUser } from '~/composables/useUser'

const route = useRoute() 

definePageMeta({
  layout: 'default'
})

const name = ref('')
const email = ref('')
const role = ref('')
const password = ref('')
const confirmPassword = ref('')

const router = useRouter()
const { isAdmin } = useUser()

onMounted(() => {
  if (!isAdmin.value) {
    alert('Access denied. Admins only.');
    router.push('/');
  }
});

const register = async () => {
  if (!name.value.trim()) {
    alert("Full Name is required");
    return;
  }

  if (!role.value) {
    alert("Please select a role");
    return;
  }

  if (password.value !== confirmPassword.value) {
    alert("Passwords do not match!");
    return;
  }

  const result = await window.auth.register({
    name: name.value,
    username: email.value,
    password: password.value,
    role: role.value,
  });

  if (result.success) {
    alert("Account created!");
    router.push('/dashboard');
  } else {
    alert(result.error || "Registration failed.");
  }
};
</script>