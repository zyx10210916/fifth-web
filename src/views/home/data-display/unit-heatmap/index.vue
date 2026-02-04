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
import { fetchBusinessData } from '@/api/data-display';

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
const currentAxes = ref({ zxAxis: "", yxAxis: "", wkt: "" });
const lastRequestSnapshot = ref("");

// 地图展示参数
const effectiveFilterParams = computed(() => ({
  ...props.filterParams,
  zxAxis: currentAxes.value.zxAxis,
  yxAxis: currentAxes.value.yxAxis
}));

const handleMapSelect = (payload) => {
  currentAxes.value = payload || { zxAxis: "", yxAxis: "", wkt: "" };
  if (currentAxes.value.wkt) {
    emit('clear-area');
  }
  fetchUnitList(1);
};

const fetchUnitList = async (pageNum = 1) => {
  // 构造新接口参数 (高性能模式)
  const wktParams = {
    ...props.filterParams,
    wkt: currentAxes.value.wkt,
    page: pageNum,
    offset: 20 // 对应之前的 pageSize
  };

  // 构造旧接口参数
  const oldParams = {
    ...props.filterParams,
    zxAxis: currentAxes.value.zxAxis,
    yxAxis: currentAxes.value.yxAxis,
    pageNo: pageNum,
    pageSize: 20
  };

  // 请求快照拦截：包含 wkt 变化判定
  const currentSnapshot = JSON.stringify({ wkt: wktParams.wkt, zxAxis: oldParams.zxAxis, ...props.filterParams, pageNum });
  if (currentSnapshot === lastRequestSnapshot.value) {
    return; 
  }
  
  lastRequestSnapshot.value = currentSnapshot;
  listLoading.value = true;

  try {
    // 调用分发器，类型设为 'list' 以指向 recordsV2 接口
    const res = await fetchBusinessData(wktParams, oldParams, 'list');
    
    // 处理返回数据
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

const emit = defineEmits(['clear-area']);

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