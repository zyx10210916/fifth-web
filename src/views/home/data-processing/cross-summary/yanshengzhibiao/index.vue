<template>
  <a-modal
      v-model:open="statisticalDefinitionVisible"
      title="设置汇总口径"
      width="90%"
      :footer="null"
      :z-index="1001"
      @cancel="closeStatisticalDefinition"
  >
    <StatisticalDefinition
        ref="statisticalDefinitionRef"
        @confirm="handleFormulaConfirm"
        @back="closeStatisticalDefinition "
    />
  </a-modal>
  <div class="derivative-indicators-container">
    <!-- 操作按钮 -->
    <div class="list-toolbar">
      <div class="table-operator">
        <a-button type="primary" @click="handleAdd" style="margin-right: 10px;">
          <template #icon><PlusOutlined /></template>
          新增
        </a-button>
        <a-button @click="handleRefresh" style="margin-right: 10px;">
          <template #icon><ReloadOutlined /></template>
          刷新
        </a-button>
        <a-button danger @click="handleDelete" :disabled="selectedRowKeys.length==0">
          <template #icon><DeleteOutlined /></template>
          删除
        </a-button>
      </div>
    </div>

    <!-- 表格展示 -->
    <a-table
        :dataSource="tableData"
        :columns="columns"
        :rowKey="record => record.ID_"
        :pagination="pagination"
        :loading="loading"
        :rowSelection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
        @change="handleTableChange"
        size="small"
        bordered
        style="margin-top: 16px;"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.dataIndex === 'action'">
          <a-button type="link" size="small" @click="handleEdit(record)">编辑</a-button>
          <a-button type="link" size="small" @click="handleSelectColumn(record)">选择</a-button>
        </template>
        <template v-else-if="column.dataIndex === 'index'">
          {{ index + 1 }}
        </template>
        <template v-else>
          <!-- 添加Tooltip组件实现悬浮展示 -->
          <a-tooltip placement="topLeft" :title="record[column.dataIndex] || '-'">
            <div class="cell-content" :class="{ 'empty-cell': !record[column.dataIndex] }">
              {{ record[column.dataIndex] || '-' }}
            </div>
          </a-tooltip>
        </template>
      </template>
    </a-table>

    <!-- 表单弹窗 -->
    <a-modal
        :title="modalTitle"
        :visible="modalVisible"
        width="50%"
        :footer="null"
        @cancel="handleModalCancel"
        :destroyOnClose="true"
    >
      <table class="table-form four-column" style="width:100%" borders="noborder">
        <colgroup>
          <col width="15%"/>
          <col width="35%"/>
          <col width="15%"/>
          <col width="35%"/>
        </colgroup>
        <tbody>
        <!-- 名称和代码行 -->
        <tr class="firstRow">
          <td style="word-break: break-all;">名称</td>
          <td>
            <a-input
                v-model:value="formData.NAME"
                placeholder="请输入名称"
                style="width:100%"
            />
          </td>
          <td style="word-break: break-all;">代码</td>
          <td>
            <a-input
                v-model:value="formData.CODE"
                placeholder="请输入代码"
                style="width:100%"
            />
          </td>
        </tr>

        <!-- 计量单位和小数显示位数行 -->
        <tr>
          <td style="word-break: break-all;">计量单位</td>
          <td>
            <a-select
                v-model:value="formData.MEASURE_UNIT"
                placeholder="请选择计量单位"
                style="width:100%"
            >
              <a-select-option value="">请选择计量单位</a-select-option>
              <a-select-option value="个">个</a-select-option>
              <a-select-option value="件">件</a-select-option>
              <a-select-option value="元">元</a-select-option>
              <a-select-option value="%">%</a-select-option>
            </a-select>
          </td>
          <td style="word-break: break-all;">小数显示位数</td>
          <td>
            <a-input-number
                v-model:value="formData.DECIMAL_PLACES"
                :min="0"
                :max="10"
                placeholder="请输入小数位数"
                style="width:100%"
            />
          </td>
        </tr>

        <!-- 衍生指标公式编辑行 -->
        <tr>
          <td style="word-break: break-all;">衍生指标公式编辑</td>
          <td colspan="3">
            <div class="formula-section">
              <div class="formula-header">
                <a-button type="primary" size="small" @click="openStatisticalDefinition">
                  设置汇总口径
                </a-button>
              </div>
              <a-textarea
                  v-model:value="formulaText"
                  placeholder="请通过'设置汇总口径'配置公式"
                  :disabled="true"
                  :rows="4"
              />
            </div>
          </td>
        </tr>

        <!-- 汇总时用不同公式行 -->
        <tr>
          <td style="word-break: break-all;">汇总时用不同公式</td>
          <td colspan="3">
            <a-textarea
                v-model:value="formData.DIFFERENT_FORMULA"
                placeholder="请输入汇总时使用的不同公式（如无则不填）"
                :rows="3"
                style="width:100%"
            />
          </td>
        </tr>

        <!-- 归属报表和标签行 -->
        <tr>
          <td style="word-break: break-all;">归属报表</td>
          <td>
            <a-select
                v-model:value="formData.BELONGING_REPORT"
                placeholder="请选择归属报表"
                style="width:100%"
                :loading="reportLoading"
            >
              <a-select-option value="">请选择归属报表</a-select-option>
              <a-select-option
                  v-for="report in reportOptions"
                  :key="report.TABLE_NUM"
                  :value="report.TABLE_NUM"
              >
                {{ report.TABLE_NAME }}
              </a-select-option>
            </a-select>
          </td>
          <td style="word-break: break-all;">标签</td>
          <td>
            <a-input
                v-model:value="formData.TAG_LABEL"
                placeholder="请输入标签"
                style="width:100%"
            />
          </td>
        </tr>
        </tbody>
      </table>

      <!-- 操作按钮 -->
      <div class="button-group" style="margin-top: 20px; text-align: center;">
        <a-button type="primary" @click="handleSubmit" style="margin-right: 10px;">提交</a-button>
        <a-button @click="handleModalCancel">取消</a-button>
      </div>
    </a-modal>

    <!-- 删除确认对话框 -->
    <a-modal
        title="确认删除"
        :visible="deleteModalVisible"
        :okText="'确认'"
        :cancelText="'取消'"
        @ok="handleDeleteConfirm"
        @cancel="deleteModalVisible = false"
    >
      <p>确定要删除选中的 {{ selectedRowKeys.length }} 条记录吗？</p>
    </a-modal>
  </div>


