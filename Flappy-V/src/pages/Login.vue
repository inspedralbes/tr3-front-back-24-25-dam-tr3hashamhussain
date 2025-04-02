<template>
  <v-container class="login-container">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="pa-6 login-card">
          <v-card-title class="text-center mb-6">
            <h2 class="text-h4">Iniciar Sessió</h2>
          </v-card-title>
          
          <v-form @submit.prevent="handleLogin" ref="loginForm">
            <v-text-field
              v-model="email"
              label="Correu Electrònic"
              type="email"
              required
              :rules="emailRules"
              outlined
              class="mb-4"
              @keyup.enter="handleLogin"
            ></v-text-field>
            
            <v-text-field
              v-model="password"
              label="Contrasenya"
              type="password"
              required
              :rules="passwordRules"
              outlined
              class="mb-4"
              @keyup.enter="handleLogin"
            ></v-text-field>
            
            <v-checkbox
              v-model="rememberMe"
              label="Recorda la meva contrasenya"
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
              Iniciar Sessió
            </v-btn>
            
            <div class="text-center mt-4">
              <p>No tens un compte? <router-link to="/register">Registra't</router-link></p>
            </div>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
    
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Tancar</v-btn>
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
        v => !!v || 'El correu és requerit',
        v => /.+@.+\..+/.test(v) || 'El correu ha de ser vàlid'
      ],
      passwordRules: [
        v => !!v || 'La contrasenya és requerida',
        v => v.length >= 6 || 'La contrasenya ha de tenir almenys 6 caràcters'
      ]
    };
  },
  created() {
    // Netejar qualsevol autenticació prèvia en carregar la pàgina de login
    this.clearAuthData();
    
    // Eliminar event listeners previs
    window.removeEventListener('beforeunload', this.clearAuthData);
    
    // Si hi ha un token però no està verificat, eliminar-lo
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
        const response = await fetch('http://localhost:3100/api/auth/login', { // Servei d'autenticació
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
          throw new Error(data.msg || 'Credencials incorrectes');
        }

        // Guardar dades d'autenticació
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('tokenExpiry', Date.now() + data.expiresIn * 1000);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Configurar esdeveniment per tancar sessió en tancar la pestanya si no es recorda
        if (!this.rememberMe) {
          window.addEventListener('beforeunload', this.clearAuthData);
        }

        this.showSnackbar('Sessió iniciada amb èxit', 'success');
        
        // Redirigir a la pàgina principal després d'1 segon
        setTimeout(() => {
          this.$router.push({ name: 'Home' });
        }, 1000);
        
      } catch (error) {
        this.showSnackbar(error.message || 'Error en iniciar sessió', 'error');
        console.error('Error en el login:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async verifyToken() {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:3100/api/auth/check', { // Servei d'autenticació
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Token invàlid');
        }
        
        // Si el token és vàlid, redirigir a la pàgina principal
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
