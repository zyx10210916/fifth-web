<template>
  <div class="search-header">
    <div class="search-row">

      <div class="search-item">
        <span>当前报表</span>
        <a-select v-model:value="searchForm.currentReport" style="width: 200px" @change="changeReport"
                  class="custom-select">
          <a-select-option value="">请选择当前报表</a-select-option>
          <a-select-option v-for='obj in currentReportDate' :value="obj.TABLE_CODE">{{obj.TABLE_NUM}} {{ obj.TABLE_NAME }}
          </a-select-option>
        </a-select>
      </div>
      <div class="search-item">
        <span>报表类别</span>
        <a-select v-model:value="searchForm.reportType" style="width: 200px" class="custom-select">
          <a-select-option value="">请选择报表类别</a-select-option>
          <a-select-option v-for='obj in professionalData' :value="obj.ZYBM">{{ obj.ZYMC }}</a-select-option>
        </a-select>
      </div>
      <!--      <div class="search-item">-->
      <!--        <span>报告期</span>-->
      <!--        <a-select v-model:value="searchForm.reportPeriod" :disabled="true" style="width: 200px" class="custom-select">-->
      <!--          <a-select-option value="1">请选择专业</a-select-option>-->
      <!--        </a-select>-->
      <!--      </div>-->
      <div class="search-item filter-condition-item">
        <span class="filter-label">过滤条件</span>
        <div class="filter-buttons-group">
          <a-button
              class="edit-filter-btn"
              style="background-color: #f0f0f0; border: 1px solid #f0f0f0; padding: 0 40px; margin-right: 10px"
              :disabled="!searchForm.currentReport"
              @click="showEditFilterModal"
          >
            编辑过滤条件
            <template #icon>
              <EditOutlined />
            </template>
          </a-button>
          <a-button
              type="primary"
              class="common-summary-btn"
              style="background-color: rgb(84 111 255 / 100%);"
              :disabled="!searchForm.currentReport"
              @click="showSummaryModal"
          >
            <template #icon>
              <FunctionOutlined />
            </template>
            常用汇总口径
          </a-button>
        </div>
      </div>
    </div>
    <div class="search-row">
      <div class="search-item">
        <span>指标查询</span>
        <a-select v-model:value="searchForm.indexQuery" style="width: 200px" class="custom-select">
          <a-select-option value="">请选择指标查询</a-select-option>
          <a-select-option v-for='obj in indexQueryDate' :value="obj.COLUMN_CODE">{{ obj.COLUMN_NAME }}
          </a-select-option>
        </a-select>
      </div>
      <div class="search-item">
        <span>运算符</span>
        <a-select v-model:value="searchForm.operator" style="width: 120px" class="custom-select">
          <a-select-option value="eq">等于</a-select-option>
          <a-select-option value="neq">不等于</a-select-option>
          <a-select-option value="gt">大于</a-select-option>
          <a-select-option value="gte">大于等于</a-select-option>
          <a-select-option value="lt">小于</a-select-option>
          <a-select-option value="lte">小于等于</a-select-option>
          <a-select-option value="likeRight">前缀</a-select-option>
          <a-select-option value="like">非前缀</a-select-option>
          <a-select-option value="likeLeft">后缀</a-select-option>
          <a-select-option value="like">非后缀</a-select-option>
          <a-select-option value="in">包含</a-select-option>
          <a-select-option value="notin">不包含</a-select-option>
        </a-select>
        <!--  -->
      </div>
      <div class="search-item">
        <span>值</span>
        <a-input v-model:value="searchForm.queryValue" placeholder="请输入查询值" style="width: 200px; height: 40px; " />
      </div>
      <div class="search-item">
        <a-space>
          <a-button type="link" class="link-btn" @click="showCombinedModal" style="color: rgb(84 111 255 / 100%)">组合条件
          </a-button>
          <a-button type="link" class="link-btn" @click="showTagModal" style="color: rgb(84 111 255 / 100%)">查询标签</a-button>
          <span>模板查询</span>
          <!--          <a-select v-model:value="searchForm.all" style="width: 200px" class="custom-select">-->
          <!--          <a-select-option value="1">全部</a-select-option>-->
          <!--          </a-select>-->
          <a-select v-model:value="searchForm.all" style="width: 200px" class="custom-select" @change="handleQueryTemplateChange">
            <a-select-option
                v-for="item in queryTemplateList"
                :key="item.value"
                :value="item.value"
                :template-data="item.templateData"
            >
              {{ item.label }}
            </a-select-option>
          </a-select>
          <a-button type="link" class="link-btn" @click="handleTemplateManage" style="color: rgb(84 111 255 / 100%)">模板管理</a-button>
          <a-button type="link" class="link-btn" style="color: rgb(84 111 255 / 100%)" @click="handleSaveTemplate">保存模板</a-button>
        </a-space>
      </div>
      <div class="search-item">
        <a-space>
          <a-button type="primary" class="search-btn" @click='getQuery' style="background: rgb(84 111 255 / 100%)" >
            <template #icon>
              <SearchOutlined style="color: white" />
            </template>
            查询
          </a-button>
          <a-button class="reset-btn" style="background: rgb(20 21 34 / 100%); border: none; color: white"
                    @click="handleReset">
            <template #icon>
              <ReloadOutlined style="color: white" />
            </template>
            重置
          </a-button>
        </a-space>
      </div>
      <div class="search-item">
        <a-button @click="goBack"
                  style="margin-right: 10px; background-color: rgb(84 111 255 / 100%); color: white; border: none">
          <template #icon>
            <LeftOutlined style="color: white" />
          </template>
          返回上一级
        </a-button>
      </div>
    </div>
  </div>
  <div style="display: flex; padding: 10px; background-color: white;flex:1; overflow: hidden">
    <!-- 左侧区域树 -->
    <div class="tree-left">
      <div class="tree-button">
        <LeftCircleOutlined v-if="treeShow" @click="treeShow = false" />
        <RightCircleOutlined v-else @click="treeShow = true" />
      </div>
      <a-card v-if="treeShow"
              style="width: 220px; min-width: 220px; margin-right: 19px 16px; background-color: rgb(245 245 247 / 100%);height:100%">
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-size: 1.5rem">地区</span>
          <span>
            <DownOutlined />
            <LeftOutlined v-if="false" />
          </span>
        </div>
        <a-tree :tree-data="regionTree" v-model:checkedKeys="checkedKeys" v-model:expandedKeys="expandedKeys" checkable
                :showLine="showLine" :showIcon="false" style="background: rgb(245 245 247 / 100%);font-size: 1.4rem"
                :autoExpandParent="true" :fieldNames="{ children: 'children', title: 'AREA_NAME', key: 'AREA_NAME' }">
          <template #switcherIcon="{ switcherCls }">
            <down-outlined :class="switcherCls" />
          </template>
        </a-tree>
      </a-card>
    </div>
    <!-- 右侧表格及操作 -->
    <div style="flex: 1; margin-left: 1.5rem;overflow: hidden;display: flex;flex-direction: column;">
      <!-- 顶部操作按钮组 -->
      <div
          style="display: flex; position: relative; align-items: center; gap: 0.8rem; margin-bottom: 1.2rem;justify-content: flex-end;">
        <!--        <a-select v-model:value="curTemplate" :options="templateList" @change="applyTemplate"  style="width: 22rem; margin-right: 1.5rem" placeholder="请选择显示方案模板">-->
        <!--          <a-select-option value="1">模板1</a-select-option>-->
        <!--        </a-select>-->

        <a-button @click="handleQuickSummary" style="background-color: black; color: white; border: none">
          <ThunderboltOutlined style="margin-right: 0.6rem; color: white; font-size: 1.4rem" />
          <span style="font-size: 1.4rem">快速汇总</span>
        </a-button>
        <a-button @click="displayTemplateManageFunc" style="background-color: black; color: white; border: none">
          <LayoutOutlined style="margin-right: 0.6rem; color: white; font-size: 1.4rem" />
          <span style="font-size: 1.4rem">模板管理</span>
        </a-button>
        <a-button @click="derivativeIndicatorsFunc" style="background-color: black; color: white; border: none">
          <SettingOutlined style="margin-right: 0.6rem; color: white; font-size: 1.4rem" />
          <span style="font-size: 1.4rem">设置显示指标</span>
        </a-button>
        <a-button style="background-color: black; color: white; border: none" @click="handleExportExcel" :loading="loading">
          <UploadOutlined style="margin-right: 0.6rem; color: white; font-size: 1.4rem" />
          <span style="font-size: 1.4rem">导出结果</span>
        </a-button>
      </div>
      <!-- 表格 -->
      <div class="rx-grid" style="flex:1;overflow: hidden; position: relative;" ref="containerRef">
        <Spin :spinning="loading" tip="加载中...">
          <a-table
              :scroll="{ x: 'max-content', y: 'calc(100vh - 510px)' }"
              style="width:100%;"
              :columns="dynamicColumns"
              :data-source="formattedTableData"
              :pagination="false"
              bordered
              size="middle"
              :showSorterTooltip="false"
              :row-class-name="() => 'custom-row-height'"
              table-layout="fixed"
              @change="handleTableChange">
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex">
                {{ record[column.dataIndex] || '-' }}
              </template>
            </template>
          </a-table>

          <!-- 分页器 + 刷新按钮 -->
          <div style="margin-top: 16px; text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
            <a-button type="primary" @click="handleRefresh">刷新</a-button>
            <a-pagination
                v-model:current="pagination.current"
                v-model:pageSize="pagination.pageSize"
                :total="pagination.total"
                :showSizeChanger="pagination.showSizeChanger"
                :showQuickJumper="pagination.showQuickJumper"
                :showTotal="pagination.showTotal"
                :pageSizeOptions="pagination.pageSizeOptions"
                @change="handleRefresh"
                :locale="{
                  items_per_page: '条/页',
                  jump_to: '跳至',
                  jump_to_confirm: '确定',
                  page: '页'
                }"
            />
          </div>
        </Spin>
      </div>
    </div>
  </div>
  <TagQueryModal
      v-model:visible="tagModalVisible"
      :searchForm="getDataData"
      :indexQueryDate="indexQueryDate"
      @confirm="handleTagConfirm"
      @cancel="handleTagCancel"
  />
  <CombinedConditionModal :indexQueryDate="indexQueryDate" :columnQueries="columnQueries" @handleOk="handleOk"
                          v-model:visible="combinedModalVisible" />
  <SummaryModal v-model:visible="summaryModalVisible" />

  <!-- 导出选项模态框 -->
  <ExportModal
      v-model:visible="exportModalVisible"
      @export-confirm="handleExportConfirm"
  />

  <!-- 保存模板模态框 -->
  <QueryTemplateModal
      v-model:visible="queryTemplateModalVisible"
      :query-conditions="currentQueryConditions"
      @save="handleSaveTemplateConfirm"
  />