</template>

<script setup lang="ts">
import { ref, reactive, onMounted,defineEmits } from 'vue';
import { message } from 'ant-design-vue';
import {
  PlusOutlined,
  ReloadOutlined,
  DeleteOutlined
} from '@ant-design/icons-vue';
import {
  getDerivativeIndicatorsList,
  saveDerivativeIndicator,
  buniscGetData
} from '@/api/data-processing/index';
import StatisticalDefinition from '@/components/StatisticalDefinition/index.vue';
const emit = defineEmits(['selectColumn']);
// 表格数据
const tableData = ref<any[]>([]);
const loading = ref(false);
const selectedRowKeys = ref<(string | number)[]>([]);
const selectedRows = ref<any[]>([]);
// 公式文本
const formulaText = ref('');

// StatisticalDefinition 弹窗控制
const statisticalDefinitionVisible = ref(false);
const statisticalDefinitionRef = ref();

// 打开 StatisticalDefinition
const openStatisticalDefinition = () => {
  if (!isEdit.value) {
    // 新增模式下重置公式文本
    formulaText.value = '';
  }

  // 重置 StatisticalDefinition 组件状态
  if (statisticalDefinitionRef.value) {
    statisticalDefinitionRef.value.resetForm();
  }

  statisticalDefinitionVisible.value = true;
};

// 关闭 StatisticalDefinition
const closeStatisticalDefinition = () => {
  statisticalDefinitionVisible.value = false;
};

