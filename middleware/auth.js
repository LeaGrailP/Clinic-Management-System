
export default defineNuxtRouteMiddleware((to) => {
  const user = useState<any>('user')

  if (!user.value && to.path !== '/login' && to.path !== '/register') {
    return navigateTo('/login')
  }

  if (to.meta.requiresAdmin && user.value?.role !== 'admin') {
    return navigateTo('/unauthorized')
  }

  if (to.meta.requiresStaff && user.value?.role !== 'cashier') {
    return navigateTo('/unauthorized')
  }
})

