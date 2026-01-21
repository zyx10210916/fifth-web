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

      <BuildingLayer v-if="mapIsReady" ref="buildingLayerRef" :view="view" :modules="mapModules"
        :visible="buildingLayerState.visible" @loaded="(data) => $emit('building-loaded', data)" />

      <ul class="mapType">
        <li v-for="item in mapList" :key="item.id" @click="handleBasemapChange(item.id)"
          :class="['item', item.className, { actived: activeBasemapId === item.id }]"
          :style="{ backgroundImage: `url(${activeBasemapId === item.id ? item.imgActive : item.imgNormal})` }">
          <span class="map-label">{{ item.name }}</span>
        </li>
      </ul>

      <MapTools ref="mapToolsRef" :view="view" :appendMode="appendMode" @select-complete="handleMapSelection" />

      <div class="layer-tree-panel">
        <div class="panel-header">
          <h3>目录树</h3>
          <button @click="togglePanel" class="toggle-btn">{{ panelVisible ? '隐藏' : '显示' }}</button>
        </div>

        <div v-if="panelVisible" class="tree-content">
          <div class="tree-node tree-group"><label>经济普查数据</label></div>
          <div class="tree-node">
            <input type="checkbox" id="building" v-model="buildingLayerState.visible" class="tree-checkbox">
            <label for="building" class="tree-label">企业建筑点</label>
          </div>
          <div v-if="showHeatmapOption" class="tree-node">
            <input type="checkbox" id="heatmap" v-model="heatmapVisible" @change="$emit('heatmap-visible', heatmapVisible)" class="tree-checkbox">
            <label for="heatmap" class="tree-label">企业热力图</label>
          </div>
          <div class="tree-node">
            <input type="checkbox" id="house" v-model="houseLayer.visible" @change="updateLayerVisibility(houseLayer)" class="tree-checkbox">
            <label for="house" class="tree-label">企业房屋面<span v-if="houseLayer.isFetching">(加载中...)</span></label>
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
import { ref, shallowRef, onMounted, onUnmounted, computed, markRaw, nextTick } from 'vue';
import { loadModules } from 'esri-loader';
import MapTools from './MapTools.vue';
import BuildingLayer from './BuildingLayer.vue';
import { MAP_CONFIG } from '@/config/mapConfig';

