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
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('authToken');
  const tokenExpiry = localStorage.getItem('tokenExpiry');
  
  // Limpiar datos si el token expiró
  if (token && tokenExpiry && Date.now() > tokenExpiry) {
    clearAuthData();
    return next('/');
  }

  // Si la ruta no requiere autenticación, continuar
  if (!to.meta.requiresAuth) {
    return next();
  }

  // Si no hay token, redirigir al login
  if (!token) {
    return next('/');
  }

  // Verificar token con el servidor
  try {
    const response = await fetch('http://localhost:3100/api/auth/check', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Token inválido');
    }

    // Token válido, continuar
    return next();
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    clearAuthData();
    return next('/');
  }
});

function clearAuthData() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('tokenExpiry');
  localStorage.removeItem('user');
}

export default router;