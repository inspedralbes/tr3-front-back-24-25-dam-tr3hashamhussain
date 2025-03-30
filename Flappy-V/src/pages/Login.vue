<template>
    <v-container class="login-container">
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6" lg="4">
          <v-card class="pa-6 login-card">
            <v-card-title class="text-center mb-6">
              <h2 class="text-h4">Iniciar Sesión</h2>
            </v-card-title>
            
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                label="Correo Electrónico"
                type="email"
                required
                :rules="emailRules"
                outlined
                class="mb-4"
              ></v-text-field>
              
              <v-text-field
                v-model="password"
                label="Contraseña"
                type="password"
                required
                :rules="passwordRules"
                outlined
                class="mb-6"
              ></v-text-field>
              
              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="loading"
              >
                Iniciar Sesión
              </v-btn>
              
              <div class="text-center mt-4">
                <p>¿No tienes una cuenta? <router-link to="/register">Regístrate</router-link></p>
              </div>
            </v-form>
          </v-card>
        </v-col>
      </v-row>
      
      <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
        {{ snackbar.message }}
        <template v-slot:actions>
          <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
        </template>
      </v-snackbar>
    </v-container>
  </template>
  
  <script>
  export default {
    data() {
      return {
        email: '',
        password: '',
        loading: false,
        snackbar: {
          show: false,
          message: '',
          color: 'error'
        },
        emailRules: [
          v => !!v || 'El correo es requerido',
          v => /.+@.+\..+/.test(v) || 'El correo debe ser válido'
        ],
        passwordRules: [
          v => !!v || 'La contraseña es requerida',
          v => v.length >= 6 || 'La contraseña debe tener al menos 6 caracteres'
        ]
      };
    },
    methods: {
  async handleLogin() {
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email,
          password: this.password
        })
      })

      if (!response.ok) {
        throw new Error('Credenciales incorrectas')
      }

      const { token } = await response.json()
      localStorage.setItem('authToken', token)
      
      // Redirige a la página home
      this.$router.push({ name: 'Home' })
      
    } catch (error) {
      console.error('Error en login:', error)
      this.errorMessage = error.message || 'Error al iniciar sesión'
    }
  }
}
  };
  </script>
  
  <style scoped>
  .login-container {
    height: 100vh;
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
  
  .login-card {
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    background: rgba(30, 30, 30, 0.9);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .text-h4 {
    color: #ffffff;
  }
  
  a {
    color: #42a5f5;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
  </style>