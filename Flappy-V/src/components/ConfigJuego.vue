<template>
  <v-card>
    <v-card-title class="bg-primary text-white">
      <v-icon left>mdi-cog</v-icon>
      Configuración del Juego
    </v-card-title>
    
    <v-card-text>
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model.number="localSettings.flapStrength"
            label="Fuerza de salto"
            type="number"
            min="5"
            max="20"
            step="0.5"
            prepend-icon="mdi-bird"
            variant="outlined"
          ></v-text-field>
        </v-col>
        
        <v-col cols="12" sm="6">
          <v-text-field
            v-model.number="localSettings.pipeSpawnRate"
            label="Tasa de aparición (segundos)"
            type="number"
            min="0.5"
            max="5"
            step="0.1"
            prepend-icon="mdi-timer"
            variant="outlined"
          ></v-text-field>
        </v-col>
        
        <v-col cols="12" sm="6">
          <v-text-field
            v-model.number="localSettings.pipeMoveSpeed"
            label="Velocidad tuberías"
            type="number"
            min="1"
            max="30"
            step="0.5"
            prepend-icon="mdi-speedometer"
            variant="outlined"
          ></v-text-field>
        </v-col>
        
        <v-col cols="12" sm="6">
          <v-slider
            v-model.number="localSettings.enemySpawnChance"
            label="Probabilidad de enemigos"
            thumb-label="always"
            min="0"
            max="100"
            step="5"
            prepend-icon="mdi-alert-octagon"
          ></v-slider>
        </v-col>
      </v-row>
    </v-card-text>
    
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
    
    <v-card-actions class="justify-end">
      <v-btn 
        color="primary" 
        @click="saveSettings"
        :loading="loading"
        :disabled="!hasChanges"
      >
        <v-icon left>mdi-content-save</v-icon>
        Guardar
      </v-btn>
    </v-card-actions>
  </v-card>
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

const emit = defineEmits(['settings-saved']);
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

const saveSettings = async () => {
  loading.value = true;
  try {
    const response = await fetch('http://localhost:3000/game-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flapStrength: Number(localSettings.value.flapStrength),
        pipeSpawnRate: Number(localSettings.value.pipeSpawnRate),
        pipeMoveSpeed: Number(localSettings.value.pipeMoveSpeed),
        enemySpawnChance: Number(localSettings.value.enemySpawnChance)
      })
    });
    
    if (!response.ok) throw new Error(await response.text());
    
    const result = await response.json();
    initialSettings.value = { ...localSettings.value };
    emit('settings-saved', result);
    showSnackbar('Configuración guardada correctamente', 'success');
  } catch (error) {
    console.error('Error:', error);
    showSnackbar('Error al guardar configuración', 'error');
  } finally {
    loading.value = false;
  }
};
</script>