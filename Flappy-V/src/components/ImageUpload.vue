<template>
  <v-container>
    <v-card>
      <v-card-title>Subir Imagen</v-card-title>
      <v-card-text>
        <v-file-input
          v-model="image"
          label="Selecciona una imagen"
          accept="image/*"
          @change="uploadImage"
          outlined
        ></v-file-input>
        <v-alert v-if="message" :type="alertType">{{ message }}</v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      image: null,
      message: '',
      alertType: 'info',
    };
  },
  methods: {
    async uploadImage() {
      if (!this.image) {
        this.message = 'Por favor, selecciona una imagen.';
        this.alertType = 'error';
        return;
      }

      const formData = new FormData();
      formData.append('file', this.image);

      try {
        const response = await this.$axios.post('http://localhost:3000/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        this.message = response.data;
        this.alertType = 'success';
      } catch (error) {
        this.message = 'Error al subir la imagen.';
        this.alertType = 'error';
        console.error(error);
      }
    },
  },
};
</script>