<template>
  <div class="main-content-layout">
    <LeftPanel :summary-data="apiData" />
    <MiddleMap class="map-center" />
    <RightPanel :summary-data="apiData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import LeftPanel from '../summary-display/left-stats/index.vue';
import MiddleMap from './middle-map/index.vue';
import RightPanel from '../summary-display/right-stats/index.vue';
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
      "registerType": "100", // 保持默认值
      "unitScale": "",
      "businessOperationType": "",
      "industryCategory": "",
      "holdingSituation": "",
      ...extraParams
    };

    console.log('--- 热力图页面发起筛选请求 ---', params);
    const res = await getGsSumDataDisplay(params);
    if (res && res.data) {
      apiData.value = res.data;
    }
  } catch (error) {
    console.error('获取热力图统计数据失败:', error);
  }
};

// 2. 监听筛选参数深度变化
watch(() => props.filterParams, (newVal) => {
  // 即使是空对象也尝试请求，或者加个判断
  fetchData(newVal || {});
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
  gap: 15px;
  padding: 15px;
  box-sizing: border-box;
  background-color: #f0f2f5;
}

.map-center {
  flex: 1;
  min-width: 0;
}
</style>