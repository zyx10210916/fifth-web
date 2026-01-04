<template>
  <div :class="['map-container', { 'full-size': isFullSize }]">
    <div id="viewDiv" style="width: 100%; height: 100vh; position: relative;">
      <!-- Loading状态提示 -->
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
          <div v-for="layer in economicLayers" :key="layer.id" class="tree-node">
            <input type="checkbox" :id="layer.id" v-model="layer.visible" @change="updateLayerVisibility(layer)"
              class="tree-checkbox">
            <label :for="layer.id" class="tree-label">{{ layer.title }}</label>
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

          <div class="tree-node tree-group"><label>文本标注</label></div>
          <div class="tree-node">
            <input type="checkbox" id="labelDistrict" v-model="labelVisibility.district" @change="updateLabelVisibility"
              class="tree-checkbox">
            <label for="labelDistrict" class="tree-label">区县名称</label>
          </div>
          <div class="tree-node">
            <input type="checkbox" id="labelTown" v-model="labelVisibility.town" @change="updateLabelVisibility"
              class="tree-checkbox">
            <label for="labelTown" class="tree-label">镇街名称</label>
          </div>
          <div class="tree-node">
            <input type="checkbox" id="labelVillage" v-model="labelVisibility.village" @change="updateLabelVisibility"
              class="tree-checkbox">
            <label for="labelVillage" class="tree-label">村居名称</label>
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

// 导入底图资源
import dtNormal from "@/assets/images/dt-1.png";
import dtActive from "@/assets/images/dt-2.png";
import yxtNormal from "@/assets/images/yxt-1.png";
import yxtActive from "@/assets/images/yxt-2.png";

