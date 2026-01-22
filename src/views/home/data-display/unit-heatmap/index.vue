<template>
  <div class="main-content">
    <LeftPanel 
      class="left-list"
      :list-data="unitListData"
      :loading="listLoading"
      @change-page="handlePageChange"
      @row-click="handleRowClick"
    />
    <RightMap 
      ref="mapRef"
      class="map-center"
      :selected-unit="selectedUnit"
      :filter-params="effectiveFilterParams"
      :loading="mapLoading"
      @map-select="handleMapSelect"  
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import LeftPanel from './LeftPanel.vue';
import RightMap from './RightMap.vue';
import { getUnitHeatMap } from '@/api/data-display';

const props = defineProps<{
  filterParams?: any;
}>();

const selectedUnit = ref<any>(null);
const unitListData = ref({
  list: [],
  total: 0,
  pageNum: 1,
  pageSize: 20
});

const listLoading = ref(false);
const mapLoading = ref(false);
const currentAxes = ref({ zxAxis: "", yxAxis: "" });
const lastRequestSnapshot = ref("");

const effectiveFilterParams = computed(() => ({
  ...props.filterParams,
  zxAxis: currentAxes.value.zxAxis,
  yxAxis: currentAxes.value.yxAxis
}));

const handleMapSelect = (payload) => {
  currentAxes.value = payload || { zxAxis: "", yxAxis: "" };
  fetchUnitList(1);
};

const fetchUnitList = async (pageNum = 1) => {
  const params = {
    pageNo: pageNum,
    pageSize: 20,
    ...effectiveFilterParams.value
  };

  const currentSnapshot = JSON.stringify(params);
  if (currentSnapshot === lastRequestSnapshot.value) {
    return; 
  }
  
  lastRequestSnapshot.value = currentSnapshot;
  listLoading.value = true;

  try {
    const res = await getUnitHeatMap(params);
    if (res?.data) {
      unitListData.value = {
        list: res.data.list || [],
        total: res.data.total || 0,
        pageNum: pageNum,
        pageSize: 20,
      };
    }
  } catch (error) {
    console.error('获取单位列表失败:', error);
  } finally {
    listLoading.value = false;
  }
};

const handleRowClick = (row: any) => {
  selectedUnit.value = { ...row };
};

const handlePageChange = (page: number) => {
  fetchUnitList(page);
};

watch(() => props.filterParams, () => {
  fetchUnitList(1);
}, { deep: true });

onMounted(() => {
  fetchUnitList(1);
});
</script>

<style scoped>
.main-content {
  display: flex;
  height: 100%;    
  width: 100%;
  gap: 10px;
  background: #f0f2f5;
}

.left-list {
  flex: 3;
  background: white;
  border-radius: 4px;
}

.map-center {
  flex: 7;
  background: white;
  border-radius: 4px;
  position: relative;
}
</style>