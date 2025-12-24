<template>
  <div class="data-query-container">
    <DataQueryTable @go-detail="goDetail" v-if="!isDetail && !isTemplateManage && !isDerivativeIndicators && !isDisplayMetrics && !isQueryTemplateManagement && !isFilterCriteria && !isDisplayTemplateManagement" :key="tableKey" ref="tableRef" />
    <InfoTemplate
        :TABLE_CODE="TABLE_CODE"
        :displayMetrics="curMetrics"
        :columnsAndTable="curColumnsAndTable"
        :derivativeFormula="derivativeFormula"
        :derivativeSummaryFormula="derivativeSummaryFormula"
        :derivativeTable="derivativeTable"
        :getDataDataInfo="getDataDataInfo"
        v-if="isDetail && TABLE_CODE"
        @template-manage-func="templateManageFunc"
        @derivative-indicators-func="derivativeIndicatorsFunc"
        @back-to-table="backToTable"
        @reset-derivative-indicators="handleResetDerivativeIndicators"
        @edit-filter-condition="handleEditFilterCondition"
        @reset-get-data-data-info="handleResetGetDataDataInfo"
        @display-template-manage-func="handleDisplayTemplateManage"
    ></InfoTemplate>
    <FilterCriteria
        v-if="isFilterCriteria"
        @back="handleFilterCriteriaBack"
        @confirm="handleFilterCriteriaConfirm"
    />
    <TemplateManage v-if="isTemplateManage"></TemplateManage>
    <DerivativeIndicators v-if="isDisplayMetrics" @go-back="handleDerivativeIndicatorsBack" @show-template-manage="handleShowTemplateManage" @apply-indicators="handleApplyIndicators"></DerivativeIndicators>
    <DisplayMetrics
        v-if="isDerivativeIndicators"
        :selectedMetrics="curMetrics"
        :columnsAndTable="curColumnsAndTable"
        @select-derivative-indicators="selectDerivativeIndicators"
        @back-to-detail="backToDetail">
    </DisplayMetrics>
    <QueryTemplateManagement v-if="isQueryTemplateManagement" @back="handleQueryTemplateManagementBack" :searchForm="queryTemplateSearchForm" :tableName="queryTemplateTableName" :tableId="queryTemplateTableId" />
    <DisplayTemplateManagement v-if="isDisplayTemplateManagement" @back="handleDisplayTemplateManagementBack" :searchForm="displayTemplateSearchForm" :tableName="displayTemplateTableName" :tableId="displayTemplateTableId" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { getUserProfile } from '@/api/user/index';
import DataQueryTable from '@/components/DataQueryTable/index.vue';
import DisplayMetrics from '@/components/DisplayMetrics.vue/index.vue';
import DerivativeIndicators from '@/components/DerivativeIndicators/index.vue';
import QueryTemplateManagement from '@/components/InfoTemplate/QueryTemplateManagement/index.vue';
import FilterCriteria from '@/components/InfoTemplate/FilterCriteria/index.vue';
import DisplayTemplateManagement from '@/components/InfoTemplate/DisplayTemplateManagement/index.vue';

// 接收从父组件传递过来的 queryData
const props = defineProps({
  queryData: {
    type: Object,
    default: () => {}
  }
});

//查看明细的key
const TABLE_CODE = ref('');

// 用户信息
const userInfo = ref({
  account: '',
  fullName: '',
  admin: false,
});

// 标签页激活
const isDetail = ref(false);
const isDerivativeIndicators = ref(false);
const isTemplateManage = ref(false);
const isDisplayMetrics = ref(false);
const isQueryTemplateManagement = ref(false);
const isFilterCriteria = ref(false);
const isDisplayTemplateManagement = ref(false);

// 添加表格key，用于强制刷新表格
const tableKey = ref(0);

// 添加表格ref引用，用于直接调用其方法
const tableRef = ref(null);

// 设置的显示指标
const curMetrics=ref('');

// 衍生指标公式
const derivativeFormula = ref('');
// 衍生指标汇总公式
const derivativeSummaryFormula = ref('');
// 衍生指标关联的报表编号
const derivativeTable = ref('');

// 重置衍生指标、多表配置和显示指标
const handleResetDerivativeIndicators = () => {
  derivativeFormula.value = '';
  derivativeSummaryFormula.value = '';
  derivativeTable.value = '';
  curColumnsAndTable.value = [];
  curMetrics.value = '';
}

