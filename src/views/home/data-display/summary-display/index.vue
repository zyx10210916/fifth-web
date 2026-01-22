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
import { getGsSumDataDisplay } from '@/api/data-display';


const props = defineProps<{
  filterParams?: any;
}>();

const apiData = ref({});
const currentAxes = ref({ zxAxis: "", yxAxis: "" });
const lastRequestSnapshot = ref("");

const fetchData = async (extraParams = {}) => {
  const params = {
    "zxAxis": currentAxes.value.zxAxis,
    "yxAxis": currentAxes.value.yxAxis,
    "area": "",
    "industryDept": "",
    "registerType": "",
    "unitScale": "",
    "businessOperationType": "",
    "industryCategory": "",
    "holdingSituation": "",
    ...extraParams
  };

  // 请求拦截：对比参数无变化则不重复请求
 const currentSnapshot = JSON.stringify(params);
  if (currentSnapshot === lastRequestSnapshot.value) return; 
  lastRequestSnapshot.value = currentSnapshot;

try {
    const res = await getGsSumDataDisplay(params);
    if (res && res.data) apiData.value = res.data;
  } catch (error) {
    console.error('汇总接口请求失败:', error);
  }
};

const handleMapSelect = (payload) => {
  const isEmpty = !payload || (!payload.zxAxis && !payload.yxAxis);
  if (isEmpty && !currentAxes.value.zxAxis) return;
  currentAxes.value = payload || { zxAxis: "", yxAxis: "" };
  fetchData(props.filterParams || {});
};

watch(() => props.filterParams, (newVal) => {
  if (newVal) {
    fetchData(newVal);
  }
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

.right-panel {
  min-width: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
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
}
</style>