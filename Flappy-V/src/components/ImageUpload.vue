<template>
  <div>
    <v-card-title class="d-flex align-center px-6 pt-6">
      <v-icon left color="primary">mdi-image</v-icon>
      <span class="white--text">Pujar Imatge</span>
    </v-card-title>
    
    <v-card-text class="pt-4 px-6 pb-6">
      <v-file-input
        v-model="image"
        label="Selecciona una imatge"
        prepend-icon="mdi-camera"
        accept="image/*"
        @change="uploadImage"
        outlined
        color="primary"
        clearable
        :loading="loading"
      ></v-file-input>
      
      <v-alert 
        v-if="message" 
        :type="alertType" 
        variant="tonal"
        class="mt-4"
      >
        {{ message }}
      </v-alert>
    </v-card-text>
  </div>
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
      this.message = 'Si us plau, selecciona una imatge.';
      this.alertType = 'error';
      return;
    }
    
    this.loading = true;
    const formData = new FormData();
    formData.append('file', this.image);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No hi ha token d’autenticació');
      }

      const response = await fetch('http://localhost:3200/images/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // No incloure 'Content-Type': el navegador l'establirà automàticament amb el boundary
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la resposta');
      }
      
      const data = await response.json();
      this.message = data.message || 'Imatge pujada correctament';
      this.alertType = 'success';
      this.$emit('image-uploaded', data);
      
    } catch (error) {
      this.message = error.message || 'Error en pujar la imatge';
      this.alertType = 'error';
      console.error('Error en pujar imatge:', error);
      
      // Redirigir a login si el token és invàlid
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
.v-card-title {
  border-top: 3px solid #4169E1;
}
</style>
