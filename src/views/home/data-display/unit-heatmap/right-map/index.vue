<template>
  <div :class="['map-container', { 'full-size': isFullSize }]">
    <div id="viewDiv" style="width: 100%; height: 100vh; position: relative;">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <div class="loading-text">{{ loadingText }}</div>
        </div>
      </div>

      <ul class="mapType">
        <li v-for="item in mapList" :key="item.id" @click="handleBasemapChange(item.id)"
          :class="['item', item.className, { actived: activeBasemapId === item.id }]"
          :style="{ backgroundImage: `url(${activeBasemapId === item.id ? item.imgActive : item.imgNormal})` }">
          <span class="map-label">{{ item.name }}</span>
        </li>
      </ul>

      <div class="layer-tree-panel">
        <div class="panel-header">
          <h3>热力图分析</h3>
          <button @click="togglePanel" class="toggle-btn">{{ panelVisible ? '隐藏' : '显示' }}</button>
        </div>

        <div v-if="panelVisible" class="tree-content">
          <div class="tree-node tree-group"><label>分析设置</label></div>
          <div class="config-section">
            <div class="label-text">热力图权重字段：</div>
            <select v-model="selectedHeatmapField" @change="handleFieldChange" class="custom-select">
              <option value="">-- 仅按分布密度 --</option>
              <option v-for="field in fieldOptions" :key="field.value" :value="field.value">
                {{ field.label }}
              </option>
            </select>
            <div class="tip-text">当前状态: {{ currentFieldLabel }}</div>
          </div>

          <div class="tree-node tree-group"><label>图层控制</label></div>
          <div v-for="layer in layers" :key="layer.id" class="tree-node">
            <input type="checkbox" :id="layer.id" v-model="layer.visible" @change="updateLayerVisibility(layer)"
              class="tree-checkbox">
            <label :for="layer.id" class="tree-label">{{ layer.title }}</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, shallowRef, onMounted, onUnmounted, computed, markRaw, watch } from 'vue';
import { loadModules } from 'esri-loader';
import { MAP_CONFIG } from '@/config/mapConfig';

