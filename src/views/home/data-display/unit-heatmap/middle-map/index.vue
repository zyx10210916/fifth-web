<template>
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
        <h3>配置面板</h3>
        <button @click="panelVisible = !panelVisible" class="toggle-btn">{{ panelVisible ? '隐藏' : '显示' }}</button>
      </div>
      <div v-if="panelVisible" class="tree-content">
        <div class="tree-node tree-group"><label>热力图动态分析</label></div>
        <div class="config-section">
          <div class="label-text">权重字段 (Long/Double)：</div>
          <select v-model="selectedHeatmapField" @change="handleFieldChange" class="custom-select">
            <option value="">-- 仅按分布密度 --</option>
            <option v-for="field in numericFields" :key="field" :value="field">{{ field }}</option>
          </select>
          <div class="tip-text">当前测试：JZWLX</div>
        </div>

        <div class="tree-node tree-group"><label>图层控制</label></div>
        <div v-for="layer in layers" :key="layer.id" class="tree-node">
          <input type="checkbox" :id="layer.id" v-model="layer.visible" @change="updateLayerVisibility(layer)" class="tree-checkbox">
          <label :for="layer.id" class="tree-label">{{ layer.title }}</label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, shallowRef, onMounted, onUnmounted } from 'vue';
import { loadModules } from 'esri-loader';

// 导入你的图片资源（请确保路径正确）
import dtNormal from "@/assets/images/dt-1.png";
import dtActive from "@/assets/images/dt-2.png";
import yxtNormal from "@/assets/images/yxt-1.png";
import yxtActive from "@/assets/images/yxt-2.png";

export default {
  name: 'ArcGISHeatmapPro',
  setup() {
    const view = shallowRef(null);
    const mapModules = shallowRef(null);
    const panelVisible = ref(true);
    const loading = ref(true);
    const loadingText = ref('正在初始化地图...');
    
    const layers = ref([]); // 存储图层元数据
    const numericFields = ref([]); // 存储扫描到的数值字段
    const selectedHeatmapField = ref("JZWLX"); // 默认使用 JZWLX
    const activeBasemapId = ref('street');

    const mapList = [
      { id: 'street', name: '地图', className: 'mapType-normal', imgNormal: dtNormal, imgActive: dtActive },
      { id: 'satellite', name: '影像图', className: 'mapType-image', imgNormal: yxtNormal, imgActive: yxtActive }
    ];

    // 配置图层
    const layerConfigs = [
      { id: "building", title: "企业建筑点", url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3AWJPjianzhuxinxipc38&outputFormat=application%2Fjson" }
    ];

    /**
     * 创建热力图渲染器
     */
    const createHeatmapRenderer = (fieldName) => {
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
        maxPixelIntensity: 100,
        minPixelIntensity: 0
      };
    };

    /**
     * 核心：加载 GeoJSON 数据并转为 FeatureLayer
     */
    const loadGeoJsonLayer = async (config, map) => {
      try {
        loadingText.value = `正在获取 ${config.title} 数据...`;
        const response = await fetch(config.url);
        const data = await response.json();

        if (!data.features || data.features.length === 0) {
          console.warn(`${config.title} 无数据返回`);
          return;
        }

        // 1. 自动提取数值字段 (用于下拉框)
        const props = data.features[0].properties;
        numericFields.value = Object.keys(props).filter(key => {
          return typeof props[key] === 'number' || !isNaN(Number(props[key]));
        });

        const [FeatureLayer, Graphic] = mapModules.value;

        // 2. 将 GeoJSON 特征转换为 ArcGIS Graphics
        const graphics = data.features.map((f, index) => {
          const coords = f.geometry.coordinates;
          // 确保所有属性特别是权重字段为 Number 类型
          const attributes = { ...f.properties, custom_oid: index };
          if (attributes.JZWLX) attributes.JZWLX = Number(attributes.JZWLX);
          if (attributes.OBJECTID) attributes.OBJECTID = Number(attributes.OBJECTID);

          return new Graphic({
            geometry: { 
              type: "point", 
              x: coords[0], 
              y: coords[1], 
              spatialReference: { wkid: 4526 } 
            },
            attributes: attributes
          });
        });

        // 3. 定义图层字段结构
        const fields = [
          { name: "custom_oid", type: "oid" },
          { name: "JZWLX", type: "double" },
          { name: "OBJECTID", type: "double" }
        ];
        // 动态添加其他字段
        Object.keys(props).forEach(key => {
          if (key !== "JZWLX" && key !== "OBJECTID") {
            fields.push({ name: key, type: "string" });
          }
        });

        // 4. 创建 FeatureLayer
        const layer = new FeatureLayer({
          id: config.id,
          title: config.title,
          source: graphics,
          fields: fields,
          objectIdField: "custom_oid",
          renderer: createHeatmapRenderer(selectedHeatmapField.value),
          spatialReference: { wkid: 4526 }
        });

        map.add(layer);
        layers.value.push({ id: config.id, title: config.title, visible: true, instance: layer });

      } catch (err) {
        console.error("加载图层出错:", err);
      }
    };

    /**
     * 下拉框切换字段事件
     */
    const handleFieldChange = () => {
      const buildingLayer = layers.value.find(l => l.id === "building");
      if (buildingLayer && buildingLayer.instance) {
        buildingLayer.instance.renderer = createHeatmapRenderer(selectedHeatmapField.value);
      }
    };

    onMounted(async () => {
      try {
        const modules = await loadModules([
          'esri/layers/FeatureLayer', 'esri/Graphic', 'esri/Map', 'esri/views/MapView',
          'esri/geometry/SpatialReference', 'esri/Basemap', 'esri/layers/TileLayer'
        ], {
          url: 'http://192.168.94.114/4.19/init.js',
          css: 'http://192.168.94.114/4.19/esri/themes/light/main.css'
        });

        mapModules.value = modules;
        const [FeatureLayer, Graphic, Map, MapView, SpatialReference, Basemap, TileLayer] = modules;

        const map = new Map({
          basemap: new Basemap({
            baseLayers: [new TileLayer({ url: "http://192.168.3.140:6080/arcgis/rest/services/fw_dt/MapServer" })]
          })
        });

        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: new SpatialReference({ wkid: 4526 }),
          extent: {
            xmin: 38392997.07, ymin: 2495903.35, xmax: 38505644.28, ymax: 2648163.20,
            spatialReference: { wkid: 4526 }
          }
        });

        // 加载企业建筑点
        await loadGeoJsonLayer(layerConfigs[0], map);
        
        loading.value = false;
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
      const url = id === 'street' 
        ? "http://192.168.3.140:6080/arcgis/rest/services/fw_dt/MapServer"
        : "http://192.168.94.114/arcgis/rest/services/GZ2000_ZW_YXDT_2019/MapServer";
      
      loadModules(['esri/Basemap', 'esri/layers/TileLayer']).then(([Basemap, TileLayer]) => {
        view.value.map.basemap = new Basemap({
          baseLayers: [new TileLayer({ url })]
        });
        activeBasemapId.value = id;
      });
    };

    onUnmounted(() => view.value?.destroy());

    return {
      view, panelVisible, loading, loadingText,
      layers, numericFields, selectedHeatmapField,
      mapList, activeBasemapId,
      handleFieldChange, updateLayerVisibility, handleBasemapChange
    };
  }
};
</script>

