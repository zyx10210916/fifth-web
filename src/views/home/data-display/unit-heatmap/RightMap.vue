<template>
  <MapView 
    ref="mapView" 
    :show-heatmap-option="true" 
    @map-select="handleMapSelect" 
    @map-loaded="handleMapLoaded"
  />
</template>

<script setup lang="ts">
import { ref, shallowRef, watch } from 'vue';
import MapView from '../MapView.vue';
import { MAP_CONFIG } from '@/config/mapConfig';

const props = defineProps<{
  selectedUnit?: any;
  filterParams?: any;
  loading?: boolean;
}>();

const emit = defineEmits(['map-select']);

const mapView = ref<InstanceType<typeof MapView> | null>(null);
const mapModules = shallowRef<any>(null);
const highlightRef = shallowRef<any>(null);

// 高亮选中单位
const highlightUnit = (unit: any) => {
  const posX = parseFloat(unit.XZ_AXIS);
  const posY = parseFloat(unit.YZ_AXIS);

  if (!unit || isNaN(posX) || isNaN(posY) || !mapView.value || !mapModules.value) return;

  try {
    const { Graphic } = mapModules.value;
    const view: any = mapView.value.getMapView();
    if (!view) return;

    // 清除旧高亮
    if (highlightRef.value) {
      view.graphics.remove(highlightRef.value);
    }

    const pointGeometry = {
      type: "point",
      x: posX,
      y: posY,
      spatialReference: MAP_CONFIG.initialExtent.spatialReference
    };

    // 使用配置中统一的 highlightPoint 样式
    const highlightGraphic = new Graphic({
      geometry: pointGeometry,
      symbol: MAP_CONFIG.styles.highlightPoint,
      attributes: unit
    });

    view.graphics.add(highlightGraphic);
    highlightRef.value = highlightGraphic;

    // 弹出信息窗
    view.popup.open({
      title: unit.B102 || '单位信息',
      content: `
        <div style="font-size:14px; line-height: 1.6; padding: 5px;">
          <p><b>统一社会信用代码:</b> ${unit.B109 || '-'}</p>
          <p><b>主要业务活动:</b> ${unit.B1031 || '-'}</p>
          <p><b>资产总计:</b> ${unit.ZCZJ || 0} 万元</p>
          <p><b>地址:</b> ${unit.B1056 || '-'}</p>
        </div>
      `,
      location: pointGeometry
    });
    
    view.goTo({ target: pointGeometry, zoom: 16 });

  } catch (error) {
    console.error("RightMap 高亮执行失败:", error);
  }
};

const handleMapLoaded = (payload: any) => {
  mapModules.value = payload.modules; 
};

const handleMapSelect = (payload: any) => {
  emit('map-select', payload);
};

watch(() => props.selectedUnit, (unit) => {
  if (unit) highlightUnit(unit);
});
</script>