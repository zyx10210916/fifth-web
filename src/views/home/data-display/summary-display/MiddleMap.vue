<template>
  <MapView ref="mapView" 
    @map-select="handleMapSelect"
    @map-loaded="handleMapLoaded"
  />
</template>
 
<script>
import { ref, watch } from 'vue';
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
      if (mapView.value) {
        await mapView.value.fetchBuildingPoints(props.filterParams);
      }
    };
 
    const handleMapSelect = (codes) => {
      emit('map-select', codes);
    };
 
    watch(() => props.filterParams, (newParams) => {
      if (mapView.value) {
        mapView.value.fetchBuildingPoints(newParams);
      }
    }, { deep: true });
 
    return {
      mapView,
      handleMapSelect,
      handleMapLoaded
    };
  }
};
</script>