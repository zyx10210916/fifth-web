<template>
  <MapView ref="mapView" 
    @map-select="handleMapSelect"
    @map-loaded="handleMapLoaded"
  />
</template>
 
<script>
import { ref } from 'vue';
import MapView from '../MapView.vue';
 
export default {
  name: 'MiddleMap',
  components: { MapView },
  props: {
    isFullSize: { type: Boolean, default: false },
    filterParams: { type: Object, default: () => ({}) }
  },
 
  setup(props, { emit }) {
    const mapView = ref(null);
    
    const handleMapLoaded = async () => {
    };
 
    const handleMapSelect = (payload) => {
      emit('map-select', payload); 
    };
 
    return {
      mapView,
      handleMapSelect,
      handleMapLoaded
    };
  }
};
</script>