<template>
  <div class="main-content">
    <LeftPanel class="left-panel" :summary-data="apiData" />
    <MiddleMap class="map-center" />
    <RightPanel class="right-panel" :summary-data="apiData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import LeftPanel from './LeftPanel.vue';
import MiddleMap from '../summary-display/MiddleMap.vue';
import RightPanel from './RightPanel.vue';
import { getDataComparison } from '@/api/data-display';

const props = defineProps<{
  filterParams?: any;
}>();

const emit = defineEmits(['update-params']);
const apiData = ref({});
const isFirstLoad = ref(true);

const fetchData = async (extraParams = {}) => {
  try {
    const defaultCompare = {
      area: "440103,440104", 
      industryDept: "",
      registerType: "",
      unitScale: "",
      businessOperationType: "",
      industryCategory: "",
      holdingSituation: ""
    };

    const hasUserFilter = props.filterParams && Object.keys(props.filterParams).length > 0;

    const params = {
      uniqueCode: "",
      ...(hasUserFilter ? props.filterParams : defaultCompare),
      ...extraParams
    };

    const res = await getDataComparison(params);

    if (res?.success === false) {
      message.warn(res.message || "请选择两个以上地区进行对比");
      return;
    }

    if (res && res.data) {
      apiData.value = res.data;

      if (isFirstLoad.value && !hasUserFilter) {
        emit('update-params', defaultCompare);
        isFirstLoad.value = false;
      }
    }
  } catch (error) {
    console.error('获取对比数据失败:', error);
  }
};

watch(() => props.filterParams, (newVal) => {
  if (newVal) {
    fetchData(newVal);
  }
}, { deep: true });

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.main-content {
  display: flex;
  height: 100vh; 
  width: 100%;
  gap: 10px;
  border-radius: 6px;
  padding: 0;
  overflow: hidden;
  align-items: stretch; 
}
 
.left-panel,
.map-center,
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