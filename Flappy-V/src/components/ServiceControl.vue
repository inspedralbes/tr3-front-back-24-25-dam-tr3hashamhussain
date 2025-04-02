<template>
    <v-card class="service-control-card">
      <v-toolbar color="primary" dark dense>
        <v-toolbar-title>Estado de Microservicios</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn 
          v-if="false" <!-- Esto oculta el botón completamente -->
          color="error" 
          @click="stopAllServices"
          :disabled="allServicesStopped"
          :loading="stoppingAll"
        >
          <v-icon left>mdi-stop-circle</v-icon>
          Detener Todos (excepto Auth)
        </v-btn>
      </v-toolbar>
  
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="4" lg="3" v-for="service in services" :key="service.name">
            <v-card :color="getStatusColor(service.status)" dark class="service-card">
              <v-card-title class="d-flex justify-space-between align-center">
                <div>
                  <v-icon left>{{ getServiceIcon(service.name) }}</v-icon>
                  {{ service.name }}
                </div>
                <v-chip small :color="getStatusColor(service.status)" class="ml-2">
                  {{ service.status === 'running' ? 'Activo' : 'Inactivo' }}
                </v-chip>
              </v-card-title>
              
              <v-card-subtitle class="d-flex align-center">
                <v-icon small class="mr-1">mdi-web</v-icon>
                <span>localhost:{{ service.port }}</span>
              </v-card-subtitle>
  
              <v-divider class="mx-4"></v-divider>
  
              <v-card-text class="pa-2">
                <v-progress-linear
                  :color="getStatusColor(service.status)"
                  :indeterminate="service.status === 'running'"
                  height="6"
                  class="mb-2"
                ></v-progress-linear>
                <div class="text-caption text-center">
                  {{ getStatusMessage(service.status) }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
  
      <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
        {{ snackbar.message }}
        <template v-slot:actions>
          <v-btn variant="text" @click="snackbar.show = false">
            Cerrar
          </v-btn>
        </template>
      </v-snackbar>
    </v-card>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  
  const services = ref([
    { 
      name: 'Auth Service', 
      port: 3100, 
      status: 'running',
      healthEndpoint: '/api/auth/health',
      controlEndpoint: '/api/auth/api/service',
      loading: false,
      action: null,
      essential: true
    },
    { 
      name: 'Game Service', 
      port: 3400, 
      status: 'unknown', 
      healthEndpoint: '/game-settings/health',
      controlEndpoint: '/game-settings/api/service',
      loading: false,
      action: null,
      essential: false
    },
    { 
      name: 'Image Service', 
      port: 3200, 
      status: 'unknown', 
      healthEndpoint: '/images/health',
      controlEndpoint: '/images/api/service',
      loading: false,
      action: null,
      essential: false
    },
    { 
      name: 'Stats Service', 
      port: 3300, 
      status: 'unknown', 
      healthEndpoint: '/stats/health',
      controlEndpoint: '/stats/api/service',
      loading: false,
      action: null,
      essential: false
    }
  ]);
  
  const stoppingAll = ref(false);
  const snackbar = ref({
    show: false,
    message: '',
    color: 'info'
  });
  
  const allServicesStopped = computed(() => {
    return services.value
      .filter(service => !service.essential)
      .every(s => s.status === 'stopped' || s.status === 'unknown');
  });
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'running': return 'green-darken-2';
      case 'stopped': return 'red-darken-2';
      case 'error': return 'orange-darken-2';
      default: return 'grey-darken-2';
    }
  };
  
  const getStatusMessage = (status) => {
    switch(status) {
      case 'running': return 'Servicio en funcionamiento';
      case 'stopped': return 'Servicio detenido';
      case 'error': return 'Error de conexión';
      default: return 'Estado desconocido';
    }
  };
  
  const getServiceIcon = (serviceName) => {
    const icons = {
      'Auth': 'mdi-shield-lock',
      'Game': 'mdi-gamepad-variant',
      'Image': 'mdi-image',
      'Stats': 'mdi-chart-bar'
    };
    return icons[serviceName.split(' ')[0]] || 'mdi-server';
  };
  
  const checkServiceStatus = async (service) => {
    if (service.essential) {
      service.status = 'running';
      return;
    }
  
    try {
      const response = await fetch(service.healthEndpoint);
      
      if (response.ok) {
        const data = await response.json();
        service.status = data.status?.toLowerCase() || 'running';
      } else {
        service.status = 'stopped';
      }
    } catch (error) {
      service.status = 'error';
    }
  };
  
  const refreshAllStatus = async () => {
    const promises = services.value.map(service => checkServiceStatus(service));
    await Promise.all(promises);
  };
  
  onMounted(() => {
    refreshAllStatus();
    
    // Actualizar estado cada 30 segundos
    const intervalId = setInterval(refreshAllStatus, 30000);
    
    return () => clearInterval(intervalId);
  });
  </script>
  
  <style scoped>
  .service-control-card {
    margin-bottom: 20px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .service-card {
    border-radius: 8px;
    transition: transform 0.2s;
    height: 100%;
  }
  
  .service-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
  </style>