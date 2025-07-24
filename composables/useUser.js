import { ref, computed } from 'vue'

const user = ref(null)

export function useUser() {
  if (process.client && user.value === null) {
    try {
      const stored = localStorage.getItem('user')
      user.value = stored ? JSON.parse(stored) : null
    } catch (e) {
      console.warn('Invalid user data in localStorage')
      user.value = null
    }
  }

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function logout() {
    localStorage.removeItem('user')
    user.value = null
  }

  return {
    user,
    isLoggedIn,
    isAdmin,
    logout
  }
}