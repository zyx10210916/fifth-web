<template>
  <div class="heatmap-container">
    <div id="heatmapViewDiv" style="width: 100%; height: 100vh; position: relative;">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <div class="loading-text">{{ loadingText }}</div>
        </div>
      </div>

      <button @click="goBack" class="back-btn">返回地图</button>

      <div class="heatmap-controls">
        <div class="control-group">
          <div class="label-text">热力图权重字段：</div>
          <select v-model="selectedHeatmapField" @change="handleFieldChange" class="custom-select">
            <option value="">-- 仅按分布密度 --</option>
            <option v-for="field in fieldOptions" :key="field.value" :value="field.value">
              {{ field.label }}
            </option>
          </select>
          <div class="tip-text">当前状态: {{ currentFieldLabel }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, shallowRef, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { loadModules } from 'esri-loader';
import { MAP_CONFIG } from '@/config/mapConfig';

export default {
  name: 'HeatmapView',
  setup() {
    const router = useRouter();
    const view = shallowRef(null);
    const loading = ref(true);
    const loadingText = ref('正在加载热力图...');
    const selectedHeatmapField = ref("");
    
    const fieldOptions = ref([
      { value: "QMRS", label: "期末人数", type: "Long" },
      { value: "ZCZJ", label: "资产总计", type: "Double" },
      { value: "ZYSR", label: "主营收入", type: "Double" },
      { value: "CYRS", label: "从业人数", type: "Double" }
    ]);

    const currentFieldLabel = computed(() => {
      if (!selectedHeatmapField.value) return "仅按分布密度";
      const field = fieldOptions.value.find(f => f.value === selectedHeatmapField.value);
      return field ? field.label : "未知字段";
    });

    const initializeMap = async () => {
      try {
        // 从sessionStorage获取数据
        const mapPointsData = JSON.parse(sessionStorage.getItem('heatmapData') || '[]');
        
        const [FeatureLayer, Graphic, Map, MapView, SpatialReference] = await loadModules([
          'esri/layers/FeatureLayer', 'esri/Graphic', 'esri/Map', 'esri/views/MapView', 'esri/geometry/SpatialReference'
        ], {
          url: MAP_CONFIG.arcgis.js,
          css: MAP_CONFIG.arcgis.css
        });

        // 创建点图形
        const graphics = mapPointsData.map((item, index) => new Graphic({
          geometry: { 
            type: "point", 
            x: item.XZ_AXIS, 
            y: item.YZ_AXIS, 
            spatialReference: new SpatialReference({ wkid: 4526 }) 
          },
          attributes: { ...item, custom_oid: index }
        }));

        // 创建热力图图层
        const heatmapLayer = new FeatureLayer({
          id: "heatmap_layer",
          title: "企业热力图",
          source: graphics,
          objectIdField: "custom_oid",
          renderer: createHeatmapRenderer(selectedHeatmapField.value),
          visible: true
        });

        const map = new Map({
          basemap: "streets",
          layers: [heatmapLayer]
        });

        view.value = new MapView({
          container: "heatmapViewDiv",
          map: map,
          spatialReference: new SpatialReference({ wkid: 4526 }),
          extent: MAP_CONFIG.initialExtent,
          ui: { components: [] }
        });

        view.value.when(() => {
          loading.value = false;
        });

      } catch (error) {
        console.error("热力图初始化失败:", error);
        loading.value = false;
      }
    };

    const createHeatmapRenderer = (fieldName) => {
      const isMoneyField = ["ZCZJ", "ZYSR"].includes(fieldName);
      return {
        type: "heatmap", 
        field: fieldName || null,
        colorStops: [
          { color: "rgba(0, 255, 255, 0)", ratio: 0 },
          { color: "rgba(0, 255, 255, 0.7)", ratio: 0.2 },
          { color: "rgb(0, 255, 0)", ratio: 0.4 },
          { color: "rgb(255, 255, 0)", ratio: 0.6 },
          { color: "rgb(255, 0, 0)", ratio: 0.9 }
        ],
        radius: 18, 
        maxPixelIntensity: isMoneyField ? 100000 : 100, 
        minPixelIntensity: 0
      };
    };

    const handleFieldChange = async () => {
      if (!view.value) return;
      
      const [FeatureLayer] = await loadModules(['esri/layers/FeatureLayer'], {
        url: MAP_CONFIG.arcgis.js
      });
      
      const oldLayer = view.value.map.findLayerById("heatmap_layer");
      if (oldLayer) {
        const currentVisible = oldLayer.visible;
        view.value.map.remove(oldLayer);
        
        const graphics = oldLayer.source;
        const newLayer = new FeatureLayer({
          id: "heatmap_layer",
          title: "企业热力图",
          source: graphics,
          objectIdField: "custom_oid",
          renderer: createHeatmapRenderer(selectedHeatmapField.value),
          visible: currentVisible
        });
        
        view.value.map.add(newLayer);
      }
    };

    const goBack = () => {
      router.go(-1);
    };

    onMounted(initializeMap);
    onUnmounted(() => {
      if (view.value) {
        view.value.destroy();
      }
    });

    return {
      loading,
      loadingText,
      selectedHeatmapField,
      fieldOptions,
      currentFieldLabel,
      handleFieldChange,
      goBack
    };
  }
};
</script>

<style lang="scss" scoped>
.heatmap-container {
  flex: 1;
  background: white;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0091ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.heatmap-controls {
  position: absolute;
  top: 20px;
  left: 80px;
  z-index: 50;
  background: white;
  border-radius: 6px;
  width: 260px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  padding: 15px;
}

.control-group {
  margin-bottom: 15px;

  .label-text {
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
  }

  .tip-text {
    font-size: 11px;
    color: #999;
    margin-top: 5px;
    text-align: right;
  }
}

.custom-select {
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}
</style>