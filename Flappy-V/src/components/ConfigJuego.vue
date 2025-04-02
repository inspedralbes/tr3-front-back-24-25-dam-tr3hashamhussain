<template>
  <div>
    <v-card-title class="d-flex align-center px-6 pt-6">
      <v-icon left color="success">mdi-cog</v-icon>
      <span class="white--text">Configuración del Juego</span>
      <v-spacer></v-spacer>
      <v-chip v-if="hasChanges" color="success" small dark>
        <v-icon left small>mdi-pencil</v-icon>
        Cambios pendientes
      </v-chip>
    </v-card-title>
    
    <v-card-text class="pt-4 px-6 pb-6">
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="localSettings.flapStrength"
            label="Fuerza de salto"
            type="number"
            min="5"
            max="20"
            step="0.5"
            variant="outlined"
            color="success"
            prepend-inner-icon="mdi-bird"
            :rules="[v => !!v || 'Campo requerido', v => (v >= 5 && v <= 20) || 'Entre 5 y 20']"
          ></v-text-field>
          
          <v-text-field
            v-model.number="localSettings.pipeSpawnRate"
            label="Tasa de aparición (segundos)"
            type="number"
            min="0.5"
            max="5"
            step="0.1"
            variant="outlined"
            color="success"
            prepend-inner-icon="mdi-timer"
            :rules="[v => !!v || 'Campo requerido', v => (v >= 0.5 && v <= 5) || 'Entre 0.5 y 5']"
          ></v-text-field>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-text-field
            v-model.number="localSettings.pipeMoveSpeed"
            label="Velocidad tuberías"
            type="number"
            min="1"
            max="30"
            step="0.5"
            variant="outlined"
            color="success"
            prepend-inner-icon="mdi-speedometer"
            :rules="[v => !!v || 'Campo requerido', v => (v >= 1 && v <= 30) || 'Entre 1 y 30']"
          ></v-text-field>
          
          <div class="mt-4">
            <v-label class="mb-2 text-caption">Probabilidad de enemigos: {{ localSettings.enemySpawnChance }}%</v-label>
            <v-slider
              v-model.number="localSettings.enemySpawnChance"
              thumb-label="always"
              min="0"
              max="100"
              step="5"
              color="success"
              track-color="grey darken-1"
              thumb-color="success"
            >
              <template v-slot:thumb-label="{ modelValue }">
                {{ modelValue }}%
              </template>
            </v-slider>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
    
    <v-card-actions class="px-6 pb-6 justify-end">
      <v-btn
        color="success"
        variant="tonal"
        @click="resetSettings"
        :disabled="!hasChanges"
        class="mr-4"
      >
        <v-icon left>mdi-restore</v-icon>
        Restablecer
      </v-btn>
      
      <v-btn
        color="success"
        @click="saveSettings"
        :loading="loading"
        :disabled="!hasChanges"
      >
        <v-icon left>mdi-content-save</v-icon>
        Guardar cambios
      </v-btn>
    </v-card-actions>
    
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  settings: {
    type: Object,
    required: true,
    default: () => ({
      flapStrength: 10,
      pipeSpawnRate: 2,
      pipeMoveSpeed: 9.5,
      enemySpawnChance: 25
    })
  }
});

const emit = defineEmits(['settings-saved', 'save-error']);
const loading = ref(false);
const localSettings = ref({ ...props.settings });
const initialSettings = ref({ ...props.settings });
const snackbar = ref({
  show: false,
  message: '',
  color: 'info'
});

const hasChanges = computed(() => {
  return Object.keys(localSettings.value).some(key => 
    localSettings.value[key] !== initialSettings.value[key]
  );
});

const showSnackbar = (message, color = 'info') => {
  snackbar.value = {
    show: true,
    message,
    color
  };
};

watch(() => props.settings, (newVal) => {
  localSettings.value = { ...newVal };
  initialSettings.value = { ...newVal };
}, { deep: true });

const resetSettings = () => {
  localSettings.value = { ...initialSettings.value };
  showSnackbar('Configuración restablecida', 'info');
};

const saveSettings = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await fetch('http://localhost:3400/game-settings', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        flapStrength: Number(localSettings.value.flapStrength),
        pipeSpawnRate: Number(localSettings.value.pipeSpawnRate),
        pipeMoveSpeed: Number(localSettings.value.pipeMoveSpeed),
        enemySpawnChance: Number(localSettings.value.enemySpawnChance)
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en la respuesta');
    }
    
    const result = await response.json();
    initialSettings.value = { ...localSettings.value };
    emit('settings-saved', result);
    showSnackbar('Configuración guardada correctamente', 'success');
  } catch (error) {
    console.error('Error:', error);
    showSnackbar(error.message || 'Error al guardar configuración', 'error');
    emit('save-error', error);
    
    // Redirigir a login si el token es inválido o no existe
    if (error.message.includes('Token') || error.message.includes('401')) {
      localStorage.removeItem('authToken');
      router.push('/login');
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.v-card-title {
  border-top: 3px solid #32CD32;
}

.v-text-field, .v-slider {
  margin-bottom: 16px;
}
</style>