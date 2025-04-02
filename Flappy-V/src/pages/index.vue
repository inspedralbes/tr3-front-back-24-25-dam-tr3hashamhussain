<template>
  <v-container class="main-container">
    <v-row class="justify-center">
      <v-col cols="12" md="10" lg="8">
        <!-- Image Upload -->
        <div class="card-container" @mouseenter="hoverCard('upload')" @mouseleave="hoverCard(null)">
          <v-card class="card-content upload-card mb-8" :class="{'card-hovered': activeHover === 'upload'}">
            <ImageUpload />
          </v-card>
          <div class="border-glow" :class="{'glow-upload': activeHover === 'upload'}"></div>
        </div>

        <!-- Game Config -->
        <div class="card-container" @mouseenter="hoverCard('config')" @mouseleave="hoverCard(null)">
          <v-card class="card-content config-card mb-8" :class="{'card-hovered': activeHover === 'config'}">
            <ConfigJuego 
              :settings="gameSettings"
              @settings-saved="handleSettingsSaved"
              @save-error="handleSettingsError"
            />
          </v-card>
          <div class="border-glow" :class="{'glow-config': activeHover === 'config'}"></div>
        </div>

        <!-- Recent Stats -->
        <div class="card-container" @mouseenter="hoverCard('recent')" @mouseleave="hoverCard(null)">
          <v-card class="card-content recent-stats-card mb-8" :class="{'card-hovered': activeHover === 'recent'}">
            <RecentStats :recent-stat="recentStat" />
          </v-card>
          <div class="border-glow" :class="{'glow-recent': activeHover === 'recent'}"></div>
        </div>

        <!-- Stats History -->
        <div class="card-container" @mouseenter="hoverCard('history')" @mouseleave="hoverCard(null)">
          <v-card class="card-content history-card" :class="{'card-hovered': activeHover === 'history'}">
            <StatsHistory :stats="stats" @show-details="showDetails" />
          </v-card>
          <div class="border-glow" :class="{'glow-history': activeHover === 'history'}"></div>
        </div>
        <!-- Stats Charts -->
        <div class="card-container" @mouseenter="hoverCard('charts')" @mouseleave="hoverCard(null)">
          <v-card class="card-content charts-card mb-8" :class="{'card-hovered': activeHover === 'charts'}">
            <StatsCharts />
          </v-card>
          <div class="border-glow" :class="{'glow-charts': activeHover === 'charts'}"></div>
        </div>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import ConfigJuego from '@/components/ConfigJuego.vue';
import ImageUpload from '@/components/ImageUpload.vue';
import RecentStats from '@/components/RecentStats.vue';
import StatsHistory from '@/components/StatsHistory.vue';
import StatsCharts from '@/components/StatsCharts.vue';
import io from 'socket.io-client';

const stats = ref([]);
const recentStat = ref(null);
const socket = ref(null);
const activeHover = ref(null);
const gameSettings = ref({
  flapStrength: 10,
  pipeSpawnRate: 2,
  pipeMoveSpeed: 9.5,
  enemySpawnChance: 25
});
const snackbar = ref({
  show: false,
  message: '',
  color: 'info'
});

const hoverCard = (card) => {
  activeHover.value = card;
};

const showDetails = (item) => {
  console.log("Detalles:", item);
};

const showSnackbar = (message, color = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color
  };
};

const fetchStats = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch('http://localhost:3300/stats', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en la respuesta');
    }
    
    const data = await response.json();
    stats.value = data;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    showSnackbar(error.message || 'Error al obtener estadísticas', 'error');
    
    // Redirigir a login si el token es inválido
    if (error.message.includes('401')) {
      localStorage.removeItem('authToken');
      router.push('/login');
    }
  }
};

const fetchRecentStat = async () => {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch('http://localhost:3300/stats/recent', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Error en la respuesta');
    }
    
    recentStat.value = await response.json();
  } catch (error) {
    console.error('Error al obtener estadística reciente:', error);
    showSnackbar('Error al obtener estadística reciente', 'error');
  }
};

const fetchGameSettings = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('http://localhost:3400/game-settings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en la respuesta');
    }
    
    gameSettings.value = await response.json();
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    showSnackbar(error.message || 'Error al obtener configuración del juego', 'error');
    
    // Redirigir a login si el token es inválido
    if (error.message.includes('Token') || error.message.includes('401')) {
      localStorage.removeItem('authToken');
      router.push('/login');
    }
  }
};

const handleSettingsSaved = (result) => {
  console.log('Configuración guardada:', result);
  gameSettings.value = result.gameSettings;
  showSnackbar('Configuración actualizada correctamente', 'success');
};

const handleSettingsError = (error) => {
  console.error('Error al guardar configuración:', error);
  showSnackbar('Error al guardar configuración: ' + error, 'error');
};

onMounted(() => {
  const token = localStorage.getItem('authToken');
  
  socket.value = io('http://localhost:3400', {
    withCredentials: true,
    transports: ['websocket'],
    auth: {
      token: token
    }
  });
  
  // Escuchar nuevas estadísticas
  socket.value.on('newStat', (newStat) => {
    stats.value.unshift(newStat);
    recentStat.value = newStat;
  });
  
  // Escuchar cambios de configuración
  socket.value.on('configUpdated', (newConfig) => {
    gameSettings.value = newConfig;
    console.log('Configuración actualizada via WebSocket:', newConfig);
    showSnackbar('Configuración del juego actualizada', 'info');
  });
  
  // Cargar datos iniciales
  fetchStats();
  fetchRecentStat();
  fetchGameSettings();
});