<style lang="scss" scoped>
#viewDiv { width: 100%; height: 100vh; background: #f0f0f0; }

.layer-tree-panel {
  position: absolute; top: 20px; right: 20px; z-index: 50;
  background: white; border-radius: 6px; width: 240px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
}

.panel-header {
  padding: 10px 15px; background: #f8f9fa;
  border-bottom: 1px solid #eee; display: flex; justify-content: space-between;
  h3 { margin: 0; font-size: 15px; color: #333; }
}

.tree-content { padding: 15px; }

.config-section {
  background: #f0f7ff; padding: 10px; border-radius: 4px; margin-bottom: 15px;
  .label-text { font-size: 12px; color: #666; margin-bottom: 5px; }
  .tip-text { font-size: 11px; color: #999; margin-top: 5px; }
}

.custom-select {
  width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 4px;
  outline: none; font-size: 13px;
}

.tree-node { display: flex; align-items: center; margin-bottom: 10px; font-size: 13px; }
.tree-group { font-weight: bold; border-left: 3px solid #0091ff; padding-left: 8px; margin-top: 15px; }
.tree-checkbox { margin-right: 10px; cursor: pointer; }

/* Loading Spinner */
.loading-overlay {
  position: absolute; inset: 0; background: rgba(255,255,255,0.7);
  z-index: 1000; display: flex; justify-content: center; align-items: center;
}
.spinner {
  width: 40px; height: 40px; border: 4px solid #f3f3f3;
  border-top: 4px solid #0091ff; border-radius: 50%;
  animation: spin 1s linear infinite; margin: 0 auto 10px;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* MapType Toggle (Copy from your original style) */
.mapType {
  position: absolute; bottom: 30px; right: 20px; z-index: 100;
  display: flex; gap: 10px; list-style: none;
  .item {
    width: 60px; height: 60px; border-radius: 4px; border: 2px solid white;
    cursor: pointer; background-size: cover; position: relative;
    &.actived { border-color: #0091ff; }
    .map-label { 
      position: absolute; bottom: 0; width: 100%; text-align: center;
      background: rgba(0,0,0,0.5); color: white; font-size: 11px;
    }
  }
}
</style>