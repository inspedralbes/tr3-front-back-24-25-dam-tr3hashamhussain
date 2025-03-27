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
        const response = await fetch('http://localhost:3000/images/upload', {
          method: 'POST',
          body: formData,
        });
        
        const data = await response.json();
        this.message = data.message || 'Imagen subida correctamente';
        this.alertType = 'success';
        
        // Emitir evento de imagen subida si es necesario
        this.$emit('image-uploaded', data);
        
      } catch (error) {
        this.message = 'Error al subir la imagen';
        this.alertType = 'error';
        console.error('Error al subir imagen:', error);
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