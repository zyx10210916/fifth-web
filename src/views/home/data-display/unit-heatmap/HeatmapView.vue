<template>
  <div class="heatmap-container">
    <div id="viewDiv" style="width: 100%; height: 100vh; position: relative;">

      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <div class="loading-text">{{ loadingText }}</div>
        </div>
      </div>

      <button @click="goBack" class="back-btn">返回地图</button>

      <div class="heatmap-controls-panel">
        <div class="panel-header">
          <h3>热力图分析</h3>
        </div>
        <div class="panel-content">
          <div class="control-group">
            <div class="label-text">权重字段选择：</div>
            <select v-model="selectedHeatmapField" @change="handleFieldChange" class="custom-select">
              <option value="">-- 仅按分布密度 --</option>
              <option v-for="field in fieldOptions" :key="field.value" :value="field.value">
                {{ field.label }}
              </option>
            </select>
            <div class="status-tip">当前状态: {{ currentFieldLabel }}</div>
          </div>
        </div>
      </div>

      <ul class="mapType">
        <li v-for="item in mapList" :key="item.id" @click="handleBasemapChange(item.id)"
          :class="['item', item.className, { actived: activeBasemapId === item.id }]"
          :style="{ backgroundImage: `url(${activeBasemapId === item.id ? item.imgActive : item.imgNormal})` }">
          <span class="map-label">{{ item.name }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import { ref, shallowRef, onMounted, onUnmounted, computed, markRaw } from 'vue';
import { useRouter } from 'vue-router';
import { loadModules } from 'esri-loader';
import { MAP_CONFIG } from '@/config/mapConfig';

// 假设全量数据缓存在全局变量中，避免重复请求
// 如果你的项目有 store (Pinia/Vuex)，建议从 store 获取
let globalBuildingDataCache = null;

export default {
  name: 'ArcGISHeatmapView',
  setup() {
    const router = useRouter();
    const view = shallowRef(null);
    const mapModules = shallowRef(null);
    const loading = ref(true);
    const loadingText = ref('正在生成热力分析...');

    const activeBasemapId = ref('street');
    const mapList = MAP_CONFIG.basemapUI;

    // 1. 定义要求的四个权重字段
    const selectedHeatmapField = ref("");
    const fieldOptions = ref([
      { value: "ZCZJ", label: "资产总计" },
      { value: "YYLR", label: "营业利润" },
      { value: "QMRS", label: "期末人数" },
      { value: "YYSR", label: "营业收入" }
    ]);

    const currentFieldLabel = computed(() => {
      if (!selectedHeatmapField.value) return "仅按分布密度";
      const field = fieldOptions.value.find(f => f.value === selectedHeatmapField.value);
      return field ? field.label : "未知字段";
    });

    const initializeMap = async () => {
      try {
        const modules = await loadModules([
          'esri/Map', 'esri/views/MapView', 'esri/layers/FeatureLayer',
          'esri/Graphic', 'esri/geometry/SpatialReference', 'esri/Basemap',
          'esri/layers/TileLayer'
        ], { url: MAP_CONFIG.arcgis.js, css: MAP_CONFIG.arcgis.css });

        mapModules.value = modules;
        const [Map, MapView, FeatureLayer, Graphic, SpatialReference, Basemap, TileLayer] = modules;

        const map = new Map({
          basemap: new Basemap({
            baseLayers: [new TileLayer({ url: MAP_CONFIG.basemaps.street })],
            id: "street"
          })
        });

        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: new SpatialReference({ wkid: 4526 }),
          extent: MAP_CONFIG.initialExtent,
          ui: { components: [] }
        });

        view.value.when(async () => {
          await createHeatmapLayer(map);
          loading.value = false;
        });

      } catch (error) {
        console.error("热力图初始化失败:", error);
        loading.value = false;
      }
    };

    // 核心：创建并渲染热力图图层
    // ArcGISHeatmapView.vue 内部修改

    const createHeatmapLayer = async (map) => {
      const [FeatureLayer, Graphic] = mapModules.value;

      // 1. 尝试获取缓存数据
      let cachedData = globalBuildingDataCache || JSON.parse(sessionStorage.getItem('heatmapData') || '[]');

      // 2. 【核心修复】：如果缓存为空，主动重新请求全量数据
      if (cachedData.length === 0) {
        console.log("热力图：缓存为空，正在重新请求全量数据...");
        loadingText.value = "正在从服务器获取全量点位...";
        try {
          const wfsUrl = "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3Agongbaokupc38&outputFormat=application%2Fjson";
          const response = await fetch(wfsUrl);
          const geojson = await response.json();
          cachedData = geojson.features || [];

          // 更新全局变量和 session，方便下次复用
          globalBuildingDataCache = cachedData;
          sessionStorage.setItem('heatmapData', JSON.stringify(cachedData));
        } catch (err) {
          console.error("重新请求数据失败:", err);
          return;
        }
      }

      // 3. 将数据转换为 Graphic (此处逻辑保持不变)
      const graphics = cachedData.map((f, idx) => {
        // 兼容不同的数据结构格式
        const props = f.properties || f;
        const coords = f.geometry?.coordinates || [f.XZ_AXIS, f.YZ_AXIS];

        return new Graphic({
          geometry: {
            type: "point",
            x: parseFloat(coords[0]),
            y: parseFloat(coords[1]),
            spatialReference: { wkid: 4526 }
          },
          attributes: {
            ObjectId: idx + 1,
            ZCZJ: parseFloat(props.ZCZJ || 0),
            YYLR: parseFloat(props.YYLR || 0),
            QMRS: parseFloat(props.QMRS || 0),
            YYSR: parseFloat(props.YYSR || 0)
          }
        });
      });

      // 4. 创建并添加热力图层
      const heatmapLayer = new FeatureLayer({
        id: "heatmap_layer",
        source: graphics,
        objectIdField: "ObjectId",
        fields: [
          { name: "ObjectId", type: "oid" },
          { name: "ZCZJ", type: "double" },
          { name: "YYLR", type: "double" },
          { name: "QMRS", type: "double" },
          { name: "YYSR", type: "double" }
        ],
        renderer: getHeatmapRenderer(selectedHeatmapField.value)
      });

      map.add(heatmapLayer);
    };

    // 构造 ArcGIS 热力图渲染器
    const getHeatmapRenderer = (fieldName) => {
      const renderer = {
        type: "heatmap",
        colorStops: [
          { color: "rgba(0, 255, 255, 0)", ratio: 0 },
          { color: "rgba(0, 255, 255, 0.7)", ratio: 0.2 },
          { color: "rgb(0, 255, 0)", ratio: 0.4 },
          { color: "rgb(255, 255, 0)", ratio: 0.6 },
          { color: "rgb(255, 0, 0)", ratio: 0.9 }
        ],
        radius: 14,
        maxPixelIntensity: 100, // 默认密度强度
        minPixelIntensity: 0
      };

      if (fieldName) {
        renderer.field = fieldName;
        // 针对金额类大数值字段设置较高的强度阈值，防止热力图“过爆”
        if (["ZCZJ", "YYSR", "YYLR"].includes(fieldName)) {
          renderer.maxPixelIntensity = 500000;
        } else {
          renderer.maxPixelIntensity = 1000; // QMRS
        }
      }

      return renderer;
    };

    const handleFieldChange = () => {
      const layer = view.value.map.findLayerById("heatmap_layer");
      if (layer) {
        layer.renderer = getHeatmapRenderer(selectedHeatmapField.value);
      }
    };

    const handleBasemapChange = (id) => {
      const [, , , , , Basemap, TileLayer] = mapModules.value;
      view.value.map.basemap = new Basemap({
        baseLayers: [new TileLayer({ url: MAP_CONFIG.basemaps[id] })],
        id: id
      });
      activeBasemapId.value = id;
    };

    const goBack = () => router.back();

    onMounted(initializeMap);
    onUnmounted(() => { if (view.value) view.value.destroy(); });

    return {
      loading, loadingText, fieldOptions, selectedHeatmapField,
      currentFieldLabel, activeBasemapId, mapList,
      handleFieldChange, handleBasemapChange, goBack
    };
  }
};
</script>