export default {
  name: 'ArcGISFeatureLayerJsonMix',
  components: { MapTools },
  props: {
    // 是否去掉外边距（全屏模式）
    isFullSize: {
      type: Boolean,
      default: false
    },
    // 是否开启点击图层点显示弹窗
    showPopup: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const view = shallowRef(null);
    const panelVisible = ref(true);
    const layers = ref([]);
    const activeBasemapId = ref('street');
    const basemapVisible = ref(true);
    const mapModules = shallowRef(null);
    const loading = ref(true);
    const loadingText = ref('正在加载地图...');
    const mapInitialized = ref(false);
    const labelLayers = shallowRef({});
    const labelVisibility = ref({
      district: false,
      town: false,
      village: false
    });

    const mapList = [
      { id: 'street', name: '地图', className: 'mapType-normal', imgNormal: dtNormal, imgActive: dtActive },
      { id: 'satellite', name: '影像图', className: 'mapType-image', imgNormal: yxtNormal, imgActive: yxtActive }
    ];

    const layerConfigs = [
      { id: "building", title: "企业建筑点", type: "economic", url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3Agongbaokuqiyedianpc38_1&maxFeatures=5000&outputFormat=application%2Fjson", defaultVisible: true },
      { id: "house", title: "企业房屋面", type: "economic", url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3AWJPFWMpc38&outputFormat=application%2Fjson", defaultVisible: false },
      { id: "city", title: "市行政区边界", type: "boundary", url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3AWJPSJpc38&outputFormat=application%2Fjson", defaultVisible: true },
      { id: "district", title: "区县行政边界", type: "boundary", url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3AWJPQXpc38&outputFormat=application%2Fjson", defaultVisible: true },
      { id: "town", title: "镇街行政边界", type: "boundary", url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3AWJPZJpc38&outputFormat=application%2Fjson", defaultVisible: false },
      { id: "village", title: "村社区行政边界", type: "boundary", url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3AWJPCSQpc38&outputFormat=application%2Fjson", defaultVisible: false }
    ];

    const economicLayers = computed(() => layers.value.filter(l => l.type === "economic"));
    const boundaryLayers = computed(() => layers.value.filter(l => l.type === "boundary"));

    // 计算多边形中心点
    const calculatePolygonCenter = (rings) => {
      let x = 0, y = 0, count = 0;
      // rings[0] 通常是外环
      const points = Array.isArray(rings[0][0]) ? rings[0] : rings[0];

      points.forEach(coord => {
        // 适配 [x, y] 或 {x, y}
        x += (coord[0] || coord.x);
        y += (coord[1] || coord.y);
        count++;
      });

      return [x / count, y / count];
    };

    // 创建文本标注层 
    const createLabelLayer = async (layerId, features, modules) => {
      try {
        const [FeatureLayer, TextSymbol, LabelClass, Point] = [
          modules[2], modules[7], modules[8], modules[9]
        ];

        const labelFields = {
          district: 'QMC',
          town: 'JDMC',
          village: 'XZQMC'
        };

        const labelField = labelFields[layerId];
        if (!labelField) return null;

        const graphics = [];
        const uniqueNames = new Set(); // 用于存储已经处理过的名称

        features.forEach((f, index) => {
          // 兼容处理：ArcGIS查询出来的要素属性在 attributes 里，GeoJSON 在 properties 里 
          const attr = f.attributes || f.properties;
          if (!attr) return;

          const textValue = attr[labelField];
          if (textValue && !uniqueNames.has(textValue)) { // 检查是否已存在该名称
            uniqueNames.add(textValue); // 添加到已处理集合 

            let centerPoint = null;

            if (f.geometry) {
              if (f.geometry.type === "point") {
                centerPoint = f.geometry;
              } else {
                // 如果是多边形，使用内置的 centroid (质心) 或 extent.center 
                centerPoint = f.geometry.centroid || f.geometry.extent.center;
              }
            }

            if (centerPoint) {
              graphics.push({
                geometry: centerPoint,
                attributes: {
                  ObjectID: index,
                  LABEL_TEXT: String(textValue)
                }
              });
            }
          }
        });

        const styleConfig = {
          district: { size: 14, color: "#222" },
          town: { size: 12, color: "#444" },
          village: { size: 10, color: "#666" }
        };

        const labelLayer = new FeatureLayer({
          id: `${layerId}_labels`,
          source: graphics,
          fields: [
            { name: "ObjectID", type: "oid" },
            { name: "LABEL_TEXT", type: "string" }
          ],
          objectIdField: "ObjectID",
          labelingInfo: [{
            symbol: new TextSymbol({
              color: styleConfig[layerId].color,
              haloColor: "white",
              haloSize: "1.5px",
              font: { size: styleConfig[layerId].size, weight: "bold", family: "Microsoft YaHei" }
            }),
            labelPlacement: "center-center",
            labelExpressionInfo: { expression: "$feature.LABEL_TEXT" }
          }],
          renderer: {
            type: "simple",
            symbol: { type: "simple-marker", size: 0 } // 隐藏点
          },
          spatialReference: { wkid: 4526 },
          visible: labelVisibility.value[layerId]
        });

        labelLayers.value[layerId] = labelLayer;
        return labelLayer;
      } catch (error) {
        console.error(`创建${layerId}层失败:`, error);
        return null;
      }
    };

    // JSON转FeatureLayer函数 
    const createJsonLayer = async (config) => {
      try {
        loadingText.value = `正在加载${config.title}...`;
        const res = await fetch(config.url);
        const data = await res.json();
        if (!data.features || data.features.length === 0) return null;

        const graphics = data.features.map((f, index) => {
          let geometry = null;
          const { type, coordinates: coords } = f.geometry;
          if (type === "Point") geometry = { type: "point", x: coords[0], y: coords[1] };
          else {
            const rings = type === "Polygon" ? coords : coords.flat(1);
            geometry = { type: "polygon", rings };
          }
          geometry.spatialReference = { wkid: 4526 };
          return new mapModules.value[3]({ geometry, attributes: { ...f.properties, ObjectId: index, ObjectID: index } });
        });

        // 核心修改：根据 prop 决定是否开启弹窗
        let popupTemplate = null;
        if (props.showPopup && config.id === "building") {
          popupTemplate = {
            title: "{b102_2}",
            content: [{
              type: "fields",
              fieldInfos: [
                { fieldName: "b109_2", label: "统一社会信用代码" },
                { fieldName: "zysr", label: "主营收入" },
                { fieldName: "zczj", label: "资产总计" },
                { fieldName: "qmrs", label: "期末人数" },
                { fieldName: "cyrs", label: "专业人数" }
              ]
            }]
          };
        }

        const layerColors = {
          city: [144, 238, 144, 0.1],
          district: [173, 216, 230, 0.3],
          town: [255, 218, 185, 0.2],
          village: [221, 160, 221, 0.2]
        };

        const outlineColors = {
          city: [34, 139, 34, 0.8],
          district: [70, 130, 180, 0.8],
          town: [210, 105, 30, 0.8],
          village: [147, 112, 219, 0.8]
        };
        const layer = new mapModules.value[2]({
          source: graphics,
          id: config.id,
          title: config.title,
          objectIdField: "ObjectId",
          fields: [
            { name: "ObjectId", type: "oid" },
            ...Object.keys(data.features[0].properties).map(key => ({ name: key, type: "string" }))
          ],
          popupTemplate: popupTemplate, // 应用弹窗配置
          renderer: config.type === "economic"
            ? (data.features[0].geometry.type === "Point"
              ? {
                type: "simple",
                symbol: {
                  type: "simple-marker",
                  color: [255, 215, 0, 0.9],  // 金色 (Gold)
                  size: "8px",
                  outline: {
                    color: [255, 140, 0, 0.8],  // 深橙色边框 
                    width: "1px"
                  }
                }
              }
              : {
                type: "simple",
                symbol: {
                  type: "simple-fill",
                  color: [255, 215, 0, 0.2],  // 半透明金色填充 
                  outline: {
                    color: [255, 140, 0, 0.6], // 半透明深橙色边框 
                    width: "1.5px"
                  }
                }
              })
            : {
              type: "simple",
              symbol: {
                type: "simple-fill",
                color: [211, 211, 211, 0.1], // 默认淡灰色填充 
                outline: {
                  color: [169, 169, 169, 0.6], // 默认中灰色边框 
                  width: "1px"
                }
              }
            },
          spatialReference: { wkid: 4526 },
          visible: config.defaultVisible
        });

        layers.value.push({ id: config.id, title: config.title, visible: config.defaultVisible, instance: layer, type: config.type });
        return layer;
      } catch (e) { return null; }
    };

    // 异步加载图层 
    const loadLayersSequentially = async (map) => {
      try {
        // 保持原有加载顺序不变 
        const defaultVisibleConfigs = layerConfigs.filter(c => c.defaultVisible);
        const defaultLayers = await Promise.all(defaultVisibleConfigs.map(config => createJsonLayer(config)));

        defaultLayers.forEach(layer => {
          if (layer) map.add(layer);
        });

        loading.value = false;

        // 加载非默认显示的图层 
        const otherConfigs = layerConfigs.filter(c => !c.defaultVisible);
        const otherLayers = await Promise.all(otherConfigs.map(async (config) => {
          const layer = await createJsonLayer(config);
          if (config.id === 'village' && layer) {
            createLabelsAsync(layer, map);
          }
          return layer;
        }));

        // 强制建筑点图层到最上层 
        const buildingLayer = map.findLayerById('building');
        if (buildingLayer) {
          map.reorder(buildingLayer, map.layers.length - 1);
        }

        console.log("所有图层数据已加载就绪");
      } catch (error) {
        console.error("图层加载失败:", error);
        loading.value = false;
      }
    };
    // 异步创建标注图层的函数
    const createLabelsAsync = async (villageLayer, map) => {
      try {
        // queryFeatures() 返回的是一个 FeatureSet 对象
        const featureSet = await villageLayer.queryFeatures();
        const features = featureSet.features; // 获取要素数组

        if (!features || features.length === 0) return;

        // 分别创建三个标注层
        const dLayer = await createLabelLayer('district', features, mapModules.value);
        if (dLayer) map.add(dLayer);

        const tLayer = await createLabelLayer('town', features, mapModules.value);
        if (tLayer) map.add(tLayer);

        const vLayer = await createLabelLayer('village', features, mapModules.value);
        if (vLayer) map.add(vLayer);

        console.log('所有标注层创建完成');
      } catch (error) {
        console.error("标注图层创建失败:", error);
      }
    };

    // 更新标注可见性 
    const updateLabelVisibility = () => {
      if (!view.value || !labelLayers.value) return;

      Object.entries(labelVisibility.value).forEach(([layerId, visible]) => {
        const labelLayer = labelLayers.value[layerId];
        if (labelLayer) {
          labelLayer.visible = visible;
        }
      });
    };

    const handleMapSelection = (uniqueCodeStr) => {
      console.log('地图中转层接收到代码:', uniqueCodeStr);
      // 将事件继续向上抛给 summary-diaplay/index.vue
      emit('map-select', uniqueCodeStr);
    };

    onMounted(async () => {
      try {
        const modules = await loadModules([
          'esri/Map', 'esri/views/MapView', 'esri/layers/FeatureLayer',
          'esri/Graphic', 'esri/geometry/SpatialReference', 'esri/Basemap',
          'esri/layers/TileLayer', 'esri/symbols/TextSymbol', 'esri/layers/support/LabelClass',
          'esri/geometry/Point'
        ], {
          url: 'http://192.168.94.114/4.19/init.js',
          css: 'http://192.168.94.114/4.19/esri/themes/light/main.css'
        });

        mapModules.value = modules;
        const [Map, MapView, FeatureLayer, Graphic, SpatialReference, Basemap, TileLayer] = modules;

        const defaultBasemap = new Basemap({
          baseLayers: [new TileLayer({ url: "http://192.168.3.140:6080/arcgis/rest/services/fw_dt/MapServer" })],
          id: "street"
        });

        const map = new Map({
          basemap: defaultBasemap,
          layers: [] // 初始为空，逐步添加图层 
        });

        // 确保 SpatialReference 被实例化了
        const sr = new SpatialReference({ wkid: 4526 });

        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: sr, // 使用实例化的对象
          extent: {
            xmin: 38392997.07,
            ymin: 2495903.35,
            xmax: 38505644.28,
            ymax: 2648163.20,
            spatialReference: sr // 这里也要带上
          },
          ui: { components: [] }
        });
        window.view = view.value;

        mapInitialized.value = true;

        // 核心修改：根据 Prop 决定是否启用视图弹窗
        view.value.when(() => {
          view.value.popup.autoOpenEnabled = props.showPopup;
        });

        // 初始化完成后开始逐步加载图层 
        loadLayersSequentially(map);
      } catch (error) {
        console.error("Map Initialization Failed:", error);
        loading.value = false;
      }
    });

    const updateLayerVisibility = async (layer) => {
      try {
        loadingText.value = `正在加载${layer.title}...`;
        loading.value = true;

        const targetLayer = view.value?.map.findLayerById(layer.id);

        if (!targetLayer) {
          const config = layerConfigs.find(c => c.id === layer.id);
          if (!config) return;

          const layerInstance = await createJsonLayer(config);
          if (layerInstance) {
            view.value.map.add(layerInstance);

            // 如果是建筑点，确保在最上层
            if (layer.id === 'building') {
              view.value.map.reorder(layerInstance, view.value.map.layers.length - 1);
            }

            if (config.id === 'village') {
              await createLabelsAsync(layerInstance, view.value.map);
            }
          }
        } else {
          targetLayer.visible = layer.visible;

          // 如果建筑点变为可见，确保在最上层 
          if (layer.id === 'building' && layer.visible) {
            view.value.map.reorder(targetLayer, view.value.map.layers.length - 1);
          }
        }
      } catch (error) {
        console.error(`更新图层 ${layer.id} 可见性失败:`, error);
      } finally {
        loading.value = false;
      }
    };

    const updateBasemapVisibility = () => {
      if (view.value?.map.basemap) {
        view.value.map.basemap.baseLayers.items[0].visible = basemapVisible.value;
      }
    };

    const handleBasemapChange = async (id) => {
      if (activeBasemapId.value === id || !view.value || !mapModules.value) return;
      const [Basemap, TileLayer] = mapModules.value.slice(5, 7);
      const url = id === 'street'
        ? "http://192.168.3.140:6080/arcgis/rest/services/fw_dt/MapServer"
        : "http://192.168.94.114/arcgis/rest/services/GZ2000_ZW_YXDT_2019/MapServer";

      view.value.map.basemap = new Basemap({ baseLayers: [new TileLayer({ url })], id: id });
      activeBasemapId.value = id;
    };

    const togglePanel = () => { panelVisible.value = !panelVisible.value; };

    onUnmounted(() => { view.value?.destroy(); });

    return {
      view, panelVisible, economicLayers, boundaryLayers, mapList,
      activeBasemapId, basemapVisible, loading, loadingText, labelVisibility,
      handleBasemapChange,
      handleMapSelection,
      updateLayerVisibility, updateBasemapVisibility, updateLabelVisibility, togglePanel,
      handleSelectionComplete: handleMapSelection
    };
  }
};
</script>

<style lang="scss" scoped>
.map-container {
  flex: 1;
  background: white;
  margin: 0 15px;
  /* 默认边距 */
  height: 100%;
  border-radius: 6px;
  overflow: hidden;

  /* 当 full-size 类存在时去掉边距 */
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

/* 加载 */
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