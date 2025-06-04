<template>
  
    <!-- Right Side -->
    <div class="right-side">
      <div class="login-box">
        <div class="avatar">
          <span class="icon">👤</span>
        </div>
        <h2>LOG IN</h2>
        <p class="small-text">
          Don’t have an account?
          <NuxtLink to="/register" class="link">Create Now</NuxtLink>
        </p>

        <form @submit.prevent="login">
          <label>Name</label>
          <input v-model="name" type="text" required />

          <label>Password</label>
          <input v-model="password" type="password" required />

          <div class="forgot">
            <NuxtLink to="/forgot-password" class="link">Forgot Password?</NuxtLink>
          </div>

          <button type="submit" class="login-button">LOG IN</button>
        </form>
              <div class="dashboard">
            <NuxtLink to="/dashboard" class="dashboard">dashboard</NuxtLink>
          </div>
      </div>

    </div>
</template>

<script>
import SystemInformation from '@/components/SystemInformation.vue'

export default {
  name: 'IndexPage',
  components: {
    SystemInformation
  },
  data () {
    return {
      externalContent: ''
    }
  },
  methods: {
    openURL (url) {
      window.open(url)
    }
  }
}
</script>

<style>
.e-nuxt-container {
  min-height: calc(100vh - 50px);
  background: linear-gradient(to right, #ece9e6, #ffffff);
  font-family: Helvetica, sans-serif;
}

.e-nuxt-content {
  display: flex;
  justify-content: space-around;
  padding-top: 100px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.e-nuxt-logo{
  width: 400px;
}

.e-nuxt-system-info {
  padding: 20px;
  border-top: 1px solid #397c6d;
  border-bottom: 1px solid #397c6d;
}

.e-nuxt-links {
  padding: 100px 0;
  display: flex;
  justify-content: center;
}

.e-nuxt-button {
  color: #364758;
  padding: 5px 20px;
  border: 1px solid #397c6d;
  margin: 0 20px;
  border-radius: 15px;
  font-size: 1rem;
}

.e-nuxt-button:hover{
  cursor: pointer;
  color: white;
  background-color: #397c6d;
}

.dashboard {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #1f8a4c;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.dashboard {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #1f8a4c;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
</style>