</template>

<script setup lang="ts">
import '@/assets/styles/modules/census.less';
import { Spin, Modal } from 'ant-design-vue'
import { LeftOutlined, ReloadOutlined, SettingOutlined, UploadOutlined, LayoutOutlined, ThunderboltOutlined } from '@ant-design/icons-vue';
import { ref, reactive, onMounted, onBeforeUnmount, watch, defineEmits, nextTick } from 'vue';
import TagQueryModal from './TagQueryModal.vue';
import CombinedConditionModal from './CombinedConditionModal.vue';
import SummaryModal from './SummaryModal.vue';
import ExportModal from './ExportModal/index.vue';
import QueryTemplateModal from './QueryTemplateModal/index.vue';

import axios from 'axios';
import { message } from 'ant-design-vue';
import { buniscGetData, indexGetData, findDataQueryPage, professionalList, areaList, dynamicExportExcel, dynamicExportCsv, getDataConditionQueryTemplateList, saveDataConditionQueryTemplate } from '@/api/data-processing';
import { getToken, isLogin } from '@/utils/auth';
import router from "../../router";
import { h } from 'vue';
import Record from "vite-plugin-mkcert/dist/mkcert/record";
interface TemplateItem {
  value: string;
  label: string;
  metrics: string[];
  reportCode: string;
}

// 设置表格高度
const containerRef = ref(null);
const tableHeight = ref(0);

const props = defineProps({
  TABLE_CODE: '',//查看明细的key
  displayMetrics:'', // 设置的显示指标
  columnsAndTable: { // 新增：多表配置
    type: Array,
    default: () => []
  },
  derivativeFormula: '', // 衍生指标公式
  derivativeSummaryFormula: '', // 衍生指标汇总公式
  derivativeTable: '', // 衍生指标关联的报表编号
  getDataDataInfo: { // 从快速汇总传递过来的getDataData信息
    type: Object,
    default: () => {}
  }
})

//默认表单定义
const defaultForm = {
  currentReport: props.TABLE_CODE || '',
  reportType: '',
  indexQuery: '',
  reportPeriod: '1',
  filter: '1',
  operator: 'eq',
  queryValue: '',
  all: '1',
}

