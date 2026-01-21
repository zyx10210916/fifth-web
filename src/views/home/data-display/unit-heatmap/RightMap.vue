<template>
  <MapView 
    ref="mapView" 
    :show-heatmap-option="true"
    @map-select="handleMapSelect" 
    @map-loaded="handleMapLoaded"
    @building-loaded="handlePointsUpdate"
    @heatmap-visible="val => isHeatmapVisible = val"
  >
    <template #map-overlay>
      <HeatmapView 
        v-if="mapIsReady"
        :view="mapInstance"
        :modules="mapModules"
        :points="currentWfsPoints"
        :visible="isHeatmapVisible"
      />
    </template>
  </MapView>
</template>

<script>
import { ref, shallowRef } from 'vue';
import { loadModules } from 'esri-loader'; 
import MapView from '../MapView.vue';
import HeatmapView from './HeatmapView.vue';

export default {
  components: { MapView, HeatmapView },
  props: {
    selectedUnit: Object,
    filterParams: { type: Object, default: () => ({}) },
    loading: Boolean
  },
  emits: ['map-select'],

  setup(props, { emit }) {
    const mapView = ref(null);
    const highlightRef = shallowRef(null);
    const mapInstance = shallowRef(null);
    const mapModules = ref(null);
    const mapIsReady = ref(false);
    const isHeatmapVisible = ref(false);
    const currentWfsPoints = ref([]);


    const loadEsriModules = async () => {
      const modules = await loadModules([
        'esri/Graphic',
        'esri/symbols/SimpleMarkerSymbol'
      ]);
      mapModules.value = modules;
    };

    const highlightUnit = async (unit) => {
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

    const handleMapLoaded = (payload) => {
      mapInstance.value = payload.view;
      mapModules.value = payload.modules;
      mapIsReady.value = true;
      // 初始加载
      mapView.value.fetchBuildingPoints(props.filterParams);
    };

    const handlePointsUpdate = (data) => {
      currentWfsPoints.value = data || [];
    };

    const handleMapSelect = (codes) => emit('map-select', codes);

    // 监听筛选
    watch(() => props.filterParams, (newParams) => {
      if (mapView.value) mapView.value.fetchBuildingPoints(newParams);
    }, { deep: true });

    watch(() => props.selectedUnit, (unit) => {
      if (unit) {
        highlightUnit(unit);
      }
    });

    return {
      mapView,
      mapInstance,
      mapModules,
      mapIsReady,
      currentWfsPoints,
      isHeatmapVisible,
      handleMapLoaded,
      handlePointsUpdate,
      handleMapSelect,
      highlightUnit,
    };
  }
};
</script>