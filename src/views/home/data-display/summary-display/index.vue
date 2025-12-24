<template>
  <div class="main-content-layout">
    <LeftPanel :summary-data="apiData" />
    <MiddleMap />
    <RightPanel />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import LeftPanel from './left-stats/index.vue';
import MiddleMap from './middle-map/index.vue';
import RightPanel from './right-stats/index.vue';
import { getGsSumDataDisplay } from '@/api/data-display'; 
const apiData = ref([]);

const fetchData = async () => {
  try {
    const params = {
      "uniqueCode": "", "area": "", "industryDept": "",
      "registerType": "", "unitScale": "", "businessOperationType": "",
      "industryCategory": ""
    };
    const res = await getGsSumDataDisplay(params);
    if (res && res.data) {
      apiData.value = res.data;
    }
  } catch (error) {
    console.error('获取汇总数据失败:', error);
  }
};

onMounted(() => {
  fetchData();
});
</script>