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

    <div class="content-area">
      <component :is="activeComponent" :filter-params="filterParams" class="tab-content" />
    </div>

    <FilterModal v-model:is-visible="filterVisible" @apply="handleFilterApply" />
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
const filterParams = ref({}); // 初始值为空对象

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
  console.log('接收到筛选条件并更新引用:', filters);
  // 核心修复点：使用 {...filters} 产生新引用地址，确保子组件 watch 被触发
  filterParams.value = { ...filters };
};
</script>

<style scoped lang="less">
/* 保持你原本的样式，仅确保布局撑满 */
.data-display-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa; /* 将背景色移到最外层 */
}

.tabs-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  height: 60px;
  flex-shrink: 0;
}

.content-area {
  flex: 1;
  overflow: hidden;
  padding: 15px 20px; 
  display: flex;
  flex-direction: column;
}

.filter-btn {
  background-color: #373737;
  color: #fff;
  border-radius: 2rem;
  border: none;
  height: 2.8rem;
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
}

.filter-btn:hover {
  background-color: #555;
  color: #fff;
}
</style>