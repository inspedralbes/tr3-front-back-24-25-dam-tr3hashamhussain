<template>
  <v-container>
    <!-- Sección para subir imágenes -->
      <v-card-title class="primary white--text">
        <v-icon left>mdi-image</v-icon>
        Subir Imagen
      </v-card-title>
      <v-card-text>
        <v-file-input
          v-model="image"
          label="Selecciona una imagen"
          prepend-icon="mdi-camera"
          accept="image/*"
          @change="uploadImage"
          outlined
          clearable
        ></v-file-input>
        <v-alert v-if="message" :type="alertType" dense outlined>
          {{ message }}
        </v-alert>
      </v-card-text>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      image: null,
      message: '',
      alertType: 'info',
      loading: false
    };
  },
  methods: {
      async uploadImage() {
    if (!this.image) {
      this.message = 'Por favor, selecciona una imagen.';
      this.alertType = 'error';
      return;
    }
    
    this.loading = true;
    const formData = new FormData();
    formData.append('file', this.image);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await fetch('http://localhost:3200/images/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // No incluir 'Content-Type': el navegador lo establecerá automáticamente con el boundary
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la respuesta');
      }
      
      const data = await response.json();
      this.message = data.message || 'Imagen subida correctamente';
      this.alertType = 'success';
      this.$emit('image-uploaded', data);
      
    } catch (error) {
      this.message = error.message || 'Error al subir la imagen';
      this.alertType = 'error';
      console.error('Error al subir imagen:', error);
      
      // Redirigir a login si el token es inválido
      if (error.message.includes('Token') || error.message.includes('401')) {
        localStorage.removeItem('authToken');
        this.$router.push('/login');
      }
    } finally {
      this.loading = false;
    }
  }
  }
};
</script>

<style scoped>
.v-card {
  margin-bottom: 24px;
}
</style>