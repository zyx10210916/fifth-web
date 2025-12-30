<template>
  <div class="main-content-layout">
    <LeftPanel 
      :list-data="unitListData" 
      :loading="loading"
      @change-page="handlePageChange"
      @row-click="handleRowClick"
    />
    <RightMap 
      ref="mapRef" 
      class="map-center" 
      :selected-unit="selectedUnit"
    />
  </div>
</template>
 
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import LeftPanel from './left-list/index.vue';
import RightMap from './right-map/index.vue';
import { getUnitHeatMap } from '@/api/data-display'; 
 
const props = defineProps<{
  filterParams?: any;
}>();
 
const mapRef = ref();
const selectedUnit = ref<any>(null);
const unitListData = ref({
  list: [],
  total: 0,
  pageNum: 1,
  pageSize: 20
});
const loading = ref(false);
 
const fetchUnitList = async (pageNum = 1, extraParams = {}) => {
  loading.value = true;
  try {
    const params = {
      "pageNum": pageNum,
      "pageSize": 20,
      "uniqueCode": "",
      "area": "",
      "industryDept": "",
      ...extraParams
    };
    
    const res = await getUnitHeatMap(params);
    if (res && res.data) {
      unitListData.value = res.data;
    }
  } catch (error) {
    console.error('获取单位热力图列表失败:', error);
  } finally {
    loading.value = false;
  }
};
 
// 处理表格行点击
const handleRowClick = (row: any) => {
  selectedUnit.value = row;
  // 调用地图组件的方法定位到该点 
  if (mapRef.value) {
    mapRef.value.highlightUnit(row);
  }
};
 
// 分页切换 
const handlePageChange = (page: number) => {
  fetchUnitList(page, props.filterParams || {});
};
 
// 监听筛选参数变化 
watch(() => props.filterParams, (newVal) => {
  fetchUnitList(1, newVal || {});
}, { deep: true });
 
onMounted(() => {
  fetchUnitList(1, props.filterParams || {});
});
</script>
 
<style scoped>
.main-content-layout {
  display: flex;
  height: 100%; 
  width: 100%;
  gap: 0px;
  padding: 0;
  overflow: hidden;
}
.map-center {
  flex: 1;
  min-width: 0;
}
</style>