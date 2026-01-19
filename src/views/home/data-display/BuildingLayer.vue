<script>
import { ref, watch, onUnmounted, markRaw } from 'vue';

// 在组件外部定义全局变量，作为内存缓存
// 这样即使切换 Tab 导致组件卸载，数据依然保留
let globalBuildingDataCache = null;

export default {
  name: 'BuildingLayer',
  props: {
    view: { type: Object, required: true },
    modules: { type: Array, required: true },
    visible: { type: Boolean, default: true }
  },
  emits: ['loaded'],
  setup(props, { emit, expose }) {
    const layerInstance = ref(null);
    const isLoading = ref(false);

    const getModule = (name) => {
      return props.modules.find(m =>
        (m.prototype?.declaredClass === `esri.${name}`) || (m.name === name)
      );
    };

    const initLayer = () => {
      const FeatureLayer = props.modules[2];
      const layer = new FeatureLayer({
        id: "building",
        title: "企业建筑点",
        objectIdField: "ObjectId",
        geometryType: "point",
        spatialReference: { wkid: 4526 },
        source: [],
        fields: [
          { name: "ObjectId", type: "oid" },
          { name: "WYM", type: "string" },
          { name: "B102", type: "string" }
        ],
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-marker",
            size: 4,
            color: [255, 68, 0, 0.7],
            outline: { color: [255, 255, 255], width: 1 }
          }
        },
        visible: props.visible,
        outFields: ["WYM"] // 严格限制输出字段，节省内存
      });

      props.view.map.add(layer);
      layerInstance.value = markRaw(layer);
    };

    // 核心加载逻辑：优先检查缓存
    const fetchBuildingPoints = async () => {
      if (!layerInstance.value || isLoading.value) return;
      
      // 如果缓存已有且图层已有数据，直接返回，什么都不做
      const count = await layerInstance.value.queryFeatureCount();
      if (globalBuildingDataCache && count > 0) {
        console.log("BuildingLayer: 数据已在内存和图层中，跳过所有逻辑");
        return;
      }

      isLoading.value = true;
      try {
        const Graphic = getModule("Graphic");
        
        // 1. 只在全无缓存时下载
        if (!globalBuildingDataCache) {
          console.log("BuildingLayer: 首次加载，下载全量数据");
          const response = await fetch("http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3Agongbaokupc38&outputFormat=application%2Fjson");
          const geojson = await response.json();
          globalBuildingDataCache = geojson.features || [];
        }

        // 2. 分批渲染 (只在图层为空时执行)
        const chunkSize = 5000;
        for (let i = 0; i < globalBuildingDataCache.length; i += chunkSize) {
          const chunk = globalBuildingDataCache.slice(i, i + chunkSize);
          const graphics = chunk.map((f, idx) => new Graphic({
            geometry: { type: "point", x: f.geometry.coordinates[0], y: f.geometry.coordinates[1], spatialReference: { wkid: 4526 } },
            attributes: { ObjectId: i + idx + 1, WYM: f.properties.WYM, B102: f.properties.B102 }
          }));
          await layerInstance.value.applyEdits({ addFeatures: graphics });
          
          // 每 2 万点给一次 GC 喘息机会
          if (i % 200000 === 0) await new Promise(r => setTimeout(r, 30));
        }
      } catch (e) {
        console.error("加载失败", e);
      } finally {
        isLoading.value = false;
      }
    };

    const queryBuildingPoints = async (geometryOrWhere) => {
      if (!layerInstance.value) return [];
      const query = layerInstance.value.createQuery();
      if (typeof geometryOrWhere === 'string') {
        query.where = geometryOrWhere;
      } else {
        query.geometry = geometryOrWhere;
      }
      query.returnGeometry = false; // 查询时不返回几何体以节省性能
      query.outFields = ["WYM"];
      const result = await layerInstance.value.queryFeatures(query);
      return result.features || [];
    };

    // 显式销毁逻辑：防止内存泄漏导致 Snap
    onUnmounted(() => {
      if (layerInstance.value) {
        console.log("[BuildingLayer] 组件卸载，清空图层实例");
        layerInstance.value.source = []; // 清空 GPU 引用
        if (props.view?.map) {
          props.view.map.remove(layerInstance.value);
        }
        layerInstance.value.destroy();
        layerInstance.value = null;
      }
    });

    watch(() => props.visible, (val) => {
      if (layerInstance.value) layerInstance.value.visible = val;
    });

    initLayer();

    expose({
      fetchBuildingPoints,
      queryBuildingPoints,
      instance: layerInstance
    });

    return () => null;
  }
};
</script>