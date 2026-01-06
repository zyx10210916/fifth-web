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
import dtNormal from "@/assets/images/dt-1.png";
import dtActive from "@/assets/images/dt-2.png";
import yxtNormal from "@/assets/images/yxt-1.png";
import yxtActive from "@/assets/images/yxt-2.png";

export default {
  name: 'ArcGISFeatureLayerJsonMix',
  components: { MapTools },
  props: {isFullSize: { type: Boolean, default: false },showPopup: {type: Boolean, default: false }},
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

    const calculatePolygonCenter = (rings) => {
      let x = 0, y = 0, count = 0;
      const points = Array.isArray(rings[0][0]) ? rings[0] : rings[0];

      points.forEach(coord => {
        x += (coord[0] || coord.x);
        y += (coord[1] || coord.y);
        count++;
      });

      return [x / count, y / count];
    };

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
        const uniqueNames = new Set(); 

        features.forEach((f, index) => {
          const attr = f.attributes || f.properties;
          if (!attr) return;

          const textValue = attr[labelField];
          if (textValue && !uniqueNames.has(textValue)) { 
            uniqueNames.add(textValue); 

            let centerPoint = null;

            if (f.geometry) {
              if (f.geometry.type === "point") {
                centerPoint = f.geometry;
              } else {
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
            symbol: { type: "simple-marker", size: 0 } 
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
          popupTemplate: popupTemplate, 
          renderer: config.type === "economic"
            ? (data.features[0].geometry.type === "Point"
              ? { type: "simple", symbol: { type: "simple-marker", color: [255, 165, 0, 0.8], size: 8 } }
              : { type: "simple", symbol: { type: "simple-fill", color: [51, 136, 255, 0.1], outline: { color: [51, 136, 255, 0.8], width: 1.5 } } })
            : {
              type: "simple",
              symbol: {
                type: "simple-fill",
                color: layerColors[config.id] || [51, 136, 255, 0.1],
                outline: {
                  color: outlineColors[config.id] || [51, 136, 255, 0.8],
                  width: 1.5
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

    const loadLayersSequentially = async (map) => {
      try {
        const defaultVisibleConfigs = layerConfigs.filter(c => c.defaultVisible);
        const defaultLayers = await Promise.all(defaultVisibleConfigs.map(config => createJsonLayer(config)));

        defaultLayers.forEach(layer => {
          if (layer) map.add(layer);
        });

        loading.value = false;

        const otherConfigs = layerConfigs.filter(c => !c.defaultVisible);

        const otherLayers = await Promise.all(otherConfigs.map(async (config) => {
          const layer = await createJsonLayer(config);

          if (config.id === 'village' && layer) {
            console.log("检测到村社区图层，开始异步创建标注...");
            createLabelsAsync(layer, map);
          }
          return layer;
        }));

        console.log("所有非预置图层数据已加载就绪");

      } catch (error) {
        console.error("图层加载失败:", error);
        loading.value = false;
      }
    };

    const createLabelsAsync = async (villageLayer, map) => {
      try {
        const featureSet = await villageLayer.queryFeatures();
        const features = featureSet.features;

        if (!features || features.length === 0) return;

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
          url: 'http://10.44.58.28:8000/4.19/init.js',
          css: 'http://10.44.58.28:8000/4.19/esri/themes/light/main.css'
        });

        mapModules.value = modules;
        const [Map, MapView, FeatureLayer, Graphic, SpatialReference, Basemap, TileLayer] = modules;

        const defaultBasemap = new Basemap({
          baseLayers: [new TileLayer({ url: "http://192.168.3.140:6080/arcgis/rest/services/fw_dt/MapServer" })],
          id: "street"
        });

        const map = new Map({
          basemap: defaultBasemap,
          layers: [] 
        });

        const sr = new SpatialReference({ wkid: 4526 });

        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: sr, 
          extent: {
            xmin: 38392997.07,
            ymin: 2495903.35,
            xmax: 38505644.28,
            ymax: 2648163.20,
            spatialReference: sr 
          },
          ui: { components: [] }
        });
        window.view = view.value;

        mapInitialized.value = true;

        view.value.when(() => {
          view.value.popup.autoOpenEnabled = props.showPopup;
        });

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

          const layerData = layers.value.find(l => l.id === layer.id);

          if (layerData) {
            const rawInstance = toRaw(layerData.instance);
            view.value.map.add(rawInstance);
            rawInstance.visible = layer.visible; 

            if (config.id === 'village') {
              await createLabelsAsync(rawInstance, view.value.map);
            }
          } else {
            const newLayer = await createJsonLayer(config);
            if (newLayer) {
              view.value.map.add(newLayer);
              newLayer.visible = layer.visible; 
              if (config.id === 'village') {
                await createLabelsAsync(newLayer, view.value.map);
              }
            }
          }
        } else {
          targetLayer.visible = layer.visible;
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
      handleBasemapChange,handleMapSelection,handleSelectionComplete: handleMapSelection,
      updateLayerVisibility, updateBasemapVisibility, updateLabelVisibility, togglePanel
    };
  }
};
</script>

<style lang="scss" scoped>
.map-container {
  flex: 1;
  background: white;
  margin: 0 15px;
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