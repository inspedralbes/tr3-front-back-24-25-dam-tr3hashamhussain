<template>
  <v-app>
    <v-app-bar 
      v-if="showServiceHeader" 
      app 
      color="primary" 
      dark
    >
      <v-toolbar-title>Flappy-V Admin</v-toolbar-title>
      <v-spacer></v-spacer>
      <ServiceControl />
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import ServiceControl from '@/components/ServiceControl.vue';

const route = useRoute();

// Mostrar header solo en rutas que no son login/register
const showServiceHeader = computed(() => {
  return !['Login', 'Register'].includes(route.name);
});
</script>