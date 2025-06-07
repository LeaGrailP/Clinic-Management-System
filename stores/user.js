// stores/user.js
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    role: '',        // cashier or manager
    isLoggedIn: false
  }),
  actions: {
    login(role) {
      this.role = role
      this.isLoggedIn = true
    },
    logout() {
      this.role = ''
      this.isLoggedIn = false
    }
  }
})
