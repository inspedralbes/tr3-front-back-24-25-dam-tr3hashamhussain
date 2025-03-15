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

    <v-card class="mt-4">
      <v-card-title>Estadísticas</v-card-title>
      <v-card-text>
        <v-list v-if="stats.length > 0">
          <v-list-item v-for="stat in stats" :key="stat._id">
            <v-list-item-content>
              <v-list-item-title>{{ stat.playerName }}</v-list-item-title>
              <v-list-item-subtitle>Saltos: {{ stat.jumps }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <v-alert v-else type="info">No hay estadísticas disponibles.</v-alert>
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
      stats: [], // Lista de estadísticas
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
        // Subir la imagen (MySQL)
        const uploadResponse = await fetch('http://localhost:3000/images/upload', {
            method: 'POST',
            body: formData,
        });

        if (!uploadResponse.ok) {
            throw new Error('Error al subir la imagen');
        }

        const uploadData = await uploadResponse.json(); // Parsear la respuesta como JSON
        this.message = uploadData.message; // Acceder al mensaje del JSON
        this.alertType = 'success';
    } catch (error) {
        this.message = 'Error al subir la imagen.';
        this.alertType = 'error';
        console.error(error);
    }
},
    async fetchStats() {
      try {
        // Obtener estadísticas (MongoDB)
        const statsResponse = await fetch('http://localhost:3000/stats');
        if (!statsResponse.ok) {
          throw new Error('Error al obtener las estadísticas');
        }
        this.stats = await statsResponse.json();
      } catch (error) {
        console.error('Error al obtener las estadísticas:', error);
      }
    },
  },
  mounted() {
    // Cargar estadísticas al montar el componente
    this.fetchStats();
  },
};
</script>