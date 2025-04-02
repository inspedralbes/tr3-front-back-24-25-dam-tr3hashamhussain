<template>
    <div class="card-container" @mouseenter="hoverCard('charts')" @mouseleave="hoverCard(null)">
      <v-card class="card-content charts-card" :class="{'card-hovered': activeHover === 'charts'}">
        <div class="chart-header">
          <h3>Estadísticas del Juego</h3>
          <v-select
            v-model="selectedTimeRange"
            :items="timeRanges"
            label="Rango de tiempo"
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
  import { ref, onMounted, watch } from 'vue';
  import { Chart, registerables } from 'chart.js';
  
  export default {
    name: 'StatsCharts',
    setup() {
      Chart.register(...registerables);
      
      const pipesChart = ref(null);
      const modeChart = ref(null);
      const activeHover = ref(null);
      const statsData = ref([]);
      const selectedTimeRange = ref('week');
      const timeRanges = ref([
        { text: 'Últimos 7 días', value: 'week' },
        { text: 'Últimos 30 días', value: 'month' },
        { text: 'Todos los registros', value: 'all' }
      ]);
      
      let pipesChartInstance = null;
      let modeChartInstance = null;
      
      const hoverCard = (card) => {
        activeHover.value = card;
      };
      
      const fetchChartData = async () => {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) {
            console.error('No hay token de autenticación');
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
          
          if (!response.ok) {
            throw new Error('Error al obtener datos para gráficos');
          }
          
          statsData.value = await response.json();
          updateCharts();
        } catch (error) {
          console.error('Error fetching chart data:', error);
        }
      };
      
      const updateCharts = () => {
        // Destruir instancias anteriores si existen
        if (pipesChartInstance) pipesChartInstance.destroy();
        if (modeChartInstance) modeChartInstance.destroy();
        
        // Procesar datos para los gráficos
        const dates = [...new Set(statsData.value.map(stat => 
          new Date(stat.date).toLocaleDateString()
        ))].sort((a, b) => new Date(a) - new Date(b));
        
        const pipesByDate = {};
        const modesCount = {};
        
        statsData.value.forEach(stat => {
          const dateStr = new Date(stat.date).toLocaleDateString();
          
          // Tuberías por fecha
          if (!pipesByDate[dateStr]) pipesByDate[dateStr] = 0;
          pipesByDate[dateStr] += stat.pipesPassed;
          
          // Conteo por modo de juego
          if (!modesCount[stat.gameMode]) modesCount[stat.gameMode] = 0;
          modesCount[stat.gameMode]++;
        });
        
        // Gráfico de tuberías
        pipesChartInstance = new Chart(pipesChart.value, {
          type: 'bar',
          data: {
            labels: dates,
            datasets: [{
              label: 'Tuberías pasadas',
              data: dates.map(date => pipesByDate[date] || 0),
              backgroundColor: 'rgba(50, 205, 50, 0.5)',
              borderColor: 'rgba(50, 205, 50, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Tuberías pasadas por fecha'
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
        
        // Gráfico de modos de juego
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
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)'
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Distribución por modo de juego'
              }
            }
          }
        });
      };
      
      onMounted(() => {
        fetchChartData();
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
      box-shadow: 0 0 15px rgba(255, 165, 0, 0.7), inset 0 0 15px rgba(255, 165, 0, 0.4);
      border-color: rgba(255, 200, 100, 0.6);
    }
    100% { 
      box-shadow: 0 0 25px rgba(255, 165, 0, 1.2), inset 0 0 25px rgba(255, 165, 0, 0.7);
      border-color: rgba(255, 220, 130, 0.9);
    }
  }
  </style>