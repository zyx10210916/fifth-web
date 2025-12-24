<template>
  <div class="data-query-container">
    <QuickSummaryForm @search="handleSearch"></QuickSummaryForm>
    <div ref="containerRef" class="custom-table">
      <RectangleTab :list="tabsConfig" :clickable="true" :tabList="tabsConfig" @click:item="handleTabClick"/>
      <!-- 数据表格 -->
      <a-table
          :columns="columns"
          :data-source="tableData"
          :pagination="pagination"
          @change="refreshData"
          :scroll="{ x: '100%', y:tableHeight}"
          style="height: 100%;"
          row-key="PAGEHELPER_ROW_ID"
          :row-selection="rowSelection"
          :loading="loading"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <div class="action-buttons">
              <a-button type="link" @click="handleEdit(record)" class="edit-button action-button">
                <template #icon><EditOutlined /></template>
                修改
              </a-button>
              <a-button type="link" @click="handleDelete(record)" class="delete-button action-button">
                <template #icon><DeleteOutlined /></template>
                删除
              </a-button>
              <a-button type="link" @click="handleExecute(record)" class="execute-button action-button">
                <template #icon><StepForwardOutlined /></template>
                执行汇总
              </a-button>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'TEMPLATE_DESC'">
            <div class="description-container">
              <span class="description-text" :title="record.TEMPLATE_DESC">{{ record.TEMPLATE_DESC }}</span>
              <a-tooltip :title="record.TEMPLATE_DESC" placement="top" :mouseEnterDelay="0.1">
                <span class="tag-label copyable-tooltip" @click="copyToClipboard(record.TEMPLATE_DESC)"></span>
              </a-tooltip>
            </div>
          </template>
          <!-- 处理是否在用模板列 - 使用开关按钮 -->
          <template v-else-if="column.dataIndex === 'SFZMB'">
            <div class="switch-container">
              <a-switch
                  :checked="getBooleanValue(record.SFZMB)"
                  @change="(checked) => handleStatusChange(record, checked)"
              />
            </div>
          </template>
          <!-- 处理模板类型列 -->
          <template v-else-if="column.dataIndex === 'TYPE'">
            <div class="description-container">
              <span class="description-text" :title="getTypeText(record.TYPE)">
                {{ getTypeText(record.TYPE) }}
              </span>
              <a-tooltip :title="getTypeText(record.TYPE)" placement="top" :mouseEnterDelay="0.1">
                <span class="tag-label copyable-tooltip" @click="copyToClipboard(getTypeText(record.TYPE))"></span>
              </a-tooltip>
            </div>
          </template>
          <!-- 处理创建时间列 -->
          <template v-else-if="column.dataIndex === 'CREATE_TIME_'">
            <div class="description-container">
              <span class="description-text" :title="formatTimestamp(record.CREATE_TIME_)">
                {{ formatTimestamp(record.CREATE_TIME_) }}
              </span>
              <a-tooltip :title="formatTimestamp(record.CREATE_TIME_)" placement="top" :mouseEnterDelay="0.1">
                <span class="tag-label copyable-tooltip" @click="copyToClipboard(formatTimestamp(record.CREATE_TIME_))"></span>
              </a-tooltip>
            </div>
          </template>
          <template v-else>
            <!-- 其他列的通用处理 -->
            <div class="description-container">
              <span class="description-text" :title="record[column.dataIndex]">{{ record[column.dataIndex] }}</span>
              <a-tooltip :title="record[column.dataIndex]" placement="top" :mouseEnterDelay="0.1">
                <span class="tag-label copyable-tooltip" @click="copyToClipboard(record[column.dataIndex])"></span>
              </a-tooltip>
            </div>
          </template>
        </template>
      </a-table>
    </div>
  </div>

  <!-- 执行汇总弹窗已注释掉 -->
  <!-- <a-modal
      v-model:open="executeModalVisible"
      title="历史执行结果查看"
      width="1200px"
      :footer="null"
  >
    <div class="modal-content">
      <div class="modal-header">
        <div class="header-item">
          <span class="header-label">模板名称：</span>
          <span class="header-value">{{ currentRecord?.TEMPLATE_NAME }}</span>
        </div>
        <div class="header-item">
          <span class="header-label">模板创建人：</span>
          <span class="header-value">{{ currentRecord?.CJR }}</span>
        </div>
        <div class="header-item">
          <span class="header-label">报告期：</span>
          <a-select v-model:value="reportYear" style="width: 120px;">
            <a-select-option v-for="year in last10Years" :key="year" :value="year">{{ year }}</a-select-option>
          </a-select>
        </div>
        <div class="header-item">
          <span class="header-label">执行时间：</span>
          <a-date-picker
              v-model:value="executeTime"
              format="YYYY年MM月DD日"
              placeholder="请选择执行时间"
              :locale="datePickerLocale"
          />
        </div>
      </div>

      <div class="modal-table">
        <a-table
            :columns="historyColumns"
            :data-source="historyTableData"
            :pagination="historyPagination"
            :scroll="{ x: '100%' }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <div class="history-action-buttons">
                <a-button type="link" @click="viewHistory(record)">查看</a-button>
                <a-button type="link" @click="downloadHistory(record)" class="download-button">下载</a-button>
              </div>
            </template>
          </template>
        </a-table>
      </div>
    </div>
  </a-modal> -->

  <!-- 启用/停用模板弹窗 -->
  <a-modal
      v-model:open="statusModalVisible"
      :title="statusModalTitle"
      @ok="confirmStatusChange"
      @cancel="cancelStatusChange"
      ok-text="确认"
      cancel-text="取消"
      :confirm-loading="statusConfirmLoading"
  >
    <div class="status-modal-content">
      <a-alert :message="statusModalMessage" type="info" show-icon />
      <div class="status-modal-info">
        <p><span class="info-label">模板名称：</span>{{ currentRecord?.TEMPLATE_NAME }}</p>
        <p><span class="info-label">当前状态：</span>{{ getBooleanValue(currentRecord?.SFZMB) ? '启用' : '停用' }}</p>
        <p><span class="info-label">目标状态：</span>{{ targetStatus ? '启用' : '停用' }}</p>
      </div>
    </div>
  </a-modal>

  <!-- 编辑模板弹窗 -->
  <EditTemplateModal
      v-model:visible="editModalVisible"
      :initial-data="{
        name: currentEditRecord?.TEMPLATE_NAME,
        description: currentEditRecord?.TEMPLATE_DESC,
        creator: currentEditRecord?.CJR
      }"
      :current-metrics="[]"
      @save="handleSaveSuccess"
      @cancel="editModalVisible = false"
  />
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import QuickSummaryForm from './head-form/Index.vue';
import RectangleTab from '@/components/CustomTabs/RectangleTab.vue';
import {
  DeleteOutlined, EditOutlined, StepForwardOutlined
} from '@ant-design/icons-vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { message, Modal } from 'ant-design-vue';
import { getSumTemplateList, removeSumTemplate, saveSumTemplate } from '@/api/data-processing';
import EditTemplateModal from '@/components/Summary/EditTemplateModal/index.vue';

