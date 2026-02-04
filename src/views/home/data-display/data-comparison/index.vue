<template>
  <div class="main-content">
    <LeftPanel class="left-panel" :summary-data="apiData" />
    <MiddleMap 
      class="map-center" 
      @map-select="handleStartComparison" 
      @clear="handleClear" 
    />
    <RightPanel class="right-panel" :summary-data="apiData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { message } from 'ant-design-vue';
import LeftPanel from './LeftPanel.vue';
import MiddleMap from './MiddleMap.vue';
import RightPanel from './RightPanel.vue';
import { fetchBusinessData } from '@/api/data-display';

const props = defineProps<{
  filterParams?: any;
}>();
  
const emit = defineEmits(['update-params', 'clear-area']);
const apiData = ref({});
const isFirstLoad = ref(true);
const activeComparisonList = ref<any[]>([]);
const hasUserFilter = computed(() => props.filterParams && Object.keys(props.filterParams).length > 0);

// 获取数据方法
const fetchData = async (extraParams = {}) => {
  // 1. 如果当前有选区数组且不是清空状态，则继续走高性能比对
  if (activeComparisonList.value.length >= 2) {
    handleStartComparison(activeComparisonList.value);
    return;
  }

  try {
    // 默认对比的行政区划代码
    const defaultCompare = {
      area: "440103,440104", 
      industryDept: "",
      registerType: "",
      unitScale: "",
      businessOperationType: "",
      industryCategory: "",
      holdingSituation: ""
    };

    let baseParams = hasUserFilter.value ? { ...props.filterParams } : { ...defaultCompare };
    if (!baseParams.area || baseParams.area === "") {
      baseParams.area = defaultCompare.area;
    }

    const oldParams = { uniqueCode: "", ...baseParams, ...extraParams };

    // 2. 核心逻辑：此时 wkt 为空，fetchBusinessData 内部会自动切换到旧接口 (getDataComparison)
    const res = await fetchBusinessData({ wkt: "" }, oldParams, 'comparison');

    if (res && res.data) {
      apiData.value = res.data;
      if (isFirstLoad.value && !hasUserFilter.value) {
        emit('update-params', defaultCompare);
        isFirstLoad.value = false;
      }
    }
  } catch (error) {
    console.error('获取默认对比数据失败:', error);
  }
};

// 清理地图选择
const handleClear = () => {
  activeComparisonList.value = [];
};

// 处理开始多区域对比事件
const handleStartComparison = async (axisList: any[]) => {
  if (!axisList || axisList.length < 2) {
    message.warn("请选择至少两个区域进行对比");
    return;
  }
  emit('clear-area');
  activeComparisonList.value = axisList;

  try {
    // 并行发起多个高性能请求
    const requests = axisList.map((item, index) => {
      const regionName = item.name || `区域 ${index + 1}`;
      
      const wktParams = {
        wkt: item.wkt, 
        area: "",
        ...props.filterParams 
      };

      const oldParams = {
        zxAxis: item.zxAxis,
        yxAxis: item.yxAxis,
        ...props.filterParams
      };
      
      return fetchBusinessData(wktParams, oldParams, 'comparison')
        .then(res => ({
          name: regionName,
          data: res.data || res 
        }));
    });

    const results = await Promise.all(requests);
    const comparisonMap = results.reduce((acc, cur) => {
      acc[cur.name] = cur.data;
      return acc;
    }, {} as any);

    apiData.value = comparisonMap;

  } catch (error) {
    console.error('高性能比对请求失败:', error);
    message.error("数据加载失败，请检查网络");
  }
};

// 监听侧边栏参数变化
watch(() => props.filterParams, (newVal) => {
  fetchData(newVal || {});
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
  min-width: 0;
  overflow: auto;
  display: flex;
  flex-direction: column; 
  background: white; 
}
</style>