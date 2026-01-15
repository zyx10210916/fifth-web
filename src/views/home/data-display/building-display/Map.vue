<template>
  <div ref="mapContainer" class="ol-map"></div>
</template>
 
<script setup>
import { ref, onMounted } from 'vue';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import Heatmap from 'ol/layer/Heatmap';
import VectorSource from 'ol/source/Vector';
import MVT from 'ol/format/MVT';
import WMTSGrid from 'ol/tilegrid/WMTS';
import { Style, Stroke, Fill, Circle } from 'ol/style';
import Projection from 'ol/proj/Projection';
import Feature from 'ol/Feature';
 
const mapContainer = ref(null);
 
onMounted(() => {
  const gridsetName = 'EPSG:4326';
  const gridNames = ['EPSG:4326:0', 'EPSG:4326:1', 'EPSG:4326:2', 'EPSG:4326:3', 'EPSG:4326:4', 'EPSG:4326:5', 'EPSG:4326:6', 'EPSG:4326:7', 'EPSG:4326:8', 'EPSG:4326:9', 'EPSG:4326:10', 'EPSG:4326:11', 'EPSG:4326:12', 'EPSG:4326:13', 'EPSG:4326:14', 'EPSG:4326:15', 'EPSG:4326:16', 'EPSG:4326:17', 'EPSG:4326:18', 'EPSG:4326:19', 'EPSG:4326:20', 'EPSG:4326:21'];
  const baseUrl = 'http://192.168.10.123:8089/geoserver/dataCenterWorkspace/gwc/service/wmts';
  const layerName = 'dataCenterWorkspace:gongbaokuqiyedianpc38_1';
  const format = 'application/vnd.mapbox-vector-tile';
  
  const resolutions = [0.703125, 0.3515625, 0.17578125, 0.087890625, 0.0439453125, 0.02197265625, 0.010986328125, 0.0054931640625, 0.00274658203125, 0.001373291015625, 6.866455078125E-4, 3.4332275390625E-4, 1.71661376953125E-4, 8.58306884765625E-5, 4.291534423828125E-5, 2.1457672119140625E-5, 1.0728836059570312E-5, 5.364418029785156E-6, 2.682209014892578E-6, 1.341104507446289E-6, 6.705522537231445E-7, 3.3527612686157227E-7];
 
  const projection = new Projection({
    code: 'EPSG:4326',
    units: 'degrees',
    axisOrientation: 'neu'
  });
 
  const url = `${baseUrl}?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&LAYER=${layerName}&STYLE=&TILEMATRIX=${gridsetName}:{z}&TILEMATRIXSET=${gridsetName}&FORMAT=${format}&TILECOL={x}&TILEROW={y}`;
 
  const source = new VectorTileSource({
    url: url,
    format: new MVT(),
    projection: projection,
    tileGrid: new WMTSGrid({
      tileSize: [256, 256],
      origin: [-180.0, 90.0],
      resolutions: resolutions,
      matrixIds: gridNames
    }),
    wrapX: true
  });
 
  // 热力图数据源
  const heatmapSource = new VectorSource();
  
  // 热力图图层配置 
  const heatmapLayer = new Heatmap({
    source: heatmapSource,
    blur: 15,
    radius: 10,
    weight: 1, // 固定权重 
    gradient: ['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000']
  });
 
  // 点图层（同时收集数据到热力图）
  const pointLayer = new VectorTileLayer({
    source: source,
    style: function(feature) {
      // 将每个点添加到热力图数据源 
      const heatFeature = new Feature({
        geometry: feature.getGeometry().clone()
      });
      heatmapSource.addFeature(heatFeature);
      
      return new Style({
        image: new Circle({
          radius: 4,
          fill: new Fill({ color: 'rgba(255, 0, 0, 0.5)' }),
          stroke: new Stroke({ color: 'white', width: 1 })
        })
      });
    }
  });
 
  const map = new Map({
    target: mapContainer.value,
    layers: [heatmapLayer, pointLayer],
    view: new View({
      center: [113.5, 23.3],
      zoom: 8,
      resolutions: resolutions,
      projection: projection,
      extent: [-180.0, -90.0, 180.0, 90.0] 
    })
  });
 
  // 修复：使用正确的监听方式 
  map.getView().on('change:resolution', function() {
    const zoom = map.getView().getZoom();
    heatmapLayer.setVisible(zoom > 7);
    pointLayer.setVisible(zoom <= 10);
  });
 
  // 适应广东范围 
  map.getView().fit([112.95159737049927, 22.60205958520947, 114.04112455367077, 23.917492250868566], {
    size: map.getSize(),
    padding: [30, 30, 30, 30]
  });
});
</script>
 
<style scoped>
.ol-map { 
  width: 100%; 
  height: 600px; 
  background-color: #f7f7f7; 
}
</style>