// 设置 dayjs 为中文
dayjs.locale('zh-cn');

// 日期选择器中文配置
const datePickerLocale = {
  lang: {
    placeholder: '请选择日期',
    yearPlaceholder: '请选择年份',
    quarterPlaceholder: '请选择季度',
    monthPlaceholder: '请选择月份',
    weekPlaceholder: '请选择周',
    rangePlaceholder: ['开始日期', '结束日期'],
    rangeYearPlaceholder: ['开始年份', '结束年份'],
    rangeMonthPlaceholder: ['开始月份', '结束月份'],
    rangeWeekPlaceholder: ['开始周', '结束周'],
    locale: 'zh_CN',
    today: '今天',
    now: '此刻',
    backToToday: '返回今天',
    ok: '确定',
    clear: '清除',
    month: '月',
    year: '年',
    timeSelect: '选择时间',
    dateSelect: '选择日期',
    weekSelect: '选择周',
    monthSelect: '选择月份',
    yearSelect: '选择年份',
    decadeSelect: '选择年代',
    yearFormat: 'YYYY年',
    dateFormat: 'YYYY年M月D日',
    dayFormat: 'D日',
    dateTimeFormat: 'YYYY年M月D日 HH时mm分ss秒',
    monthBeforeYear: false,
    previousMonth: '上个月 (PageUp)',
    nextMonth: '下个月 (PageDown)',
    previousYear: '上一年 (Control + left)',
    nextYear: '下一年 (Control + right)',
    previousDecade: '上一年代',
    nextDecade: '下一年代',
    previousCentury: '上一世纪',
    nextCentury: '下一世纪',
  },
  timePickerLocale: {
    placeholder: '请选择时间',
    rangePlaceholder: ['开始时间', '结束时间'],
  },
};

