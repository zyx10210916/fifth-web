<template>
  <div :class="['map-container', { 'full-size': isFullSize }]">
    <div id="viewDiv" style="width: 100%; height: 100vh; position: relative;">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <div class="loading-text">{{ loadingText }}</div>
        </div>
      </div>

      <slot name="map-overlay"></slot>

      <template v-if="mapIsReady">
        <BuildingLayer ref="buildingLayerRef" :view="view" :modules="mapModules" :visible="layersState.building.visible"
          @loaded="(data) => $emit('building-loaded', data)" @loading-status="s => updateLayerLoading('building', s)" />

        <HouseLayer :view="view" :modules="mapModules" :visible="layersState.house.visible"
          @loading-status="s => updateLayerLoading('house', s)" />

        <HeatmapLayer v-if="showHeatmapOption" :view="view" :modules="mapModules" :visible="layersState.heatmap.visible"
          @loading-status="s => updateLayerLoading('heatmap', s)" />
      </template>

      <ul class="mapType">
        <li v-for="item in mapList" :key="item.id" @click="handleBasemapChange(item.id)"
          :class="['item', item.className, { actived: activeBasemapId === item.id }]"
          :style="{ backgroundImage: `url(${activeBasemapId === item.id ? item.imgActive : item.imgNormal})` }">
          <span class="map-label">{{ item.name }}</span>
        </li>
      </ul>

      <MapTools 
        ref="mapToolsRef" :view="view" :modules="mapModules"  :appendMode="appendMode" 
        @map-select="handleMapSelect" 
      />

      <div class="layer-tree-panel">
        <div class="panel-header">
          <h3>目录树</h3>
          <button @click="togglePanel" class="toggle-btn">{{ panelVisible ? '隐藏' : '显示' }}</button>
        </div>

        <div v-if="panelVisible" class="tree-content">
          <div class="tree-node tree-group"><label>经济普查数据</label></div>

          <div class="tree-node">
            <input type="checkbox" id="building" v-model="layersState.building.visible" @change="handleBuildingToggle"
              class="tree-checkbox">
            <label for="building" class="tree-label">
              企业建筑点
              <span v-if="layersState.building.isFetching" style="color: #999; margin-left: 4px;">(加载中...)</span>
            </label>
          </div>

          <div v-if="showHeatmapOption" class="tree-node">
            <input type="checkbox" id="heatmap" v-model="layersState.heatmap.visible" class="tree-checkbox">
            <label for="heatmap" class="tree-label">
              企业热力图
              <span v-if="layersState.heatmap.isFetching" style="color: #999; margin-left: 4px;">(加载中...)</span>
            </label>
          </div>

          <div class="tree-node">
            <input type="checkbox" id="house" v-model="layersState.house.visible" class="tree-checkbox">
            <label for="house" class="tree-label">
              企业房屋面
              <span v-if="layersState.house.isFetching" style="color: #999; margin-left: 4px;">(加载中...)</span>
            </label>
          </div>

          <div class="tree-node tree-group"><label>基础地理数据</label></div>

          <div class="tree-node">
            <input type="checkbox" id="basemap-toggle" v-model="basemapVisible" @change="updateBasemapVisibility"
              class="tree-checkbox">
            <label for="basemap-toggle" class="tree-label">底图</label>
          </div>

          <div v-for="layer in boundaryLayers" :key="layer.id" class="tree-node">
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
import { ref, shallowRef, onMounted, onUnmounted, computed, markRaw, nextTick, provide } from 'vue';
import { loadModules } from 'esri-loader';
import MapTools from './MapTools.vue';
import BuildingLayer from './layers/BuildingLayer.vue';
import HeatmapLayer from './layers/HeatmapLayer.vue';
import HouseLayer from './layers/HouseLayer.vue';
import { MAP_CONFIG } from '@/config/mapConfig';
import { query } from '@/utils/mapQuery';