const goDetail = (record) => {
  isDetail.value = true;
  TABLE_CODE.value = record.TABLE_CODE;
  console.log(record, '父组件', isDetail.value);

  isDerivativeIndicators.value = false;  // 隐藏设置显示指标组件
};
// 设置的多表配置
const curColumnsAndTable = ref([]);
const allColumnsAndTable = ref([]);
const queryTemplateSearchForm = ref({});
const queryTemplateTableName = ref('');
const queryTemplateTableId = ref('');
// 显示方案模板管理相关数据
const displayTemplateSearchForm = ref({});
const displayTemplateTableName = ref('');
const displayTemplateTableId = ref('');
// 从快速汇总传递过来的getDataData信息
const getDataDataInfo = ref({});

const backToDetail = (data) => {
  console.log(data.allColumnsAndTable)
  TABLE_CODE.value = data.tableCode;
  // 修改这里：接收分组的多表配置
  if (data.columnsAndTable) {
    // 如果有分组的多表配置，使用第一个表的指标（保持向后兼容）
    const firstTable = data.columnsAndTable[0];
    curMetrics.value = firstTable ? firstTable.columns : '';
    // 同时保存完整的分组配置
    curColumnsAndTable.value = data.columnsAndTable;
  } else {
    // 如果没有分组配置，使用原来的单个指标字符串
    curMetrics.value = data.metrics || '';
    curColumnsAndTable.value = [];
  }
  if (data.allColumnsAndTable) {
    // 如果有分组的多表配置，使用第一个表的指标（保持向后兼容）
    const firstTable = data.allColumnsAndTable[0];
    curMetrics.value = firstTable ? firstTable.columns : '';
    // 同时保存完整的分组配置
    allColumnsAndTable.value = data.allColumnsAndTable;
  } else {
    // 如果没有分组配置，使用原来的单个指标字符串
    curMetrics.value = data.metrics || '';
    allColumnsAndTable.value = [];
  }
  isDisplayMetrics.value = false;
  isDerivativeIndicators.value = false;
  isDetail.value = true;
};

// 模板管理
const templateManageFunc = (data) => {
  queryTemplateSearchForm.value = data.searchForm || {};
  queryTemplateTableName.value = data.tableName || '';
  queryTemplateTableId.value = data.tableId || '';
  isQueryTemplateManagement.value = true;
  isDetail.value = false;
};

// 处理显示方案模板管理事件
const handleDisplayTemplateManage = (data) => {
  displayTemplateSearchForm.value = data.searchForm || {};
  displayTemplateTableName.value = data.tableName || '';
  displayTemplateTableId.value = data.tableId || '';
  isDisplayTemplateManagement.value = true;
  isDetail.value = false;
};
const derivativeIndicatorsFunc = () => {
  isDerivativeIndicators.value = true;
  isDetail.value = false;
  isTemplateManage.value = false;
};
// const displayMetricsFunc = () => {
//   isDisplayMetrics.value = true;
//   isDetail.value = false;
//   isTemplateManage.value = false;
//   isDerivativeIndicators.value = false;
// };
const selectDerivativeIndicators = () => {
  console.log('selectDerivativeIndicators');

  // 当点击DisplayMetrics中的选择衍生指标按钮时，显示DerivativeIndicators页面
  isDisplayMetrics.value = true;
  isDerivativeIndicators.value = false;
  isDetail.value = false;
  isTemplateManage.value = false;
};

// 处理DerivativeIndicators组件的返回事件
const handleDerivativeIndicatorsBack = () => {
  console.log('handleDerivativeIndicatorsBack');
  // 当点击DerivativeIndicators中的返回按钮时，返回到DisplayMetrics页面
  isDisplayMetrics.value = false;
  isDerivativeIndicators.value = true;
};

// 处理DerivativeIndicators组件的显示模板管理页面事件
const handleShowTemplateManage = () => {
  console.log('handleShowTemplateManage');
  // 当点击DerivativeIndicators中的设置显示图标按钮时，显示TemplateManage页面
  isTemplateManage.value = true;
  isDisplayMetrics.value = false;
  isDerivativeIndicators.value = false;
  isDetail.value = false;
};