// 处理公式确认事件
const handleFormulaConfirm = (formula: string) => {
  formulaText.value = formula;  // 将接收到的公式设置到公式编辑框
  closeStatisticalDefinition();
};
// 添加选择列的方法
const handleSelectColumn = (record: any) => {
  console.log(record)
  // 发送选中的衍生指标数据到父组件，包括公式
  emit('selectColumn', {
    title: record.NAME,
    listNum: record.BELONGING_REPORT,
    method: 'count',
    formula: record.FORMULA_EDIT || record.formula_edit || '' // 添加公式信息
  });
  message.success('已选择该衍生指标');
};
// 报表选项数据
const reportOptions = ref<any[]>([]);
const reportLoading = ref(false);

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) =>
      `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
  pageSizeOptions: ['10', '20', '30', '50'],
   locale: {
    items_per_page: '条/页',
     jump_to:"跳至"
 }

});


// 表格列配置 - 适配返回的数据结构
const columns = ref([
  {
    title: '序号',
    dataIndex: 'index',
    key: 'index',
    width: 60,
    align: 'center'
  },
  {
    title: '名称',
    dataIndex: 'NAME',
    key: 'NAME',
    width: 120,
    ellipsis: true
  },
  {
    title: '代码',
    dataIndex: 'CODE',
    key: 'CODE',
    width: 100
  },
  {
    title: '计量单位',
    dataIndex: 'MEASURE_UNIT',
    key: 'MEASURE_UNIT',
    width: 80
  },
  {
    title: '小数位数',
    dataIndex: 'DECIMAL_PLACES',
    key: 'DECIMAL_PLACES',
    width: 80,
    align: 'center'
  },
  {
    title: '公式编辑',
    dataIndex: 'FORMULA_EDIT',
    key: 'FORMULA_EDIT',
    ellipsis: true
  },
  {
    title: '不同公式',
    dataIndex: 'DIFFERENT_FORMULA',
    key: 'DIFFERENT_FORMULA',
    ellipsis: true
  },
  {
    title: '归属报表',
    dataIndex: 'BELONGING_REPORT',
    key: 'BELONGING_REPORT',
    width: 100,
    ellipsis: true
  },
  {
    title: '标签',
    dataIndex: 'TAG_LABEL',
    key: 'TAG_LABEL',
    width: 100,
    ellipsis: true
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    width: 80,
    align: 'center',
    fixed: 'right'
  }
]);

// 表单相关数据
const modalVisible = ref(false);
const deleteModalVisible = ref(false);
const modalTitle = ref("新增衍生指标");
const formData = ref({
  ID_: '',
  NAME: '',
  CODE: '',
  MEASURE_UNIT: '',
  DECIMAL_PLACES: 2,
  FORMULA_EDIT: '',
  DIFFERENT_FORMULA: '',
  BELONGING_REPORT: '',
  TAG_LABEL: ''
});
const isEdit = ref(false);

// 加载报表数据
const loadReportData = async () => {
  try {
    reportLoading.value = true;
    const response = await buniscGetData({
      pageNo: 1,
      pageSize: 1000,
      sortField: "TABLE_NAME",
      sortOrder: "asc",
      params: {}
    });

    if (response) {
      reportOptions.value = response.data;
    }
  } catch (error) {
    console.error('获取报表数据出错:', error);
    message.error('获取报表数据失败');
  } finally {
    reportLoading.value = false;
  }
};

// 加载数据
const loadData = async () => {
  try {
    loading.value = true;
    const params = {
      pageNo: pagination.current,
      pageSize: pagination.pageSize
    };

    const response = await getDerivativeIndicatorsList(params);
    if (response) {
      tableData.value = response.data;
      pagination.total = response.totalCount || 0;
    } else {
      message.error('加载数据失败');
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
};

// 刷新数据
const handleRefresh = () => {
  pagination.current = 1;
  loadData();
};

// 行选择变化
const onSelectChange = (selectedKeys: (string | number)[], selectedRows: any[]) => {
  selectedRowKeys.value = [...selectedKeys];
  selectedRows.value = [...selectedRows];
  console.log('- Keys:', selectedKeys);
};

// 表格变化（分页、排序等）
const handleTableChange = (pag: any) => {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadData();
};

// 打开新增模态框
const handleAdd = () => {
  isEdit.value = false;
  modalTitle.value = "新增衍生指标";
  formData.value = {
    ID_: '',
    NAME: '',
    CODE: '',
    MEASURE_UNIT: '',
    DECIMAL_PLACES: 2,
    FORMULA_EDIT: '',
    DIFFERENT_FORMULA: '',
    BELONGING_REPORT: '',
    TAG_LABEL: ''
  };

  // 清空公式文本
  formulaText.value = '';

  modalVisible.value = true;
};

// 打开编辑模态框
const handleEdit = (record: any) => {
  isEdit.value = true;
  modalTitle.value = "编辑衍生指标";
  formData.value = {
    ID_: record.ID_ || '',
    NAME: record.NAME || '',
    CODE: record.CODE || '',
    MEASURE_UNIT: record.MEASURE_UNIT || '',
    DECIMAL_PLACES: record.DECIMAL_PLACES || 2,
    FORMULA_EDIT: record.FORMULA_EDIT || record.formula_edit || '', // 兼容不同字段名
    DIFFERENT_FORMULA: record.DIFFERENT_FORMULA || record.different_formula || '',
    BELONGING_REPORT: record.BELONGING_REPORT || record.belonging_report || '',
    TAG_LABEL: record.TAG_LABEL || record.tag_label || ''
  };

  // 同步公式文本
  formulaText.value = formData.value.FORMULA_EDIT;

  modalVisible.value = true;
};

// 删除操作
const handleDelete = () => {
  console.log('handleDelete called');
  console.log('Current state:', {
    selectedRowsLength: selectedRows.value.length,
    selectedRowKeys: selectedRowKeys.value,
    selectedRows: selectedRows.value
  });

  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的记录');
    return;
  }
  deleteModalVisible.value = true;
};

// 确认删除
const handleDeleteConfirm = async () => {
  try {
    // 这里需要实现实际的删除API调用
    // 假设有一个 deleteDerivativeIndicators 方法
    // await deleteDerivativeIndicators(selectedRowKeys.value);

    message.success('删除成功');
    deleteModalVisible.value = false;
    selectedRowKeys.value = [];
    selectedRows.value = [];
    handleRefresh();
  } catch (error) {
    console.error('删除失败:', error);
    message.error('删除失败');
  }
};

// 提交表单
const handleSubmit = async () => {
  // 验证逻辑
  if (!formData.value.NAME) {
    message.error('请输入名称');
    return;
  }
  if (!formData.value.CODE) {
    message.error('请输入代码');
    return;
  }
  // 同步公式文本到表单数据
  formData.value.FORMULA_EDIT = formulaText.value;
  try {
    // 构造符合后端要求的数据格式
    const submitData: any = {
      name: formData.value.NAME,
      code: formData.value.CODE,
      formula_edit: formData.value.FORMULA_EDIT,
      decimal_places: formData.value.DECIMAL_PLACES,
      // 可选字段
      measure_unit: formData.value.MEASURE_UNIT || null,
      different_formula: formData.value.DIFFERENT_FORMULA || null,
      belonging_report: formData.value.BELONGING_REPORT || null,
      tag_label: formData.value.TAG_LABEL || null,
      // 必需的固定字段
      PARENT_ID_: '0',
      TENANT_ID_: '1',
      COMPANY_ID_: '0',
      REF_ID_: '0',
      sign: '',
      CREATE_BY_: '1',
      UPDATE_BY_: '1'
    };

    // 如果是编辑，需要包含ID_
    if (formData.value.ID_) {
      submitData.ID_ = formData.value.ID_;
    }

    const response = await saveDerivativeIndicator(submitData);
    if (response.code === 200) {
      message.success(isEdit.value ? '编辑成功' : '新增成功');
      modalVisible.value = false;
      handleRefresh();
    } else {
      message.error('提交失败: ' + (response.message || '未知错误'));
    }
  } catch (error) {
    console.error('提交失败:', error);
    message.error('提交失败');
  }
};

// 关闭模态框
const handleModalCancel = () => {
  modalVisible.value = false;
};

// 初始化加载数据
onMounted(() => {
  loadData();
  loadReportData();
});

// 暴露方法给父组件
defineExpose({
  handleRefresh
});
</script>

<style scoped>
.derivative-indicators-container {
  height: 100%;
}

.list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.table-operator {
  display: flex;
  gap: 8px;
}

.table-form {
  border-collapse: collapse;
  margin: 20px 0;
}

.table-form td {
  padding: 10px;
  border: 1px solid #e5e7eb;
}

.button-group {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* 新增样式：表格单元格内容 */
.cell-content {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.empty-cell {
  color: #ccc;
}

/* 调整表格行高以更好地显示Tooltip */
:deep(.ant-table-tbody > tr > td) {
  padding: 8px;
}

/* 确保Tooltip能够显示完整内容 */
:deep(.ant-tooltip-inner) {
  max-width: 400px;
  word-break: break-all;
  white-space: pre-wrap;
}
.formula-header{
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
</style>