<style lang="scss" scoped>
.heatmap-container {
  width: 100%;
  height: 100vh;
  background: #000;
  position: relative;
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  padding: 8px 20px;
  background: #fff;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.heatmap-controls-panel {
  position: absolute;
  top: 20px;
  left: 140px;
  z-index: 50;
  background: white;
  border-radius: 6px;
  width: 280px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  overflow: hidden;

  .panel-header {
    padding: 10px 15px;
    background: #f8f9fa;
    border-bottom: 1px solid #eee;

    h3 {
      margin: 0;
      font-size: 15px;
      color: #333;
    }
  }

  .panel-content {
    padding: 15px;

    .control-group {
      .label-text {
        font-size: 13px;
        font-weight: bold;
        color: #555;
        margin-bottom: 8px;
      }

      .custom-select {
        width: 100%;
        padding: 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 13px;
      }

      .status-tip {
        font-size: 11px;
        color: #999;
        margin-top: 8px;
        text-align: right;
      }
    }
  }
}

.mapType {
  position: absolute;
  bottom: 30px;
  right: 20px;
  z-index: 100;
  display: flex;
  gap: 10px;
  list-style: none;

  .item {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    border: 2px solid #fff;
    cursor: pointer;
    background-size: cover;
    position: relative;

    &.actived {
      border-color: #0091ff;
    }

    .map-label {
      position: absolute;
      bottom: 0;
      width: 100%;
      text-align: center;
      background: rgba(0, 0, 0, 0.5);
      color: #fff;
      font-size: 11px;
    }
  }
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #0091ff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 10px;
  }
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>