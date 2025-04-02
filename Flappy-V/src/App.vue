<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  created() {
    this.verifyInitialAuth();
  },
  methods: {
    async verifyInitialAuth() {
      const token = localStorage.getItem('authToken');
      const tokenExpiry = localStorage.getItem('tokenExpiry');
      
      // Si no hay token o está expirado, limpiar y redirigir
      if (!token || (tokenExpiry && Date.now() > tokenExpiry)) {
        this.clearAuthData();
        if (this.$route.meta.requiresAuth) {
          this.$router.push('/');
        }
        return;
      }
      
      // Si estamos en login/register pero hay token válido, redirigir a home
      if ((this.$route.name === 'Login' || this.$route.name === 'Register') && token) {
        try {
          const response = await fetch('http://localhost:3100/api/auth/check', { // Auth service
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            this.$router.push('/home');
          }
        } catch (error) {
          this.clearAuthData();
        }
      }
    },
    clearAuthData() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('user');
    }
  }
}
</script>