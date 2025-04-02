<template>
  <v-container class="login-container">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="pa-6 login-card">
          <v-card-title class="text-center mb-6">
            <h2 class="text-h4">Iniciar Sesión</h2>
          </v-card-title>
          
          <v-form @submit.prevent="handleLogin" ref="loginForm">
            <v-text-field
              v-model="email"
              label="Correo Electrónico"
              type="email"
              required
              :rules="emailRules"
              outlined
              class="mb-4"
              @keyup.enter="handleLogin"
            ></v-text-field>
            
            <v-text-field
              v-model="password"
              label="Contraseña"
              type="password"
              required
              :rules="passwordRules"
              outlined
              class="mb-4"
              @keyup.enter="handleLogin"
            ></v-text-field>
            
            <v-checkbox
              v-model="rememberMe"
              label="Recordar mi contraseña"
              class="mb-6"
            ></v-checkbox>
            
            <v-btn
              type="submit"
              color="primary"
              block
              size="large"
              :loading="loading"
              :disabled="loading"
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
      rememberMe: false,
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
  created() {
    // Limpiar cualquier autenticación previa al cargar el login
    this.clearAuthData();
    
    // Eliminar event listeners previos
    window.removeEventListener('beforeunload', this.clearAuthData);
    
    // Si hay token pero no está verificado, limpiarlo
    if (localStorage.getItem('authToken')) {
      this.verifyToken();
    }
  },
  methods: {
    async handleLogin() {
      if (!this.$refs.loginForm.validate()) {
        return;
      }

      this.loading = true;
      try {
        const response = await fetch('http://localhost:3100/api/auth/login', { // Auth service
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password,
            rememberMe: this.rememberMe
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.msg || 'Credenciales incorrectas');
        }

        // Guardar datos de autenticación
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('tokenExpiry', Date.now() + data.expiresIn * 1000);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Configurar evento para cerrar sesión al cerrar pestaña si no recordar
        if (!this.rememberMe) {
          window.addEventListener('beforeunload', this.clearAuthData);
        }

        this.showSnackbar('Inicio de sesión exitoso', 'success');
        
        // Redirigir al home después de 1 segundo
        setTimeout(() => {
          this.$router.push({ name: 'Home' });
        }, 1000);
        
      } catch (error) {
        this.showSnackbar(error.message || 'Error al iniciar sesión', 'error');
        console.error('Error en login:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async verifyToken() {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:3100/api/auth/check', { // Auth service
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Token inválido');
        }
        
        // Si el token es válido, redirigir al home
        this.$router.push({ name: 'Home' });
      } catch (error) {
        this.clearAuthData();
      }
    },
    
    clearAuthData() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiry');
      localStorage.removeItem('user');
    },
    
    showSnackbar(message, color = 'error') {
      this.snackbar = {
        show: true,
        message,
        color
      };
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