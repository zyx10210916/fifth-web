<script>
import { shallowRef, watch, onUnmounted, onMounted } from 'vue';
import { MAP_CONFIG } from '@/config/mapConfig';
import { getHouse } from '@/api/data-display/mapCache';

export default {
  name: 'HouseLayer',
  props: {
    view: Object,
    modules: Array,
    visible: Boolean
  },
  emits: ['loading-status'],
  setup(props, { emit }) {
    const layerInstance = shallowRef(null);

    const initLayer = async () => {
      emit('loading-status', true);
      const { FeatureLayer, Graphic } = props.modules;
      try {
        const data = await getHouse();// 从缓存获取房屋多边形数据
        
        const graphics = data.features.map((f, i) => new Graphic({
          geometry: { 
            type: "polygon", 
            rings: f.geometry.type === "MultiPolygon" ? f.geometry.coordinates.flat(1) : f.geometry.coordinates,
            spatialReference: { wkid: 4526 } 
          },
          attributes: { ...f.properties, OBJECTID: i + 1 }
        }));

        layerInstance.value = new FeatureLayer({
          id: MAP_CONFIG.economic.house.id,
          source: graphics,
          objectIdField: "OBJECTID",
          renderer: MAP_CONFIG.styles.house,
          visible: props.visible
        });
        props.view.map.add(layerInstance.value);
      } finally {
        emit('loading-status', false);
      }
    };

    onMounted(initLayer);
    watch(() => props.visible, (val) => { if (layerInstance.value) layerInstance.value.visible = val; });
    onUnmounted(() => { if (layerInstance.value) props.view.map.remove(layerInstance.value); });
    return () => null;
  }
};
</script>