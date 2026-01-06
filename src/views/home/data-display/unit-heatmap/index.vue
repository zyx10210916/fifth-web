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
      :unit-list-data="unitListData"
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
      pageNum: pageNum,
      pageSize: 20,
      ...extraParams
    };
    
    console.log('发送请求参数:', params); // 调试 
    const res = await getUnitHeatMap(params);
    console.log('收到响应数据:', res?.data); // 调试
    
    if (res?.data) {
      unitListData.value = {
        list: res.data.list, // 完全替换列表数据
        total: res.data.total,
        pageNum: pageNum,
        pageSize: 20 
      };
    }
  } catch (error) {
    console.error('获取单位热力图列表失败:', error);
  } finally {
    loading.value = false;
  }
};
 
const handleRowClick = (row: any) => {
  selectedUnit.value = row;
  if (mapRef.value) {
    mapRef.value.highlightUnit(row);
  }
};
 
const handlePageChange = (page: number) => {
  fetchUnitList(page, props.filterParams || {});
};
 
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