// 搜索表单数据
const searchForm = reactive({
  currentReport: props.TABLE_CODE,
  reportType: '',
  indexQuery: '',
  reportPeriod: '1',
  filter: '1',
  operator: 'eq',
  queryValue: '',
  all: '1',
});

// 控制searchForm监听器是否执行的标志位
const isUpdatingFromGetDataDataInfo = ref(false);

// 响应式的查询参数对象，提供给TagQueryModal使用
const getDataData = reactive({
  columnsAndTable: [],
  pageNo: 1,
  pageSize: 100,
  tableName: '',
  city: '',
  area: '',
  specialtyCode: '',
  columnQueries: [],
  sortField: '',
  sortOrder: '',
  derivativeColumn: '',
  derivativeTable: ''
});

// 监听searchForm的变化，确保getDataData始终保持最新
watch(searchForm, (newForm) => {
  getDataData.tableName = newForm.currentReport;
  getDataData.specialtyCode = newForm.reportType;

  // 同步查询条件
  if (newForm.indexQuery) {
    const existingQuery = getDataData.columnQueries.find(
        q => q.columnName === newForm.indexQuery
    );

    if (existingQuery) {
      existingQuery.columnValue = newForm.queryValue;
      existingQuery.queryMode = newForm.operator;
    } else {
      getDataData.columnQueries.push({
        "columnName": newForm.indexQuery,
        "columnValue": newForm.queryValue,
        "queryMode": newForm.operator,
        "logicalSymbol": ""
      });
    }
  }
}, { deep: true });

// 监听queryValue的变化，剔除重复内容
watch(() => searchForm.queryValue, (newValue) => {
  if (newValue) {
    // 将字符串按空格和逗号分割，并过滤掉空字符
    const values = newValue.split(/[\s,]+/).filter(value => value.trim());

    // 使用Set剔除重复项
    const uniqueValues = [...new Set(values)];

    // 将处理后的值重新赋值给queryValue，使用逗号分隔
    searchForm.queryValue = uniqueValues.join(',');
  }
});

// 展开的指标
const displayMetrics=ref(props.displayMetrics)

// 监听displayMetrics prop的变化
watch(() => props.displayMetrics, (newVal) => {
  displayMetrics.value = newVal;
}, { immediate: true })

// 返回上一级
const goBack = () => {
  emit('back-to-table');
};

//展开左边树
const treeShow = ref(true);
//筛选当前报表列表数据
const currentReportDate = ref([]);
// 动态列名的数据
const formattedTableData = ref([]);
// 存储列名映射关系
const columnMapping = ref({});

//筛选指标查询
const indexQueryDate = ref([]);
//专业列表
const professionalData = ref([]);
const regionTree = ref([]);
const checkedKeys = ref([]);
const expandedKeys = ref(['广州市'])
const columnQueries= ref<any>([]);
//加载动画参数
const loading = ref(false);
//动态列名
const dynamicColumns = ref([]);
const showLine = ref < Boolean > (true);
const tableData = ref([]);
// 当前查询条件（用于保存模板）
const currentQueryConditions = ref({});
const emit = defineEmits(['templateManageFunc', 'derivativeIndicatorsFunc', 'back-to-table', 'reset-derivative-indicators', 'edit-filter-condition', 'display-template-manage-func']);

// 跟踪当前排序状态
const currentSort = ref({ field: '', order: '' });
// 跟踪每个列的点击次数
const sortClickCount = ref({});

// 保存模板处理函数
const handleSaveTemplate = () => {
  // 保存整个searchForm和getDataData，但排除不需要的字段
  const { columnsAndTable, pageNo, pageSize, sortOrder, sortField, area, city, ...getDataDataWithoutExcluded } = getDataData;
  currentQueryConditions.value = {
    ...searchForm,
    ...getDataDataWithoutExcluded
  };
  queryTemplateModalVisible.value = true;
};

// 保存模板确认事件处理
const handleSaveTemplateConfirm = async (data: any) => {
  try {
    const { formData, queryConditions } = data;

    // 构造请求数据
    const requestData = {
      template_name: formData.name,
      template_desc: formData.description,
      cjr: formData.creator,
      is_share: formData.shared,
      is_used: formData.isCommon,
      query_conditions: JSON.stringify(queryConditions)
    };

    // 调用API保存模板
    const response = await saveDataConditionQueryTemplate(requestData);

    if (response.success) {
      message.success('模板保存成功');
      // 刷新查询模板列表
      await getQueryTemplateList();
    } else {
      message.error('模板保存失败：' + (response.message || '未知错误'));
    }
  } catch (error: any) {
    console.error('保存模板失败:', error);
    message.error('模板保存失败：' + (error.message || '网络错误'));
  }
};

// 查询模板列表
const queryTemplateList = ref([{ value: '1', label: '请选择查询模板' }]);

// 控制弹窗显示状态
const tagModalVisible = ref(false);
const combinedModalVisible = ref(false);
const summaryModalVisible = ref(false);
const templateModalVisible = ref(false);
const queryTemplateModalVisible = ref(false);

// 获取查询模板列表
const getQueryTemplateList = async () => {
  try {
    const response = await getDataConditionQueryTemplateList({
      pageNo: 1,
      pageSize: 100,
      sortField: '',
      sortOrder: '',
      params: {}
    });
    if (response.data) {
      // 处理返回的数据，添加到查询模板列表
      const templates = response.data?.map((item: any) => ({
        value: item.id || item.ID_,
        label: item.template_name || item.TEMPLATE_NAME,
        templateData: item // 保存完整的模板数据
      })) || [];

      console.log(templates)
      // 确保第一个选项始终是"请选择查询模板"
      queryTemplateList.value = [{ value: '1', label: '请选择查询模板' }, ...templates];
    } else {
      message.error('获取查询模板失败');
    }
  } catch (error) {
    console.error('获取查询模板列表失败:', error);
    message.error('获取查询模板失败');
  }
};

// 模板管理处理函数
const handleTemplateManage = () => {
  // 根据当前报表代码查找报表名称和表编号
  const currentReportInfo = currentReportDate.value.find(item => item.TABLE_CODE === searchForm.currentReport);
  const tableName = currentReportInfo ? currentReportInfo.TABLE_NAME : searchForm.currentReport;
  // 假设表编号字段名为TABLE_ID，如果实际字段名不同，请修改为正确的字段名
  const tableId = currentReportInfo ? currentReportInfo.TABLE_NUM : '';
  // 传递searchForm数据、报表名称和表编号给父组件
  emit('template-manage-func', {
    searchForm: searchForm,
    tableName: tableName,
    tableId: tableId
  });
  // 这里可以添加模板管理相关的逻辑
  // console.log('模板管理按钮被点击', tableId);
};

