<template>
  <MapView 
    ref="mapView" 
    :show-heatmap-option="true" 
    @map-select="handleMapSelect" 
    @map-loaded="handleMapLoaded"
    @building-loaded="handlePointsUpdate"
    >
    </MapView>
</template>

<script>
import { ref, shallowRef } from 'vue';
import { loadModules } from 'esri-loader';
import MapView from '../MapView.vue';

export default {
  components: { MapView },
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
    const currentWfsPoints = ref([]);


    const loadEsriModules = async () => {
      const modules = await loadModules([
        'esri/Graphic',
        'esri/geometry/Point',
        'esri/symbols/SimpleMarkerSymbol'
      ]);
      mapModules.value = modules;
    };

    // 高亮选中单位
    const highlightUnit = async (unit) => {
      const posX = parseFloat(unit.XZ_AXIS);
      const posY = parseFloat(unit.YZ_AXIS);

      if (!unit || isNaN(posX) || isNaN(posY) || !mapView.value) return;

      try {
        if (!mapModules.value) await loadEsriModules();
        const Graphic = mapModules.value[3];

        const view = mapView.value.getMapView();
        if (!view) return;

        if (highlightRef.value) {
          view.graphics.remove(highlightRef.value);
        }

        const pointGeometry = {
          type: "point",
          x: posX,
          y: posY,
          spatialReference: { wkid: 4526 }
        };

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
        view.graphics.add(highlightGraphic);
        highlightRef.value = highlightGraphic;

        // await view.goTo({
        //   target: pointGeometry,
        //   zoom: 17
        // }, {
        //   duration: 1200,
        //   easing: "ease-in-out"
        // });

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
    };

    const handlePointsUpdate = (data) => {
      currentWfsPoints.value = data || [];
    };

     const handleMapSelect = (payload) => {
      emit('map-select', payload); 
    };

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
      handleMapLoaded,
      handlePointsUpdate,
      handleMapSelect,
      highlightUnit,
    };
  }
};
</script>