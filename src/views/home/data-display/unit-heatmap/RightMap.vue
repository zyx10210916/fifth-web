<template>
  <div :class="['map-container', { 'full-size': isFullSize }]">
    <div id="viewDiv" style="width: 100%; height: 100vh; position: relative;">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <div class="loading-text">{{ loadingText }}</div>
        </div>
      </div>

      <button @click="openHeatmapView" class="heatmap-view-btn">查看热力图</button>

      <ul class="mapType">
        <li v-for="item in mapList" :key="item.id" @click="handleBasemapChange(item.id)"
          :class="['item', item.className, { actived: activeBasemapId === item.id }]"
          :style="{ backgroundImage: `url(${activeBasemapId === item.id ? item.imgActive : item.imgNormal})` }">
          <span class="map-label">{{ item.name }}</span>
        </li>
      </ul>

      <MapTools ref="mapToolsRef" :view="view" @select-complete="handleMapSelection" />

      <div class="layer-tree-panel">
        <div class="panel-header">
          <h3>目录树</h3>
          <button @click="togglePanel" class="toggle-btn">{{ panelVisible ? '隐藏' : '显示' }}</button>
        </div>

        <div v-if="panelVisible" class="tree-content">
          <div class="tree-node tree-group"><label>经济普查数据</label></div>
          <div v-for="layer in businessLayers" :key="layer.id" class="tree-node">
            <input type="checkbox" :id="layer.id" v-model="layer.visible" @change="updateLayerVisibility(layer)"
              class="tree-checkbox">
            <label :for="layer.id" class="tree-label">{{ layer.title }}</label>
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
import { ref, shallowRef, onMounted, onUnmounted, computed, markRaw, watch } from 'vue';
import { useRouter } from 'vue-router';
import { loadModules } from 'esri-loader';
import { MAP_CONFIG } from '@/config/mapConfig';
import MapTools from '../summary-display/MapTools.vue';

