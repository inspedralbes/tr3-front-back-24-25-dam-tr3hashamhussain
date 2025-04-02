<template>
  <div>
    <v-card-title class="d-flex align-center px-6 pt-6">
      <v-icon left color="info">mdi-history</v-icon>
      <span class="white--text">Historial de Partides</span>
      <v-spacer></v-spacer>
      <v-chip color="info" small dark>
        {{ totalItems }} registres
      </v-chip>
    </v-card-title>
    
    <v-card-text class="px-6 pb-6">
      <!-- Taula amb paginació manual -->
      <v-data-table
        :headers="headers"
        :items="paginatedItems"
        hide-default-footer
        class="transparent-table"
        dark
      >
        <template v-slot:item.playerName="{ item }">
          <v-chip color="info" small dark>
            <v-icon left small>mdi-account</v-icon>
            {{ item.playerName }}
          </v-chip>
        </template>
        
        <template v-slot:item.pipesPassed="{ item }">
          <v-chip color="secondary" small dark>
            <v-icon left small>mdi-pipe</v-icon>
            {{ item.pipesPassed }}
          </v-chip>
        </template>
        
        <template v-slot:item.date="{ item }">
          <span class="grey--text text--lighten-2">{{ formatDate(item.date) }}</span>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-btn icon small @click="showDetails(item)">
            <v-icon small color="info">mdi-information</v-icon>
          </v-btn>
        </template>
      </v-data-table>

      <!-- Controls de paginació personalitzats -->
      <div class="d-flex justify-center align-center mt-4">
        <v-btn 
          icon
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        
        <span class="mx-4">
          Pàgina {{ currentPage }} de {{ totalPages }}
        </span>
        
        <v-btn 
          icon
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </v-card-text>
  </div>
</template>

<script>
export default {
  props: {
    stats: {
      type: Array,
      default: () => [] // Assegura un array buit per defecte
    }
  },
  data() {
    return {
      currentPage: 1,
      itemsPerPage: 5,
      headers: [
        { text: 'Jugador', value: 'playerName' },
        { text: 'Tubs', value: 'pipesPassed' },
        { text: 'Data', value: 'date' },
        { text: 'Accions', value: 'actions', sortable: false }
      ]
    };
  },
  computed: {
    totalItems() {
      return Array.isArray(this.stats) ? this.stats.length : 0;
    },
    totalPages() {
      return Math.ceil(this.totalItems / this.itemsPerPage);
    },
    paginatedItems() {
      if (!Array.isArray(this.stats)) return [];
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.stats.slice(start, end);
    }
  },
  methods: {
    formatDate(date) {
      return new Date(date).toLocaleString();
    },
    showDetails(item) {
      this.$emit('show-details', item);
    }
  },
  watch: {
    stats() {
      // Reiniciar a la primera pàgina quan canvien les dades
      this.currentPage = 1;
    }
  }
};
</script>

<style scoped>
.v-card-title {
  border-top: 3px solid #00FFFF;
}
</style>
