import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'

export default defineNuxtRouteMiddleware((to) => {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  if (!token) {
    return navigateTo('/login')
  }

  if (to.meta.requiresAdmin && role !== 'admin') {
    return navigateTo('/unauthorized')
  }

  if (to.meta.requiresStaff && role !== 'cashier') {
    return navigateTo('/unauthorized')
  }
})