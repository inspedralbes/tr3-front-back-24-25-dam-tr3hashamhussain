<template>
  <div>
    <v-card-title class="d-flex align-center px-6 pt-6">
      <v-icon left color="accent">mdi-star-circle</v-icon>
      <span class="white--text">Partida Destacada</span>
      <v-spacer></v-spacer>
      <v-chip color="accent" small dark>
        <v-icon left small>mdi-trending-up</v-icon>
        Recent
      </v-chip>
    </v-card-title>
    
    <v-card-text v-if="recentStat" class="pt-4 px-6 pb-6">
      <v-row align="center">
        <v-col cols="12" md="6">
          <div class="stat-display">
            <div class="stat-value">{{ recentStat.pipesPassed }}</div>
            <div class="stat-label">Tubs superats</div>
          </div>
        </v-col>
        <v-col cols="12" md="6">
          <v-list dense class="transparent">
            <v-list-item>
              <v-list-item-icon>
                <v-icon color="accent">mdi-account</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title class="white--text">{{ recentStat.playerName }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-icon>
                <v-icon color="accent">mdi-clock</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title class="white--text">{{ formatDate(recentStat.date) }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>
    </v-card-text>
    
    <v-card-text v-else class="px-6 pb-6">
      <v-alert type="info" outlined class="text-center">
        No hi ha partides recents registrades
      </v-alert>
    </v-card-text>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  props: {
    recentStat: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const isNew = ref(false);
    
    watch(() => props.recentStat, (newVal) => {
      if (newVal) {
        isNew.value = true;
        setTimeout(() => isNew.value = false, 5000); // Quitar el indicador "Nuevo" después de 5 segundos
      }
    }, { immediate: true });
    
    return {
      isNew
    };
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleString();
    }
  }
};
</script>

<style scoped>
.v-card-title {
  border-top: 3px solid #9370DB;
}
</style>
