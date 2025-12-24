<template>
  <div class="data-display-container">
    <div class="tabs-head">
      <div class="tabs-wrapper">
        <a-tabs v-model:activeKey="activeTabKey" class="custom-tabs" @change="handleTabChange">
          <a-tab-pane key="summary" tab="汇总数据展示" />
          <a-tab-pane key="comparison" tab="数据比对展示" />
          <a-tab-pane key="heatmap" tab="单位热力图" />
          <a-tab-pane key="building" tab="建筑物展示" />
          <a-tab-pane key="custom" tab="自定义区域汇总" />
        </a-tabs>
      </div>
 
      <div class="right-actions">
        <a-button class="filter-btn" size="small" @click="showFilterModal">
          筛选条件
          <template #icon><FilterOutlined /></template>
        </a-button>
      </div>
    </div>
 
    <div class="content-area">
      <component 
        :is="activeComponent" 
        :filter-params="filterParams"
        class="tab-content"
      />
    </div>
 
    <FilterModal 
      v-model:is-visible="filterVisible"
      @apply="handleFilterApply"
    />
  </div>
</template>
 
<script setup lang="ts">
import { ref, computed } from 'vue';
import { FilterOutlined } from '@ant-design/icons-vue';
import FilterModal from './filter.vue';  
import SummaryDisplay from './summary-display/index.vue';  
import UnitHeatmap from './unit-heatmap/index.vue';
 
const activeTabKey = ref('summary');
const filterVisible = ref(false);
const filterParams = ref({});
 
const componentMap = {
  summary: SummaryDisplay,
  heatmap: UnitHeatmap 
};
 
const activeComponent = computed(() => componentMap[activeTabKey.value]);
 
const handleTabChange = (key: string) => {
  activeTabKey.value = key;
};
 
const showFilterModal = () => {
  filterVisible.value = true;
};
 
const handleFilterApply = (filters: any) => {
  filterParams.value = filters;
};
</script>
 
<style scoped lang="less">
.data-display-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}
 
.tabs-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.6rem;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
 
  .tabs-wrapper {
    flex: 1;
  }
 
  .right-actions {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding-right: 1.6rem;
 
    .filter-btn {
      background-color: #373737;
      color: #fff;
      border-radius: 2rem;
      border: none;
      font-size: 1.4rem;
      padding: 0 1.5rem;
      height: 2.8rem;
      display: flex;
      align-items: center;
      flex-direction: row-reverse;
 
      &:hover {
        background-color: #555;
        color: #fff;
      }
 
      :deep(.anticon) {
        margin-left: 0.8rem;
        margin-right: 0;
      }
    }
  }
}
 
.custom-tabs {
  padding: 0 1.6rem;
  border-bottom: 0.1rem solid #f0f0f0;
  background-color: #fff;
 
  :deep(.ant-tabs-tab) {
    font-size: 1.4rem;
    padding: 1.2rem 0;
  }
}
 
:deep(.ant-tabs-nav::before) {
  border-bottom: none !important;
}
 
:deep(.ant-tabs-nav) {
  margin-bottom: 0 !important;
 
  .ant-tabs-tab {
    color: rgb(113 113 113 / 100%);
    font-size: 1.6rem;
    margin: 0 1.6rem;
 
    &.ant-tabs-tab-active {
      .ant-tabs-tab-btn {
        color: #546fff !important;
        font-size: 1.6rem;
      }
    }
  }
 
  .ant-tabs-ink-bar {
    background: #546fff;
    height: 0.2rem;
  }
}
 
.content-area {
  flex: 1;
  overflow: auto;
  padding: 1.6rem;
  background-color: #f5f7fa;
  border-radius: 0.8rem;
  margin: 0 1.6rem 1.6rem;
}
</style>