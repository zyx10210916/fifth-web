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

      <MapTools :view="view" @select-complete="handleMapSelection" />

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
            <input type="checkbox" id="basemap" v-model="basemapVisible" @change="updateBasemapVisibility"
              class="tree-checkbox">
            <label for="basemap" class="tree-label">底图</label>
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
import { ref, shallowRef, onMounted, onUnmounted, computed, watch, markRaw } from 'vue';
import { loadModules } from 'esri-loader';
import MapTools from './MapTools.vue';
import { MAP_CONFIG } from '@/config/mapConfig';
import { getBulletinList } from '@/api/data-display';

export default {
  name: 'ArcGISFeatureLayerJsonMix',
  components: { MapTools },
  props: {
    isFullSize: { type: Boolean, default: false },
    showPopup: { type: Boolean, default: true },
    filterParams: { type: Object, default: () => ({}) }
  },

  setup(props, { emit }) {
    // ========== 状态管理 ==========
    const view = shallowRef(null);
    const panelVisible = ref(true);
    const activeBasemapId = ref('street');
    const mapList = MAP_CONFIG.basemapUI;
    const basemapVisible = ref(true);
    const mapModules = shallowRef(null);
    const loading = ref(true);
    const loadingText = ref('正在加载地图...');
    const labelLayers = shallowRef({});
    const layers = ref([]);
    const highlightRef = shallowRef(null);

    // 单独控制企业建筑点和房屋面 
    const buildingLayer = ref({
      id: "building",
      title: "企业建筑点",
      visible: true,
      type: "economic"
    });

    const houseLayer = ref({
      id: "house",
      title: "企业房屋面",
      visible: false,
      type: "economic",
      isFetching: false,
      loaded: false
    });

    const labelVisibility = ref({
      district: false,
      town: false,
      village: false
    });

    // ========== 计算属性 ==========
    const economicLayers = computed(() => layers.value.filter(l => l.type === "economic"));
    const boundaryLayers = computed(() => layers.value.filter(l => l.type === "boundary"));

    // ========== 地图操作函数 ==========
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

        // 创建默认底图 
        const defaultBasemap = new Basemap({
          baseLayers: [new TileLayer({ url: MAP_CONFIG.basemaps.street })],
          id: "street"
        });

        // 创建地图实例 
        const map = new Map({ basemap: defaultBasemap, layers: [] });

        // 设置空间参考
        const sr = new SpatialReference({ wkid: 4526 });

        // 创建视图 
        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: sr,
          extent: MAP_CONFIG.initialExtent,
          ui: { components: [] }
        });

        view.value.on("click", handleMapClickQuery);

        // 设置弹窗 
        view.value.when(() => {
          view.value.popup.autoOpenEnabled = props.showPopup;
        });

        // 加载图层
        await loadBoundaryLayers(map);
        await loadBuildingPoints(map);
        loading.value = false;
        LoadHouseLayer(map);

      } catch (error) {
        loading.value = false;
      }
    };

    /**
     * 加载图层
     */

    // 加载行政区图层
    const loadBoundaryLayers = async (map) => {
      try {
        const [FeatureLayer, TextSymbol] = mapModules.value.slice(2, 4);

        // 加载所有行政区划图层
        for (const [key, config] of Object.entries(MAP_CONFIG.boundary.layers)) {
          const layer = new FeatureLayer({
            url: `${MAP_CONFIG.boundary.baseUrl}/${config.layerId}`,
            id: key,
            title: config.title,
            outFields: ["*"],
            spatialReference: { wkid: 4526 },
            renderer: {
              type: "simple",
              symbol: {
                type: "simple-fill",
                color: [0, 0, 0, 0],
                outline: {
                  color: config.outlineColor,
                  width: 1.5
                }
              }
            },
            popupTemplate: {
              title: "{NAME}",
              content: config.title
            },
            labelingInfo: [{
              symbol: {
                type: "text",
                color: config.labelColor,
                haloColor: "white",
                haloSize: "1.5px",
                font: {
                  size: config.labelSize,
                  weight: "bold",
                  family: "Microsoft YaHei"
                }
              },
              labelExpressionInfo: { expression: "$feature.NAME" },
              labelPlacement: "center-center",
              minScale: key === 'district' ? 100000 : 50000,
              maxScale: 0
            }],
            labelsVisible: labelVisibility.value[key.replace('label', '').toLowerCase()] || false,
            visible: config.defaultVisible
          });

          layer.when(() => {
            console.log(`${config.title}图层加载完成`);
          }, (error) => {
            console.error(`${config.title}图层加载失败:`, error);
          });

          map.add(layer);
          layers.value.push({
            id: key,
            title: config.title,
            visible: config.defaultVisible,
            instance: layer,
            type: "boundary"
          });
        }
      } catch (error) {
        console.error("加载行政区划图层失败:", error);
        throw error;
      }
    };


    // 加载建筑点
    const loadBuildingPoints = async (map) => {

      const [FeatureLayer, Graphic] = mapModules.value.slice(2, 4);

      loading.value = true;

      try {
        // 1. 创建空图层 (Client-side FeatureLayer)
        const layer = new FeatureLayer({
          id: "building",
          title: "企业建筑点",
          objectIdField: "ObjectId",
          geometryType: "point", // 必须指定几何类型
          source: [],           // 必须初始化为空数组
          spatialReference: { wkid: 4526 }, // 必须指定坐标系
          fields: [
            { name: "ObjectId", type: "oid" },
            { name: "B109", type: "string" },
            { name: "ZYSR", type: "string" },
            { name: "ZCZJ", type: "string" },
            { name: "QMRS", type: "string" },
            { name: "CYRS", type: "string" }
          ],
          renderer: {
            type: "simple",
            symbol: {
              type: "simple-marker",
              color: [156, 120, 0, 0.8],
              size: "8px",
              outline: { color: [255, 255, 255], width: 1 }
            }
          },
          popupTemplate: createPopupTemplate(buildingLayer.value)
        });

        // 2. 将图层添加到地图和 Vue 状态中
        map.add(layer);
        layers.value.push({
          ...buildingLayer.value,
          instance: markRaw(layer)
        });

        // 3. 分批加载数据 
        const batchSize = 2000;
        const totalCount = 2000; // 如果是动态的，建议从第一次请求的 res.data.total 获取
        const batchCount = Math.ceil(totalCount / batchSize);

        for (let i = 1; i <= batchCount; i++) {
          loadingText.value = `正在加载企业建筑点数据 (${i}/${batchCount})...`;

          const res = await getBulletinList({
            pageNo: i,
            pageSize: batchSize,
            ...props.filterParams
          });

          if (!res?.data?.list || res.data.list.length === 0) continue;

          // 4. 将原始数据转换为 Graphic 数组
          const graphics = res.data.list
            .map((item, index) => {
              const x = parseFloat(item.XZ_AXIS);
              const y = parseFloat(item.YZ_AXIS);

              if (isNaN(x) || isNaN(y)) return null;

              return new Graphic({
                geometry: {
                  type: "point",
                  x: x,
                  y: y,
                  spatialReference: { wkid: 4526 }
                },
                attributes: {
                  // 确保全局唯一 ID，从 1 开始
                  ObjectId: (i - 1) * batchSize + index + 1,
                  B109: item.B109 || "",
                  ZYSR: item.ZYSR || "",
                  ZCZJ: item.ZCZJ || "",
                  QMRS: item.QMRS || "",
                  CYRS: item.CYRS || ""
                }
              });
            })
            .filter(g => g !== null);

          // 5. 使用 applyEdits 批量添加图形
          if (graphics.length > 0) {
            await layer.applyEdits({
              addFeatures: graphics
            });
          }
        }
      } catch (error) {
        console.error("加载企业建筑点失败:", error);
      } finally {
        loading.value = false;
        loadingText.value = "";
      }
    };

    // 加载房屋面
    const LoadHouseLayer = async (map) => {
      if (houseLayer.value.loaded || houseLayer.value.isFetching) return;

      houseLayer.value.isFetching = true;
      try {
        const houseConfig = {
          id: "house",
          title: "企业房屋面",
          type: "economic",
          url: MAP_CONFIG.economic.houseUrl,
          defaultVisible: false
        };

        const newLayer = await createJsonLayer(houseConfig);

        if (newLayer) {
          map.add(newLayer);
          houseLayer.value.loaded = true;
        }
      } catch (e) {
        console.error("房屋面异步加载失败:", e);
      } finally {
        houseLayer.value.isFetching = false;
      }
    };

    /**
     * 创建JSON图层
     */
    const createJsonLayer = async (config) => {
      try {
        const res = await fetch(config.url);
        const data = await res.json();
        if (!data.features || data.features.length === 0) return null;

        const [, , , Graphic, , , , , SimpleFillSymbol] = mapModules.value;
        const FeatureLayer = mapModules.value[2];

        const graphics = data.features.map((f, index) => {
          const { type, coordinates: coords } = f.geometry;
          let geometry = null;
          if (type === "MultiPolygon") {
            geometry = { type: "polygon", rings: coords.flat(1), spatialReference: { wkid: 4526 } };
          } else if (type === "Polygon") {
            geometry = { type: "polygon", rings: coords, spatialReference: { wkid: 4526 } };
          }
          if (!geometry) return null;
          return new Graphic({
            geometry: geometry,
            attributes: { ...f.properties, ObjectId: index }
          });
        }).filter(g => g !== null);

        const layer = new FeatureLayer({
          source: graphics,
          id: config.id,
          title: config.title,
          objectIdField: "ObjectId",
          fields: [{ name: "ObjectId", type: "oid" }],
          renderer: {
            type: "simple",
            symbol: {
              type: "simple-fill",
              color: [0, 197, 255, 0.3],
              outline: { color: [0, 112, 255, 0.8], width: 1.5 }
            }
          },
          spatialReference: { wkid: 4526 },
          visible: config.defaultVisible
        });

        const existingIdx = layers.value.findIndex(l => l.id === config.id);
        if (existingIdx > -1) {
          layers.value[existingIdx].instance = markRaw(layer);
        } else {
          layers.value.push({
            id: config.id,
            title: config.title,
            visible: config.defaultVisible,
            instance: markRaw(layer),
            type: config.type
          });
        }
        return layer;
      } catch (e) {
        console.error(`创建${config.title}图层失败:`, e);
        return null;
      }
    };

    // ========== 辅助函数 ==========
    const createGeometryFromFeature = (feature) => {
      const { type, coordinates: coords } = feature.geometry;

      if (type === "Point") {
        return { type: "point", x: coords[0], y: coords[1] };
      } else {
        const rings = type === "Polygon" ? coords : coords.flat(1);
        return { type: "polygon", rings };
      }
    };

    const createPopupTemplate = (config) => {
      if (!props.showPopup || config.id !== "building") return null;

      return {
        title: "{B109}",
        content: [{
          type: "fields",
          fieldInfos: [
            { fieldName: "ZYSR", label: "主营收入" },
            { fieldName: "ZCZJ", label: "资产总计" },
            { fieldName: "QMRs", label: "期末人数" },
            { fieldName: "CYRS", label: "专业人数" }
          ]
        }]
      };
    };

    const createRenderer = (config, geometryType) => {
      const [SimpleMarkerSymbol, SimpleFillSymbol] = mapModules.value.slice(7, 9);

      if (geometryType === "point") {
        return {
          type: "simple",
          symbol: new SimpleMarkerSymbol({
            color: [56, 168, 0, 0.8],
            size: "8px",
            outline: {
              color: [255, 255, 255],
              width: 1
            }
          })
        };
      } else {
        return {
          type: "simple",
          symbol: new SimpleFillSymbol({
            color: [56, 168, 0, 0.4],
            outline: {
              color: [255, 255, 255],
              width: 1
            }
          })
        };
      }
    };

    const getBoundaryColor = (layerId) => {
      const colors = [
        [34, 139, 34, 0.8],
        [70, 130, 180, 0.8],
        [210, 105, 30, 0.8]
      ];
      return colors[layerId] || [0, 0, 0, 0.8];
    };

    // ========== 交互处理函数 ==========
    const handleMapClickQuery = async (event) => {
      if (!view.value || !mapModules.value) return;

      const [
        Map, MapView, FeatureLayer, Graphic, SpatialReference,
        Basemap, TileLayer, TextSymbol, LabelClass, Point,
        SimpleMarkerSymbol, SimpleFillSymbol, Query
      ] = mapModules.value;

      const clearHighlight = () => {
        if (highlightRef.value) {
          view.value.graphics.remove(highlightRef.value);
          highlightRef.value = null;
        }
      };

      try {
        // 获取点击结果
        const hitTestResult = await view.value.hitTest(event);
        const results = hitTestResult.results.map(r => r.graphic).filter(g => g && g.layer);

        let bestFit = null;
        bestFit = results.find(g => g.layer.id === "house") ||
          results.find(g => g.layer.id === "town") ||
          results.find(g => g.layer.id === "district");

        // 执行高亮
        clearHighlight();
        const highlightGraphic = new Graphic({
          geometry: bestFit.geometry,
          symbol: new SimpleFillSymbol({
            color: [0, 255, 255, 0.25],
            outline: { color: [0, 255, 255, 1], width: 2.5 }
          })
        });
        view.value.graphics.add(highlightGraphic);
        highlightRef.value = highlightGraphic;

        // 执行空间查询
        const buildingLayer = view.value.map.findLayerById("building");
        if (buildingLayer) {
          const query = new Query();
          query.geometry = bestFit.geometry;
          query.spatialRelationship = "intersects";
          query.outFields = ["B109"];
          query.returnGeometry = false;

          const result = await buildingLayer.queryFeatures(query);

          if (result.features.length > 0) {
            const codes = result.features.map(f => f.attributes.B109).filter(Boolean);
            emit('map-select', codes.join(','));
          } else {
            loadingText.value = "该区域内未发现企业点";
            loading.value = true;
            setTimeout(() => (loading.value = false), 1000);
            emit('map-select', 'none');
          }
        }
      } catch (error) {
        console.error("查询逻辑执行异常:", error);
      }
    };

    // ========== UI交互函数 ==========
    const handleBasemapChange = async (id) => {
      if (activeBasemapId.value === id || !view.value || !mapModules.value) return;

      const [Basemap, TileLayer] = mapModules.value.slice(5, 7);
      const url = MAP_CONFIG.basemaps[id];

      view.value.map.basemap = new Basemap({
        baseLayers: [new TileLayer({ url })],
        id
      });
      activeBasemapId.value = id;
    };

    const updateLayerVisibility = async (layerItem) => {
      const targetLayer = view.value?.map.findLayerById(layerItem.id);

      if (targetLayer) {
        targetLayer.visible = layerItem.visible;
      } else {
        if (layerItem.id === "house" && layerItem.visible) {
          if (houseLayer.value.isFetching) {
            console.warn("数据正在后台传输，请稍候...");
          } else {
            await LoadHouseLayer(view.value.map);
            const relayer = view.value?.map.findLayerById("house");
            if (relayer) relayer.visible = true;
          }
        }
      }
    };

    const updateBasemapVisibility = () => {
      if (view.value?.map.basemap) {
        view.value.map.basemap.baseLayers.items[0].visible = basemapVisible.value;
      }
    };

    const updateLabelVisibility = () => {
      Object.entries(labelVisibility.value).forEach(([type, visible]) => {
        const layer = view.value?.map.findLayerById(type === 'district' ? 'district' : 'town');
        if (layer) {
          layer.labelsVisible = visible;
        }
      });
    };

    const handleMapSelection = (uniqueCodeStr) => {
      emit('map-select', uniqueCodeStr);
    };

    const togglePanel = () => {
      panelVisible.value = !panelVisible.value;
    };

    // ========== 生命周期钩子 ==========
    onMounted(initializeMap);
    onUnmounted(() => {
      if (highlightRef.value) {
        view.value?.graphics.remove(highlightRef.value);
      }
      view.value?.destroy();
    });

    // 监听filterParams变化，重新加载企业点数据
    watch(() => props.filterParams, () => {
      if (buildingLayer.value.visible) {
        updateLayerVisibility(buildingLayer.value);
      }
    }, { deep: true });

    // ========== 暴露给模板的属性和方法 ==========
    return {
      view,
      panelVisible,
      economicLayers,
      boundaryLayers,
      buildingLayer,
      houseLayer,
      mapList,
      activeBasemapId,
      basemapVisible,
      loading,
      loadingText,
      labelVisibility,
      handleBasemapChange,
      handleMapSelection,
      updateLayerVisibility,
      updateBasemapVisibility,
      updateLabelVisibility,
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
  width: 240px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.panel-header {
  padding: 10px 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 15px;
    color: #333;
  }
}

.tree-content {
  padding: 15px;
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
  }
}

.custom-select {
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
  font-size: 13px;
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
  0% {
    transform: rotate(0deg);
  }

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