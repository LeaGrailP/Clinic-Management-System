<template>
  <div class="login-wrapper">
    <!-- Left Side -->
    <div class="left-side">
      <h1>ACCOUNTING<br />SYSTEM<br />PROJECT</h1>
    </div>

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
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      name: '',
      password: ''
    };
  },
  methods: {
    login() {
      // Placeholder logic
      alert(`Logging in as ${this.name}`);
    }
  }
};
</script>

<style scoped>
.login-wrapper {
  display: flex;
  height: 100vh;
  font-family: sans-serif;
}

.left-side {
  flex: 1;
  background-color: #801336; /* Maroon */
  color: #fbd3e9;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.left-side h1 {
  font-size: 2.5rem;
  font-weight: bold;
  line-height: 1.5;
}

.right-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #fff;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background-color: #ffd6ec;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
}

.avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background-color: #fcbce2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

h2 {
  margin-bottom: 0.5rem;
}

.small-text {
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

.link {
  color: #333;
  text-decoration: underline;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  text-align: left;
}

input {
  padding: 0.5rem;
  border-radius: 5px;
  border: 1px solid #ccc;
}

.forgot {
  text-align: right;
}

.login-button {
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
