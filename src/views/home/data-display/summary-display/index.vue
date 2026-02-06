<template>
  <div class="main-content">
    <LeftPanel class="left-panel" :summary-data="apiData" />
    <MiddleMap class="map-center" @map-select="handleMapSelect" />
    <RightPanel class="right-panel" :summary-data="apiData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import LeftPanel from './LeftPanel.vue';
import MiddleMap from './MiddleMap.vue';
import RightPanel from './RightPanel.vue';
import { fetchBusinessData } from '@/api/data-display';

const props = defineProps<{
  filterParams?: any;
}>();

const apiData = ref({});
const currentAxes = ref({ zxAxis: "", yxAxis: "", wkt: "" });
const lastRequestSnapshot = ref("");

const fetchData = async (extraParams = {}) => {

  const wktParams = {
    wkt: currentAxes.value.wkt,
    ...extraParams 
  };

  const oldParams = {
    zxAxis: currentAxes.value.zxAxis,
    yxAxis: currentAxes.value.yxAxis,
    ...extraParams
  };

  // 请求拦截逻辑
  const currentSnapshot = JSON.stringify({ wkt: wktParams.wkt, zxAxis: oldParams.zxAxis, ...extraParams });
  if (currentSnapshot === lastRequestSnapshot.value) return; 
  lastRequestSnapshot.value = currentSnapshot;

  try {
    const res = await fetchBusinessData(wktParams, oldParams, 'sum');
    
    if (res && res.data) {
      apiData.value = res.data; 
    }
  } catch (error) {
    console.error('获取数据失败:', error);
  }
};

const emit = defineEmits(['clear-area']);

// 处理地图选择事件
const handleMapSelect = (payload) => {
  if (payload.isUpdate && apiData.value && currentAxes.value.wkt === payload.wkt) {
    currentAxes.value.zxAxis = payload.zxAxis;
    currentAxes.value.yxAxis = payload.yxAxis;
    return;
  }

  currentAxes.value = payload || { zxAxis: "", yxAxis: "", wkt: "" };
  fetchData(props.filterParams || {}); 
};

// 监听过滤参数变化
watch(() => props.filterParams, (newVal) => {
  fetchData(newVal || {});
}, { deep: true });

onMounted(() => {
  fetchData(props.filterParams || {});
});
</script>

<style scoped>
.main-content {
  display: flex;
  height: 100%;
  width: 100%;
  gap: 10px;
  padding: 0;
  overflow: hidden;
  align-items: stretch;
}

.left-panel {
  flex: 1;
  background: white;
}

.map-center {
  flex: 2.5;
  background: white;
}

.right-panel {
  flex: 1;
  background: white;
  min-width: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
</style>