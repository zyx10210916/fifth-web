<script>
import { ref, watch, onUnmounted, markRaw, shallowRef, onMounted } from 'vue';
import { MAP_CONFIG } from '@/config/mapConfig';
import { getBuilding } from '@/api/data-display/mapCache';

export default {
  name: 'BuildingLayer',
  props: {
    view: { type: Object, required: true },
    modules: { type: Object, required: true }, 
    visible: { type: Boolean, default: true }
  },
  emits: ['loaded', 'loading-status'],
  setup(props, { emit }) {
    const layerInstance = shallowRef(null);
    const isLoading = ref(false);
    const hasLoaded = ref(false);
    const bldCfg = MAP_CONFIG.economic.building;

    const initFullMode = async () => {
      if (hasLoaded.value || isLoading.value) return;

      try {
        isLoading.value = true;
        emit('loading-status', true);

        const geojson = await getBuilding();// 从缓存获取建筑点数据
        const features = geojson.features || [];

        const { FeatureLayer, Graphic } = props.modules;

        layerInstance.value = markRaw(new FeatureLayer({
          id: bldCfg.id,
          source: [], 
          objectIdField: "ObjectId",
          geometryType: "point",
          fields: [
            { name: "ObjectId", type: "oid" },
            { name: "坐标", type: "string" }
          ],
          outFields: ["*"], 
          renderer: { type: "simple", symbol: MAP_CONFIG.styles.building },
          spatialReference: { wkid: 4526 },
          visible: props.visible
        }));

        props.view.map.add(layerInstance.value);

        const chunkSize = 5000;
        for (let i = 0; i < features.length; i += chunkSize) {
          const chunk = features.slice(i, i + chunkSize);
          const graphics = chunk.map((f, index) => {
            const coords = f.geometry.coordinates;
            return new Graphic({
              geometry: { type: "point", x: parseFloat(coords[0]), y: parseFloat(coords[1]), spatialReference: { wkid: 4526 } },
              attributes: { 
                ObjectId: i + index + 1,
                "坐标": f.properties["坐标"] || "" 
              }
            });
          });

          await layerInstance.value.applyEdits({ addFeatures: graphics });
        }

        hasLoaded.value = true;
        emit('loaded', geojson);
      } catch (err) {
        console.error("企业建筑点加载失败:", err);
      } finally {
        isLoading.value = false;
        emit('loading-status', false);
      }
    };

    onMounted(() => { props.view.when(initFullMode); });
    watch(() => props.visible, (val) => { if (layerInstance.value) layerInstance.value.visible = val; });
    onUnmounted(() => { if (layerInstance.value) props.view.map.remove(layerInstance.value); });
    
    return () => null;
  }
};
</script>