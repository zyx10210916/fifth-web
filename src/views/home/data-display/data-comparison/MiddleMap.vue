<template>
  <div class="comparison-map-wrapper">
    <MapView ref="mapView" :appendMode="true" @map-select="handleSelection" @map-loaded="handleMapLoaded" />

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
import { ref, watch } from 'vue';
import MapView from '../MapView.vue';
import { message } from 'ant-design-vue';

// 1. 参考 RightMap，接收 filterParams 属性
const props = defineProps({
  filterParams: { type: Object, default: () => ({}) }
});

const emit = defineEmits(['map-select']);
const mapView = ref<InstanceType<typeof MapView> | null>(null);
const selectedGroups = ref<string[]>([]);

// 2. 参考 RightMap，处理地图加载完成的回调
// 这样可以确保 MapView 内部的 BuildingLayer 准备好后，立即触发缓存加载逻辑
const handleMapLoaded = async () => {
  if (mapView.value) {
    // 调用 fetchBuildingPoints 会进入 BuildingLayer 的缓存检查判断
    await mapView.value.fetchBuildingPoints(props.filterParams);
  }
};

// 3. 参考 RightMap，监听 filterParams 的变化
// 虽然点数据现在是全量的，但保持监听可以确保在筛选条件改变时，
// 地图逻辑能与整体业务逻辑保持同步（哪怕 BuildingLayer 内部拦截了重绘）
watch(() => props.filterParams, (newParams) => {
  if (mapView.value) {
    mapView.value.fetchBuildingPoints(newParams);
  }
}, { deep: true });

const handleSelection = (codes: string) => {
  if (!codes || codes === 'warn' || codes === 'none' || codes === '') return;

  if (selectedGroups.value.includes(codes)) {
    message.info('该区域已在比对清单中');
    return;
  }

  selectedGroups.value.push(codes);
  message.success(`已添加区域 ${selectedGroups.value.length}`);
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
};

const startComparison = () => {
  if (selectedGroups.value.length < 2) {
    message.warning('请至少选择两个区域进行比对');
    return;
  }
  emit('map-select', [...selectedGroups.value]);
};
</script>

<style scoped>
/* 样式保持不变 */
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