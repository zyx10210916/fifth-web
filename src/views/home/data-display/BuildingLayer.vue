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
    const LOAD_MODE = 'full'; // 全量加载模式
    const layerInstance = shallowRef(null);
    const wmsLayer = shallowRef(null);
    const isLoading = ref(false);
    const useWFS = ref(false);
    const isViewReady = ref(false);
    const hasLoaded = ref(false);
    const bldCfg = MAP_CONFIG.economic.building;
    const loadedKeys = new Set();
    let abortController = null;
    let lastRequestExtent = null;


    // 监听 props.visible 变化
    watch(() => props.visible, (val) => {
      if (layerInstance.value) layerInstance.value.visible = val;
      if (wmsLayer.value && !useWFS.value) wmsLayer.value.visible = val;
    });

    // --- 初始化 WMS 占位图层 ---
    const initWMSLayer = () => {
      const WMSLayer = props.modules[10];
      wmsLayer.value = markRaw(new WMSLayer({
        id: "building_wms",
        url: bldCfg.wmsUrl,
        sublayers: [{ name: bldCfg.layerName }],
        customParameters: { "TRANSPARENT": "true", "VERSION": "1.1.0", "SRS": "EPSG:4526" },
        visible: props.visible && !useWFS.value
      }));
      props.view.map.add(wmsLayer.value);
    };

    // --- 全量加载模式：分批注入 FeatureLayer ---
    const initFullMode = async () => {
      const FeatureLayer = props.modules[2];
      const Graphic = props.modules[3];
      if (!FeatureLayer || !Graphic) return;
      if (hasLoaded.value) return;

      // 构造 URL：复用配置逻辑并去掉 bbox 参数
      const finalUrl = bldCfg.getWfsUrl("").replace("&bbox=", "") + "&propertyName=the_geom,坐标";

      try {
        isLoading.value = true;
        const response = await fetch(finalUrl);
        const geojson = await response.json();
        const features = geojson.features || [];

        // 1. 创建原生 4526 坐标系的 FeatureLayer
        layerInstance.value = markRaw(new FeatureLayer({
          id: bldCfg.id,
          source: [],
          objectIdField: "ObjectId",
          geometryType: "point",
          fields: [
            { name: "ObjectId", type: "oid" },
            { name: "坐标", type: "string" }
          ],
          renderer: {
            type: "simple",
            symbol: bldCfg.symbol
          },
          spatialReference: { wkid: 4526 },
          visible: true,
          outFields: ["*"]
        }));

        props.view.map.add(layerInstance.value);

        // 等待 LayerView 准备就绪
        await props.view.whenLayerView(layerInstance.value);

        // 2. 分批注入数据，确保坐标为数值类型
        const chunkSize = 5000;
        for (let i = 0; i < features.length; i += chunkSize) {
          const chunk = features.slice(i, i + chunkSize);
          const graphics = chunk.map((f, index) => {
            const x = parseFloat(f.geometry.coordinates[0]);
            const y = parseFloat(f.geometry.coordinates[1]);

            if (isNaN(x) || isNaN(y)) return null;

            return new Graphic({
              geometry: {
                type: "point",
                x: x,
                y: y,
                spatialReference: { wkid: 4526 }
              },
              attributes: {
                ObjectId: i + index + 1,
                "坐标": f.properties["坐标"] || ""
              }
            });
          }).filter(g => g !== null);

          await layerInstance.value.applyEdits({ addFeatures: graphics });
        }

        // 3. 渲染完成后隐藏 WMS
        useWFS.value = true;
        if (wmsLayer.value) wmsLayer.value.visible = false;
        isLoading.value = false;
        
        hasLoaded.value = true;

      } catch (error) {
        isLoading.value = false;
      }
    };

    // --- 动态 BBOX 模式 ---
    const initBboxMode = () => {
      const FeatureLayer = props.modules[2];
      layerInstance.value = markRaw(new FeatureLayer({
        id: bldCfg.id,
        objectIdField: "ObjectId",
        geometryType: "point",
        spatialReference: { wkid: 4526 },
        source: [],
        fields: [{ name: "ObjectId", type: "oid" }, { name: "坐标", type: "string" }],
        renderer: { type: "simple", symbol: bldCfg.symbol },
        visible: false
      }));
      props.view.map.add(layerInstance.value);
      props.view.watch('extent', debouncedHandleViewChange);
    };

    const fetchBuildingPointsBBox = async () => {
      if (!layerInstance.value || !useWFS.value) return;
      if (abortController) abortController.abort();
      abortController = new AbortController();
      isLoading.value = true;
      try {
        const Graphic = props.modules[3];
        const ext = props.view.extent;
        const paddedExt = ext.clone().expand(1.5);
        lastRequestExtent = paddedExt;
        const bbox = `${paddedExt.xmin},${paddedExt.ymin},${paddedExt.xmax},${paddedExt.ymax},EPSG:4526`;
        const url = `${bldCfg.getWfsUrl(bbox)}&propertyName=the_geom,${encodeURIComponent('坐标')}`;
        const response = await fetch(url, { signal: abortController.signal });
        const geojson = await response.json();
        const features = (geojson.features || []).filter(f => {
          const key = `${f.geometry.coordinates[0]},${f.geometry.coordinates[1]}`;
          return !loadedKeys.has(key);
        });
        if (features.length === 0) return;
        const graphics = features.map(f => {
          loadedKeys.add(`${f.geometry.coordinates[0]},${f.geometry.coordinates[1]}`);
          return new Graphic({
            geometry: { type: "point", x: f.geometry.coordinates[0], y: f.geometry.coordinates[1], spatialReference: { wkid: 4526 } },
            attributes: { ObjectId: Date.now() + Math.random() }
          });
        });
        await layerInstance.value.applyEdits({ addFeatures: graphics });
      } catch (e) {
        isLoading.value = false;
      } finally { isLoading.value = false; }
    };

    const debouncedHandleViewChange = debounce(() => {
      if (!isViewReady.value || LOAD_MODE !== 'bbox') return;
      const isCloseEnough = props.view.scale > 0 && props.view.scale <= bldCfg.maxScale;
      if (isCloseEnough && !useWFS.value) {
        useWFS.value = true;
        if (wmsLayer.value) wmsLayer.value.visible = false;
        if (layerInstance.value) layerInstance.value.visible = true;
        fetchBuildingPointsBBox();
      } else if (useWFS.value && (!lastRequestExtent || !lastRequestExtent.contains(props.view.extent))) {
        fetchBuildingPointsBBox();
      }
    }, 400);

    const init = () => {
      props.view.when(() => {
        isViewReady.value = true;
        initWMSLayer();
        if (LOAD_MODE === 'full') initFullMode();
        else initBboxMode();
      });
    };

    onMounted(init);
    onUnmounted(() => {
      abortController?.abort();
      if (layerInstance.value) props.view.map.remove(layerInstance.value);
      if (wmsLayer.value) props.view.map.remove(wmsLayer.value);
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