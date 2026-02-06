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
  // 如果当前有选区数组且不是清空状态，则继续走高性能比对
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

    //此时 wkt 为空，fetchBusinessData 内部会自动切换到旧接口 (getDataComparison)
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

// 处理开始多对比事件
const handleStartComparison = async (axisList: any[]) => {
  if (!axisList || axisList.length < 2) return;
  emit('clear-area');
  activeComparisonList.value = axisList;

  try {
    // 发起试探请求：使用第一个选区，并带上普通接口所需的 axisDtos
    const firstItem = axisList[0];
    const oldComparisonParams = {
      axisDtos: axisList, 
      area: "", 
      ...props.filterParams
    };

    const firstRes = await fetchBusinessData(
      { wkt: firstItem.wkt, ...props.filterParams },
      oldComparisonParams,
      'comparison'
    );

    // 根据标记进行逻辑分发
    if (firstRes._isHP === false) {
      // 情况 A：开关关闭或报错回退。返回的是普通接口计算好的全量对比数据
      apiData.value = firstRes.data || firstRes;
      console.log('检测到旧接口回退或开关关闭，已渲染全量对比数据');
    } else {
      // 情况 B：高性能模式正常。返回的是第一个区域的数据，需并行请求剩下的区域
      console.log('高性能模式运行中，开始并行请求剩余区域数据');
      
      const requests = axisList.map(async (item, index) => {
        const regionName = item.name || `区域 ${index + 1}`;
        
        // 第一个区域直接用试探请求的结果，不再重复发包
        if (index === 0) {
          return { name: regionName, data: firstRes.data };
        }

        const wktParams = { wkt: item.wkt, ...props.filterParams };
        const oldParams = { zxAxis: item.zxAxis, yxAxis: item.yxAxis, ...props.filterParams };
        
        const singleRes = await fetchBusinessData(wktParams, oldParams, 'comparison');
        return { name: regionName, data: singleRes.data || singleRes };
      });

      const results = await Promise.all(requests);
      apiData.value = results.reduce((acc, cur) => {
        acc[cur.name] = cur.data;
        return acc;
      }, {} as any);
    }
  } catch (error) {
    console.error('比对流程异常:', error);
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