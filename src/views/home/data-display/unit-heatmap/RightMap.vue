<template>
  <MapView ref="mapView" @map-select="handleMapSelect" @map-loaded="handleMapLoaded">
    <template #map-overlay>
      <button @click="openHeatmapView" class="heatmap-view-btn">查看热力图</button>
    </template>
  </MapView>
</template>

<script>
import { ref, shallowRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { loadModules } from 'esri-loader'; // 确保引入了加载工具
import MapView from '../MapView.vue';

export default {
  name: 'RightMap',
  components: { MapView },
  props: {
    selectedUnit: Object,
    filterParams: { type: Object, default: () => ({}) },
    loading: Boolean
  },
  emits: ['map-select'],

  setup(props, { emit }) {
    const router = useRouter();
    const mapView = ref(null);
    const highlightRef = shallowRef(null);
    const mapModules = ref(null);

    // 加载高亮所需的 ArcGIS 模块
    const loadEsriModules = async () => {
      // 建议传入与全局一致的配置
      const modules = await loadModules([
        'esri/Graphic',
        'esri/symbols/SimpleMarkerSymbol'
      ]);
      mapModules.value = modules;
    };
    // 高亮单位逻辑 (RightMap 独有)
   // RightMap.vue

const highlightUnit = async (unit) => {
  if (!unit?.B109 || !mapView.value) return;

  try {
    // 1. 依然先获取 Graphic 模块（这是必须的，用来创建容器）
    // 如果你之前的代码是用 [Graphic] = mapModules.value 取的，这里也保持一致
    if (!mapModules.value) await loadEsriModules();
    const [Graphic] = mapModules.value; 

    // 2. 调用 MapView 暴露的查询接口
    const features = await mapView.value.queryBuildingPoints(`B109 = '${unit.B109}'`);

    // 3. 获取底层 View 实例
    const view = mapView.value.getMapView();
    if (!view || !features?.length) return;

    // 清除旧高亮
    if (highlightRef.value) {
      view.graphics.remove(highlightRef.value);
    }

    // 4. 【核心修复】：直接使用对象字面量作为 symbol
    // 不要用 new SimpleMarkerSymbol，直接把配置写在 symbol 属性里
    // ArcGIS 会根据 type: "simple-marker" 自动找到对应的类
    const highlightGraphic = new Graphic({
      geometry: features[0].geometry,
      symbol: {
        type: "simple-marker", // 靠这个字符串让底层的 Accessor 自动解析
        style: "circle",
        color: [255, 0, 0, 0.9],
        size: 14,
        outline: { color: [255, 255, 255], width: 2 }
      }
    });

    // 5. 添加并定位
    view.graphics.add(highlightGraphic);
    highlightRef.value = highlightGraphic;

    await view.goTo({
      target: features[0].geometry,
      zoom: 15
    }, { duration: 800 });

    // 如果你想保留之前的弹窗功能
    view.popup.open({
      title: unit.B102 || '单位信息',
      content: `统一代码: ${unit.B109}`,
      location: features[0].geometry
    });

  } catch (error) {
    console.error("RightMap 高亮执行失败:", error);
  }
};

    const handleMapLoaded = async () => {
      if (mapView.value) {
        await mapView.value.fetchBuildingPoints(props.filterParams);
      }
    };

    const openHeatmapView = () => {
      // 通过暴露的 buildingLayer 获取数据
      const data = mapView.value?.buildingLayer?.data;
      if (data) {
        sessionStorage.setItem('heatmapData', JSON.stringify(data));
        router.push('/heatmap-view');
      }
    };

    const handleMapSelect = (codes) => emit('map-select', codes);

    // 监听筛选
    watch(() => props.filterParams, (newParams) => {
      if (mapView.value) mapView.value.fetchBuildingPoints(newParams);
    }, { deep: true });

    // 监听选中项变化
    watch(() => props.selectedUnit, (unit) => {
      if (unit) {
        // 【关键修复】：直接调用本地的 highlightUnit，不加 mapView.value
        highlightUnit(unit);
      }
    });

    return {
      mapView,
      openHeatmapView,
      handleMapSelect,
      handleMapLoaded,
      highlightUnit // 暴露给外部（虽然目前是内部 watch 调用）
    };
  }
};
</script>

<style lang="scss" scoped>
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
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}
</style>