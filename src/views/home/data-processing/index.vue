<template>
  <a-tabs v-model:activeKey="activeTabKey" class="custom-tabs" @tab-click="changeTab">
    <a-tab-pane key="1" tab="数据查询" />
    <a-tab-pane key="2" tab="快速汇总" />
    <a-tab-pane key="3" tab="交叉汇总" />
    <a-tab-pane key="4" tab="模板汇总" />
  </a-tabs>
  <div class="dynamic-comp">
    <component
        :is="componentsMap[activeTabKey]"
        :query-data="queryData"
        @navigate-to-summary="handleNavigateToSummary"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DataQuery from '@/views/home/data-processing/data-query/index.vue';
import QuickSummary from '@/views/home/data-processing/quick-summary/index.vue';
import CrossSummary from '@/views/home/data-processing/cross-summary/index.vue';
import TemplateSummary from '@/views/home/data-processing/template-summary/index.vue';
// 动态组件映射
const componentsMap = {
  1: DataQuery,
  2: QuickSummary,
  3: CrossSummary,
  4: TemplateSummary,
};

// 激活状态，默认从sessionStorage获取，否则为1
const activeTabKey = ref('1');

// 查询数据，从sessionStorage获取
const queryData = ref({});

onMounted(() => {
  // 从sessionStorage获取activeTabKey
  try {
    const storedActiveTabKey = sessionStorage.getItem('quickSummaryActiveTabKey');
    if (storedActiveTabKey) {
      activeTabKey.value = storedActiveTabKey;
      sessionStorage.removeItem('quickSummaryActiveTabKey');
    }
  } catch (error) {
    console.error('解析activeTabKey失败:', error);
  }

  // 从sessionStorage获取查询数据
  try {
    const storedQueryData = sessionStorage.getItem('quickSummaryQueryData');
    if (storedQueryData) {
      queryData.value = JSON.parse(storedQueryData);
      sessionStorage.removeItem('quickSummaryQueryData');
    }

  } catch (error) {
    console.error('解析查询数据失败:', error);
  }
});

/**
 * @desc: 处理标签切换
 * @param key
 * @return {*}
 */
const changeTab = (key: string) => {
  activeTabKey.value = key;
};

// 处理从模板汇总导航到其他汇总页面
const handleNavigateToSummary = (data: { sumOp: any; pageType: string }) => {
  try {
    // 根据页面类型确定要跳转的tab键
    let targetTabKey = '2'; // 默认快速汇总
    if (data.pageType === 'cross-summary') {
      targetTabKey = '3'; // 交叉汇总
    }

    // 将SUM_OP数据存储到sessionStorage中
    sessionStorage.setItem('summarySumOpData', JSON.stringify(data.sumOp));

    // 切换到目标tab
    activeTabKey.value = targetTabKey;
  } catch (error) {
    console.error('导航到汇总页面失败:', error);
  }
};
</script>

<style scoped lang="less">
.dynamic-comp{
  height: calc(100% - 10vh);
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

:deep(.ant-space) {
  gap: 0.8rem !important;
}

:deep(.ant-menu) {
  font-size: 1.4rem;
}

:deep(.ant-dropdown-menu-item) {
  padding: 0.8rem 1.2rem;
  font-size: 1.4rem;
}
</style>
