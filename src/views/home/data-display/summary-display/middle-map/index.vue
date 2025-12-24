<template>
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

    <MapTools :view="view" @select-complete="handleSelectionComplete" />

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
</template>

<script>
import { ref, shallowRef, onMounted, onUnmounted, computed } from 'vue';
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
  setup() {
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
      district: true,
      town: true,
      village: true
    });

    const mapList = [
      { id: 'street', name: '地图', className: 'mapType-normal', imgNormal: dtNormal, imgActive: dtActive },
      { id: 'satellite', name: '影像图', className: 'mapType-image', imgNormal: yxtNormal, imgActive: yxtActive }
    ];

    const layerConfigs = [
      { id: "building", title: "企业建筑点", type: "economic", url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3AWJPjianzhuxinxipc38&outputFormat=application%2Fjson" },
      { id: "house", title: "企业房屋面", type: "economic", url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3AWJPFWMpc38&outputFormat=application%2Fjson" },
      { id: "city", title: "市行政区边界", type: "boundary", url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3AWJPSJpc38&outputFormat=application%2Fjson" },
      { id: "district", title: "区县行政边界", type: "boundary", url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3AWJPQXpc38&outputFormat=application%2Fjson" },
      { id: "town", title: "镇街行政边界", type: "boundary", url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3AWJPZJpc38&outputFormat=application%2Fjson" },
      { id: "village", title: "村社区行政边界", type: "boundary", url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3AWJPCSQpc38&outputFormat=application%2Fjson" }
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

        // 边界图层颜色配置 
        const boundaryColors = {
          city: { fill: [51, 136, 255, 0.1], outline: [51, 136, 255, 0.8] },
          district: { fill: [255, 165, 0, 0.1], outline: [255, 165, 0, 0.8] },
          town: { fill: [50, 205, 50, 0.1], outline: [50, 205, 50, 0.8] },
          village: { fill: [147, 112, 219, 0.1], outline: [147, 112, 219, 0.8] }
        };

        const graphics = data.features.map((f, index) => {
          let geometry = null;
          const type = f.geometry.type;
          const coords = f.geometry.coordinates;

          if (type === "Point") {
            geometry = { type: "point", x: coords[0], y: coords[1], spatialReference: { wkid: 4526 } };
          } else if (type === "Polygon") {
            geometry = { type: "polygon", rings: coords, spatialReference: { wkid: 4526 } };
          } else if (type === "MultiPolygon") {
            const allRings =[];
            coords.forEach(polygonCoords => {
              polygonCoords.forEach(ring => {
                allRings.push(ring);
              });
            });
            geometry = { type: "polygon", rings: allRings, spatialReference: { wkid: 4526 } };
          }


          return new mapModules.value[3]({
            geometry: geometry,
            attributes: { ...f.properties, ObjectId: index }
          });
        });

        const layer = new mapModules.value[2]({
          source: graphics,
          id: config.id,
          title: config.title,
          objectIdField: "ObjectId",
          fields: [
            { name: "ObjectId", type: "oid" },
            ...Object.keys(data.features[0].properties).map(key => ({ name: key, type: "string" }))
          ],
          renderer: config.type === "economic"
            ? (data.features[0].geometry.type === "Point"
              ? { type: "simple", symbol: { type: "simple-marker", color: [255, 165, 0, 0.8], size: 8 } }
              : { type: "simple", symbol: { type: "simple-fill", color: [51, 136, 255, 0.1], outline: { color: [51, 136, 255, 0.8], width: 1.5 } } }
            )
            : {
              type: "simple",
              symbol: {
                type: "simple-fill",
                color: boundaryColors[config.id].fill,
                outline: {
                  color: boundaryColors[config.id].outline,
                  width: config.id === 'city' ? 2 : 1.5
                }
              }
            },
          spatialReference: { wkid: 4526 },
          visible: true
        });

        layers.value.push({ id: config.id, title: config.title, visible: true, instance: layer, type: config.type });

        // 为边界图层创建对应的文本标注层
        if (config.type === "boundary" && config.id !== 'city') {
          await createLabelLayer(config.id, data.features, mapModules.value);
        }

        return layer;
      } catch (e) {
        console.error(config.title + " 加载失败:", e);
        return null;
      }
    };

    // 异步加载图层 
    const loadLayersSequentially = async (map) => {
      try {
        // 1. 首先加载市区边界
        const cityLayer = await createJsonLayer(layerConfigs.find(l => l.id === 'city'));
        if (cityLayer) map.add(cityLayer);

        // 2. 加载区县
        const districtLayer = await createJsonLayer(layerConfigs.find(l => l.id === 'district'));
        if (districtLayer) map.add(districtLayer);

        // 3. 加载镇街
        const townLayer = await createJsonLayer(layerConfigs.find(l => l.id === 'town'));
        if (townLayer) map.add(townLayer);

        // 4. 加载村居（包含标注信息）
        const villageLayer = await createJsonLayer(layerConfigs.find(l => l.id === 'village'));
        if (villageLayer) {
          map.add(villageLayer);

          // 异步创建标注图层
          createLabelsAsync(villageLayer, map);
        }

        // 5. 加载房屋面
        const houseLayer = await createJsonLayer(layerConfigs.find(l => l.id === 'house'));
        if (houseLayer) map.add(houseLayer);

        // 6. 加载建筑点
        const buildingLayer = await createJsonLayer(layerConfigs.find(l => l.id === 'building'));
        if (buildingLayer) map.add(buildingLayer);

        loading.value = false;
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

        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: new SpatialReference({ wkid: 4526 }),
          extent: {
            xmin: 38392997.07, ymin: 2495903.35, xmax: 38505644.28, ymax: 2648163.20,
            spatialReference: { wkid: 4526 }
          },
          ui: { components: [] }
        });

        window.view = view.value;

        mapInitialized.value = true;

        // 初始化完成后开始逐步加载图层 
        loadLayersSequentially(map);
      } catch (error) {
        console.error("Map Initialization Failed:", error);
        loading.value = false;
      }
    });

    const updateLayerVisibility = (layer) => {
      const target = view.value?.map.findLayerById(layer.id);
      if (target) target.visible = layer.visible;
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
      updateLayerVisibility, updateBasemapVisibility, updateLabelVisibility, togglePanel,
      handleSelectionComplete: (g) => console.log('选择完成:', g)
    };
  }
};
</script>

