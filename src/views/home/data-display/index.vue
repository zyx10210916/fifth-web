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
          <template #icon>
            <FilterOutlined />
          </template>
        </a-button>
      </div>
    </div>

    <div class="content">
      <component 
    :is="activeComponent" 
    :filter-params="filterParams" 
    @update-params="handleFilterApply" 
  />
    </div>

    <FilterModal 
    v-model:is-visible="filterVisible"
    :current-params="filterParams"  
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
import DataComparison from './data-comparison/index.vue';

const activeTabKey = ref('summary');
const filterVisible = ref(false);
const filterParams = ref({}); // 初始值为空对象

const componentMap = {
  summary: SummaryDisplay,
  heatmap: UnitHeatmap,
  comparison: DataComparison,
};

const activeComponent = computed(() => componentMap[activeTabKey.value]);

const handleTabChange = (key: string) => {
  activeTabKey.value = key;
};

const showFilterModal = () => {
  filterVisible.value = true;
};

const handleFilterApply = (filters: any) => {
  filterParams.value = { ...filters };
};
</script>

<style scoped lang="less">
.data-display-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
  box-sizing: border-box;
  padding: 0 10px !important;
  overflow: hidden;
}
 
.tabs-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 15px !important;
  border-bottom: 1px solid #f0f0f0;
  background: white;
  height: 60px;
  flex-shrink: 0;
  border-radius: 6px;
  position: relative;
  padding-bottom: 2px;
  margin-top: 15px;
  width: 100%;
 
  .tabs-wrapper {
    flex: 1;
    margin-left: 10px;
  }
 
 .right-actions {
    display: flex;
    align-items: center;
    gap: 1.2rem;
 
    .filter-btn {
      background-color: #373737;
      color: white;
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
        color: white;
      }
 
      :deep(.anticon) {
        margin-left: 0.8rem;
        margin-right: 0;
      }
    }
  }
}
 
.custom-tabs {
  padding: 0;
  background-color: white;
  height: 60px;
 
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
    padding: 16px 0 !important;
    color: rgb(113 113 113 / 100%);
    font-size: 1.6rem;
    margin: 0 1.6rem;
 
    &.ant-tabs-tab-active {
      .ant-tabs-tab-btn {
        color: #546fff !important;
      }
    }
  }
 
  .ant-tabs-ink-bar {
    background: #546fff;
    height: 2px !important;
    bottom: 2px !important;
  }
}
 
.content {
  height: calc(100%-75px);
  width: calc(100%-1
  5px);
  flex: 1;
  overflow: hidden;
  padding: 15px 0 !important;
  display: flex;
  flex-direction: column;
  margin: 0;
}


.filter-btn {
  background-color: #373737;
  color: white;
  border-radius: 2rem;
  border: none;
  height: 2.8rem;
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
}

.filter-btn:hover {
  background-color: #555;
  color: white;
}
</style>