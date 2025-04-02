<template>
    <div class="card-container" @mouseenter="hoverCard('charts')" @mouseleave="hoverCard(null)">
      <v-card class="card-content charts-card" :class="{'card-hovered': activeHover === 'charts'}">
        <div class="chart-header">
          <h3>Estadístiques del Joc</h3>
          <v-select
            v-model="selectedTimeRange"
            :items="timeRanges"
            label="Rang de temps"
            dense
            outlined
            class="time-selector"
            @change="fetchChartData"
          ></v-select>
        </div>
        
        <div class="chart-container">
          <canvas ref="pipesChart"></canvas>
        </div>
        
        <div class="chart-container">
          <canvas ref="modeChart"></canvas>
        </div>
      </v-card>
      <div class="border-glow" :class="{'glow-charts': activeHover === 'charts'}"></div>
    </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Chart, registerables } from 'chart.js';
import { io } from 'socket.io-client';

export default {
  name: 'StatsCharts',
  setup() {
    // Registrar components de Chart.js
    Chart.register(...registerables);
    
    // Referències
    const pipesChart = ref(null);
    const modeChart = ref(null);
    const activeHover = ref(null);
    const statsData = ref([]);
    const selectedTimeRange = ref('week');
    const socket = ref(null);
    
    // Opcions del selector de temps
    const timeRanges = ref([
      { text: 'Últims 7 dies', value: 'week' },
      { text: 'Últims 30 dies', value: 'month' },
      { text: 'Tots els registres', value: 'all' }
    ]);
    
    // Instàncies de gràfics
    let pipesChartInstance = null;
    let modeChartInstance = null;

    // Efecte hover
    const hoverCard = (card) => {
      activeHover.value = card;
    };

    // Obtenir dades per als gràfics
    const fetchChartData = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.error('No hi ha token d\'autenticació');
          return;
        }
        
        let url = 'http://localhost:3300/stats';
        if (selectedTimeRange.value !== 'all') {
          const days = selectedTimeRange.value === 'week' ? 7 : 30;
          const date = new Date();
          date.setDate(date.getDate() - days);
          url += `?dateFrom=${date.toISOString()}`;
        }
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error('Error en obtenir les dades');
        
        statsData.value = await response.json();
        updateCharts();
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    // Actualitzar gràfics amb noves dades
    const updateCharts = () => {
      // Netejar gràfics anteriors
      if (pipesChartInstance) pipesChartInstance.destroy();
      if (modeChartInstance) modeChartInstance.destroy();
      
      // Processar dades
      const dates = [...new Set(statsData.value.map(stat => 
        new Date(stat.date).toLocaleDateString()
      ))].sort((a, b) => new Date(a) - new Date(b));
      
      const pipesByDate = {};
      const modesCount = {};
      
      statsData.value.forEach(stat => {
        const dateStr = new Date(stat.date).toLocaleDateString();
        
        // Tuberies per data
        pipesByDate[dateStr] = (pipesByDate[dateStr] || 0) + stat.pipesPassed;
        
        // Comptatge per mode de joc
        modesCount[stat.gameMode] = (modesCount[stat.gameMode] || 0) + 1;
      });
      
      // Gràfic de Tuberies (Barres)
      pipesChartInstance = new Chart(pipesChart.value, {
        type: 'bar',
        data: {
          labels: dates,
          datasets: [{
            label: 'Tuberies passades',
            data: dates.map(date => pipesByDate[date] || 0),
            backgroundColor: 'rgba(50, 205, 50, 0.5)',
            borderColor: 'rgba(50, 205, 50, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'Tuberies passades per data' }
          },
          scales: { y: { beginAtZero: true } }
        }
      });
      
      // Gràfic de Modes (Donut)
      modeChartInstance = new Chart(modeChart.value, {
        type: 'doughnut',
        data: {
          labels: Object.keys(modesCount),
          datasets: [{
            data: Object.values(modesCount),
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'Distribució per mode de joc' }
          }
        }
      });
    };
    
    // Inicialització
    onMounted(() => {
      // Connexió WebSocket
      const token = localStorage.getItem('authToken');
      socket.value = io('http://localhost:3300', {
        withCredentials: true,
        transports: ['websocket'],
        auth: { token }
      });
      
      // Escoltar noves estadístiques
      socket.value.on('newStat', () => {
        fetchChartData(); // Actualitzar gràfics automàticament
      });
      
      // Carrega inicial
      fetchChartData();
    });
    
    // Neteja al desmuntar
    onBeforeUnmount(() => {
      if (socket.value) socket.value.disconnect();
      if (pipesChartInstance) pipesChartInstance.destroy();
      if (modeChartInstance) modeChartInstance.destroy();
    });
    
    return {
      pipesChart,
      modeChart,
      activeHover,
      hoverCard,
      selectedTimeRange,
      timeRanges,
      fetchChartData
    };
  }
};
</script>

<style scoped>
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.chart-header h3 {
  margin: 0;
  color: #fff;
  font-weight: 500;
}

.time-selector {
  max-width: 200px;
  background: rgba(255, 255, 255, 0.1);
}

.chart-container {
  padding: 1rem;
  margin-bottom: 1rem;
}

.charts-card {
  border-top: 3px solid #FFA500;
}

.glow-charts {
  opacity: 1;
  box-shadow: 
    0 0 20px rgba(255, 165, 0, 0.9),
    inset 0 0 20px rgba(255, 165, 0, 0.5);
  border: 3px solid rgba(255, 200, 100, 0.7);
  animation: pulse-orange 1.5s infinite alternate;
}

@keyframes pulse-orange {
  0% { 
    box-shadow: 0 0 15px rgba(255, 165, 0, 0.7);
    border-color: rgba(255, 200, 100, 0.6);
  }
  100% { 
    box-shadow: 0 0 25px rgba(255, 165, 0, 1.2);
    border-color: rgba(255, 220, 130, 0.9);
  }
}
</style>
