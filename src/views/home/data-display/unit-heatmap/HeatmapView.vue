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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';

// OpenLayers 核心组件
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Heatmap as HeatmapLayer, VectorTile as VectorTileLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import TileGrid from 'ol/tilegrid/TileGrid';
import { get as getProjection } from 'ol/proj';
import { getTopLeft, getWidth } from 'ol/extent';

export default {
  name: 'VectorTileHeatmapView',
  setup() {
    const router = useRouter();
    const mapInstance = ref(null);
    const heatmapLayer = ref(null);
    const loading = ref(true);
    const loadingText = ref('正在加载矢量热力数据...');

    const selectedHeatmapField = ref("");
    const fieldOptions = ref([
      { value: "QMRS", label: "期末人数" },
      { value: "ZCZJ", label: "资产总计" },
      { value: "ZYSR", label: "主营收入" },
      { value: "CYRS", label: "从业人数" }
    ]);

    const currentFieldLabel = computed(() => {
      if (!selectedHeatmapField.value) return "仅按分布密度";
      const field = fieldOptions.value.find(f => f.value === selectedHeatmapField.value);
      return field ? field.label : "未知字段";
    });

    // GeoServer 矢量切片服务地址
    const vtUrl = "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/gwc/demo/dataCenterWorkspace:gongbaokuqiyedianpc38_1?gridSet=EPSG:4326&format=application/vnd.mapbox-vector-tile&tile={z}&x={x}&y={y}";

    const initMap = () => {
      const projection = getProjection('EPSG:4326');
      const projectionExtent = projection.getExtent(); // [-180, -90, 180, 90]

      // 1. 核心修复：精准匹配 GeoServer 4326 切片网格
      // GeoServer 4326 方案通常第0层是 2x1 个切片覆盖全球
      const resolutions = [];
      const tileSize = 256;
      const initialResolution = getWidth(projectionExtent) / tileSize / 2; // 0.703125
      for (let i = 0; i <= 20; i++) {
        resolutions.push(initialResolution / Math.pow(2, i));
      }

      const vtSource = new VectorTileSource({
        format: new MVT(),
        url: vtUrl,
        projection: projection,
        tileGrid: new TileGrid({
          extent: projectionExtent,
          resolutions: resolutions,
          tileSize: [tileSize, tileSize],
          origin: getTopLeft(projectionExtent) // 必须是 [-180, 90]
        }),
        // 调试用：如果是身份认证问题，可以在这里处理
        tileLoadFunction: (tile, url) => {
          tile.setLoader((extent, resolution, projection) => {
            fetch(url).then(response => {
              if (response.ok) {
                response.arrayBuffer().then(data => {
                  const format = tile.getFormat();
                  const features = format.readFeatures(data, {
                    extent: extent,
                    featureProjection: projection
                  });
                  tile.setFeatures(features);
                });
              } else {
                console.error('切片请求失败:', url);
                tile.setState(3); // Error state
              }
            });
          });
        }
      });

      // 2. 热力图矢量源
      const heatmapSource = new VectorSource();

      // 3. 不可见的切片层（用于触发请求）
      const dataLoaderLayer = new VectorTileLayer({
        source: vtSource,
        visible: true,
        opacity: 0
      });

      // 4. 监听要素提取
      vtSource.on('tileloadend', (event) => {
        const features = event.tile.getFeatures();
        if (features && features.length > 0) {
          heatmapSource.addFeatures(features);
        }
      });

      // 5. 热力图展示层
      heatmapLayer.value = new HeatmapLayer({
        source: heatmapSource,
        blur: 25,
        radius: 15,
        weight: (feature) => {
          const field = selectedHeatmapField.value;
          if (!field) return 1;
          const val = parseFloat(feature.get(field)) || 0;
          const scalar = ["ZCZJ", "ZYSR"].includes(field) ? 50000 : 100;
          return Math.min(val / scalar, 1);
        }
      });

      // 6. 初始化地图
      mapInstance.value = new Map({
        target: 'heatmapViewDiv',
        layers: [dataLoaderLayer, heatmapLayer.value],
        view: new View({
          projection: 'EPSG:4326',
          center: [113.2644, 23.1291], // 广州中心
          zoom: 12,
          maxZoom: 20
        })
      });

      loading.value = false;
    };

    const handleFieldChange = () => {
      if (heatmapLayer.value) {
        heatmapLayer.value.setWeight((feature) => {
          const field = selectedHeatmapField.value;
          if (!field) return 1;
          const val = parseFloat(feature.get(field)) || 0;
          const scalar = ["ZCZJ", "ZYSR"].includes(field) ? 50000 : 100;
          return Math.min(val / scalar, 1);
        });
      }
    };

    const goBack = () => router.go(-1);

    onMounted(() => setTimeout(initMap, 200));
    onUnmounted(() => mapInstance.value?.setTarget(null));

    return {
      loading, loadingText, selectedHeatmapField, fieldOptions,
      currentFieldLabel, handleFieldChange, goBack
    };
  }
};
</script>

<style lang="scss" scoped>
/* 样式与之前保持一致 */
.heatmap-container {
  flex: 1;
  background: #000;
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
  margin-bottom: 10px;
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
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.heatmap-controls {
  position: absolute;
  top: 20px;
  left: 120px;
  z-index: 50;
  background: white;
  border-radius: 6px;
  width: 260px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.control-group {
  .label-text {
    font-size: 13px;
    font-weight: bold;
    margin-bottom: 8px;
    display: block;
  }

  .tip-text {
    font-size: 11px;
    color: #999;
    text-align: right;
    margin-top: 8px;
  }
}

.custom-select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>