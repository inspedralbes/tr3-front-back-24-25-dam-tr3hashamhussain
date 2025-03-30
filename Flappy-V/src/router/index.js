import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: () => import('@/pages/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/pages/index.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/pages/Register.vue'),
    meta: { requiresAuth: false }
  },
  // Ruta comodín para manejar todas las rutas no definidas
  {
    path: '/:pathMatch(.*)*',
    redirect: () => {
      return localStorage.getItem('authToken') ? '/home' : '/'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('authToken')
  
  // Si la ruta requiere autenticación y no está autenticado
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/') // Redirige al login (que ahora es la ruta '/')
  }
  
  // Si está autenticado y trata de acceder a login/register
  if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
    return next('/home') // Redirige al home
  }
  
  next()
})

export default router