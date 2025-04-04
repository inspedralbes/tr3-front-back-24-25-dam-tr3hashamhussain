<template>
  <v-container class="register-container">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="pa-6 register-card">
          <v-card-title class="text-center mb-6">
            <h2 class="text-h4">Registre</h2>
          </v-card-title>
          
          <v-form @submit.prevent="handleRegister">
            <v-text-field
              v-model="firstName"
              label="Nom"
              required
              :rules="nameRules"
              outlined
              class="mb-4"
            ></v-text-field>
            
            <v-text-field
              v-model="lastName"
              label="Cognom"
              required
              :rules="nameRules"
              outlined
              class="mb-4"
            ></v-text-field>
            
            <v-text-field
              v-model="email"
              label="Correu Electrònic"
              type="email"
              required
              :rules="emailRules"
              outlined
              class="mb-4"
            ></v-text-field>
            
            <v-text-field
              v-model="password"
              label="Contrasenya"
              type="password"
              required
              :rules="passwordRules"
              outlined
              class="mb-4"
            ></v-text-field>
            
            <v-text-field
              v-model="confirmPassword"
              label="Confirma la Contrasenya"
              type="password"
              required
              :rules="confirmPasswordRules"
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
              Registrar-se
            </v-btn>
            
            <div class="text-center mt-4">
              <p>Ja tens un compte? <router-link to="/login">Inicia Sessió</router-link></p>
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
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      loading: false,
      snackbar: {
        show: false,
        message: '',
        color: 'error'
      },
      nameRules: [
        v => !!v || 'Aquest camp és requerit',
        v => v.length >= 2 || 'Ha de tenir almenys 2 caràcters'
      ],
      emailRules: [
        v => !!v || 'El correu és requerit',
        v => /.+@.+\..+/.test(v) || 'El correu ha de ser vàlid'
      ],
      passwordRules: [
        v => !!v || 'La contrasenya és requerida',
        v => v.length >= 6 || 'La contrasenya ha de tenir almenys 6 caràcters'
      ],
      confirmPasswordRules: [
        v => !!v || 'Confirma la teva contrasenya',
        v => v === this.password || 'Les contrasenyes no coincideixen'
      ]
    };
  },
  methods: {
    async handleRegister() {
      if (!this.firstName || !this.lastName || !this.email || !this.password || this.password !== this.confirmPassword) {
        return;
      }
      
      this.loading = true;
      
      try {
        const response = await fetch('http://localhost:3100/api/auth/register', { // Servei d'autenticació
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            password: this.password
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.errors?.[0]?.msg || data.msg || 'Error en registrar-se');
        }
        
        this.snackbar = {
          show: true,
          message: 'Registre completat! Redirigint...',
          color: 'success'
        };
        
        setTimeout(() => {
          this.$router.push('/login');
        }, 1500);
      } catch (error) {
        this.snackbar = {
          show: true,
          message: error.message,
          color: 'error'
        };
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.register-container {
  height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
}

.register-card {
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
