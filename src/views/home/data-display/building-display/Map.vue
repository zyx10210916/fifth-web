<template>
  <div ref="mapContainer" class="ol-map"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowRef } from 'vue';
import { loadModules } from 'esri-loader';
import { MAP_CONFIG } from '@/config/mapConfig';

const mapContainer = ref(null);
const view = shallowRef<any>(null);

const initMap = async () => {
  try {
    const [Map, MapView, FeatureLayer, Graphic, SpatialReference] = await loadModules([
      'esri/Map',
      'esri/views/MapView',
      'esri/layers/FeatureLayer',
      'esri/Graphic',
      'esri/geometry/SpatialReference'
    ], { 
      url: MAP_CONFIG.arcgis.js, 
      css: MAP_CONFIG.arcgis.css 
    });

    const sp = new SpatialReference({ wkid: 4526 });

    // 1. 初始化地图 (不加载底图)
    const map = new Map();

    view.value = new MapView({
      container: mapContainer.value,
      map: map,
      spatialReference: sp,
      extent: MAP_CONFIG.initialExtent,
      ui: { components: [] }
    });

    // 2. 创建空的 FeatureLayer
    const dataLayer = new FeatureLayer({
      id: "massive_data_layer",
      source: [], 
      geometryType: "point", // 【关键修复】：必须明确指定几何类型为点
      objectIdField: "ObjectId",
      spatialReference: sp,
      fields: [
        { name: "ObjectId", type: "oid" },
        { name: "WYM", type: "string" },
        { name: "B102", type: "string" }
      ],
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-marker",
          size: 4,
          color: [255, 68, 0, 0.7],
          outline: { color: [255, 255, 255], width: 1 }
        }
      }
    });
    map.add(dataLayer);

    // 3. 异步获取数据并分批加载
    const fetchDataAndLoad = async () => {
      const wfsUrl = "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3Agongbaokupc38&outputFormat=application%2Fjson";
      
      const response = await fetch(wfsUrl);
      const data = await response.json();
      const features = data.features;

      const chunkSize = 5000;
      for (let i = 0; i < features.length; i += chunkSize) {
        const chunk = features.slice(i, i + chunkSize);
        
        const graphics = chunk.map((f, idx) => new Graphic({
          geometry: {
            type: "point",
            x: f.geometry.coordinates[0],
            y: f.geometry.coordinates[1],
            spatialReference: sp
          },
          attributes: {
            ObjectId: i + idx + 1,
            ...f.properties
          }
        }));

        // 逐步注入数据
        await dataLayer.applyEdits({
          addFeatures: graphics
        });

        if (i % 50000 === 0) {
          console.log(`加载进度: ${Math.min(i + chunkSize, features.length)} / ${features.length}`);
          // 稍微延迟，确保 UI 能够渲染
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // 4. 加载完成后定位
      // 使用 queryExtent 确保获取到所有分批注入后的最新范围
      const responseExtent = await dataLayer.queryExtent();
      if (responseExtent.extent) {
        view.value.goTo(responseExtent.extent);
      }
    };

    fetchDataAndLoad();

  } catch (error) {
    console.error("地图初始化或数据加载失败:", error);
  }
};

onMounted(initMap);
</script>

<style scoped>
.ol-map {
  width: 100%;
  height: 100%;
  background-color: #f0f2f5;
}
</style>