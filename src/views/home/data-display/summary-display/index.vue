<template>
  <div class="main-content">
    <LeftPanel :summary-data="apiData" />
    <MiddleMap  class="map-center" @map-select="handleMapSelectChange"/>
    <RightPanel :summary-data="apiData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import LeftPanel from './left-stats/index.vue';
import MiddleMap from './middle-map/index.vue';
import RightPanel from './right-stats/index.vue';
import { getGsSumDataDisplay } from '@/api/data-display'; 

const props = defineProps<{
  filterParams?: any;
}>();

const apiData = ref({});
const currentUniqueCode = ref("");

const fetchData = async (extraParams = {}) => {
  try {
    const params = {
      "uniqueCode": currentUniqueCode.value, 
      "area": "", 
      "industryDept": "",
      "registerType": "", 
      "unitScale": "", 
      "businessOperationType": "",
      "industryCategory": "",
      "holdingSituation": "",
      ...extraParams 
    };
    
    console.log('--- 发起筛选请求，参数：', params);
    const res = await getGsSumDataDisplay(params);
    if (res && res.data) {
      apiData.value = res.data;
    }
  } catch (error) {
    console.error('获取数据失败:', error);
  }
};

// 处理地图拉框选中的回调
const handleMapSelectChange = (codes: string) => {
  currentUniqueCode.value = codes;
  fetchData(props.filterParams || {});
};

// 监听顶部/侧边筛选框变化
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
  gap: 0px;
  padding: 0;
  overflow: hidden;
}

:deep(.middle-map-container){
  flex:1;
  min-width: 0;
  height:100%;
}
.map-center{
  flex:1;
  min-width: 0;
}
</style>