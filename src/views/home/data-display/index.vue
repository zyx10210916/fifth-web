<template>
  <a-tabs 
    v-model:activeKey="activeTabKey" 
    class="custom-tabs" 
    @change="handleTabChange"
  >
    <a-tab-pane key="summary" tab="汇总数据展示" />
    <a-tab-pane key="comparison" tab="数据比对展示" />
    <a-tab-pane key="heatmap" tab="单位热力图" />
    
    <template #leftExtra>
       <div style="width: 1.6rem;"></div>
    </template>
    <template #rightExtra>
      <div class="right-actions">
        <a-button class="filter-btn" size="small" @click="showFilterModal">
          筛选条件
          <template #icon>
            <FilterOutlined />
          </template>
        </a-button>
      </div>
    </template>
  </a-tabs>

  <div class="dynamic-comp">
    <keep-alive>
    <component 
      :is="activeComponent" 
      :filter-params="filterParams" 
      @update-params="handleFilterApply" 
    />
    </keep-alive>
  </div>

  <FilterModal 
    v-model:is-visible="filterVisible"
    :current-params="filterParams"  
    @apply="handleFilterApply"
  />
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
const filterParams = ref({}); 

const componentMap = {
  summary: SummaryDisplay,
  heatmap: UnitHeatmap,
  comparison: DataComparison,
};

const activeComponent = computed(() => componentMap[activeTabKey.value]);

const handleTabChange = (key: string) => {
  activeTabKey.value = key;
  filterParams.value = {};
};

const showFilterModal = () => {
  filterVisible.value = true;
};

const handleFilterApply = (filters: any) => {
  filterParams.value = { ...filters };
};
</script>

<style scoped lang="less">
:host { 
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dynamic-comp {
  flex: 1; 
  overflow: hidden;
  padding: 10px 0px; 
  background: #f5f5f5;
  display: flex;
}

.custom-tabs {
  padding: 0;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  height: 60px;
  display: flex;
  align-items: center;

  :deep(.ant-tabs-nav) {
    margin-bottom: 0 !important;
    width: 100%;

    .ant-tabs-tab {
      padding: 12px 0 !important;
      color: #717171;
      font-size: 1.6rem;
      margin: 0 1.6rem;

      &.ant-tabs-tab-active .ant-tabs-tab-btn {
        color: #546fff !important;
        font-weight: 500;
      }
    }

    .ant-tabs-ink-bar {
      background: #546fff;
      height: 2px;
    }
  }
}

.right-actions {
  padding-right: 24px;
  display: flex;
  align-items: center;

  .filter-btn {
    background-color: #373737;
    color: white;
    border-radius: 2rem;
    border: none;
    height: 2.8rem;
    padding: 0 1.2rem;
    display: flex;
    align-items: center;
    flex-direction: row-reverse; 
    gap: 8px;

    &:hover {
      background-color: #555;
    }
  }
}

:deep(.ant-tabs-nav::before) {
  border-bottom: none !important;
}
</style>