// 处理应用衍生指标事件
const handleApplyIndicators = (selectedData) => {
  console.log('收到应用的衍生指标数据:', selectedData);

  if (selectedData && selectedData.length > 0) {
    // 存储衍生指标公式和汇总公式（使用分号拼接）
    derivativeFormula.value = selectedData.map(item => item.formula || '').filter(Boolean).join(';');
    derivativeSummaryFormula.value = selectedData.map(item => item.summaryFormula || '').filter(Boolean).join(';');

    // 拼接所有报表编码（使用逗号拼接）
    derivativeTable.value = selectedData.map(item => item.reportCode || '').filter(Boolean).join(',');
  } else {
    // 未选择衍生指标时，将衍生指标相关变量设置为空
    derivativeFormula.value = '';
    derivativeSummaryFormula.value = '';
    derivativeTable.value = '';
  }

  // 跳转到InfoTemplate页面
  isDetail.value = true;
  isDisplayMetrics.value = false;


};

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await getUserProfile();
    if (response && response.data) {
      userInfo.value = response.data.user || response.data;
      console.log('用户信息:', userInfo.value);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};
// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo();

  // 如果有传递过来的 queryData，自动跳转到详情页面
  if (props.queryData && Object.keys(props.queryData).length > 0) {
    isDetail.value = true;
    TABLE_CODE.value = props.queryData.TABLE_CODE || '';
    // 可以在这里根据需要设置其他相关数据
  }
});

// 监听 queryData 的变化
watch(
    () => props.queryData,
    (newVal) => {
      if (newVal && Object.keys(newVal).length > 0) {
        console.log('DataQuery 组件接收到 queryData:', newVal);
        isDetail.value = true;
        TABLE_CODE.value = newVal.TABLE_CODE || '';
        // 将 queryData 中的相关属性传递给 InfoTemplate 组件
        curMetrics.value = newVal.displayMetrics || '';
        curColumnsAndTable.value = newVal.columnsAndTable || [];
        derivativeFormula.value = newVal.derivativeFormula || '';
        derivativeSummaryFormula.value = newVal.derivativeSummaryFormula || '';
        derivativeTable.value = newVal.derivativeTable || '';
        // 传递getDataData相关字段
        getDataDataInfo.value = {
          city: newVal.city || '',
          area: newVal.area || '',
          specialtyCode: newVal.specialtyCode || '',
          columnQueries: newVal.columnQueries || [],
          sortField: newVal.sortField || '',
          sortOrder: newVal.sortOrder || '',
          derivativeColumn: newVal.derivativeColumn || '',
          tableName: newVal.tableName || '',
          reportType: newVal.reportType || '',
          indexQuery: newVal.indexQuery || '',
          reportPeriod: newVal.reportPeriod || '1',
          filter: newVal.filter || '1',
          operator: newVal.operator || 'eq',
          queryValue: newVal.queryValue || '',
          all: newVal.all || '1'
        };
      }
    },
    { deep: true, immediate: true }
);

// 返回DataQueryTable页面
const backToTable = async () => {
  window.location.reload();
};

// 处理QueryTemplateManagement组件的返回事件
const handleQueryTemplateManagementBack = () => {
  console.log('handleQueryTemplateManagementBack');
  isQueryTemplateManagement.value = false;
  // 如果之前有查看的报表，返回到详情页，否则保持在DataQueryTable页面
  if (TABLE_CODE.value) {
    isDetail.value = true;
  }
};

// 处理过滤条件编辑事件
const handleEditFilterCondition = (data) => {
  console.log('handleEditFilterCondition:', data);
  isFilterCriteria.value = true;
  isDetail.value = false;
};

// 处理从InfoTemplate组件传递过来的重置getDataDataInfo事件
const handleResetGetDataDataInfo = () => {
  // console.log('重置getDataDataInfo为空');
  getDataDataInfo.value = {};
  console.log('重置getDataDataInfo为空',getDataDataInfo.value);
};

// 处理过滤条件返回事件
const handleFilterCriteriaBack = () => {
  console.log('handleFilterCriteriaBack');
  isFilterCriteria.value = false;
  isDetail.value = true;
};

// 处理显示方案模板管理返回事件
const handleDisplayTemplateManagementBack = () => {
  isDisplayTemplateManagement.value = false;
  // 如果之前有查看的报表，返回到详情页，否则保持在DataQueryTable页面
  if (TABLE_CODE.value) {
    isDetail.value = true;
  }
};
</script>

<style scoped lang="less">
.data-query-container {
  display: flex;
  flex-direction: column;
  height: 85vh;
  background-color: #f5f5f5;
  overflow-y: auto;

  .search-section {
    background: white;
    margin-bottom: 1.6rem;
    background-color: #f5f5f5;
    border-radius: 1.8rem 1.8rem 0 0;

    .custom-tabs {
      padding: 0 1.6rem;
      border-bottom: 0.1rem solid #f0f0f0;
      background-color: #fff;

      :deep(.ant-tabs-tab) {
        font-size: 1.4rem;
        padding: 1.2rem 0;
      }
    }
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


