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

    const highlightUnit = async (unit) => {
  // 1. 验证坐标是否存在 (由 getUnitHeatMap 接口提供)
  if (!unit || !unit.XZ_AXIS || !unit.YZ_AXIS || !mapView.value) return;

  try {
    if (!mapModules.value) await loadEsriModules();
    const [Graphic] = mapModules.value;

    // 获取底层 MapView 实例
    const view = mapView.value.getMapView();
    if (!view) return;

    // 清除之前的高亮 Graphic
    if (highlightRef.value) {
      view.graphics.remove(highlightRef.value);
    }

    // 构建点几何对象
    const pointGeometry = {
      type: "point",
      x: parseFloat(unit.XZ_AXIS),
      y: parseFloat(unit.YZ_AXIS),
      spatialReference: { wkid: 4526 }
    };

    // 创建红色高亮圆点 Graphic
    const highlightGraphic = new Graphic({
      geometry: pointGeometry,
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: [255, 0, 0, 0.9], 
        size: 10,
        outline: { color: [255, 255, 255], width: 1 }
      },
      attributes: unit 
    });

    // 将高亮层添加到地图
    view.graphics.add(highlightGraphic);
    highlightRef.value = highlightGraphic;

    // 执行飞行缩放 (flyTo 效果)
    await view.goTo({
      target: pointGeometry,
      zoom: 17 
    }, {
      duration: 1200,  
      easing: "ease-in-out"
    });

    // 定位完成后打开信息弹窗
    view.popup.open({
      title: unit.B102 || '单位信息',
      content: `
        <div style="font-size:14px; line-height: 1.6;">
          <p><b>统一社会信用代码:</b> ${unit.B109 || '-'}</p>
          <p><b>主要业务活动:</b> ${unit.B1031 || '-'}</p>
          <p><b>资产总计:</b> ${unit.ZCZJ || 0} 万元</p>
          <p><b>地址:</b> ${unit.B1056 || '-'}</p>
        </div>
      `,
      location: pointGeometry
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