export default {
  name: 'MapView',
  components: { MapTools, BuildingLayer },
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
    const heatmapVisible = ref(false);
    const panelVisible = ref(true);
    const basemapVisible = ref(true);
    const mapList = MAP_CONFIG.basemapUI;
    const activeBasemapId = ref('street');
    const mapToolsRef = ref(null);
    const highlightRef = shallowRef(null);
    const layers = ref([]);
    const boundaryLayers = computed(() => layers.value.filter(l => l.type === 'boundary'));
    const buildingLayerState = ref({ visible: true });

    // 转发清除方法
    const clearMapTools = () => {
      mapToolsRef.value?.clearAll();
    };

    const houseLayer = ref({
      id: "house",
      title: "企业房屋面",
      visible: false,
      type: "economic",
      isFetching: false,
      loaded: false,
      instance: null
    });

    const initializeMap = async () => {
      try {
        const modules = await loadModules([
          'esri/Map', 'esri/views/MapView', 'esri/layers/FeatureLayer',
          'esri/Graphic', 'esri/geometry/SpatialReference', 'esri/Basemap',
          'esri/layers/TileLayer', 'esri/layers/GeoJSONLayer',
          'esri/symbols/SimpleFillSymbol', 'esri/tasks/support/Query',
          'esri/layers/WMSLayer', 'esri/widgets/Zoom'
        ], { url: MAP_CONFIG.arcgis.js, css: MAP_CONFIG.arcgis.css });

        mapModules.value = modules;
        const [
          Map, MapView, FeatureLayer, Graphic, SpatialReference,
          Basemap, TileLayer, GeoJSONLayer, SimpleFillSymbol,
          Query, WMSLayer, Zoom
        ] = modules;

        provide('arcgisModules', mapModules.value);
        provide('mapView', view.value);

        const map = new Map({
          basemap: new Basemap({
            // baseLayers: [new TileLayer({ url: MAP_CONFIG.basemaps.street })],
            basemap: null,
            id: "street"
          })
        });

        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: { wkid: 4526 },
          extent: props.initialExtent,
          ui: { components: ["zoom"] }
        });

        view.value.when(async () => {
          console.log("地图初始化完成");

          // 缩放控件
          const zoomWidget = new Zoom({
            view: view.value,
            layout: "vertical"
          });
          view.value.ui.add(zoomWidget, "bottom-right");

          mapIsReady.value = true;
          await nextTick();
          // 加载边界
          // await loadBoundaryLayers(map);

          // 加载房屋面
          await loadHouseLayer();

          view.value.on("click", handleMapClickQuery);
          emit('map-loaded', { view: view.value, map, modules: mapModules.value });
        });
      } catch (error) {
        console.error("地图初始化失败:", error);
      }
    };

    const loadBoundaryLayers = async (map) => {
      const FeatureLayer = mapModules.value[2];
      for (const [key, config] of Object.entries(props.boundaryLayersConfig)) {
        const layer = new FeatureLayer({
          url: `${props.boundaryBaseUrl}/${config.layerId}`,
          id: key,
          title: config.title,
          renderer: {
            type: "simple",
            symbol: { type: "simple-fill", color: [0, 0, 0, 0], outline: { color: config.outlineColor, width: 1.5 } }
          },
          visible: config.defaultVisible || false
        });
        map.add(layer);
        layers.value.push({ id: key, title: config.title, visible: config.defaultVisible || false, instance: markRaw(layer), type: "boundary" });
      }
    };

    const loadHouseLayer = async () => {
      if (houseLayer.value.loaded || houseLayer.value.isFetching) return;
      houseLayer.value.isFetching = true;
      const [, , FeatureLayer, Graphic] = mapModules.value;

      try {
        const response = await fetch(props.houseLayerUrl);
        const data = await response.json();

        if (!data.features || data.features.length === 0) {
          houseLayer.value.loaded = true;
          return;
        }

        // 将 GeoJSON 转换为Graphics
        const graphics = data.features.map((feature, index) => {
          let rings = [];
          if (feature.geometry.type === "MultiPolygon") {
            rings = feature.geometry.coordinates.reduce((acc, polygon) => {
              return acc.concat(polygon);
            }, []);
          } else if (feature.geometry.type === "Polygon") {
            rings = feature.geometry.coordinates;
          }

          return new Graphic({
            geometry: {
              type: "polygon",
              rings: rings,
              spatialReference: { wkid: 4526 } 
            },
            attributes: {
              ...feature.properties,
              OBJECTID: index + 1 
            }
          });
        });

        // 创建 FeatureLayer
        const layer = new FeatureLayer({
          id: "house",
          title: "企业房屋面",
          source: graphics,
          objectIdField: "OBJECTID",
          fields: [
            { name: "OBJECTID", type: "oid" },
            { name: "B109", type: "string" }
          ],
          renderer: {
            type: "simple",
            symbol: {
              type: "simple-fill",
              color: [0, 121, 193, 0.2],
              outline: { color: [0, 121, 193, 0.8], width: 1.5 }
            }
          },
          visible: houseLayer.value.visible,
          outFields: ["*"]
        });

        view.value.map.add(layer);
        houseLayer.value.instance = markRaw(layer);
        houseLayer.value.loaded = true;

      } catch (error) {
        console.error("处理房屋面数据时出错:", error);
      } finally {
        houseLayer.value.isFetching = false;
      }
    };

    const handleMapClickQuery = async (event) => {
      if (!view.value || !mapModules.value) return;
      const Graphic = mapModules.value[3];
      const SimpleFillSymbol = mapModules.value[8];

      // 清除旧高亮
      if (!props.appendMode && highlightRef.value) {
        view.value.graphics.remove(highlightRef.value);
        highlightRef.value = null;
      }

      try {
        const hitTest = await view.value.hitTest(event);
        //查找点击的企业点（通过 ID）
        const buildingHit = hitTest.results.find(r => r.graphic?.layer?.id === "building");
        if (buildingHit) {
          view.value.popup.open({ features: [buildingHit.graphic], location: event.mapPoint });
        }

        // 面图层逻辑（房屋、镇、区）
        const priorityIds = ["house", "town", "district"];
        let bestFit = null;
        for (const id of priorityIds) {
          const layerState = id === 'house' ? houseLayer.value : layers.value.find(l => l.id === id);
          if (layerState?.visible) {
            const hit = hitTest.results.find(r => r.graphic?.layer?.id === id);
            if (hit) { bestFit = hit.graphic; break; }
          }
        }

        if (bestFit) {
          const highlightGraphic = new Graphic({
            geometry: bestFit.geometry,
            symbol: new SimpleFillSymbol({ color: [0, 255, 255, 0.25], outline: { color: [0, 255, 255, 1], width: 2.5 } })
          });
          view.value.graphics.add(highlightGraphic);
          highlightRef.value = highlightGraphic;

          // 调用 BuildingLayer 的查询逻辑
          const buildingLayer = view.value.map.findLayerById("building");
          if (buildingLayer) {
            const query = buildingLayer.createQuery();
            query.geometry = bestFit.geometry;
            query.spatialRelationship = "intersects";
            query.outFields = ["WYM"];
            const result = await buildingLayer.queryFeatures(query);
            const codes = result.features.map(f => f.attributes.WYM).filter(c => c && c !== 'null').join(',');
            emit('map-select', codes || 'warn');
          }
        } else if (!buildingHit) {
          emit('map-select', '');
        }
      } catch (err) { console.error("查询失败:", err); }
    };

    // --- 供外部调用的方法（转发到 BuildingLayer 子组件） ---
    const fetchBuildingPoints = async (params) => {
      if (buildingLayerRef.value?.fetchBuildingPoints) {
        return await buildingLayerRef.value.fetchBuildingPoints(params);
      } else {
        console.warn("BuildingLayer 还未准备好方法");
      }
    };
    const loadBuildingPoints = (data) => buildingLayerRef.value?.loadBuildingPoints(data);
    const queryBuildingPoints = (cond) => buildingLayerRef.value?.queryBuildingPoints(cond);

    // 底图和图层控制方法
    const handleBasemapChange = (id) => {
      const Basemap = mapModules.value[5];
      const TileLayer = mapModules.value[6];
      view.value.map.basemap = new Basemap({
        baseLayers: [new TileLayer({ url: MAP_CONFIG.basemaps[id], visible: basemapVisible.value })],
        id: id
      });
      activeBasemapId.value = id;
    };

    const updateLayerVisibility = (layer) => {
      if (layer.instance) {
        layer.instance.visible = layer.visible;
      }
    };
    const updateBasemapVisibility = () => {
      view.value.map.basemap.baseLayers.forEach(lyr => lyr.visible = basemapVisible.value);
    };

    const togglePanel = () => panelVisible.value = !panelVisible.value;
    const handleMapSelection = (codes) => emit('map-select', codes);

    onMounted(initializeMap);
    onUnmounted(() => { if (view.value) view.value.destroy(); });

    expose({
      fetchBuildingPoints,
      getMapView: () => view.value,
      clearMapTools: () => mapToolsRef.value?.clearAll()
    });

    return {
      view, mapModules, mapIsReady, buildingLayerRef, buildingLayerState, heatmapVisible,
      panelVisible, boundaryLayers, houseLayer, mapList: MAP_CONFIG.basemapUI, mapToolsRef,
      activeBasemapId, basemapVisible, togglePanel: () => panelVisible.value = !panelVisible.value,
      updateLayerVisibility,clearMapTools,
      handleBasemapChange: (id) => { /* 底图切换逻辑 */ },
      handleMapSelection: (codes) => emit('map-select', codes),
      fetchBuildingPoints: (p) => buildingLayerRef.value?.fetchBuildingPoints(p),
      loadBuildingPoints: (d) => buildingLayerRef.value?.loadBuildingPoints(d),
      queryBuildingPoints: (c) => buildingLayerRef.value?.queryBuildingPoints(c),
      getMapView: () => view.value,
      updateBasemapVisibility: () => {
        view.value.map.basemap.baseLayers.forEach(lyr => lyr.visible = basemapVisible.value);
      },
    };
  }
};
</script>

<style lang="scss" scoped>
#viewDiv .esri-ui {
  z-index: 1000;
}

/* 自定义层级显示样式 */
.zoom-level-display {
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: bold;
  border-radius: 4px;
  margin-bottom: 20px;
  margin-left: 10px;
  z-index: 99;
}

#viewDiv .esri-ui-bottom-left {
  z-index: 2000;
  /* 确保在所有面板之上 */
}

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
  left: 5%;
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