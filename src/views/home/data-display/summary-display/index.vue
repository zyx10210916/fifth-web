<template>
  <div class="main-content">
    <LeftPanel class="left-panel" :summary-data="apiData" />
    <MiddleMap class="map-center" @map-select="handleMapSelectChange" />
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
    
    const res = await getGsSumDataDisplay(params);
    if (res && res.data) {
      apiData.value = res.data;
    }
  } catch (error) {
    console.error('获取数据失败:', error);
  }
};

const handleMapSelectChange = (codes: string) => {
  if (codes === '') {
    currentUniqueCode.value = "";
  } else {
    currentUniqueCode.value = codes;
  }
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