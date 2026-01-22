<script>
import { ref, watch, onUnmounted, markRaw, shallowRef, onMounted } from 'vue';
import { debounce } from 'lodash-es';
import { MAP_CONFIG } from '@/config/mapConfig';

export default {
  name: 'BuildingLayer',
  props: {
    view: { type: Object, required: true },
    modules: { type: Array, required: true },
    visible: { type: Boolean, default: true }
  },
  emits: ['loaded'],
  setup(props, { emit, expose }) {
    const layerInstance = shallowRef(null);
    const wmsLayer = shallowRef(null);
    const isLoading = ref(false);
    const useWFS = ref(false);
    const isViewReady = ref(false);

    let abortController = null;
    const loadedKeys = new Set();
    let lastRequestExtent = null;

    // 引用
    const bldCfg = MAP_CONFIG.economic.building;

    const shouldFetchNewData = (currentExtent) => {
      return !lastRequestExtent || !lastRequestExtent.contains(currentExtent);
    };

    const debouncedHandleViewChange = debounce(() => {
      if (!isViewReady.value || !props.view) return;

      const currentScale = props.view.scale;
      const isCloseEnough = currentScale > 0 && currentScale <= bldCfg.maxScale;

      if (isCloseEnough && !useWFS.value) {
        useWFS.value = true;
        updateLayersVisibility();
        fetchBuildingPoints();
      } else if (!isCloseEnough && useWFS.value) {
        useWFS.value = false;
        if (abortController) abortController.abort();
        updateLayersVisibility();
      } else if (useWFS.value && shouldFetchNewData(props.view.extent)) {
        fetchBuildingPoints();
      }
    }, 400);

    const updateLayersVisibility = () => {
      if (wmsLayer.value) wmsLayer.value.visible = !useWFS.value && props.visible;
      if (layerInstance.value) layerInstance.value.visible = useWFS.value && props.visible;
    };

    const initWMSLayer = () => {
      const WMSLayer = props.modules[10];
      wmsLayer.value = markRaw(new WMSLayer({
        id: "building_wms",
        url: bldCfg.wmsUrl,
        sublayers: [{ name: bldCfg.layerName, queryable: true }],
        customParameters: { "TRANSPARENT": "true", "VERSION": "1.1.0", "SRS": "EPSG:4526" },
        visible: !useWFS.value && props.visible
      }));
      props.view.map.add(wmsLayer.value);
    };

    const initFeatureLayer = () => {
      const FeatureLayer = props.modules[2];
      layerInstance.value = markRaw(new FeatureLayer({
        id: bldCfg.id,
        objectIdField: "ObjectId",
        geometryType: "point",
        spatialReference: { wkid: 4526 },
        source: [],
        fields: [
          { name: "ObjectId", type: "oid" },
          { name: "WYM", type: "string" }
        ],
        renderer: { type: "simple", symbol: bldCfg.symbol },
        visible: useWFS.value && props.visible,
        outFields: ["*"]
      }));
      props.view.map.add(layerInstance.value);
    };

    const fetchBuildingPoints = async () => {
      if (!layerInstance.value || !useWFS.value) return;
      if (abortController) abortController.abort();
      abortController = new AbortController();

      isLoading.value = true;
      try {
        const Graphic = props.modules.find(m => m.name === 'Graphic' || m.prototype?.declaredClass === "esri.Graphic");
        const ext = props.view.extent;
        if (!ext) return;

        // 外扩缓冲区并获取 URL
        const paddedExt = ext.clone().expand(1.5);
        lastRequestExtent = paddedExt;
        const bbox = `${paddedExt.xmin},${paddedExt.ymin},${paddedExt.xmax},${paddedExt.ymax},EPSG:4526`;
        const url = bldCfg.getWfsUrl(bbox);
        const response = await fetch(url, { signal: abortController.signal });
        const geojson = await response.json();
        const features = (geojson.features || []).filter(f => {
          const key = `${f.geometry.coordinates[0]},${f.geometry.coordinates[1]}`;
          return !loadedKeys.has(key);
        });

        if (features.length === 0) return;
        const chunkSize = 2000;
        for (let i = 0; i < features.length; i += chunkSize) {
          const graphics = features.slice(i, i + chunkSize).map(f => {
            const key = `${f.geometry.coordinates[0]},${f.geometry.coordinates[1]}`;
            loadedKeys.add(key);
            return new Graphic({
              geometry: {
                type: "point",
                x: f.geometry.coordinates[0],
                y: f.geometry.coordinates[1],
                spatialReference: { wkid: 4526 }
              },
              attributes: {
                ObjectId: Date.now() + Math.random(),
              }
            });
          });
          await layerInstance.value.applyEdits({ addFeatures: graphics });
          await new Promise(r => setTimeout(r, 16));
        }
        emit('loaded', geojson.features);
      } catch (e) {
        if (e.name !== 'AbortError') console.error("[BuildingLayer] Error:", e);
      } finally {
        isLoading.value = false;
      }
    };

    const init = () => {
      props.view.when(() => {
        if (props.view.scale > 0) {
          isViewReady.value = true;
          initWMSLayer();
          initFeatureLayer();
          props.view.watch('scale', debouncedHandleViewChange);
          props.view.watch('extent', debouncedHandleViewChange);
          debouncedHandleViewChange();
        } else {
          const tempWatch = props.view.watch("scale", (s) => {
            if (s > 0) { tempWatch.remove(); init(); }
          });
        }
      });
    };

    watch(() => props.visible, (val) => {
      if (!val) { loadedKeys.clear(); lastRequestExtent = null; }
      updateLayersVisibility();
    });

    onMounted(init);
    onUnmounted(() => {
      abortController?.abort();
      if (layerInstance.value) props.view.map.remove(layerInstance.value);
      if (wmsLayer.value) props.view.map.remove(wmsLayer.value);
      loadedKeys.clear();
    });

    expose({
      queryBuildingPoints: async (q) => {
        if (!layerInstance.value) return [];
        const query = layerInstance.value.createQuery();
        if (typeof q === 'string') query.where = q; else query.geometry = q;
        return await layerInstance.value.queryFeatures(query);
      }
    });

    return () => null;
  }
};
</script>