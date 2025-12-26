<template>
  <div class="main-content">
    <LeftPanel :summary-data="apiData" />
    <MiddleMap class="map-center" />
    <RightPanel :summary-data="apiData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import LeftPanel from './left-stats/index.vue';
import MiddleMap from '../summary-display/middle-map/index.vue';
import RightPanel from './right-stats/index.vue';
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
      area: "440103,440104", // 越秀、荔湾
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
  height: 100%;
  width: 100%;
  gap: 0px;
  padding: 0;
  overflow: hidden;
}

:deep(.middle-map-container) {
  flex: 1;
  min-width: 0;
  height: 100%;
}

.map-center {
  flex: 1;
  min-width: 0;
}
</style>