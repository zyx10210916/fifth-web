<template>
  <div class="map-container">
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

      <div class="layer-control-panel">
        <div class="panel-header">
          <h3>热力图分析</h3>
          <button @click="panelVisible = !panelVisible" class="toggle-btn">
            {{ panelVisible ? '隐藏' : '显示' }}
          </button>
        </div>
        <div v-if="panelVisible" class="panel-content">
          <div class="control-section">
            <h4 class="section-title">热力图设置</h4>
            <div class="field-selector">
              <label class="selector-label">权重字段：</label>
              <select v-model="selectedHeatmapField" @change="handleFieldChange" class="field-select">
                <option value="">-- 仅按分布密度 --</option>
                <option v-for="field in fieldOptions" :key="field.value" :value="field.value">
                  {{ field.label }}
                </option>
              </select>
              <div class="current-field">当前字段: {{ currentFieldLabel }}</div>
            </div>
          </div>

          <div class="control-section">
            <h4 class="section-title">图层控制</h4>
            <div class="layer-list">
              <div v-for="layer in layers" :key="layer.id" class="layer-item">
                <input type="checkbox" :id="layer.id" v-model="layer.visible" @change="updateLayerVisibility(layer)"
                  class="layer-checkbox">
                <label :for="layer.id" class="layer-label">{{ layer.title }}</label>
              </div>
            </div>
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
    selectedUnit: Object,
    mapPointsData: {
      type: Array,
      default: () => []
    },
    loading: Boolean
  },

  setup(props, { expose, emit }) {
    // 响应式数据
    const view = shallowRef(null);
    const mapModules = shallowRef(null);
    const panelVisible = ref(true);
    const loading = ref(true);
    const loadingText = ref('正在加载地图...');
    const layers = ref([]);
    const selectedHeatmapField = ref("");
    const activeBasemapId = ref('street');
    const mapList = MAP_CONFIG.basemapUI;
    const highlightGraphic = shallowRef(null);
    const highlightRef = shallowRef(null);

    // 权重字段选项
    const fieldOptions = ref([
      { value: "QMRS", label: "期末人数", type: "Long" },
      { value: "ZCZJ", label: "资产总计", type: "Double" },
      { value: "ZYSR", label: "主营收入", type: "Double" },
      { value: "CYRS", label: "从业人数", type: "Integer" }
    ]);

    const currentFieldLabel = computed(() => {
      if (!selectedHeatmapField.value) return "仅按分布密度";
      const field = fieldOptions.value.find(f => f.value === selectedHeatmapField.value);
      return field ? field.label : "未知字段";
    });

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

    // 加载行政区划数据
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
                color: conf.outlineColor,
                width: 1.5
              }
            }
          },
          visible: conf.defaultVisible
        });
        map.add(layer);
        layers.value.push({ 
          id: key, 
          title: conf.title, 
          visible: conf.defaultVisible, 
          instance: markRaw(layer) 
        });
      }
    };

    // 加载企业房屋面数据
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
              spatialReference: MAP_CONFIG.initialExtent.spatialReference
            },
            attributes: {
              ...feature.properties,
              ObjectID: index
            }
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
              outline: {
                color: [0, 112, 255, 0.8],
                width: 1.5
              }
            }
          },
          visible: false
        });

        map.add(houseLayer);
        layers.value.push({ 
          id: "enterprise_house", 
          title: "企业房屋面", 
          visible: false, 
          instance: markRaw(houseLayer) 
        });

      } catch (err) {
        console.error("企业房屋面加载失败:", err);
      }
    };

    const handleMapClickQuery = async (event) => {
      if (!view.value || !mapModules.value) return;

      const [FeatureLayer, Graphic, Map, MapView, SpatialReference, Basemap, TileLayer, Popup, Query, SimpleFillSymbol] = mapModules.value;

      const clearHighlight = () => {
        if (highlightRef.value) {
          view.value.graphics.remove(highlightRef.value);
          highlightRef.value = null;
        }
      };

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
          clearHighlight();
          emit('map-select', '');
          return;
        }

        clearHighlight();
        highlightRef.value = new Graphic({
          geometry: bestFit.geometry,
          symbol: new SimpleFillSymbol(MAP_CONFIG.styles.highlight)
        });
        view.value.graphics.add(highlightRef.value);

        const buildingLayer = view.value.map.findLayerById("building_points");
        if (buildingLayer) {
          const query = new Query();
          query.geometry = bestFit.geometry;
          query.spatialRelationship = "intersects";
          query.outFields = ["B109"];
          query.returnGeometry = false;

          const result = await buildingLayer.queryFeatures(query);

          if (result.features.length > 0) {
            const b109Codes = result.features
              .map(f => f.attributes.B109)
              .filter(code => code && code !== 'null')
              .join(',');
            emit('map-select', b109Codes);
          } else {
            loadingText.value = "该区域内未发现企业点";
            loading.value = true;
            setTimeout(() => (loading.value = false), 1000);
            emit('map-select', 'warn');
          }
        }
      } catch (err) {
        console.error("查询逻辑执行异常:", err);
      }
    };

    const loadBuildingPoints = async (map) => {
      try {
        loadingText.value = '正在加载企业建筑点数据...';
        loading.value = true;

        const [FeatureLayer, Graphic] = mapModules.value;
        const buildingData = props.mapPointsData || [];

        if (buildingData.length === 0) return;

        const graphics = buildingData.map((item, index) => {
          const x = parseFloat(item.XZ_AXIS);
          const y = parseFloat(item.YZ_AXIS);
          if (isNaN(x) || isNaN(y)) return null;

          return new Graphic({
            geometry: {
              type: "point",
              x: x,
              y: y,
              spatialReference: MAP_CONFIG.initialExtent.spatialReference
            },
            attributes: {
              ...item,
              custom_oid: index,
              B109: item.B109 || '',
              WYM: item.WYM || '',
              ZCZJ: item.ZCZJ || 0,
              ZYSR: item.ZYSR || 0,
              QMRS: item.QMRS || 0,
              CYRS: item.CYRS || 0
            }
          });
        }).filter(Boolean);

        const layer = new FeatureLayer({
          id: "building_points",
          title: "企业建筑点",
          source: graphics,
          objectIdField: "custom_oid",
          fields: [
            { name: "custom_oid", type: "oid" },
            { name: "B109", type: "string" },
            { name: "WYM", type: "string" },
            { name: "ZCZJ", type: "double" },
            { name: "ZYSR", type: "double" },
            { name: "QMRS", type: "integer" },
            { name: "CYRS", type: "integer" }
          ],
          spatialReference: MAP_CONFIG.initialExtent.spatialReference,
          renderer: {
            type: "simple",
            symbol: {
              type: "simple-marker",
              color: MAP_CONFIG.styles.buildingMarker.color,
              outline: { 
                color: MAP_CONFIG.styles.buildingMarker.outlineColor, 
                width: 1 
              },
              size: MAP_CONFIG.styles.buildingMarker.size
            }
          }
        });

        map.add(layer);
        layers.value = [
          ...layers.value.filter(l => l.id !== "building_points"),
          { id: "building_points", title: "企业建筑点", visible: true, instance: markRaw(layer) }
        ];

      } catch (err) {
        console.error("建筑点加载失败:", err);
      } finally {
        loading.value = false;
      }
    };

    const createHeatmap = async (map) => {
      try {
        loadingText.value = '正在生成热力图...';
        loading.value = true;

        const [FeatureLayer] = mapModules.value;
        const buildingLayer = map.findLayerById("building_points");

        if (!buildingLayer) return;

        const heatmapLayer = new FeatureLayer({
          id: "heatmap_layer",
          title: "热力图",
          source: buildingLayer.source,
          objectIdField: "custom_oid",
          fields: buildingLayer.fields,
          spatialReference: MAP_CONFIG.initialExtent.spatialReference,
          renderer: createHeatmapRenderer(selectedHeatmapField.value)
        });

        map.add(heatmapLayer);
        layers.value = [
          ...layers.value.filter(l => l.id !== "heatmap_layer"),
          { 
            id: "heatmap_layer", 
            title: "热力图", 
            visible: true, 
            instance: markRaw(heatmapLayer) 
          }
        ];

      } catch (err) {
        console.error("创建热力图失败:", err);
      } finally {
        loading.value = false;
      }
    };

    const removeLayer = (layerId) => {
      if (!view.value) return;
      const layer = view.value.map.findLayerById(layerId);
      if (layer) view.value.map.remove(layer);
      layers.value = layers.value.filter(l => l.id !== layerId);
    };

    const handleFieldChange = async () => {
      if (!view.value) return;
      removeLayer("heatmap_layer");
      await createHeatmap(view.value.map);
    };

    const highlightAndLocateUnit = async (unit) => {
      if (!unit?.WYM || !view.value) return;

      try {
        const [Graphic] = mapModules.value;
        if (highlightGraphic.value) view.value.graphics.remove(highlightGraphic.value);

        const buildingLayer = view.value.map.findLayerById("building_points");
        if (!buildingLayer) return;

        const query = buildingLayer.createQuery();
        query.where = `WYM = '${unit.WYM}'`;
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
          await view.value.goTo({ target: features[0].geometry, zoom: 10 });

          view.value.popup.open({
            title: unit.B102 || '未知单位',
            content: `统一社会信用代码: ${unit.B109 || '未知'}`,
            location: features[0].geometry
          });
        }
      } catch (error) {
        console.error("定位单位失败:", error);
      }
    };

    onMounted(async () => {
      try {
        const modules = await loadModules([
          'esri/layers/FeatureLayer',
          'esri/Graphic',
          'esri/Map',
          'esri/views/MapView',
          'esri/geometry/SpatialReference',
          'esri/Basemap',
          'esri/layers/TileLayer',
          'esri/widgets/Popup',
          'esri/tasks/support/Query',
          'esri/symbols/SimpleFillSymbol'
        ], {
          url: MAP_CONFIG.arcgis.js, 
          css: MAP_CONFIG.arcgis.css
        });

        mapModules.value = modules;
        const [FeatureLayer, Graphic, Map, MapView, SpatialReference, Basemap, TileLayer] = modules;

        const map = new Map({
          basemap: new Basemap({
            baseLayers: [new TileLayer({ url: MAP_CONFIG.basemaps.street })]
          })
        });

        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: new SpatialReference(MAP_CONFIG.initialExtent.spatialReference),
          extent: MAP_CONFIG.initialExtent,
          ui: { components: [] }
        });

        view.value.when(async () => {
          await loadBuildingPoints(map);
          await createHeatmap(map);
          await loadBoundaryLayers(map);
          await loadHouseLayer(map);

          view.value.on("click", handleMapClickQuery);
          loading.value = false;
        });

      } catch (error) {
        console.error("初始化失败", error);
        loading.value = false;
      }
    });

    const updateLayerVisibility = (layer) => {
      if (layer.instance) layer.instance.visible = layer.visible;
    };

    const handleBasemapChange = (id) => {
      if (!view.value) return;
      const url = MAP_CONFIG.basemaps[id];
      const [,,,, , Basemap, TileLayer] = mapModules.value;
      
      view.value.map.basemap = new Basemap({
        baseLayers: [new TileLayer({ url })]
      });
      activeBasemapId.value = id;
    };

    onUnmounted(() => {
      if (view.value) view.value.destroy();
    });

    expose({
      locateEnterprise: (unit) => highlightAndLocateUnit(unit),
      highlightUnit: highlightAndLocateUnit
    });

    return {
      view,
      panelVisible,
      loading,
      loadingText,
      layers,
      selectedHeatmapField,
      fieldOptions,
      currentFieldLabel,
      mapList,
      activeBasemapId,
      updateLayerVisibility,
      handleBasemapChange,
      handleFieldChange
    };
  }
};
</script>

