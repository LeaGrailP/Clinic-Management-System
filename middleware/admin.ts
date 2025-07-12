import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'

export default defineNuxtRouteMiddleware(() => {
  const role = localStorage.getItem('role')

  // Only allow admin
  if (role !== 'admin') {
    return navigateTo('/unauthorized') // You should create this page
  }
})