export default {
  name: 'ArcGISMapViewer',
  components: { MapTools },
  props: {
    isFullSize: { type: Boolean, default: false },
    selectedUnit: Object,
    mapPointsData: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false }
  },

  setup(props, { emit }) {
    const router = useRouter();
    const view = shallowRef(null);
    const mapModules = shallowRef(null);
    const panelVisible = ref(true);
    const loading = ref(true);
    const loadingText = ref('正在加载地图...');
    const layers = ref([]);
    const activeBasemapId = ref('street');
    const basemapVisible = ref(true);
    const mapList = MAP_CONFIG.basemapUI;
    const mapToolsRef = ref(null);
    const highlightGraphic = shallowRef(null); 
    const highlightRef = shallowRef(null); 

    const businessLayers = computed(() => layers.value.filter(l => !['district', 'town'].includes(l.id)));
    const boundaryLayers = computed(() => layers.value.filter(l => ['district', 'town'].includes(l.id)));

    const initializeMap = async () => {
      try {
        const modules = await loadModules([
          'esri/layers/FeatureLayer', 'esri/Graphic', 'esri/Map', 'esri/views/MapView',
          'esri/geometry/SpatialReference', 'esri/Basemap', 'esri/layers/TileLayer',
          'esri/tasks/support/Query', 'esri/symbols/SimpleFillSymbol', 'esri/symbols/SimpleMarkerSymbol'
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

        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: new SpatialReference({ wkid: 4526 }),
          extent: MAP_CONFIG.initialExtent,
          ui: { components: [] }
        });

        view.value.when(async () => {
          await loadBuildingPoints(map);
          await loadBoundaryLayers(map);
          await loadHouseLayer(map);
          view.value.on("click", handleMapClickQuery);
          loading.value = false;
        });

      } catch (error) {
        console.error("地图初始化失败:", error);
        loading.value = false;
      }
    };

    const updateBasemapVisibility = () => {
      if (view.value?.map?.basemap) {
        view.value.map.basemap.baseLayers.forEach(lyr => {
          lyr.visible = basemapVisible.value;
        });
      }
    };

    const updateLayerVisibility = (layer) => {
      if (layer.instance) {
        layer.instance.visible = layer.visible;
      }
    };

    const handleBasemapChange = (id) => {
      const [, , , , , Basemap, TileLayer] = mapModules.value;
      const newBasemap = new Basemap({
        baseLayers: [new TileLayer({ 
          url: MAP_CONFIG.basemaps[id],
          visible: basemapVisible.value
        })],
        id: id
      });
      view.value.map.basemap = newBasemap;
      activeBasemapId.value = id;
    };

    const loadBoundaryLayers = async (map) => {
      const [FeatureLayer] = mapModules.value;
      for (const [key, conf] of Object.entries(MAP_CONFIG.boundary.layers)) {
        const layer = new FeatureLayer({
          url: `${MAP_CONFIG.boundary.baseUrl}/${conf.layerId}`,
          id: key, title: conf.title,
          renderer: { type: "simple", symbol: { type: "simple-fill", color: [0, 0, 0, 0], outline: { color: conf.outlineColor, width: 1.5 } } },
          visible: false
        });
        map.add(layer);
        layers.value.push({ id: key, title: conf.title, visible: false, instance: markRaw(layer) });
      }
    };

    const loadHouseLayer = async (map) => {
      try {
        const [FeatureLayer, Graphic] = mapModules.value;
        const response = await fetch(MAP_CONFIG.economic.houseUrl);
        const geoJson = await response.json();
        const graphics = geoJson.features.map((f, i) => new Graphic({
          geometry: { type: "polygon", rings: f.geometry.coordinates[0], spatialReference: { wkid: 4526 } },
          attributes: { ...f.properties, ObjectID: i }
        }));
        const houseLayer = new FeatureLayer({
          id: "enterprise_house", title: "企业房屋面", source: graphics, objectIdField: "ObjectID", visible: false,
          renderer: { type: "simple", symbol: { type: "simple-fill", color: [0, 197, 255, 0.3], outline: { color: [0, 112, 255, 0.8], width: 1.5 } } }
        });
        map.add(houseLayer);
        layers.value.push({ id: "enterprise_house", title: "企业房屋面", visible: false, instance: markRaw(houseLayer) });
      } catch (err) { console.error(err); }
    };

    const loadBuildingPoints = async (map) => {
      const [FeatureLayer, Graphic] = mapModules.value;
      const graphics = props.mapPointsData.map((item, index) => new Graphic({
        geometry: { type: "point", x: item.XZ_AXIS, y: item.YZ_AXIS, spatialReference: { wkid: 4526 } },
        attributes: { ...item, custom_oid: index }
      }));
      const layer = new FeatureLayer({
        id: "building", title: "企业建筑点", source: graphics,
        objectIdField: "custom_oid", fields: [{ name: "custom_oid", type: "oid" }, { name: "B109", type: "string" }],
        visible: false
      });
      map.add(layer);
      layers.value.push({ id: "building", title: "企业建筑点", visible: false, instance: markRaw(layer) });
    };

    const handleMapClickQuery = async (event) => {
      if (!view.value || !mapModules.value) return;
      
      const [Graphic, Query, SimpleFillSymbol] = mapModules.value;
    
      const clearHighlight = () => {
        if (highlightRef.value) {
          view.value.graphics.remove(highlightRef.value);
          highlightRef.value = null;
        }
      };
      clearHighlight();
    
      try {
        const hitTest = await view.value.hitTest(event);
        
        const priorityIds = ["enterprise_house", "town", "district"];
        let bestFit = null;
    
        for (const id of priorityIds) {
          const layerState = layers.value.find(l => l.id === id);
          if (layerState && layerState.visible) {
            const hit = hitTest.results.find(r => r.graphic?.layer?.id === id);
            if (hit) {
              bestFit = hit.graphic;
              break;
            }
          }
        }
    
        if (!bestFit) {
          emit('map-select', ''); 
          return;
        }
    
        const highlightGraphic = new Graphic({
          geometry: bestFit.geometry,
          symbol: new SimpleFillSymbol({
            color: [0, 255, 255, 0.25],
            outline: { 
              color: [0, 255, 255, 1],
              width: 2.5
            }
          })
        });
        
        view.value.graphics.add(highlightGraphic);
        highlightRef.value = highlightGraphic;
    
        const buildingLayer = view.value.map.findLayerById("building");
        if (buildingLayer) {
          const query = buildingLayer.createQuery();
          query.geometry = bestFit.geometry;
          query.spatialRelationship = "intersects";
          query.outFields = ["B109"];
          query.returnGeometry = false;
    
          const result = await buildingLayer.queryFeatures(query);
          
          const Codes = result.features
            .map(f => f.attributes.B109)
            .filter(code => code && code !== 'null')
            .join(',');
          
          if (Codes) {
            emit('map-select', Codes);
          } else {
            loadingText.value = "该区域内未发现企业点";
            loading.value = true;
            setTimeout(() => (loading.value = false), 1000);
            emit('map-select', 'none');
          }
        }
      } catch (err) {
        console.error("查询失败:", err);
      }
    };

    const handleMapSelection = (codes) => emit('map-select', codes);

    const highlightAndLocateUnit = async (unit) => {
      if (!unit?.B109 || !view.value) return;
      
      const [Graphic] = mapModules.value;
    
      if (highlightGraphic.value) {
        view.value.graphics.remove(highlightGraphic.value);
      }
    
      try {
        const buildingLayer = view.value.map.findLayerById("building");
        if (!buildingLayer) return;
    
        const query = buildingLayer.createQuery();
        query.where = `B109 = '${unit.B109}'`;
        query.returnGeometry = true;
    
        const { features } = await buildingLayer.queryFeatures(query);
    
        if (features[0]?.geometry) {
          highlightGraphic.value = new Graphic({
            geometry: features[0].geometry,
            symbol: {
              type: "simple-marker",
              color: [255, 0, 0],
              outline: { color: [255, 255, 255], width: 2 },
              size: 12 
            }
          });
          view.value.graphics.add(highlightGraphic.value);
          
          await view.value.goTo({
            target: features[0].geometry,
            zoom: 10 
          });
    
          view.value.popup.open({
            title: unit.B102 || '单位信息',
            content: `统一代码: ${unit.B109}`,
            location: features[0].geometry
          });
        }
      } catch (error) {
        console.error("定位失败:", error);
      }
    };

    const openHeatmapView = () => {
      // 使用sessionStorage传递数据
      sessionStorage.setItem('heatmapData', JSON.stringify(props.mapPointsData));
      router.push('/heatmap-view');
    };

    watch(() => props.selectedUnit, (newUnit) => {
      highlightAndLocateUnit(newUnit);
    });

    onMounted(initializeMap);
    onUnmounted(() => view.value?.destroy());

    return {
      view, panelVisible, loading, loadingText, layers,
      businessLayers, boundaryLayers,
      mapList, activeBasemapId, basemapVisible,
      updateLayerVisibility, updateBasemapVisibility,
      handleBasemapChange, handleMapSelection, highlightAndLocateUnit,
      togglePanel: () => panelVisible.value = !panelVisible.value,
      mapToolsRef,
      openHeatmapView
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

.heatmap-view-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 50;
  padding: 8px 16px;
  background: #ff5722;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: background 0.3s;
  
  &:hover {
    background: #e64a19;
  }
}
</style>