<style lang="scss" scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: white;
  border-radius: 6px;
  overflow: hidden;

  #viewDiv {
    width: 100%;
    height: 100%;
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

  .loading-content {
    text-align: center;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

  .loading-text {
    color: #333;
    font-size: 14px;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.layer-control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 50;
  width: 260px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  overflow: hidden;

  .panel-header {
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 16px;
      color: #333;
      font-weight: 600;
    }

    .toggle-btn {
      background: #0091ff;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background: #0077cc;
      }
    }
  }

  .panel-content {
    padding: 16px;
  }

  .control-section {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #333;
    font-weight: 500;
    border-left: 3px solid #0091ff;
    padding-left: 8px;
  }

  .field-selector {
    .selector-label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 6px;
    }

    .field-select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      background: white;
      margin-bottom: 6px;

      &:focus {
        outline: none;
        border-color: #0091ff;
      }
    }

    .current-field {
      font-size: 11px;
      color: #666;
      text-align: right;
    }
  }

  .layer-list {
    .layer-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .layer-checkbox {
      margin-right: 8px;
      cursor: pointer;
    }

    .layer-label {
      font-size: 13px;
      color: #333;
      cursor: pointer;
    }
  }
}

.mapType {
  position: absolute;
  bottom: 20%;
  right: 20px;
  z-index: 100;
  display: flex;
  gap: 10px;
  list-style: none;
  margin: 0;
  padding: 0;

  .item {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    border: 2px solid white;
    cursor: pointer;
    background-size: cover;
    position: relative;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-2px);
    }

    &.actived {
      border-color: #0091ff;
    }

    .map-label {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 2px 0;
      text-align: center;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      font-size: 11px;
    }
  }
}
</style>