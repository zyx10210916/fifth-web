<template>
  <div class="comparison-map-wrapper">
    <MapView ref="mapView" :appendMode="true" @map-select="handleMapSelect" @map-loaded="handleMapLoaded" />

    <div class="comparison-toolbar">
      <div class="info">
        已选对比区域：<span class="count">{{ selectedGroups.length }}</span> 个
      </div>
      <div class="btns">
        <el-button size="small" @click="clearGroups">清空重选</el-button>
        <el-button type="primary" size="small" :disabled="selectedGroups.length < 2" @click="startComparison">
          开始比对
        </el-button>
      </div>
      <div class="tip">提示：点击地图区域或使用拉框工具选择多个区域</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MapView from '../MapView.vue';
import { message } from 'ant-design-vue';

const props = defineProps({
  filterParams: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['map-select', 'clear']);
const mapView = ref<InstanceType<typeof MapView> | null>(null);
const selectedGroups = ref<Array<{ zxAxis: string, yxAxis: string, wkt: string }>>([]);

const handleMapLoaded = async () => {
};

const handleMapSelect = (payload: any) => {
  if (!payload || (!payload.wkt && !payload.zxAxis && !payload.yxAxis)) return;
  if (payload._isUpdate) {
    const target = selectedGroups.value.find(group => group.wkt === payload.wkt);
    if (target) {
      target.zxAxis = payload.zxAxis;
      target.yxAxis = payload.yxAxis;
    }
    return;
  }

  const isDuplicate = selectedGroups.value.some(group => {
    if (payload.wkt && group.wkt) {
      return group.wkt === payload.wkt;
    }
    return group.zxAxis === payload.zxAxis && group.yxAxis === payload.yxAxis;
  });

  if (isDuplicate) {
    message.info('该区域已在比对清单中');
    return;
  }

  selectedGroups.value.push({
    zxAxis: payload.zxAxis || "",
    yxAxis: payload.yxAxis || "",
    wkt: payload.wkt || ""
  });

  message.success(`已添加区域 ${selectedGroups.value.length}`);
};

const startComparison = () => {
  if (selectedGroups.value.length < 2) {
    message.warning('请至少选择两个区域进行比对');
    return;
  }
  emit('map-select', [...selectedGroups.value]);
};

const clearGroups = () => {
  selectedGroups.value = [];
  const view = mapView.value?.getMapView() as any;
  if (view && view.graphics) {
    view.graphics.removeAll();
  }
  if (mapView.value) {
    mapView.value.clearMapTools();
  }
  emit('clear');
};
</script>

<style scoped>
.comparison-map-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
}

.comparison-toolbar {
  position: absolute;
  top: 10%;
  right: 2%;
  z-index: 500;
  background: white;
  padding: 12px 25px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 320px;
}

.info {
  font-size: 16px;
  color: #333;
}

.count {
  color: #409eff;
  font-weight: bold;
  font-size: 20px;
  margin: 0 4px;
}

.btns {
  display: flex;
  gap: 15px;
}

.tip {
  font-size: 12px;
  color: #999;
}
</style>