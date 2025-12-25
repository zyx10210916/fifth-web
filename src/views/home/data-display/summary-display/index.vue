<template>
  <div class="main-content-layout">
    <LeftPanel :summary-data="apiData" />
    <MiddleMap />
    <RightPanel />
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

const fetchData = async (extraParams = {}) => {
  try {
    const params = {
      "uniqueCode": "", 
      "area": "", 
      "industryDept": "",
      "registerType": "100", 
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

// 监听筛选参数深度变化
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
/* --- 主内容布局样式：三栏 Flexbox --- */
.main-content-layout {
  display: flex;
  height: 100%; 
  gap: 10px;
  padding: 0;
  overflow: hidden; 
}
</style>