onBeforeUnmount(() => {
  if (socket.value) {
    socket.value.disconnect();
  }
});
</script>

<style scoped>
.main-container {
  background-color: #000000;
  min-height: 100vh;
  padding: 2rem 0;
}

.card-container {
  position: relative;
  border-radius: 12px;
}

.card-content {
  position: relative;
  z-index: 2;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(30, 30, 30, 0.9) !important;
  backdrop-filter: blur(6px);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.card-hovered {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5) !important;
}

.border-glow {
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 15px;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.glow-upload {
  opacity: 1;
  box-shadow: 
    0 0 20px rgba(65, 105, 255, 0.9),
    inset 0 0 20px rgba(65, 105, 255, 0.5);
  border: 3px solid rgba(100, 150, 255, 0.7);
  animation: pulse-blue 1.5s infinite alternate;
}

.glow-config {
  opacity: 1;
  box-shadow: 
    0 0 20px rgba(50, 205, 50, 0.9),
    inset 0 0 20px rgba(50, 205, 50, 0.5);
  border: 3px solid rgba(100, 255, 150, 0.7);
  animation: pulse-green 1.5s infinite alternate;
}

.glow-recent {
  opacity: 1;
  box-shadow: 
    0 0 20px rgba(147, 112, 219, 0.9),
    inset 0 0 20px rgba(147, 112, 219, 0.5);
  border: 3px solid rgba(200, 150, 255, 0.7);
  animation: pulse-purple 1.5s infinite alternate;
}

.glow-history {
  opacity: 1;
  box-shadow: 
    0 0 20px rgba(0, 255, 255, 0.9),
    inset 0 0 20px rgba(0, 255, 255, 0.5);
  border: 3px solid rgba(100, 255, 255, 0.7);
  animation: pulse-cyan 1.5s infinite alternate;
}

@keyframes pulse-blue {
  0% { 
    box-shadow: 0 0 15px rgba(65, 105, 255, 0.7), inset 0 0 15px rgba(65, 105, 255, 0.4);
    border-color: rgba(100, 150, 255, 0.6);
  }
  100% { 
    box-shadow: 0 0 25px rgba(65, 105, 255, 1.2), inset 0 0 25px rgba(65, 105, 255, 0.7);
    border-color: rgba(100, 180, 255, 0.9);
  }
}

@keyframes pulse-green {
  0% { 
    box-shadow: 0 0 15px rgba(50, 205, 50, 0.7), inset 0 0 15px rgba(50, 205, 50, 0.4);
    border-color: rgba(100, 255, 150, 0.6);
  }
  100% { 
    box-shadow: 0 0 25px rgba(50, 205, 50, 1.2), inset 0 0 25px rgba(50, 205, 50, 0.7);
    border-color: rgba(150, 255, 150, 0.9);
  }
}

@keyframes pulse-purple {
  0% { 
    box-shadow: 0 0 15px rgba(147, 112, 219, 0.7), inset 0 0 15px rgba(147, 112, 219, 0.4);
    border-color: rgba(200, 150, 255, 0.6);
  }
  100% { 
    box-shadow: 0 0 25px rgba(147, 112, 219, 1.2), inset 0 0 25px rgba(147, 112, 219, 0.7);
    border-color: rgba(220, 170, 255, 0.9);
  }
}

@keyframes pulse-cyan {
  0% { 
    box-shadow: 0 0 15px rgba(0, 255, 255, 0.7), inset 0 0 15px rgba(0, 255, 255, 0.4);
    border-color: rgba(100, 255, 255, 0.6);
  }
  100% { 
    box-shadow: 0 0 25px rgba(0, 255, 255, 1.2), inset 0 0 25px rgba(0, 255, 255, 0.7);
    border-color: rgba(150, 255, 255, 0.9);
  }
}

.upload-card {
  border-top: 3px solid #4169E1;
}

.config-card {
  border-top: 3px solid #32CD32;
}

.recent-stats-card {
  border-top: 3px solid #9370DB;
}

.history-card {
  border-top: 3px solid #00FFFF;
}

.glow-charts {
  opacity: 1;
  box-shadow: 
    0 0 20px rgba(255, 165, 0, 0.9),
    inset 0 0 20px rgba(255, 165, 0, 0.5);
  border: 3px solid rgba(255, 200, 100, 0.7);
  animation: pulse-orange 1.5s infinite alternate;
}

.charts-card {
  border-top: 3px solid #FFA500;
}

@keyframes pulse-orange {
  0% { 
    box-shadow: 0 0 15px rgba(255, 165, 0, 0.7), inset 0 0 15px rgba(255, 165, 0, 0.4);
    border-color: rgba(255, 200, 100, 0.6);
  }
  100% { 
    box-shadow: 0 0 25px rgba(255, 165, 0, 1.2), inset 0 0 25px rgba(255, 165, 0, 0.7);
    border-color: rgba(255, 220, 130, 0.9);
  }
}
</style>