// 表格列定义
const columns = [
  {
    title: '模板名称',
    dataIndex: 'TEMPLATE_NAME',
    key: 'TEMPLATE_NAME',
    width: 100,
    align: 'center',
  },
  {
    title: '模板描述',
    dataIndex: 'TEMPLATE_DESC',
    key: 'TEMPLATE_DESC',
    width: 200,
    align: 'center',
  },
  {
    title: '创建人',
    dataIndex: 'CJR',
    key: 'CJR',
    width: 100,
    align: 'center',
  },
  {
    title: '创建时间',
    dataIndex: 'CREATE_TIME_',
    key: 'CREATE_TIME_',
    width: 180,
    align: 'center',
  },
  {
    title: '是否在用模板',
    dataIndex: 'SFZMB',
    key: 'SFZMB',
    width: 120,
    align: 'center',
  },
  {
    title: '模板类型',
    dataIndex: 'TYPE',
    key: 'TYPE',
    width: 120,
    align: 'center',
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 250,
    align: 'center',
  },
];

// 历史执行表格列定义（已注释掉）
// const historyColumns = [
//   {
//     title: '报告期',
//     width: 150,
//     dataIndex: 'reportPeriod',
//     key: 'reportPeriod',
//     align: 'center',
//   },
//   {
//     title: '执行时间',
//     dataIndex: 'executeTime',
//     key: 'executeTime',
//     width: 200,
//     align: 'center',
//   },
//   {
//     title: '执行人',
//     dataIndex: 'executor',
//     key: 'executor',
//     align: 'center',
//     width: 150,
//   },
//   {
//     title: '操作',
//     key: 'action',
//     fixed: 'right',
//     width: 150,
//     align: 'center',
//   },
// ];

// 表格数据
const tableData = ref([]);
// 加载状态
const loading = ref(false);

// 排序配置
const sortField = ref('');
const sortOrder = ref('asc');

// 搜索参数
const searchParams = ref({
  templateName: '',
  year: new Date().getFullYear()
});

// 处理搜索事件
const handleSearch = (params) => {
  console.log('接收到搜索参数:', params);
  searchParams.value = params;
  // 重置分页并重新加载数据
  pagination.value.current = 1;
  loadData();
};

// 获取模板类型文本
const getTypeText = (typeValue) => {
  if (typeValue === undefined || typeValue === null) return '';
  const typeStr = String(typeValue).trim();
  if (typeStr === '1') return '快速汇总';
  if (typeStr === '2') return '交叉汇总';
  return typeStr; // 如果既不是1也不是2，显示原始值
};

// 将各种值转换为布尔值
const getBooleanValue = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const str = value.trim().toLowerCase();
    return str === 'true' || str === '1' || str === '是' || str === '启用';
  }
  return false;
};

// 格式化时间戳函数
const formatTimestamp = (timestamp) => {
  if (!timestamp && timestamp !== 0) return '';

  try {
    // 将时间戳转换为数字
    const timeNum = Number(timestamp);

    if (isNaN(timeNum)) {
      // 如果不是数字，直接返回原始值
      return String(timestamp);
    }

    // 将毫秒级时间戳转换为dayjs对象
    return dayjs(timeNum).format('YYYY-MM-DD HH:mm:ss');
  } catch (error) {
    console.error('格式化时间戳失败:', error, '时间戳:', timestamp);
    return String(timestamp);
  }
};

// 加载数据函数
const loadData = async () => {
  loading.value = true;
  try {
    // 构建查询参数，使用Q_TEMPLATE-NAME_S_LK作为模板名称的查询字段
    const apiParams = {
      pageNo: pagination.value.current,
      pageSize: pagination.value.pageSize,
      params: {
        'Q_TEMPLATE_NAME_S_LK': searchParams.value.templateName || '',
      },
      sortField: sortField.value,
      sortOrder: sortOrder.value,
    };

    console.log('请求API的参数:', apiParams);
    const response = await getSumTemplateList(apiParams);

    if (response && response.data) {
      console.log("data", response.data)
      tableData.value = response.data || [];
      pagination.value.total = response.data.total || 0;
    }
  } catch (error) {
    console.error('加载汇总模板列表失败:', error);
    message.error('加载汇总模板列表失败');
  } finally {
    loading.value = false;
  }
};

