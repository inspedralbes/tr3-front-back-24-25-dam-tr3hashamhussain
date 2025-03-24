<template>
  <v-container>
    <!-- Sección para subir imágenes -->
    <v-card class="mb-6" elevation="4">
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
    </v-card>

    <!-- Configuración del juego -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="secondary white--text">
        <v-icon left>mdi-cog</v-icon>
        Configuración del Juego
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="flapStrength"
              label="Fuerza de salto"
              type="number"
              prepend-icon="mdi-bird"
              outlined
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="pipeSpawnRate"
              label="Tasa de tuberías (segundos)"
              type="number"
              prepend-icon="mdi-pipe"
              outlined
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="pipeMoveSpeed"
              label="Velocidad tuberías"
              type="number"
              prepend-icon="mdi-speedometer"
              outlined
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-slider
              v-model="enemySpawnChance"
              label="% de enemigos"
              thumb-label="always"
              min="0"
              max="100"
              step="5"
            ></v-slider>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn 
          color="primary" 
          @click="updateGameSettings"
          :loading="loading"
        >
          <v-icon left>mdi-content-save</v-icon>
          Guardar Configuración
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Estadísticas recientes -->
    <v-card class="mb-6" elevation="4">
      <v-card-title class="accent white--text">
        <v-icon left>mdi-trophy</v-icon>
        Partida Más Reciente
      </v-card-title>
      <v-card-text>
        <template v-if="recentStat">
          <v-list-item three-line>
            <v-list-item-avatar color="primary">
              <v-icon dark>mdi-account</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title class="font-weight-bold">
                {{ recentStat.playerName }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <v-chip small color="info" class="mr-2">
                  <v-icon left small>mdi-gamepad-variant</v-icon>
                  {{ recentStat.gameMode }}
                </v-chip>
                <v-chip small color="success" class="mr-2">
                  <v-icon left small>mdi-pipe</v-icon>
                  {{ recentStat.pipesPassed }} tuberías
                </v-chip>
                <v-chip small color="warning">
                  <v-icon left small>mdi-jump-rope</v-icon>
                  {{ recentStat.jumps }} saltos
                </v-chip>
              </v-list-item-subtitle>
              <v-list-item-subtitle class="mt-2">
                <v-icon small left>mdi-clock</v-icon>
                {{ formatDate(recentStat.date) }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </template>
        <v-alert v-else type="info" outlined>
          No hay partidas recientes registradas
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Historial de partidas -->
    <v-card elevation="4">
      <v-card-title class="teal white--text">
        <v-icon left>mdi-history</v-icon>
        Historial de Partidas
      </v-card-title>
      <v-card-text>
        <template v-if="stats.length > 0">
          <v-list>
            <v-list-item
              v-for="stat in stats"
              :key="stat._id"
              three-line
            >
              <template v-slot:default="{ active }">
                <v-list-item-avatar color="grey lighten-2">
                  <v-icon>mdi-account</v-icon>
                </v-list-item-avatar>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ stat.playerName }}
                  </v-list-item-title>
                  <v-list-item-subtitle class="d-flex flex-wrap">
                    <v-chip
                      v-for="(tag, i) in getStatTags(stat)"
                      :key="i"
                      small
                      :color="tag.color"
                      class="mr-2 mb-1"
                    >
                      <v-icon left small>{{ tag.icon }}</v-icon>
                      {{ tag.text }}
                    </v-chip>
                  </v-list-item-subtitle>
                  <v-list-item-subtitle>
                    <v-icon small left>mdi-clock</v-icon>
                    {{ formatDate(stat.date) }}
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-action>
                  <v-btn icon @click="showStatDetails(stat)">
                    <v-icon>mdi-information</v-icon>
                  </v-btn>
                </v-list-item-action>
              </template>
            </v-list-item>
          </v-list>
          <v-pagination
            v-model="page"
            :length="totalPages"
            circle
            class="mt-4"
          ></v-pagination>
        </template>
        <v-alert v-else type="info" outlined>
          No hay partidas registradas
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Dialogo de detalles -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title class="headline">
          Detalles de la partida
        </v-card-title>
        <v-card-text v-if="selectedStat">
          <v-simple-table>
            <template v-slot:default>
              <tbody>
                <tr>
                  <td><strong>Jugador:</strong></td>
                  <td>{{ selectedStat.playerName }}</td>
                </tr>
                <tr>
                  <td><strong>Modo:</strong></td>
                  <td>{{ selectedStat.gameMode }}</td>
                </tr>
                <tr>
                  <td><strong>Tuberías:</strong></td>
                  <td>{{ selectedStat.pipesPassed }}</td>
                </tr>
                <tr>
                  <td><strong>Saltos:</strong></td>
                  <td>{{ selectedStat.jumps }}</td>
                </tr>
                <tr>
                  <td><strong>Fecha:</strong></td>
                  <td>{{ formatDate(selectedStat.date) }}</td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="dialog = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import io from 'socket.io-client';

export default {
  data() {
    return {
      image: null,
      message: '',
      alertType: 'info',
      recentStat: null,
      stats: [],
      flapStrength: 10,
      pipeSpawnRate: 2,
      pipeMoveSpeed: 9.5,
      enemySpawnChance: 25,
      loading: false,
      dialog: false,
      selectedStat: null,
      page: 1,
      itemsPerPage: 5,
      socket: null,
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.stats.length / this.itemsPerPage);
    },
    paginatedStats() {
      const start = (this.page - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.stats.slice(start, end);
    },
  },
  methods: {
    getStatTags(stat) {
      return [
        { 
          text: stat.gameMode, 
          icon: 'mdi-gamepad-variant', 
          color: 'info' 
        },
        { 
          text: `${stat.pipesPassed} tuberías`, 
          icon: 'mdi-pipe', 
          color: 'success' 
        },
        { 
          text: `${stat.jumps} saltos`, 
          icon: 'mdi-jump-rope', 
          color: 'warning' 
        },
      ];
    },
    showStatDetails(stat) {
      this.selectedStat = stat;
      this.dialog = true;
    },
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
      } catch (error) {
        this.message = 'Error al subir la imagen';
        this.alertType = 'error';
      } finally {
        this.loading = false;
      }
    },
    async updateGameSettings() {
      this.loading = true;
      try {
        const response = await fetch('http://localhost:3000/game-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flapStrength: this.flapStrength,
            pipeSpawnRate: this.pipeSpawnRate,
            pipeMoveSpeed: this.pipeMoveSpeed,
            enemySpawnChance: this.enemySpawnChance,
          }),
        });
        if (!response.ok) throw new Error('Error al guardar');
        this.message = 'Configuración actualizada';
        this.alertType = 'success';
      } catch (error) {
        this.message = error.message;
        this.alertType = 'error';
      } finally {
        this.loading = false;
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleString();
    },
    async fetchStats() {
      try {
        const response = await fetch('http://localhost:3000/stats');
        this.stats = await response.json();
      } catch (error) {
        console.error('Error:', error);
      }
    },
    async fetchRecentStat() {
      try {
        const response = await fetch('http://localhost:3000/stats/recent');
        this.recentStat = await response.json();
      } catch (error) {
        console.error('Error:', error);
      }
    },
  },
  mounted() {
    this.socket = io('http://localhost:3000');
    this.socket.on('newStat', (newStat) => {
      this.stats.unshift(newStat);
      this.recentStat = newStat;
    });
    this.fetchStats();
    this.fetchRecentStat();
  },
  beforeDestroy() {
    if (this.socket) this.socket.disconnect();
  },
};
</script>

<style scoped>
.v-card {
  margin-bottom: 24px;
}
</style>