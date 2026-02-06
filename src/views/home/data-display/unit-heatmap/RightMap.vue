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
import { mapPopup } from '@/hooks/mapPopup';
import { getUnitHeatMap } from '@/api/data-display'; 

const props = defineProps<{
  selectedUnit?: any;
  filterParams?: any;
  loading?: boolean;
}>();

const emit = defineEmits(['map-select']);

const mapView = ref<InstanceType<typeof MapView> | null>(null);
const mapModules = shallowRef<any>(null);
const highlightRef = shallowRef<any>(null);
const { showPopup } = mapPopup(mapView, mapModules);

//高亮选中逻辑
const highlightUnit = async (unit: any) => {
  if (!unit || !mapView.value || !mapModules.value) return;

  // 获取坐标数据
  let posX = parseFloat(unit.XZ_AXIS || unit.xz_axis);
  let posY = parseFloat(unit.YZ_AXIS || unit.yz_axis);
  let finalUnitData = { ...unit };

  // 高性能模式处理：如果没有坐标，则通过 b109 关联普通接口获取点位
  if (isNaN(posX) || isNaN(posY)) {
    try {
      const res = await getUnitHeatMap({ 
        uniqueCode: unit.B109 || unit.b109, 
        pageSize: 1, 
        pageNo: 1 
      });

      if (res?.success && res?.data?.list?.length > 0) {
        const detail = res.data.list[0];
        posX = parseFloat(detail.XZ_AXIS);
        posY = parseFloat(detail.YZ_AXIS);
        finalUnitData = { ...detail };
      } else {
        console.warn('该单位未找到对应的空间坐标点');
        return;
      }
    } catch (error) {
      console.error("补全单位坐标失败:", error);
      return;
    }
  }

  // 执行地图渲染逻辑
  try {
    const { Graphic } = mapModules.value;
    const view: any = mapView.value.getMapView();
    if (!view || isNaN(posX) || isNaN(posY)) return;

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

    const highlightGraphic = new Graphic({
      geometry: pointGeometry,
      symbol: MAP_CONFIG.styles.highlightPoint,
      attributes: finalUnitData
    });

    view.graphics.add(highlightGraphic);
    highlightRef.value = highlightGraphic;

    showPopup(finalUnitData, pointGeometry, false);
    view.goTo({ target: pointGeometry, zoom: 16 });

  } catch (error) {
    console.error("RightMap高亮执行失败:", error);
  }
};

const handleMapLoaded = (payload: any) => {
  mapModules.value = payload.modules; 
};

const handleMapSelect = (payload: any) => {
  emit('map-select', payload);
};

watch(() => props.selectedUnit, (unit) => {
  if (unit) {
    highlightUnit(unit);
  }
}, { deep: true });
</script>