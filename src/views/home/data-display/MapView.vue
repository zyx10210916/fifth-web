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
          <div class="tree-node">
            <input type="checkbox" id="building" v-model="buildingLayer.visible"
              @change="updateLayerVisibility(buildingLayer)" class="tree-checkbox">
            <label for="building" class="tree-label">企业建筑点</label>
          </div>
          <div v-if="houseLayer.loaded" class="tree-node">
            <input type="checkbox" id="house" v-model="houseLayer.visible" @change="updateLayerVisibility(houseLayer)"
              class="tree-checkbox">
            <label for="house" class="tree-label">企业房屋面</label>
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
import { ref, shallowRef, onMounted, onUnmounted, computed, markRaw } from 'vue';
import { loadModules } from 'esri-loader';
import MapTools from './MapTools.vue';
import { MAP_CONFIG } from '@/config/mapConfig';
import { getBulletinList } from '@/api/data-display';

export default {
  name: 'MapView',
  components: { MapTools },
  props: {
    isFullSize: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    loadingText: { type: String, default: '正在加载地图...' },
    initialExtent: {
      type: Object,
      default: () => MAP_CONFIG.initialExtent
    },
    boundaryLayersConfig: {
      type: Object,
      default: () => MAP_CONFIG.boundary.layers
    },
    boundaryBaseUrl: {
      type: String,
      default: MAP_CONFIG.boundary.baseUrl
    },
    houseLayerUrl: {
      type: String,
      default: MAP_CONFIG.economic.houseUrl
    },
    buildingLayerConfig: {
      type: Object,
      default: () => ({
        id: "building",
        title: "企业建筑点",
        visible: true,
        fields: [
          { name: "ObjectId", type: "oid" },
          { name: "B109", type: "string" },
          { name: "ZYSR", type: "string" },
          { name: "ZCZJ", type: "string" },
          { name: "QMRS", type: "string" },
          { name: "CYRS", type: "string" }
        ],
        popupTemplate: {
          title: "{B109}",
          content: [{
            type: "fields",
            fieldInfos: [
              { fieldName: "ZYSR", label: "主营收入" },
              { fieldName: "ZCZJ", label: "资产总计" },
              { fieldName: "QMRS", label: "期末人数" },
              { fieldName: "CYRS", label: "专业人数" }
            ]
          }]
        },
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-marker",
            color: [156, 120, 0, 0.8],
            size: "8px",
            outline: { color: [255, 255, 255], width: 1 }
          }
        }
      })
    }
  },

  emits: ['map-select', 'map-loaded', 'building-points-loaded', 'house-layer-loaded'],

  setup(props, { emit }) {
    // 基础地图状态
    const view = shallowRef(null);
    const mapModules = shallowRef(null);
    const panelVisible = ref(true);
    const basemapVisible = ref(true);
    const mapList = MAP_CONFIG.basemapUI;
    const activeBasemapId = ref('street');
    const mapToolsRef = ref(null);
    const highlightRef = shallowRef(null);

    // 图层管理
    const layers = ref([]);
    const boundaryLayers = computed(() => layers.value.filter(l => l.type === 'boundary'));

    // 企业图层状态 
    const buildingLayer = ref({
      id: "building",
      title: "企业建筑点",
      visible: true,
      type: "economic",
      data: []
    });

    const houseLayer = ref({
      id: "house",
      title: "企业房屋面",
      visible: false,
      type: "economic",
      isFetching: false,
      loaded: false
    });

    // 初始化地图
    const initializeMap = async () => {
      try {
        const modules = await loadModules([
          'esri/Map', 'esri/views/MapView', 'esri/layers/FeatureLayer',
          'esri/Graphic', 'esri/geometry/SpatialReference', 'esri/Basemap',
          'esri/layers/TileLayer', 'esri/symbols/TextSymbol', 'esri/layers/support/LabelClass',
          'esri/geometry/Point', 'esri/symbols/SimpleMarkerSymbol', 'esri/symbols/SimpleFillSymbol',
          'esri/tasks/support/Query', 'esri/Graphic'
        ], {
          url: MAP_CONFIG.arcgis.js,
          css: MAP_CONFIG.arcgis.css
        });

        mapModules.value = modules;
        const [Map, MapView, FeatureLayer, Graphic, SpatialReference, Basemap, TileLayer] = modules;

        const defaultBasemap = new Basemap({
          baseLayers: [new TileLayer({ url: MAP_CONFIG.basemaps.street })],
          id: "street"
        });

        const map = new Map({ basemap: defaultBasemap });
        const sr = new SpatialReference({ wkid: 4526 });

        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: sr,
          extent: props.initialExtent,
          ui: { components: [] }
        });

        // 创建企业建筑点空图层
        const buildingFeatureLayer = new FeatureLayer({
          id: buildingLayer.value.id,
          title: buildingLayer.value.title,
          objectIdField: "ObjectId",
          geometryType: "point",
          outFields:["*"],
          source: [],
          fields: props.buildingLayerConfig.fields,
          popupTemplate: props.buildingLayerConfig.popupTemplate,
          renderer: props.buildingLayerConfig.renderer,
          visible: buildingLayer.value.visible,
          popupEnabled: true,
          spatialReference: { wkid: 4526 }
        });

        map.add(buildingFeatureLayer);
        layers.value.push({
          ...buildingLayer.value,
          instance: markRaw(buildingFeatureLayer)
        });

        // 加载边界图层
        await loadBoundaryLayers(map);

        view.value.on("click", handleMapClickQuery);

        view.value.when(() => {
          view.value.popup.autoOpenEnabled = props.showPopup;
        });

        emit('map-loaded', {
          view: view.value,
          map,
          modules: mapModules.value
        });

      } catch (error) {
        console.error("地图初始化失败:", error);
        emit('map-loaded', { error });
      }
    };

    // 加载边界图层 
    const loadBoundaryLayers = async (map) => {
      try {
        const [FeatureLayer] = mapModules.value.slice(2, 3);

        for (const [key, config] of Object.entries(props.boundaryLayersConfig)) {
          const layer = new FeatureLayer({
            url: `${props.boundaryBaseUrl}/${config.layerId}`,
            id: key,
            title: config.title,
            renderer: {
              type: "simple",
              symbol: {
                type: "simple-fill",
                color: [0, 0, 0, 0],
                outline: { color: config.outlineColor, width: 1.5 }
              }
            },
            popupTemplate: {
              title: "{NAME}",
              content: config.title
            },
            visible: config.defaultVisible || false
          });

          map.add(layer);
          layers.value.push({
            id: key,
            title: config.title,
            visible: config.defaultVisible || false,
            instance: markRaw(layer),
            type: "boundary"
          });
        }
      } catch (error) {
        console.error("加载边界图层失败:", error);
      }
    };

    // 获取企业点数据（单次请求2000条）
    const fetchBuildingPoints = async (params = {}) => {
      try {
        const res = await getBulletinList({
          pageNo: 1,
          pageSize: 2000,  
          ...params
        });

        if (res?.data?.list) {
          await loadBuildingPoints(res.data.list);
          return res.data.list;
        }
        return [];
      } catch (error) {
        console.error("获取企业点数据失败:", error);
        throw error;
      }
    };

    // 企业点加载逻辑
    const loadBuildingPoints = async (pointsData) => {
      if (!view.value?.map || !pointsData) return;

      const Graphic = mapModules.value.find(m => m.name === "Graphic" || m.prototype?.declaredClass === "esri.Graphic");
      const layer = view.value.map.findLayerById(buildingLayer.value.id);

      if (!layer) {
        console.warn("未找到企业建筑点图层");
        return;
      }

      try {
      
        const existingFeatures = await layer.queryFeatures();

        const edits = {
          deleteFeatures: existingFeatures.features
        };

        if (pointsData.length > 0) {
          const graphics = pointsData
            .map((item, index) => {
              const x = parseFloat(item.XZ_AXIS);
              const y = parseFloat(item.YZ_AXIS);
              if (isNaN(x) || isNaN(y)) return null;

              return new Graphic({
                geometry: {
                  type: "point",
                  x,
                  y,
                  spatialReference: { wkid: 4526 }
                },
                attributes: {
                  ObjectId: index + 1,
                  B109: item.B109 || "",
                  ZYSR: item.ZYSR || "",
                  ZCZJ: item.ZCZJ || "",
                  QMRS: item.QMRS || "",
                  CYRS: item.CYRS || ""
                }
              });
            })
            .filter(g => g !== null);

          if (graphics.length > 0) {
            edits.addFeatures = graphics;
          }
        }

        await layer.applyEdits(edits);

        buildingLayer.value.data = pointsData;
        emit('building-points-loaded', pointsData);

      } catch (error) {
        console.error("加载企业建筑点失败:", error);
        throw error; 
      }
    };

    // 加载企业房屋面 
    const loadHouseLayer = async () => {
      if (houseLayer.value.loaded || houseLayer.value.isFetching) return;

      houseLayer.value.isFetching = true;
      try {
        const res = await fetch(props.houseLayerUrl);
        const geoJson = await res.json();
        const [FeatureLayer, Graphic] = mapModules.value.slice(2, 4);

        const graphics = geoJson.features.map((f, i) => {
          const geometry = f.geometry.type === "MultiPolygon"
            ? { type: "polygon", rings: f.geometry.coordinates.flat(1) }
            : { type: "polygon", rings: f.geometry.coordinates };

          return new Graphic({
            geometry,
            attributes: { ...f.properties, ObjectId: i }
          });
        });

        const layer = new FeatureLayer({
          id: houseLayer.value.id,
          title: houseLayer.value.title,
          source: graphics,
          objectIdField: "ObjectId",
          renderer: {
            type: "simple",
            symbol: {
              type: "simple-fill",
              color: [0, 197, 255, 0.3],
              outline: { color: [0, 112, 255, 0.8], width: 1.5 }
            }
          },
          visible: houseLayer.value.visible
        });

        view.value.map.add(layer);
        layers.value.push({
          id: houseLayer.value.id,
          title: houseLayer.value.title,
          visible: houseLayer.value.visible,
          instance: markRaw(layer),
          type: "economic"
        });

        houseLayer.value.loaded = true;
        emit('house-layer-loaded', layer);
      } catch (e) {
        console.error("房屋面异步加载失败:", e);
      } finally {
        houseLayer.value.isFetching = false;
      }
    };

    // 地图交互处理 
    const handleMapClickQuery = async (event) => {
      if (!view.value || !mapModules.value) return;

      const Graphic = mapModules.value.find(m => m.prototype?.declaredClass === "esri.Graphic");
      const SimpleFillSymbol = mapModules.value.find(m => m.prototype?.declaredClass === "esri.symbols.SimpleFillSymbol");
      const Query = mapModules.value.find(m => m.prototype?.declaredClass === "esri.rest.support.Query" || m.prototype?.declaredClass === "esri.tasks.support.Query");

      // 清除旧高亮
      const clearHighlight = () => {
        if (highlightRef.value) {
          view.value.graphics.remove(highlightRef.value);
          highlightRef.value = null;
        }
      };
      clearHighlight();

      try {
        const hitTest = await view.value.hitTest(event);
        const buildingHit = hitTest.results.find(r => r.graphic?.layer?.id === "building");
        if (buildingHit) {
          view.value.popup.open({
            features: [buildingHit.graphic],
            location: event.mapPoint
          });
        }

        const priorityIds = ["house", "town", "district"];
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
          if (!buildingHit) emit('map-select', '');
          return;
        }

        const highlightGraphic = new Graphic({
          geometry: bestFit.geometry,
          symbol: new SimpleFillSymbol({
            color: [0, 255, 255, 0.25],
            outline: { color: [0, 255, 255, 1], width: 2.5 }
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
          const result = await buildingLayer.queryFeatures(query);
          const codes = result.features
            .map(f => f.attributes.B109)
            .filter(code => code && code !== 'null')
            .join(',');
          emit('map-select', codes || 'none');
        }
      } catch (err) {
        console.error("查询失败:", err);
      }
    };

    const handleMapSelection = (codes) => emit('map-select', codes);

    const queryBuildingPoints = async (condition) => {
      if (!view.value) return [];

      const layer = view.value.map.findLayerById("building");
      if (!layer) {
        console.warn("未找到 building 图层");
        return [];
      }

      try {
        const query = layer.createQuery();

        query.where = condition;
        query.returnGeometry = true;
        query.outFields = ["*"];

        const result = await layer.queryFeatures(query);
        return result.features || [];
      } catch (error) {
        console.error("MapView内部查询失败:", error);
        return [];
      }
    };

    // 底图控制 
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

    // 图层可见性控制 
    const updateLayerVisibility = async (layer) => {
      if (layer.instance) {
        layer.instance.visible = layer.visible;
      }

      if (layer.id === 'house' && layer.visible && !houseLayer.value.loaded) {
        await loadHouseLayer();
      }
    };

    const updateBasemapVisibility = () => {
      if (view.value?.map?.basemap) {
        view.value.map.basemap.baseLayers.forEach(lyr => {
          lyr.visible = basemapVisible.value;
        });
      }
    };

    // UI控制 
    const togglePanel = () => panelVisible.value = !panelVisible.value;

    // 提供公共方法 
    const highlightFeature = (geometry, symbol) => {
      const [Graphic] = mapModules.value.slice(3, 4);

      if (highlightRef.value) {
        view.value.graphics.remove(highlightRef.value);
      }

      highlightRef.value = new Graphic({ geometry, symbol });
      view.value.graphics.add(highlightRef.value);
      view.value.goTo(geometry);
    };

    // 生命周期 
    onMounted(initializeMap);
    onUnmounted(() => {
      if (view.value) {
        view.value.destroy();
      }
    });

    return {
      // 模板使用的状态 
      view,
      panelVisible,
      loading: computed(() => props.loading),
      loadingText: computed(() => props.loadingText),
      boundaryLayers,
      buildingLayer,
      houseLayer,
      mapList,
      activeBasemapId,
      basemapVisible,
      mapToolsRef,

      // 模板使用的方法 
      updateLayerVisibility,
      updateBasemapVisibility,
      handleBasemapChange,
      handleMapSelection,
      togglePanel,
      fetchBuildingPoints,
      loadBuildingPoints,

      // 暴露给父组件的方法 
      loadBuildingPoints,
      loadHouseLayer,
      highlightFeature,
      queryBuildingPoints,
      getMapModules: () => mapModules.value,
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
</style>