export default {
  name: 'ArcGISHeatmapPro',
  props: {
    isFullSize: { type: Boolean, default: false },
    selectedUnit: Object,
    mapPointsData: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  },

  setup(props, { expose, emit }) {
    // ========== 状态管理 ==========
    const view = shallowRef(null);
    const mapModules = shallowRef(null);
    const panelVisible = ref(true);
    const loading = ref(true);
    const loadingText = ref('正在加载地图...');
    const layers = ref([]); // 存储所有动态加载的图层引用
    const activeBasemapId = ref('street');
    const mapList = MAP_CONFIG.basemapUI;
    const selectedHeatmapField = ref("");
    const highlightGraphic = shallowRef(null);
    const highlightRef = shallowRef(null);

    // 权重字段配置 (变量名保持 fieldOptions)
    const fieldOptions = ref([
      { value: "QMRS", label: "期末人数", type: "Long" },
      { value: "ZCZJ", label: "资产总计", type: "Double" },
      { value: "ZYSR", label: "主营收入", type: "Double" },
      { value: "CYRS", label: "从业人数", type: "Integer" }
    ]);

    // ========== 计算属性 ==========
    const currentFieldLabel = computed(() => {
      if (!selectedHeatmapField.value) return "仅按分布密度";
      const field = fieldOptions.value.find(f => f.value === selectedHeatmapField.value);
      return field ? field.label : "未知字段";
    });

    // ========== 地图操作函数 ==========
    const initializeMap = async () => {
      try {
        const modules = await loadModules([
          'esri/layers/FeatureLayer', 'esri/Graphic', 'esri/Map', 'esri/views/MapView',
          'esri/geometry/SpatialReference', 'esri/Basemap', 'esri/layers/TileLayer',
          'esri/widgets/Popup', 'esri/tasks/support/Query', 'esri/symbols/SimpleFillSymbol'
        ], {
          url: MAP_CONFIG.arcgis.js,
          css: MAP_CONFIG.arcgis.css
        });

        mapModules.value = modules;
        const [FeatureLayer, Graphic, Map, MapView, SpatialReference, Basemap, TileLayer] = modules;

        const map = new Map({
          basemap: new Basemap({
            baseLayers: [new TileLayer({ url: MAP_CONFIG.basemaps.street })],
            id: "street"
          })
        });

        const sr = new SpatialReference({ wkid: 4526 });

        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: sr,
          extent: MAP_CONFIG.initialExtent,
          ui: { components: [] }
        });

        view.value.when(async () => {
          await loadBuildingPoints(map); // 加载基础点
          await createHeatmap(map);       // 基于点创建热力图
          await loadBoundaryLayers(map); // 加载边界
          await loadHouseLayer(map);    // 加载房屋面

          view.value.on("click", handleMapClickQuery);
          loading.value = false;
        });

      } catch (error) {
        console.error("地图初始化失败:", error);
        loading.value = false;
      }
    };

    // 加载行政边界
    const loadBoundaryLayers = async (map) => {
      const [FeatureLayer] = mapModules.value;
      for (const [key, conf] of Object.entries(MAP_CONFIG.boundary.layers)) {
        const layer = new FeatureLayer({
          url: `${MAP_CONFIG.boundary.baseUrl}/${conf.layerId}`,
          id: key,
          title: conf.title,
          outFields: ["*"],
          renderer: {
            type: "simple",
            symbol: {
              type: "simple-fill",
              color: [0, 0, 0, 0],
              outline: {
                color: conf.outlineColor || [70, 130, 180, 0.8],
                width: 1.5
              }
            }
          },
          visible: false // 初始隐藏
        });
        map.add(layer);
        layers.value.push({
          id: key,
          title: conf.title,
          visible: false,
          instance: markRaw(layer),
          type: "boundary"
        });
      }
    };

    // 加载企业房屋面
    const loadHouseLayer = async (map) => {
      try {
        const [FeatureLayer, Graphic] = mapModules.value;
        const response = await fetch(MAP_CONFIG.economic.houseUrl);
        const geoJson = await response.json();

        const graphics = geoJson.features.map((feature, index) => {
          return new Graphic({
            geometry: {
              type: "polygon",
              rings: feature.geometry.coordinates[0],
              spatialReference: { wkid: 4526 }
            },
            attributes: { ...feature.properties, ObjectID: index }
          });
        });

        const houseLayer = new FeatureLayer({
          id: "enterprise_house",
          title: "企业房屋面",
          source: graphics,
          objectIdField: "ObjectID",
          fields: [{ name: "ObjectID", type: "oid" }],
          renderer: {
            type: "simple",
            symbol: {
              type: "simple-fill",
              color: [0, 197, 255, 0.3],
              outline: { color: [0, 112, 255, 0.8], width: 1.5 }
            }
          },
          visible: false
        });

        map.add(houseLayer);
        layers.value.push({
          id: "enterprise_house",
          title: "企业房屋面",
          visible: false,
          instance: markRaw(houseLayer),
          type: "economic"
        });
      } catch (err) {
        console.error("房屋面加载失败:", err);
      }
    };

    // 加载基础建筑点 
    const loadBuildingPoints = async (map) => {
      const [FeatureLayer, Graphic] = mapModules.value;
      const buildingData = props.mapPointsData || [];
      if (buildingData.length === 0) return;

      const graphics = buildingData.map((item, index) => {
        const x = parseFloat(item.XZ_AXIS);
        const y = parseFloat(item.YZ_AXIS);
        if (isNaN(x) || isNaN(y)) return null;
        return new Graphic({
          geometry: { type: "point", x, y, spatialReference: { wkid: 4526 } },
          attributes: { ...item, custom_oid: index }
        });
      }).filter(Boolean);

      const layer = new FeatureLayer({
        id: "building_points",
        title: "企业建筑点",
        source: graphics,
        objectIdField: "custom_oid",
        fields: [{ name: "custom_oid", type: "oid" }, { name: "B109", type: "string" }],
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-marker",
            color: MAP_CONFIG.styles.buildingMarker.color,
            outline: { color: MAP_CONFIG.styles.buildingMarker.outlineColor, width: 1 },
            size: MAP_CONFIG.styles.buildingMarker.size
          }
        },
        visible: true
      });

      map.add(layer);
      layers.value.push({ id: "building_points", title: "企业建筑点", visible: true, instance: markRaw(layer), type: "economic" });
    };

    // 创建热力图图层
    const createHeatmap = async (map) => {
      const [FeatureLayer] = mapModules.value;
      const buildingLayer = map.findLayerById("building_points");
      if (!buildingLayer) return;

      const heatmapLayer = new FeatureLayer({
        id: "heatmap_layer",
        title: "企业热力图",
        source: buildingLayer.source,
        objectIdField: "custom_oid",
        spatialReference: { wkid: 4526 },
        renderer: createHeatmapRenderer(selectedHeatmapField.value),
        visible: true
      });

      map.add(heatmapLayer);
      layers.value.push({ id: "heatmap_layer", title: "企业热力图", visible: true, instance: markRaw(heatmapLayer), type: "economic" });
    };

    // 创建热力图渲染器配置
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

    // ========== 交互处理函数 ==========
    const handleMapClickQuery = async (event) => {
      if (!view.value || !mapModules.value) return;
      const [, , , Graphic, , , , , SimpleFillSymbol, Query] = mapModules.value;

      const clearHighlight = () => {
        if (highlightRef.value) {
          view.value.graphics.remove(highlightRef.value);
          highlightRef.value = null;
        }
      };

      try {
        const hitTest = await view.value.hitTest(event);
        // 定义点击优先级
        const priorityIds = ["enterprise_house", "town", "district"];
        let bestFit = null;

        for (const id of priorityIds) {
          const hit = hitTest.results.find(r => r.graphic?.layer?.id === id);
          if (hit) { bestFit = hit.graphic; break; }
        }

        if (!bestFit) { clearHighlight(); return; }

        // 高亮选中区域
        clearHighlight();
        highlightRef.value = new Graphic({
          geometry: bestFit.geometry,
          symbol: new SimpleFillSymbol({
            color: [0, 255, 255, 0.25],
            outline: { color: [0, 255, 255, 1], width: 2.5 }
          })
        });
        view.value.graphics.add(highlightRef.value);

        // 空间查询企业点
        const buildingLayer = view.value.map.findLayerById("building_points");
        if (buildingLayer) {
          const query = new Query();
          query.geometry = bestFit.geometry;
          query.spatialRelationship = "intersects";
          query.outFields = ["B109"];
          const result = await buildingLayer.queryFeatures(query);

          if (result.features.length > 0) {
            const b109Codes = result.features.map(f => f.attributes.B109).filter(c => c && c !== 'null').join(',');
            emit('map-select', b109Codes);
          } else {
            loadingText.value = "该区域内未发现企业点";
            loading.value = true;
            setTimeout(() => (loading.value = false), 1000);
          }
        }
      } catch (err) {
        console.error("查询异常:", err);
      }
    };

    // ========== UI交互函数 ==========
    const handleBasemapChange = (id) => {
      if (!view.value || activeBasemapId.value === id) return;
      const [, , , , , Basemap, TileLayer] = mapModules.value;
      view.value.map.basemap = new Basemap({
        baseLayers: [new TileLayer({ url: MAP_CONFIG.basemaps[id] })],
        id: id
      });
      activeBasemapId.value = id;
    };

    const updateLayerVisibility = (layerItem) => {
      if (layerItem.instance) {
        layerItem.instance.visible = layerItem.visible;
      }
    };

    const handleFieldChange = async () => {
      if (!view.value) return;
      // 找到并移除旧的热力图图层
      const oldLayer = view.value.map.findLayerById("heatmap_layer");
      if (oldLayer) view.value.map.remove(oldLayer);
      layers.value = layers.value.filter(l => l.id !== "heatmap_layer");

      await createHeatmap(view.value.map);
    };

    const togglePanel = () => { panelVisible.value = !panelVisible.value; };

    // ========== 生命周期 ==========
    onMounted(initializeMap);
    onUnmounted(() => {
      if (highlightRef.value) view.value?.graphics.remove(highlightRef.value);
      view.value?.destroy();
    });

    // 暴露给父组件的方法
    expose({
      locateEnterprise: (unit) => {
        if (!unit?.WYM || !view.value) return;
        // 定位逻辑...
      }
    });

    return {
      view,
      panelVisible,
      loading,
      loadingText,
      layers,
      mapList,
      activeBasemapId,
      fieldOptions,
      selectedHeatmapField,
      currentFieldLabel,
      updateLayerVisibility,
      handleBasemapChange,
      handleFieldChange,
      togglePanel
    };
  }
};
</script>

<style lang="scss" scoped>
.map-container {
  flex: 1;
  background: white;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
  position: relative;

  &.full-size {
    margin: 0 !important;
  }

  #viewDiv {
    height: 100%;
  }
}

.layer-tree-panel {
  position: absolute;
  top: 20px;
  left: 2%;
  z-index: 50;
  background: white;
  border-radius: 6px;
  width: 260px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.panel-header {
  padding: 10px 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 15px;
    color: #333;
  }

  .toggle-btn {
    background: #0091ff;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
  }
}

.tree-content {
  padding: 15px;
}

.tree-node {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
}

.tree-group {
  font-weight: bold;
  border-left: 3px solid #0091ff;
  padding-left: 8px;
  margin-top: 15px;
}

.tree-checkbox {
  margin-right: 10px;
  cursor: pointer;
}

.config-section {
  background: #f0f7ff;
  padding: 10px;
  border-radius: 6px;
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
  outline: none;
  font-size: 13px;
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

.mapType {
  position: absolute;
  bottom: 2%;
  right: 20px;
  z-index: 100;
  display: flex;
  gap: 10px;
  list-style: none;

  .item {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    border: 2px solid white;
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
      color: white;
      font-size: 11px;
    }
  }
}
</style>