// 历史执行表格数据（已注释掉）
// const historyTableData = ref([
//   {
//     id: 1,
//     reportPeriod: '2023年',
//     executeTime: '2023-06-15 10:30:00',
//     executor: '张三',
//   },
//   {
//     id: 2,
//     reportPeriod: '2022年',
//     executeTime: '2022-06-20 14:45:00',
//     executor: '李四',
//   },
//   {
//     id: 3,
//     reportPeriod: '2021年',
//     executeTime: '2021-07-10 11:20:00',
//     executor: '王五',
//   },
//   {
//     id: 2,
//     reportPeriod: '2022年',
//     executeTime: '2022-06-20 14:45:00',
//     executor: '李四',
//   },
//   {
//     id: 3,
//     reportPeriod: '2021年',
//     executeTime: '2021-07-10 11:20:00',
//     executor: '王五',
//   },
//   {
//     id: 2,
//     reportPeriod: '2022年',
//     executeTime: '2022-06-20 14:45:00',
//     executor: '李四',
//   },
//   {
//     id: 3,
//     reportPeriod: '2021年',
//     executeTime: '2021-07-10 11:20:00',
//     executor: '王五',
//   }
// ]);

// 分页配置
const pagination = ref({
  current: 1,
  pageSize: 10,
  total: 3,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`,
  onChange: (current, pageSize) => {
    refreshData(current, pageSize);
  },
  locale: {
    items_per_page: '条/页',
    jump_to: '跳转到',
    jump_to_confirm: '确定',
    page: '页',
    prev_page: '上一页',
    next_page: '下一页',
    prev_5: '向前 5 页',
    next_5: '向后 5 页',
    prev_3: '向前 3 页',
    next_3: '向后 3 页'
  }
});

// 历史执行分页配置（已注释掉）
// const historyPagination = ref({
//   current: 1,
//   pageSize: 10,
//   total: 3,
//   showSizeChanger: true,
//   showQuickJumper: true,
//   showTotal: (total) => `共 ${total} 条`,
//   onChange: (current, pageSize) => {
//     refreshHistoryData(current, pageSize);
//   },
//   locale: {
//     items_per_page: '条/页',
//     jump_to: '跳转到',
//     jump_to_confirm: '确定',
//     page: '页',
//     prev_page: '上一页',
//     next_page: '下一页',
//     prev_5: '向前 5 页',
//     next_5: '向后 5 页',
//     prev_3: '向前 3 页',
//     next_3: '向后 3 页'
//   }
// });

// 表格行选择配置
const rowSelection = ref({
  selectedRowKeys: [],
  onChange: (selectedRowKeys, selectedRows) => {
    rowSelection.value.selectedRowKeys = selectedRowKeys;
    selectedRowsData.value = selectedRows;
  },
});

// 选中的行数据
const selectedRowsData = ref([]);

const tabsConfig = [
  {
    title: '删除',
    key: 'delete',
    icon: DeleteOutlined,
    iconFont: 1.6,
  }
];

const tableHeight = ref(500);
const containerRef = ref(null);

// 计算表格高度
const calculateTableHeight = () => {
  nextTick(() => {
    if (containerRef.value) {
      const containerHeight = containerRef.value.clientHeight;
      // 减去表格标题、分页等元素的高度
      tableHeight.value = containerHeight - 80;
    }
  });
};

// 弹窗相关（已注释掉）
// const executeModalVisible = ref(false);
// const reportYear = ref(new Date().getFullYear());
// const executeTime = ref(dayjs());

// 状态变更弹窗相关
const statusModalVisible = ref(false);
const statusConfirmLoading = ref(false);
const currentRecord = ref(null);
const targetStatus = ref(false);

// 计算最近10年（已注释掉）
// const last10Years = computed(() => {
//   const currentYear = new Date().getFullYear();
//   const years = [];
//   for (let i = 0; i < 10; i++) {
//     years.push(currentYear - i);
//   }
//   return years;
// });

// 计算状态弹窗标题和消息
const statusModalTitle = computed(() => {
  return targetStatus.value ? '启用模板' : '停用模板';
});

const statusModalMessage = computed(() => {
  return targetStatus.value
      ? '您确定要启用该模板吗？启用后该模板将可用于相关业务操作。'
      : '您确定要停用该模板吗？停用后该模板将不可用于相关业务操作。';
});

// 处理函数
const handleView = (record) => {
  console.log('查看', record);
};



const handleDelete = (record) => {
  Modal.confirm({
    title: '删除模板确认',
    content: '您确定要删除该汇总模板吗？此操作不可恢复!',
    okText: '删除',
    cancelText: '取消',
    okType: 'danger',
    async onOk() {
      try {
        // 调用删除API
        await removeSumTemplate(record.ID_);

        // 删除成功后，重新加载数据
        message.success('删除汇总模板成功');
        loadData();
      } catch (error) {
        console.error('删除汇总模板失败:', error);
        message.error('删除汇总模板失败');
      }
    },
    onCancel() {
      // 取消操作，不需要额外处理
    },
  });
};

// 定义emit事件
const emit = defineEmits(['navigate-to-summary']);

// 编辑模板相关变量
const editModalVisible = ref(false);
const currentEditRecord = ref(null);

const handleEdit = (record) => {
  console.log('修改', record);
  // 保存当前编辑记录
  currentEditRecord.value = record;
  // 打开编辑模态框
  editModalVisible.value = true;
};

const handleExecute = (record) => {
  // 根据模板类型判断跳转页面
  const pageType = record.TYPE === '1' ? 'quick-summary' : 'cross-summary';
  // 使用emit传递SUM_OP数据和页面类型
  emit('navigate-to-summary', {
    sumOp: record.SUM_OP,
    pageType: pageType
  });
};

// 处理保存成功
const handleSaveSuccess = async (data) => {
  console.log('保存成功的数据:', data);
  try {
    // 构造API所需的参数格式
    const templateData = {
      ID_: currentEditRecord.value?.ID_,
      template_name: data.formData.name,
      template_desc: data.formData.description,
      sum_op: currentEditRecord.value?.SUM_OP,
      sfzmb: currentEditRecord.value?.SFZMB,
      cjr: data.formData.creator,
      type: currentEditRecord.value?.TYPE,
      ID_: currentEditRecord.value?.ID_,
      UPDATE_VERSION_: currentEditRecord.value?.UPDATE_VERSION_ === undefined
          ? 1
          : parseInt(currentEditRecord.value?.UPDATE_VERSION_)
    };

    // 调用保存模板API
    await saveSumTemplate(templateData);

    // 关闭模态框
    editModalVisible.value = false;

    // 显示成功消息
    message.success('模板编辑成功');

    // 重新加载数据列表
    loadData();
  } catch (error) {
    console.error('保存模板失败:', error);
    message.error('保存模板失败，请重试');
  }
};

// 处理tab点击事件
const handleTabClick = (item) => {
  if (item.key === 'delete') {
    if (rowSelection.value.selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的汇总模板');
      return;
    }

    // 显示批量删除确认弹窗
    Modal.confirm({
      title: '批量删除模板确认',
      content: '您确定要删除选中的汇总模板吗？此操作不可恢复！',
      okText: '删除',
      cancelText: '取消',
      okType: 'danger',
      async onOk() {
        try {
          // 调用批量删除API
          // 注意：这里假设后端支持批量删除，或者我们需要循环调用单个删除API
          // 由于当前API只支持单个删除，我们需要循环调用
          for (const row of selectedRowsData.value) {
            await removeSumTemplate(row.ID_);
          }

          // 删除成功后，重新加载数据
          message.success(`成功删除${rowSelection.value.selectedRowKeys.length}个汇总模板`);
          loadData();

          // 清空选中行
          rowSelection.value.selectedRowKeys = [];
          selectedRowsData.value = [];
        } catch (error) {
          console.error('批量删除汇总模板失败:', error);
          message.error('批量删除汇总模板失败');
        }
      },
      onCancel() {
        // 取消操作，不需要额外处理
      },
    });
  }
};

// const viewHistory = (record) => {
//   console.log('查看历史记录', record);
// };

// const downloadHistory = (record) => {
//   console.log('下载历史记录', record);
// };

const refreshData = (paginationInfo, pageSize, filters, sorter) => {
  // 如果是分页变更
  if (paginationInfo && typeof paginationInfo === 'object') {
    pagination.value.current = paginationInfo.current;
    pagination.value.pageSize = paginationInfo.pageSize;
  } else if (typeof paginationInfo === 'number') {
    // 兼容旧的调用方式
    pagination.value.current = paginationInfo;
    if (pageSize) {
      pagination.value.pageSize = pageSize;
    }
  }

  // 如果是排序变更
  if (sorter && sorter.field) {
    sortField.value = sorter.field;
    sortOrder.value = sorter.order === 'ascend' ? 'asc' : 'desc';
  }

  loadData();
};

// const refreshHistoryData = (current, pageSize) => {
//   console.log('刷新历史数据', current, pageSize);
// };

// 复制到剪贴板功能
const copyToClipboard = (text) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      message.success('已复制到剪贴板');
    }).catch(err => {
      console.error('复制失败:', err);
      message.error('复制失败');
    });
  } else {
    // 兼容性处理
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      message.success('已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
      message.error('复制失败');
    }
    document.body.removeChild(textArea);
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadData();
  calculateTableHeight();
  // 添加窗口大小变化监听
  window.addEventListener('resize', calculateTableHeight);
});

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('resize', calculateTableHeight);
});

// 状态变更处理函数
const handleStatusChange = (record, checked) => {
  currentRecord.value = record;
  targetStatus.value = checked;
  statusModalVisible.value = true;
};

// 确认状态变更
const confirmStatusChange = async () => {
  statusConfirmLoading.value = true;
  try {
    // 调用接口更新状态
    await updateTemplateStatus(currentRecord.value.id, targetStatus.value);

    // 更新本地数据状态
    // 注意：这里将目标状态转换为适当的数据类型
    // 如果后端期望的是0/1，可以在这里转换
    const newStatusValue = targetStatus.value ? 1 : 0;
    currentRecord.value.SFZMB = newStatusValue;

    // 关闭弹窗
    statusModalVisible.value = false;

    // 显示成功消息
    const action = targetStatus.value ? '启用' : '停用';
    message.success(`${action}模板成功`);
  } catch (error) {
    // 如果更新失败，恢复开关状态
    if (currentRecord.value) {
      // 恢复原来的状态
      const originalStatus = getBooleanValue(currentRecord.value.SFZMB);
      // 不需要手动设置，因为开关会根据getBooleanValue自动获取状态
    }

    message.error(`操作失败: ${error.message}`);
  } finally {
    statusConfirmLoading.value = false;
  }
};

// 取消状态变更
const cancelStatusChange = () => {
  statusModalVisible.value = false;
};

// 预留的接口调用方法，后续需要接入真实接口
const updateTemplateStatus = async (id, status) => {
  // 模拟异步请求，实际使用时替换为真实的API调用
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(`调用接口更新模板ID ${id} 的状态为 ${status ? '启用' : '停用'}`);
      // 这里应该调用真实的API接口
      // 例如: await templateApi.updateStatus(id, status)

      // 模拟成功
      resolve();

      // 如果需要模拟失败，可以使用下面的代码
      // reject(new Error('模拟失败'));
    }, 500);
  });
};
</script>

<style scoped lang="less">
.data-query-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.description-link {
  color: #1890ff;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  justify-content: center;
}

.action-button {
  font-size: 14px;
  padding: 4px 8px;

  &:hover {
    transform: scale(1.05);
  }
}

.edit-button {
  color: #52c41a;

  &:hover {
    color: #73d13d;
  }
}

.delete-button {
  color: #ff4d4f;

  &:hover {
    color: #ff7875;
  }
}

.execute-button {
  color: #1890ff;

  &:hover {
    color: #40a9ff;
  }
}

.download-button {
  color: #52c41a;

  &:hover {
    color: #73d13d;
  }
}

.history-action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.modal-content {
  .modal-header {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-bottom: 20px;
    padding: 16px;
    background-color: #fafafa;
    border-radius: 4px;

    .header-item {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 250px;

      .header-label {
        white-space: nowrap;
        margin-right: 8px;
        font-weight: bold;
      }

      .header-value {
        flex: 1;
      }
    }
  }

  .modal-table {
    margin-top: 20px;
  }
}

/* 新增样式：表格单元格内容 */
.cell-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.description-container {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  height: 24px;
}

.description-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.copyable-tooltip {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  cursor: pointer;
  z-index: 1;
  background: transparent;
}

.switch-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 24px;
}

.status-modal-content {
  .status-modal-info {
    margin-top: 20px;

    p {
      margin-bottom: 10px;
      font-size: 14px;

      .info-label {
        font-weight: bold;
        margin-right: 8px;
      }
    }
  }
}
</style>