const pagination = ref({
  total: 0,
  current: 1,
  pageSize: 30,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`,
  pageSizeOptions: ['10', '20', '30', '40', '50', '100', '200', '500', '1000'],
  locale: {
    items_per_page: '条/页',
    jump_to: '跳至'
  },
});
const handleRefresh = () => {
  init();
};

// 显示方案模板相关
const curTemplate = ref('');
const templateList = ref<TemplateItem[]>([]);

// 显示弹窗方法
const showTagModal = () => {
  tagModalVisible.value = true;
};


// 处理标签确认
const handleTagConfirm = (queryCriteria: any) => {

  // 处理不同类型的输入参数
  let queryData = null;

  // 1. 直接处理对象类型
  if (typeof queryCriteria === 'object' && queryCriteria !== null) {
    queryData = queryCriteria;
  }
  // 2. 处理字符串类型
  else if (typeof queryCriteria === 'string') {

    // 尝试解析为JSON数组（后端可能存储为数组格式）
    try {
      const parsedArray = JSON.parse(queryCriteria);
      if (Array.isArray(parsedArray)) {
        // 如果是数组格式，尝试转换为searchForm需要的格式

        // 处理数组中的第一个查询条件
        if (parsedArray.length > 0) {
          const firstQuery = parsedArray[0];
          if (firstQuery.columnName && firstQuery.columnValue) {
            // 构建兼容searchForm的对象
            queryData = {
              indexQuery: firstQuery.columnName,
              queryValue: firstQuery.columnValue,
              operator: firstQuery.queryMode || 'eq'
            };
          }
        }
      } else if (typeof parsedArray === 'object') {
        // 如果解析为对象，直接使用
        queryData = parsedArray;
      }
    } catch (e) {
      // 尝试解析特殊格式：[{columnName=serial_number,columValue=121,queryMode=大于,logicalSymbol=并且,operator=gt}]
      try {
        if (queryCriteria.startsWith('[') && queryCriteria.endsWith(']')) {

          // 支持多个查询条件，提取所有大括号内的内容
          // 使用全局正则表达式匹配所有大括号内的内容
          const contentMatches = queryCriteria.match(/\{([^}]*)\}/g);
          if (contentMatches && contentMatches.length > 0) {

            // 解析每个查询条件
            const allConditions = [];

            for (const match of contentMatches) {
              // 移除大括号
              const content = match.substring(1, match.length - 1);
              // 分割键值对
              const pairs = content.split(',');
              const parsedObject: any = {};

              pairs.forEach(pair => {
                const [key, ...valueParts] = pair.split('=');
                if (key && valueParts.length > 0) {
                  parsedObject[key.trim()] = valueParts.join('=').trim();
                }
              });

              allConditions.push(parsedObject);
            }

            // console.log('所有解析的条件:', allConditions);

            // 过滤出所有有效的条件
            const validConditions = allConditions.filter(cond =>
                cond.columnName && (cond.columValue || cond.columnValue)
            );

            if (validConditions.length > 0) {
              // 使用第一个条件作为主要查询条件
              const primaryCondition = validConditions[0];

              // 构建查询数据，包含所有有效条件
              queryData = {
                indexQuery: primaryCondition.columnName,
                queryValue: primaryCondition.columValue || primaryCondition.columnValue,
                operator: primaryCondition.queryMode || 'eq',
                allConditions: validConditions, // 存储所有有效条件
                isMultiCondition: validConditions.length > 1 // 标记为多条件查询
              };
            }
          }
        }
      } catch (customParseError) {
        console.error('自定义解析失败:', customParseError.message);
      }

      // 记录是否成功解析
      if (!queryData) {
        console.log('使用原始字符串格式');
      }
    }
  }

  console.log('最终处理后的查询条件数据:', queryData);

  // 将标签的查询条件覆盖到searchForm中
  // 只覆盖指标查询、运算符和值三个项，不清空其他字段
  if (queryData) {
    // 基础字段赋值 - 始终保留第一个条件作为基础查询
    searchForm.indexQuery = queryData.indexQuery;
    searchForm.queryValue = queryData.queryValue;
    searchForm.operator = queryData.operator;

    // 检查是否有多个条件需要特殊处理
    if (queryData.isMultiCondition && queryData.allConditions && queryData.allConditions.length > 1) {
      // 方案1: 如果系统支持columnQueries数组格式
      if (searchForm.columnQueries && Array.isArray(searchForm.columnQueries)) {
        // 清空现有条件
        searchForm.columnQueries = [];

        // 添加所有有效条件到columnQueries
        queryData.allConditions.forEach(condition => {
          searchForm.columnQueries.push({
            columnName: condition.columnName,
            columnValue: condition.columValue || condition.columnValue,
            queryMode: condition.queryMode,
            logicalSymbol: condition.logicalSymbol || '并且',
            operator: condition.operator
          });
        });
      }
    }

    // 执行查询
    getQuery();
  } else if (typeof queryCriteria === 'string') {
    console.log('使用原始查询条件字符串');
  }

  console.log('更新后的searchForm:', searchForm);
};

// 处理标签取消
const handleTagCancel = () => {
  // console.log('取消标签查询');
};

const showCombinedModal = () => {
  combinedModalVisible.value = true;
};

const showSummaryModal = () => {
  summaryModalVisible.value = true;
};

// 处理过滤条件的显示
const showEditFilterModal = () => {
  // 参考"设置显示指标"的实现，通过emit将数据传递给父组件
  emit('edit-filter-condition', {
    TABLE_CODE: searchForm.currentReport,
    currentFormula: '' // 如果有当前公式，可以在这里传递
  });
};
const handleView = (record) => {
  // console.log('View record:', record);
  // 实际应用中可以跳转到详情页面或打开弹窗
};
const templateManageFunc = () => {
  emit('templateManageFunc');
};

const derivativeIndicatorsFunc = () => {
  emit('derivativeIndicatorsFunc', {
    selectedMetrics: displayMetrics.value,
    TABLE_CODE: searchForm.currentReport,
    columnsAndTable: props.columnsAndTable
  });
};

// 显示模板管理函数
const displayTemplateManageFunc = () => {
  // 根据当前报表代码查找报表名称和表编号
  const currentReportInfo = currentReportDate.value.find(item => item.TABLE_CODE === searchForm.currentReport);
  const tableName = currentReportInfo ? currentReportInfo.TABLE_NAME : searchForm.currentReport;
  const tableId = currentReportInfo ? currentReportInfo.TABLE_NUM : '';
  emit('display-template-manage-func', {
    searchForm: searchForm,
    tableName: tableName,
    tableId: tableId
  });
};

// 导出选项模态框
const exportModalVisible = ref(false);

// 导出Excel功能
const handleExportExcel = () => {
  if (loading.value) return;
  exportModalVisible.value = true;
};

// 处理快速汇总
const handleQuickSummary = async () => {
  // 实现快速汇总功能：跳转到数据处理页面的快速查询tab（key=2）
  // console.log('快速汇总，跳转到快速查询页面');

  // 准备要传递的查询数据
  const queryData = {
    reportType: searchForm.reportType,
    indexQuery: searchForm.indexQuery,
    reportPeriod: searchForm.reportPeriod,
    filter: searchForm.filter,
    operator: searchForm.operator,
    queryValue: searchForm.queryValue,
    all: searchForm.all,
    columnsAndTable: getDataData.columnsAndTable,
    tableName: getDataData.tableName,
    city: getDataData.city,
    area: getDataData.area,
    specialtyCode: getDataData.specialtyCode,
    columnQueries: getDataData.columnQueries,
    sortField: getDataData.sortField,
    sortOrder: getDataData.sortOrder,
    derivativeColumn: getDataData.derivativeColumn,
    TABLE_CODE: props.TABLE_CODE,
    displayMetrics: props.displayMetrics,
    derivativeFormula: props.derivativeFormula,
    derivativeSummaryFormula: props.derivativeSummaryFormula,
    derivativeTable: props.derivativeTable
  };

  // 使用sessionStorage存储查询数据和tabKey，避免在URL中暴露
  sessionStorage.setItem('quickSummaryQueryData', JSON.stringify(queryData));
  sessionStorage.setItem('quickSummaryActiveTabKey', '2');

  // 跳转到数据处理页面
  router.push({
    path: '/home/data-processing'
  });

  window.location.reload();
};

// 导出确认
const handleExportConfirm = (scope, format) => {
  performExport(scope, format);
};

// 执行导出操作
const performExport = (allImport: number, format: string = 'xlsx') => {
  loading.value = true;
  let city = [];//城市
  let area = [];//区域
  if (checkedKeys.value) {
    checkedKeys.value.map(obj => {
      const areaCode = areaCodeMapping.value[obj];
      if (areaCode) {
        area.push(areaCode)
      } else {
        area.push(obj);
      }
    })
  }

  let exportData = {
    columnsAndTable: [], // 初始化为空数组
    tableName: searchForm.currentReport,
    city: city.join(','),
    area: area.join(','),
    pageNo: pagination.value.current,
    pageSize: pagination.value.pageSize,
    specialtyCode: searchForm.reportType,
    columnQueries: [...columnQueries.value],
    allImport: allImport, // 添加allImport属性 1:导出全部 2:导出当前页
  };

  if (searchForm.indexQuery) {
    exportData.columnQueries.push({
      "columnName": searchForm.indexQuery,
      "columnValue": searchForm.queryValue,
      "queryMode": searchForm.operator,
      "logicalSymbol": ""
    })
  }

  // 修改这里：优先使用分组的多表配置
  if (props.columnsAndTable && props.columnsAndTable.length > 0) {
    exportData.columnsAndTable = [...props.columnsAndTable];
  } else if (displayMetrics.value) {
    // 如果没有分组配置，使用原来的单个表配置（保持向后兼容）
    exportData.columnsAndTable.push({
      "tableName": searchForm.currentReport,
      "columns": displayMetrics.value,
    })
  }

  // 根据导出格式调整API调用
  if (format === 'xlsx') {
    // 使用从API中导入的dynamicExportExcel函数
    dynamicExportExcel(exportData)
        .then(data => {
          loading.value = false;
          // console.log('导出响应数据类型:', typeof data);
          // console.log('导出响应数据大小:', data ? data.length || data.size : '未知');

          // 检查响应是否有效
          if (!data) {
            throw new Error('无效的响应数据');
          }

          // 如果data已经是Blob类型，直接使用它，否则创建新的Blob
          let blob;
          if (data instanceof Blob) {
            // console.log('已接收到Blob对象，直接使用');
            blob = data;
            // console.log("1", blob.type);
          } else {
            // console.log('使用响应数据创建Blob');
            blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          }

          // 验证blob大小，避免空文件
          if (blob.size === 0) {
            throw new Error('导出的文件为空');
          }

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;

          let fileName = '数据导出结果';

          a.download = `${fileName}_${new Date().getTime()}.${format}`;
          document.body.appendChild(a);

          // 使用setTimeout确保在UI线程空闲时执行下载
          setTimeout(() => {
            a.click();
            // 清理资源
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }, 100);
            message.success('导出成功');
          }, 0);
        }).catch(error => {
      loading.value = false;
      console.error('导出失败:', error);
    });
  } else if (format === 'csv') {
    // 使用CSV导出API
    dynamicExportCsv(exportData)
        .then(data => {
          loading.value = false;

          let blob;
          if (data instanceof Blob) {
            blob = data;
          } else {
            blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
          }

          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;

          let fileName = '数据导出结果';
          a.download = `${fileName}_${new Date().getTime()}.${format}`;
          document.body.appendChild(a);

          setTimeout(() => {
            a.click();
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }, 100);
            message.success('导出成功');
          }, 0);
        }).catch(error => {
      loading.value = false;
      console.error('导出失败:', error);
    });
  }
};
const handleBackToDetail = (data) => {
  if (data && data.metrics) {
    displayMetrics.value = data.metrics;
    if (data.fromSetting) {
      // 如果是从设置界面返回，刷新表格
      init();
    }
  }
  // 如果没有传metrics，则保持原状或清除
  else if (data && !data.metrics) {
    displayMetrics.value = '';
    init();
  }
};
const getInit = () => {
  let getDataData = {
    pageNo: 1,
    pageSize: 100,
  }
  //获取当前报表下拉框
  buniscGetData(getDataData).then(res => {
    currentReportDate.value = res.data;
  })
};
//切换报表
const changeReport = (value) => {
  indexGetDataInit(value);
};
const indexGetDataInit = (key) => {
  indexQueryDate.value = [];
  searchForm.indexQuery = ''
  if (!key) {
    return
  }
  let getDataData = {
    pageNo: 1,
    pageSize: 100,
    params: {
      Q_TABLE_CODE_S_LK: key
    }
  }
  indexGetData(getDataData).then(res => {
    indexQueryDate.value = res.data
  })
};

const columnsAndTable = ref(props.columnsAndTable || []);
//初始化列表数据
const init = (obj) => {
  // console.log("checked", checkedKeys)
  loading.value = true;
  let city = [];//城市
  let area = [];//区域
  if (checkedKeys.value) {

    checkedKeys.value.map(obj => {
      const areaCode = areaCodeMapping.value[obj];
      if (areaCode){
        area.push(areaCode)
      }else {
        area.push(obj);
      }
    })
  }

  // 更新响应式的getDataData对象
  Object.assign(getDataData, {
    columnsAndTable: [], // 初始化为空数组
    pageNo: pagination.value.current,
    pageSize: pagination.value.pageSize,
    tableName: searchForm.currentReport,
    city: city.join(','),
    area: area.join(','),
    specialtyCode: searchForm.reportType,
    columnQueries: [...columnQueries.value],
    sortField: '',
    sortOrder: '',
    derivativeColumn: props.derivativeFormula || '',
    derivativeTable: props.derivativeTable || ''
  });

  // 如果存在从快速汇总传递过来的getDataDataInfo，优先使用其中的值
  if (props.getDataDataInfo && Object.keys(props.getDataDataInfo).length > 0) {
    // console.log('使用getDataDataInfo中的值更新查询参数:', props.getDataDataInfo);

    // 使用getDataDataInfo中的值覆盖当前的getDataData
    Object.assign(getDataData, {
      tableName: props.getDataDataInfo.tableName || getDataData.tableName,
      city: props.getDataDataInfo.city || getDataData.city,
      area: props.getDataDataInfo.area || getDataData.area,
      specialtyCode: props.getDataDataInfo.specialtyCode || getDataData.specialtyCode,
      columnQueries: props.getDataDataInfo.columnQueries || getDataData.columnQueries,
      sortField: props.getDataDataInfo.sortField || getDataData.sortField,
      sortOrder: props.getDataDataInfo.sortOrder || getDataData.sortOrder,
      derivativeColumn: props.getDataDataInfo.derivativeColumn || getDataData.derivativeColumn
    });

    // 同时更新searchForm以保持一致性
    isUpdatingFromGetDataDataInfo.value = true;
    Object.assign(searchForm, {
      reportType: props.getDataDataInfo.reportType || searchForm.reportType,
      indexQuery: props.getDataDataInfo.indexQuery || searchForm.indexQuery,
      reportPeriod: props.getDataDataInfo.reportPeriod || searchForm.reportPeriod,
      filter: props.getDataDataInfo.filter || searchForm.filter,
      operator: props.getDataDataInfo.operator || searchForm.operator,
      queryValue: props.getDataDataInfo.queryValue || searchForm.queryValue,
      all: props.getDataDataInfo.all || searchForm.all
    });
    // 重置标志位
    nextTick(() => {
      isUpdatingFromGetDataDataInfo.value = false;
    });
  }

  // console.log("getDataData", getDataData)
  if (obj) {
    getDataData.sortField = obj.field;
    getDataData.sortOrder = obj.order == 'ascend' ? 'asc' : 'desc';
  }

  if (searchForm.indexQuery) {
    getDataData.columnQueries.push({
      "columnName": searchForm.indexQuery,
      "columnValue": searchForm.queryValue,
      "queryMode": searchForm.operator,
      "logicalSymbol": ""
    })
  }

  console.log("查询参数", getDataData);

  // 修改这里：优先使用分组的多表配置
  if (props.columnsAndTable && props.columnsAndTable.length > 0) {
    getDataData.columnsAndTable = [...props.columnsAndTable];
  } else if (displayMetrics.value) {
    // 如果没有分组配置，使用原来的单个表配置（保持向后兼容）
    getDataData.columnsAndTable.push({
      "tableName": searchForm.currentReport,
      "columns": displayMetrics.value,
    })
  }

  findDataQueryPage(getDataData).then(res => {
    loading.value = false;
    // console.log("find", res.data)
    if (res) {
      tableData.value = res.data.list;
      pagination.value.total = res.data.total;
      generateDynamicColumns(res.data.columnName);
      formatTableData(res.data.list, res.data.columnName);
    }
  })
};


const generateDynamicColumns = (columnData) => {
  // console.log("col", columnData);
  if (!columnData || !columnData.columnName || !columnData.columnCode) {
    console.error('缺少列名或列代码数据');
    return;
  }

  const columnNames = columnData.columnName.split(',');
  const columnCodes = columnData.columnCode.split(',');

  if (columnNames.length !== columnCodes.length) {
    console.error('列名和列代码数量不匹配');
    return;
  }

  // 创建列名映射
  const mapping = {};
  columnCodes.forEach((code, index) => {
    mapping[code] = columnNames[index];
  });
  columnMapping.value = mapping;

  const newColumns = columnCodes.map((code, index) => {
    return {
      title: columnNames[index],
      dataIndex: code,
      key: code,
      width: 200,
      ellipsis: true,
      sorter: true, // 使用远程排序
      filterMultiple: false
    };
  });

  // 设置前两列固定
  if (newColumns.length > 0) {
    newColumns[0].fixed = 'left';
    newColumns[0].width = 200;
  }
  if (newColumns.length > 1) {
    newColumns[1].fixed = 'left';
    newColumns[1].width = 400;
  }

  dynamicColumns.value = newColumns;
};
// 格式化表格数据
const formatTableData = (data, columnData) => {
  if (!data || !columnData) return;

  const columnCodes = columnData.columnCode.split(',');

  formattedTableData.value = data.map(item => {
    const formattedItem = {};

    // 首先尝试使用 columnCode 作为键
    columnCodes.forEach(code => {
      if (item.hasOwnProperty(code)) {
        formattedItem[code] = item[code];
      } else {
        // 如果 columnCode 不存在，尝试查找大写的版本
        const upperCode = code.toUpperCase();
        if (item.hasOwnProperty(upperCode)) {
          formattedItem[code] = item[upperCode];
        } else {
          // 如果还是找不到，尝试在原始数据中查找任何匹配的键
          const foundKey = Object.keys(item).find(key =>
              key.toLowerCase() === code.toLowerCase()
          );
          formattedItem[code] = foundKey ? item[foundKey] : null;
        }
      }
    });

    return formattedItem;
  });

  // 调试信息
  // console.log('原始数据:', data[0]);
  // console.log('格式化后数据:', formattedTableData.value[0]);
  // console.log('列映射:', columnMapping.value);
};

//专业列表
const getProfessionalList = () => {
  let getDataData = {
    pageNo: 1,
    pageSize: 100,
  }
  professionalList(getDataData).then(res => {
    professionalData.value = res.data
  })
};

const areaCodeMapping  = ref<Record<string, string>>({});

//地区列表
const getAreaList = () => {
  let getDataData = {
    pageNo: 1,
    pageSize: 100,
  }
  areaList(getDataData).then(res => {
    let data = res.data;
    // console.log("data", data)
    data.forEach(item => {
      areaCodeMapping.value[item.AREA_NAME] = item.AREA_CODE
    });
    regionTree.value = listToTree(data, 'AREA_CODE', 'PARENT_AREA')
  })
};
//构建树
const listToTree = function (ary, idKey, pidKey) {
  let obj = {};
  //先对数据进行处理
  //obj[id]=row
  for (let i = 0; i < ary.length; i++) {
    let o = ary[i];
    if (!o.hasOwnProperty("isLeaf")) {
      o.isLeaf = true;
    }
    if (idKey && o[idKey]) {
      obj[o[idKey]] = ary[i];
    }
  }
  let rtnAry = [];
  for (let i = 0; i < ary.length; i++) {
    let row = ary[i];
    let id = row[idKey];
    let pid = row[pidKey];
    if (obj[pid] && id !== pid) {
      let parent = obj[pid];
      parent.isLeaf = false;
      parent.children = parent.children || [];
      //已有数据则不再添加进去
      let findItem = parent.children.find(item => {
        return item[idKey] === id;
      })
      if (!findItem) {
        parent.children.push(row);
      }
    } else {
      rtnAry.push(row);
    }
  }
  return rtnAry;
};
//查询
const getQuery = () => {
  pagination.value.current = 1;
  init();

};

// 查询模板选择变化处理函数
const handleQueryTemplateChange = (value: string, option: any) => {
  // 如果选择的是默认选项（请选择查询模板），不执行任何操作
  if (value === '1') {
    return;
  }

  // 查找选中的模板
  const selectedTemplate = queryTemplateList.value.find(item => item.value === value);
  if (!selectedTemplate || !selectedTemplate.templateData) {
    message.error('未找到模板数据');
    return;
  }

  try {
    // 获取模板中的查询条件
    const templateConditions = selectedTemplate.templateData.QUERY_CONDITIONS;
    if (!templateConditions) {
      message.error('模板中没有查询条件');
      return;
    }

    // 解析查询条件
    let parsedConditions;
    if (typeof templateConditions === 'string') {
      parsedConditions = JSON.parse(templateConditions);
    } else {
      parsedConditions = templateConditions;
    }

    // 应用模板中的所有需要的字段

    if (parsedConditions.tableName) {
      searchForm.currentReport = parsedConditions.tableName;
      // 初始化指标列表
      indexGetDataInit(parsedConditions.tableName);
    }

    if (parsedConditions.specialtyCode) {
      searchForm.reportType = parsedConditions.specialtyCode;
    }

    if (parsedConditions.columnQueries) {
      // 清空现有的查询条件
      columnQueries.value = [];
      getDataData.columnQueries = [];

      // 添加模板中的查询条件
      parsedConditions.columnQueries.forEach((query: any) => {
        columnQueries.value.push(query);
        getDataData.columnQueries.push(query);
      });
    }

    if (parsedConditions.derivativeTable) {
      getDataData.derivativeTable = parsedConditions.derivativeTable;
    }

    if (parsedConditions.derivativeColumn) {
      getDataData.derivativeColumn = parsedConditions.derivativeColumn;
    }

    // 应用模板中的指标查询、运算符和值
    if (parsedConditions.indexQuery) {
      searchForm.indexQuery = parsedConditions.indexQuery;
    }
    if (parsedConditions.queryValue) {
      searchForm.queryValue = parsedConditions.queryValue;
    }
    if (parsedConditions.operator) {
      searchForm.operator = parsedConditions.operator;
    }

    // 执行查询
    getQuery();
    message.success('查询模板应用成功');
  } catch (error) {
    console.error('应用查询模板失败:', error);
    message.error('应用查询模板失败，请检查模板格式');
  }
};
//重置
const handleReset = () => {
  // 通知父组件重置衍生指标和多表配置
  emit('reset-derivative-indicators');

  // 使用nextTick确保在props更新后再执行所有的重置操作
  nextTick(() => {
    // 重置搜索表单到初始状态
    Object.assign(searchForm,{
      ...defaultForm,
      currentReport: props.TABLE_CODE || ''
    });

    // 重置组合查询条件
    columnQueries.value = [];

    // 重置区域选择
    checkedKeys.value = [];
    expandedKeys.value = ['广州市'];

    // 重置模板选择
    curTemplate.value = '';

    // 重置分页
    pagination.value.current = 1;

    // 重置与查询条件相关的响应式变量
    displayMetrics.value = props.displayMetrics;
    currentReportDate.value = [];
    indexQueryDate.value = [];

    // 重置getDataData中的所有字段到初始状态
    Object.assign(getDataData, {
      columnsAndTable: [],
      pageNo: 1,
      pageSize: 100,
      tableName: props.TABLE_CODE || '',
      city: '',
      area: '',
      specialtyCode: '',
      columnQueries: [],
      sortField: '',
      sortOrder: '',
      derivativeColumn: props.derivativeFormula || '',
      derivativeTable: props.derivativeTable || ''
    });

    // 调用init函数重新加载数据
    init();
  });
}


const handleOk = (conditions: any[]) => {
  // console.log("组合条件为", conditions)

  columnQueries.value = conditions;

  pagination.value.current = 1;

  init();
};

// 处理表格排序变化
const handleTableChange = (pagination, filters, sorter) => {
  if (sorter.field) {
    // 检查当前点击的字段是否与之前的排序字段相同
    if (sorter.field === currentSort.value.field) {
      // 增加点击次数
      sortClickCount.value[sorter.field] = (sortClickCount.value[sorter.field] || 0) + 1;

      // 如果点击次数达到3次，重置排序状态
      if (sortClickCount.value[sorter.field] === 3) {
        sortClickCount.value[sorter.field] = 0;
        currentSort.value = { field: '', order: '' };
        // 调用init函数，不传递排序参数表示重置
        init();
      } else {
        // 更新当前排序状态
        currentSort.value = { field: sorter.field, order: sorter.order };
        // 调用init函数，传递排序参数
        init({ field: sorter.field, order: sorter.order });
      }
    } else {
      // 如果点击的是新字段，重置点击次数并更新排序状态
      sortClickCount.value = { [sorter.field]: 1 };
      currentSort.value = { field: sorter.field, order: sorter.order };
      // 调用init函数，传递排序参数
      init({ field: sorter.field, order: sorter.order });
    }
  }
};

// 应用模板
const applyTemplate = (value: string,option) => {
  // console.log(option,'option')
  if (!value) {
    // 清空模板应用
    return;
  }

  const template = templateList.value.find(tpl => tpl.value === value);
  if (!template) return;

  // 应用模板指标
  const metricsStr = template.metrics.join(',');
  // 调用查询方法刷新表格
  displayMetrics.value = metricsStr;
};

onMounted(() => {
  if (searchForm.currentReport) {
    indexGetDataInit(searchForm.currentReport)
  }
  getInit();
  if(!props.displayMetrics){
    init();
  }
  getProfessionalList();
  getAreaList()
  getQueryTemplateList();
  if (containerRef.value) {
    const containerHeight = containerRef.value.clientHeight;
    tableHeight.value = containerHeight - 110
  }

  // 加载显示方案模板下拉框
  const savedTemplates = localStorage.getItem('metric_templates');
  if (savedTemplates) {
    const allTemplates = JSON.parse(savedTemplates);
    // 筛选当前报表的模板
    templateList.value = allTemplates.filter(
        (tpl: TemplateItem) => tpl.reportCode === props.TABLE_CODE
    );
  }
  // 初始化getDataData的tableName
  getDataData.tableName = props.TABLE_CODE;
})

watch(checkedKeys, (val) => {
  init();
})

// 修改监听器，同时监听 columnsAndTable 的变化
watch(() => [displayMetrics.value, props.columnsAndTable], ([metricsVal, columnsTableVal]) => {
  init();
}, { deep: true, immediate: true })

// 监听从快速汇总传递过来的getDataDataInfo变化，用于初始化数据
watch(() => props.getDataDataInfo, (newVal) => {
  if (newVal && Object.keys(newVal).length > 0) {
    // console.log('InfoTemplate 组件接收到 getDataDataInfo:', newVal);
    emit('reset-get-data-data-info')
    // 初始化查询数据后执行查询
    // init();
  }
}, { immediate: true })
</script>

<style lang="less" scoped>
/* 移除整体页面的滚动效果 */
:deep(body) {
  overflow: hidden;
}

.tree-left {
  position: relative;
}

.tree-button {
  position: absolute;
  top: 50%;
  right: -12px;
  z-index: 99;
  font-size: 28px;
  color: rgb(118 118 118 / 10%);
  cursor: pointer;
}

.tree-button:hover {
  color: #546fff
}

.ant-card-body {
  padding: 2.4rem;
}

.rightSearch {}

:deep(.ant-table-thead > tr > th) {
  background: rgb(245 245 245 / 100%);
  color: rgb(55 55 55 / 100%);
  font-size: 14px;
  text-align: center;
  height: 36px;
  font-weight: 500;
  padding: 0;
}

:deep(.ant-table-tbody > tr > td) {
  padding: 5px 15px !important;
  text-align: center;
  font-size: 1.4rem;

  // 除了模板描述和操作列，其他列的字体颜色
  &:not(:nth-child(3)):not(:last-child) {
    color: rgb(90 96 107 / 100%);
  }

  // 模板描述列的样式
  &:nth-child(3) {
    color: rgb(84 111 255 / 100%);
    cursor: pointer;
  }
}

:deep(.ant-table-thead > tr > th) {
  font-size: 1.5rem !important;
}

.custom-row-height {
  height: 36px !important;
}

.search-header {
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;

  .search-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;

    &:last-child {
      margin-bottom: 0;
    }

    .search-item {
      display: flex;
      align-items: center;
      margin-left: 1rem;
    }
  }


  :deep(.ant-select) {
    .ant-select-selector {
      border-radius: 85px;
      font-size: 1.5rem;
      height: 32px;
      background: rgb(245 245 247 / 100%) !important;
      border: none;

      .ant-select-selection-item {
        color: rgb(55 55 55 / 100%);
        font-size: 1.6rem;
        line-height: 30px;
      }

      .ant-select-selection-placeholder {
        font-size: 16px;
        line-height: 30px;
        font-weight: 400;
        color: black;
      }

      &:hover,
      &:focus {
        background: rgb(245 245 247 / 100%) !important;
        box-shadow: none;
      }
    }

    &.ant-select-focused .ant-select-selector {
      box-shadow: none !important;
    }
  }

  .add-condition-btn {
    background: #fff;
    border: 1px dashed #d9d9d9;
    color: rgb(0 0 0 / 85%);
    border-radius: 85px;
    padding: 0 16px;
    height: 32px;
    line-height: 32px;
    font-size: 14px;

    &:hover {
      color: #546fff;
      border-color: #546fff;
    }
  }

  .link-btn {
    color: rgb(113 113 113 / 100%);
    padding: 0;
    height: auto;
    font-size: 14px;

    &:hover {
      color: #546fff;
    }
  }

  :deep(.ant-btn) {
    border-radius: 85px;
    height: 32px;
    font-size: 14px;
    // padding: 0.4rem 1.5rem;
  }

  :deep(.ant-input) {
    border-radius: 85px;
    background: rgb(245 245 247 / 100%);
    border: none;
    height: 32px;
    font-size: 14px;
    color: rgb(55 55 55 / 100%);

    &:hover,
    &:focus {
      background: rgb(245 245 247 / 100%);
      box-shadow: none;
    }

    &::placeholder {
      // 修改placeholder样式以匹配其他组件
      color: rgb(55 55 55 / 100%);
      font-size: 1.6rem;
      font-weight: 400;
    }
  }
}

.rx-grid {
  :deep(.ant-spin-nested-loading) {
    height: 100%;
  }

  :deep(.ant-spin-container) {
    height: 100%;
  }

  :deep(.ant-table) {
    height: 100% !important;
    overflow: hidden;
  }

  :deep(.ant-table-container) {
    height: 100%;
  }

  :deep(.ant-table-body) {
    overflow-y: auto;
  }

  :deep(.ant-table-thead > tr > th) {
    position: sticky;
    top: 0;
    background: white;
    z-index: 10;
  }

  :deep(.ant-table-tbody > tr > td) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>