export default {
  name: 'MapView',
  components: { MapTools, BuildingLayer, HeatmapLayer, HouseLayer },
  props: {
    isFullSize: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    loadingText: { type: String, default: '正在加载地图...' },
    initialExtent: { type: Object, default: () => MAP_CONFIG.initialExtent },
    boundaryLayersConfig: { type: Object, default: () => MAP_CONFIG.boundary.layers },
    boundaryBaseUrl: { type: String, default: MAP_CONFIG.boundary.baseUrl },
    houseLayerUrl: { type: String, default: MAP_CONFIG.economic.houseUrl },
    appendMode: { type: Boolean, default: false },
    showHeatmapOption: { type: Boolean, default: false }
  },
  emits: ['map-select', 'map-loaded', 'building-loaded', 'house-loaded', 'heatmap-visible'],

  setup(props, { emit, expose }) {
    const view = shallowRef(null);
    const mapModules = shallowRef(null);
    const mapIsReady = ref(false);
    const buildingLayerRef = ref(null);
    const panelVisible = ref(true);
    const basemapVisible = ref(true);
    const mapList = MAP_CONFIG.basemapUI;
    const activeBasemapId = ref('street');
    const mapToolsRef = ref(null);
    const highlightRef = shallowRef(null);
    const layers = ref([]);

    // 基础边界图层计算属性
    const boundaryLayers = computed(() => layers.value.filter(l => l.type === 'boundary'));

    // --- 核心重构：统一图层状态管理 ---
    const layersState = ref({
      building: { visible: false, isFetching: false, loaded: false },
      house: { visible: false, isFetching: false },
      heatmap: { visible: false, isFetching: false }
    });

    // 统一处理各子图层的加载状态回调
    const updateLayerLoading = (layerKey, status) => {
      layersState.value[layerKey].isFetching = status;
      if (layerKey === 'building' && !status) {
        layersState.value.building.loaded = true;
      }
    };

    const handleBuildingToggle = () => {
      if (layersState.value.building.visible && !layersState.value.building.loaded) {
        buildingLayerRef.value?.triggerFullLoad();
      }
    };

    const initializeMap = async () => {
      try {
    // 1. 从配置中提取路径和名称
    const moduleEntries = Object.entries(MAP_CONFIG.modules);
    const paths = moduleEntries.map(([path]) => path);
    const names = moduleEntries.map(([, name]) => name);

    // 2. 加载模块数组
    const loadedArr = await loadModules(paths, { 
      url: MAP_CONFIG.arcgis.js, 
      css: MAP_CONFIG.arcgis.css 
    });

    // 3. 构建语义化对象 (关键：不再使用索引)
    const modulesObj = {};
    names.forEach((name, index) => {
      modulesObj[name] = loadedArr[index];
    });
    
    // 4. 存储并提供给子组件
    mapModules.value = markRaw(modulesObj);
    provide('arcgisModules', mapModules.value);

    // 5. 使用解构方式获取模块，代码更稳固
    const { Map, MapView, Basemap } = modulesObj;

        const map = new Map({
          basemap: new Basemap({
            // baseLayers: [new TileLayer({ url: MAP_CONFIG.basemaps.street })],
            baseLayers: null,
            id: "street"
          })
        });

        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: { wkid: 4526 },
          extent: props.initialExtent,
        });

        view.value.when(async () => {
          console.log("地图视图初始化完成");
          mapIsReady.value = true;
          await nextTick();

          // 加载行政边界（如需要）
          // await loadBoundaryLayers(map);

          view.value.on("click", handleMapClick);
          emit('map-loaded', { view: view.value, map, modules: mapModules.value });
        });
      } catch (error) {
        console.error("地图初始化失败:", error);
      }
    };

    const handleMapClick = async (event) => {
      if (!view.value || !mapModules.value) return;
      const { Graphic,geometryEngine, Point } = mapModules.value;

      const hitTest = await view.value.hitTest(event);
      const priorityIds = ["house", "town", "district"];
      let bestFit = null;

      // 判定逻辑适配重构后的 layersState
      for (const id of priorityIds) {
        const isVisible = id === 'house' 
          ? layersState.value.house.visible 
          : layers.value.find(l => l.id === id)?.visible;

        if (isVisible) {
          const hit = hitTest.results.find(r => r.graphic?.layer?.id === id);
          if (hit) {
            bestFit = hit.graphic;
            break;
          }
        }
      }

      if (bestFit) {
        if (!props.appendMode) view.value.graphics.removeAll();

        // 1. 高亮面
        view.value.graphics.add(new Graphic({
          geometry: bestFit.geometry,
          symbol: MAP_CONFIG.styles.highlightPolygon
        }));

        // 2. 调用外部查询函数
        const result = await query(bestFit.geometry, mapModules.value);

        // 3. 渲染结果
        view.value.graphics.addMany(result.graphics);
        emit('map-select', { zxAxis: result.zxAxis, yxAxis: result.yxAxis });
      }
    }

    // --- 暴露给外部调用的方法 ---
    const fetchBuildingPoints = async (params) => {
      return await buildingLayerRef.value?.fetchBuildingPoints(params);
    };

    const handleBasemapChange = (id) => {
      const [, , , , , Basemap, TileLayer] = mapModules.value;
      view.value.map.basemap = new Basemap({
        baseLayers: [new TileLayer({ url: MAP_CONFIG.basemaps[id], visible: basemapVisible.value })],
        id: id
      });
      activeBasemapId.value = id;
    };

    const updateLayerVisibility = (layer) => {
      if (layer.instance) layer.instance.visible = layer.visible;
    };

    const updateBasemapVisibility = () => {
      view.value.map.basemap.baseLayers.forEach(lyr => lyr.visible = basemapVisible.value);
    };

    onMounted(initializeMap);
    onUnmounted(() => { if (view.value) view.value.destroy(); });

    expose({
      fetchBuildingPoints,
      getMapView: () => view.value,
      clearMapTools: () => mapToolsRef.value?.clearAll()
    });

    return {
      view, mapModules, mapIsReady, buildingLayerRef, layersState,
      panelVisible, boundaryLayers, mapList, mapToolsRef,
      activeBasemapId, basemapVisible,
      togglePanel: () => panelVisible.value = !panelVisible.value,
      handleBuildingToggle,
      updateLayerLoading,
      updateLayerVisibility,
      handleBasemapChange,
      updateBasemapVisibility,
      handleMapSelect: (payload) => emit('map-select', payload),
      getMapView: () => view.value
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
}

.layer-tree-panel {
  position: absolute;
  top: 1%;
  left: 6%;
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
  top: 75%;
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