<style lang="scss" scoped>
#viewDiv {
  padding: 0;
  margin: 0;
  height: 100vh;
  width: 100%;
  position: relative;
}

.layer-tree-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 50;
  background: white;
  border-radius: 4px;
  width: 220px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f8f8;
  border-bottom: 1px solid #ddd;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
}

.tree-content {
  padding: 10px;
  max-height: 400px;
  overflow-y: auto;
}

.tree-node {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 13px;
}

.tree-group {
  font-weight: bold;
  margin-top: 10px;
  margin-bottom: 5px !important;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.tree-checkbox {
  margin-right: 8px;
  cursor: pointer;
}

.tree-label {
  cursor: pointer;
}

.toggle-btn {
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 2px 8px;
  font-size: 12px;
  cursor: pointer;
}

.mapType {
  height: 60px;
  width: 72px;
  position: absolute;
  bottom: 15%;
  right: 20px;
  cursor: pointer;
  z-index: 100;
  padding: 0;
  margin: 0;
  list-style: none;
  transition: width 0.3s;

  .item {
    position: absolute;
    bottom: 0;
    width: 72px;
    height: 100%;
    border: 1px solid rgba(125, 125, 125, 0.8);
    border-radius: 4px;
    transition: all 0.3s;
    background-size: 100% 100%;

    .map-label {
      position: absolute;
      bottom: 0;
      right: 0;
      background: rgba(60, 60, 60, 0.9);
      color: white;
      font-size: 12px;
      padding: 1px 6px;
      border-radius: 4px 0 0 0;
    }

    &.actived {
      border: 2px solid #0091ff;

      .map-label {
        background: #0091ff;
      }
    }
  }

  .mapType-image {
    right: 0;
    z-index: 1;
  }

  .mapType-normal {
    right: 0;
    z-index: 2;
  }

  &:hover {
    width: 160px;

    .mapType-image {
      right: 80px;
    }
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-content {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 15px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 16px;
  color: #333;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>