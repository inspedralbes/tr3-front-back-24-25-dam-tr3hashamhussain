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
    // Redirige al home si ya está autenticado al cargar la app
    if (localStorage.getItem('authToken') && this.$route.name === 'Login') {
      this.$router.push({ name: 'Home' })
    }
  }
}
</script>