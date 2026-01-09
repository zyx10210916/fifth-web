<template>
  <MapBase 
    :is-full-size="true" 
    :show-popup="true" 
    @map-select="onMapSelect"
  />
</template>

<script>
import MapBase from '../summary-display/MiddleMap.vue';

export default {
  components: { MapBase },
  methods: {
    onMapSelect(code) {
      this.$emit('map-select', code);
    }
  }
}
</script>