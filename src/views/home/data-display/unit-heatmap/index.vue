<template>
  <div class="main-content-layout">
    <LeftPanel class="left-list" :list-data="unitListData" :loading="listLoading" @change-page="handlePageChange"
      @row-click="handleRowClick" />
    <RightMap ref="mapRef" class="map-center" :selected-unit="selectedUnit" :map-points-data="mapPointsData"
      :loading="mapLoading" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import LeftPanel from './left-list/index.vue';
import RightMap from './right-map/index.vue';
import { getUnitHeatMap, getBulletinList } from '@/api/data-display';

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
const mapPointsData = ref<any[]>([]);
const listLoading = ref(false);
const mapLoading = ref(false);

// 左侧列表数据请求 
const fetchUnitList = async (pageNum = 1, extraParams = {}) => {
  listLoading.value = true;
  try {
    const params = {
      pageNo: pageNum,
      pageSize: 20,
      "area": "",
      ...extraParams
    };

    const res = await getUnitHeatMap(params);

    if (res?.data) {
      unitListData.value = {
        list: res.data.list,
        total: res.data.total,
        pageNum: pageNum,
        pageSize: 20
      };
    }
  } catch (error) {
    console.error('获取单位热力图列表失败:', error);
  } finally {
    listLoading.value = false;
  }
};

// 右侧地图数据请求（分批加载）
const fetchMapPoints = async (pageNo = 1, extraParams = {}) => {
  mapLoading.value = true;
  try {
    const pageSize = 10000;

    const res = await getBulletinList({
      pageNo,
      pageSize,
      "area": "",
      ...extraParams
    });

    if (res?.data?.list && res.data.list.length > 0) {
      // 转换数据格式
      const transformedPoints = res.data.list.map(item => ({
        ...item,
        XZ_AXIS: item.XZ_AXIS,
        YZ_AXIS: item.YZ_AXIS,
        B109: item.B109,
        WYM: item.WYM,
        ZCZJ: item.ZCZJ,
        ZYSR: item.ZYSR,
        QMRS: item.QMRS,
        CYRS: item.CYRS
      }));

      // 追加新数据到现有数据 
      mapPointsData.value = [...mapPointsData.value, ...transformedPoints];

      // // 检查是否还有更多数据可以加载
      // if (res.data.list.length === pageSize && pageNo * pageSize < res.data.total) {
      //   // 继续加载下一页
      //   fetchMapPoints(pageNo + 1, extraParams);
      // }
    }
  } catch (error) {
    console.error('获取地图点位数据失败:', error);
  } finally {
    mapLoading.value = false;
  }
};

const handleRowClick = (row: any) => {
  selectedUnit.value = {
    WYM: row.WYM,
    B102: row.B102,
    B109: row.B109
  };
  if (mapRef.value) {
    mapRef.value.highlightUnit(selectedUnit.value);
  }
};

const handlePageChange = (page: number) => {
  fetchUnitList(page, props.filterParams || {});
};

watch(() => props.filterParams, (newVal) => {
  fetchUnitList(1, newVal || {});
  mapPointsData.value = []; 
  fetchMapPoints(1, newVal || {});
}, { deep: true });

onMounted(() => {
  fetchUnitList(1, props.filterParams || {});
  fetchMapPoints(1, props.filterParams || {});
});
</script>

<style scoped>
.main-content-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  gap: 10px;
  padding: 0;
  overflow: hidden;
  align-items: stretch;
}

.left-list {
  flex: 3;
  min-width: 0;
  overflow: auto;
  background: white;
}

.map-center {
  flex: 7;
  min-width: 0;
  overflow: hidden;
}
</style>