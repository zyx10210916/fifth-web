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
        <a-select
          v-model:value="statSystem"
          placeholder="请选择"
          class="style-1-select"
          size="small"
          style="width: 200px"
        >
          <a-select-option value="一套表">企一套表统计调查制度</a-select-option>
          <a-select-option value="非一套表">企非一套表统计调查制度</a-select-option>
        </a-select>

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
const statSystem = ref('一套表'); // 默认选中企一套表
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
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;

  .tabs-wrapper {
    flex: 1;
  }

  .right-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .style-1-select {
      :deep(.ant-select-selector) {
        border-radius: 4px;
        border: 1px solid #dcdfe6;
      }
    }

    .filter-btn {
      background-color: #373737; // 参考HTML中的背景色
      color: #fff;
      border-radius: 20px; // 圆角按钮
      border: none;
      font-size: 12px;
      padding: 0 15px;
      height: 28px;
      display: flex;
      align-items: center;
      flex-direction: row-reverse; // 让图标在文字右侧

      &:hover {
        background-color: #555;
        color: #fff;
      }

      :deep(.anticon) {
        margin-left: 8px;
        margin-right: 0;
      }
    }
  }
}

.custom-tabs {
  :deep(.ant-tabs-nav) {
    margin: 0;
    &::before {
      border: none; // 去掉自带的底边线，由父级控制
    }

    .ant-tabs-tab {
      padding: 16px 0;
      margin: 0 16px;
      font-size: 14px;
      color: #303133;

      &-active .ant-tabs-tab-btn {
        color: #409eff;
        font-weight: bold;
      }
    }

    .ant-tabs-ink-bar {
      height: 2px;
      background: #409eff;
    }
  }
}

.content-area {
  flex: 1;
  overflow: auto;
  padding: 16px;
  background-color: #f5f7fa; // 增加背景色区分内容区
}
</style>