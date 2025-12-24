<template>
  <div>
    <div class="search-header">
      <div class="search-row" style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px">
        <div class="search-item" style="display: flex; align-items: center">
          <span style="margin-right: 8px">制度范围</span>
          <a-select v-model:value="searchForm.systemRange" style="width: 200px; background-color: rgba(245, 245, 247, 1); border-radius: 20px" placeholder="请选择制度范围">
            <a-select-option value="">请选择制度范围</a-select-option>
            <a-select-option value="第五次全国经济普查">第五次全国经济普查</a-select-option>
          </a-select>
        </div>
        <div class="search-item" style="display: flex; align-items: center">
          <span style="margin-right: 8px">报表编码</span>
          <a-select
              v-model:value="searchForm.reportCode"
              style="width: 200px; background-color: rgba(245, 245, 247, 1); border-radius: 20px"
              placeholder="请选择报表编码"
              :loading="reportCodeLoading"
          >
            <a-select-option v-for="option in reportCodeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </a-select-option>
          </a-select>
        </div>
        <div class="search-item" style="display: flex; align-items: center">
          <span style="margin-right: 8px">指标名称</span>
          <a-input v-model:value="searchForm.indicatorName" style="width: 200px; background-color: rgba(245, 245, 247, 1); border-radius: 20px" placeholder="请输入指标名称" />
        </div>
        <div class="search-item" style="display: flex; align-items: center">
          <span style="margin-right: 8px">指标代码</span>
          <a-input v-model:value="searchForm.indicatorCode" style="width: 200px; background-color: rgba(245, 245, 247, 1); border-radius: 20px" placeholder="请输入指标代码" />
        </div>
        <div class="search-item" style="display: flex; align-items: center">
          <span style="margin-right: 8px">分类标签</span>
          <a-select v-model:value="searchForm.categoryTag" style="width: 200px; background-color: rgba(245, 245, 247, 1); border-radius: 20px" placeholder="请选择分类标签">
            <a-select-option v-for="option in categoryTagOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </a-select-option>
          </a-select>
        </div>
      </div>

      <div class="search-row" style="display: flex; gap: 12px; align-items: center">
        <div class="search-item" style="display: flex; align-items: center">
          <span style="margin-right: 8px">所属机构</span>
          <a-select v-model:value="searchForm.organization" style="width: 200px; background-color: rgba(245, 245, 247, 1); border-radius: 20px" placeholder="请选择所属机构">
            <a-select-option value="">请选择所属机构</a-select-option>
            <a-select-option value="广州市统计局">广州市统计局</a-select-option>
            <!--            <a-select-option value="广东省统计局">广东省统计局</a-select-option>-->
          </a-select>
        </div>
        <div class="search-item" style="display: flex; align-items: center">
          <span style="margin-right: 8px">创建人</span>
          <a-input v-model:value="searchForm.creator" style="width: 200px; background-color: rgba(245, 245, 247, 1); border-radius: 20px" placeholder="请输入创建人姓名" />
        </div>
        <div class="search-item" style="display: flex; align-items: center">
          <span style="margin-right: 8px">状态</span>
          <a-select v-model:value="searchForm.status" style="width: 200px; background-color: rgba(245, 245, 247, 1); border-radius: 20px" placeholder="请选择状态">
            <a-select-option value="">请选择状态</a-select-option>
            <a-select-option value="已审核">已应用</a-select-option>
            <a-select-option value="未审核">未应用</a-select-option>
          </a-select>
        </div>
        <div class="search-item" style="margin-left: auto">
          <a-space>
            <a-button type="primary" style="background-color: rgb(84 111 255); border-radius: 20px" @click="handleSearch">
              <template #icon><SearchOutlined style="color: white" /></template>
              查询
            </a-button>
            <a-button style="background-color: rgb(20 21 34); color: white; border: none; border-radius: 20px"
                      @click="handleReset">
              <template #icon><ReloadOutlined style="color: white" /></template>
              重置
            </a-button>
          </a-space>
        </div>
      </div>
    </div>

    <div style="flex: 1; background-color: white; padding: 20px 40px; border-radius: 17.08px">
      <!-- 顶部操作按钮组 -->
      <div style="display: flex; position: relative; align-items: center; gap: 8px; margin-bottom: 12px">
        <a-button type="primary" style="width: 111px; height: 29px; background-color: black; color: white; border: none"
                  @click="goBack">
          <ArrowLeftOutlined style="margin-right: 6px; color: white; font-size: 14px" />返回
        </a-button>
        <a-button type="primary" style="width: 111px; height: 29px; background-color: black; color: white; border: none"
                  @click="showAddModal">
          <PlusOutlined style="margin-right: 6px; color: white; font-size: 14px" />新增
        </a-button>
        <a-button style="height: 29px; background-color: black; color: white; border: none" @click="handleApply">
          <CopyOutlined style="margin-right: 6px; color: white; font-size: 14px" />应用
        </a-button>
        <a-button style="height: 29px; background-color: black; color: white; border: none" @click="handleBatchDelete">
          <DeleteOutlined style="margin-right: 6px; color: white; font-size: 14px" />删除
        </a-button>
        <!--        <a-button style="height: 29px; background-color: rgb(84 111 255 / 100%); color: white; border: none">-->
        <!--          <EditOutlined style="margin-right: 6px; color: white; font-size: 14px" />编辑-->
        <!--        </a-button>-->
        <div class="rightSearch">
          <a-select style="width: 220px; margin-right: 15px; background-color: rgba(245, 245, 247, 1); border-radius: 20px" placeholder="请选择显示方案模板">
            <a-select-option value="1">模板1</a-select-option>
          </a-select>
          <!--          <a-button style="height: 29px; background-color: black; color: white; border: none" @click="showTemplateManage">-->
          <!--            <SettingOutlined style="margin-right: 6px; color: white; font-size: 14px" />设置显示图标-->
          <!--          </a-button>-->
        </div>
      </div>
      <!-- 表格 -->
      <a-table
          :columns="columns"
          :data-source="tableData"
          :row-selection="rowSelection"
          :loading="loading"
          :pagination="{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条数据`
          }"
          @change="handlePaginationChange"
          bordered
          size="small"
          :row-class-name="() => 'custom-row-height'"
          :row-key="record => record.key || record.ID"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" class="edit-btn" @click="handleEdit(record)">
                <template #icon><EditOutlined style="color: #52c41a" /></template>
                <span style="color: #52c41a">修改</span>
              </a-button>
              <a-button type="link" class="delete-btn" @click="handleDelete(record)">
                <template #icon><DeleteOutlined style="color: #ff4d4f" /></template>
                <span style="color: #ff4d4f">删除</span>
              </a-button>
            </a-space>
          </template>
          <template v-if="column.key === 'status'">
            <a-switch v-model:checked="record.status" />
          </template>
        </template>
      </a-table>
    </div>
  </div>

  <AddIndicatorModal
      v-model:visible="addModalVisible"
      :editing-data="editingData"
      @saved="handleIndicatorSaved"
      @cancel="handleIndicatorCancel"
  />
</template>

<script setup>
import '@/assets/styles/modules/searchHear.less';
import { ref, reactive, onMounted, computed, defineEmits } from 'vue';
import {
  SearchOutlined,
  ReloadOutlined,
  CopyOutlined,
  SettingOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import AddIndicatorModal from './AddIndicatorModal/index.vue';
import { getDerivativeIndicatorsList, saveDerivativeIndicator, removeDerivativeIndicator, buniscGetData } from '@/api/data-processing/index';

const searchForm = reactive({
  systemRange: '', // 制度范围
  reportCode: '', // 报表编码
  indicatorName: '', // 指标名称
  indicatorCode: '', // 指标代码
  organization: '', // 所属机构
  creator: '', // 创建人
  status: '', // 状态
  categoryTag: '', // 分类标签
});

// 报表编码选项和加载状态
const reportCodeOptions = ref([{ value: '', label: '请选择报表编码' }]);
const reportCodeLoading = ref(false);

// 分类标签选项
const categoryTags = ref(new Set());
const categoryTagOptions = ref([{ value: '', label: '请选择分类标签' }]);

// 获取报表编码选项 - 支持分页获取全部数据
const fetchReportCodeOptions = async () => {
  reportCodeLoading.value = true;
  try {
    const uniqueReports = new Map();
    let currentPage = 1;
    const pageSize = 100; // 设置一个合理的页大小
    let hasMoreData = true;

    // 分页获取所有数据
    while (hasMoreData) {
      const response = await buniscGetData({
        pageNo: currentPage,
        pageSize: pageSize,
        params: { Q_TABLE_NO_S_LK: "" }
      });

      console.log("报表数据:", response.data);
      if (response.data) {
        response.data.forEach((item) => {
          if (item.TABLE_NUM) {
            uniqueReports.set(item.TABLE_NUM, item.TABLE_NUM);
          }
        });

        // 判断是否还有更多数据
        hasMoreData = response.data.length === pageSize;
        currentPage++;
      } else {
        hasMoreData = false;
      }
    }

    // 转换为选项格式，保留请选择选项
    const newOptions = [{ value: '', label: '请选择报表编码' }];
    uniqueReports.forEach((value) => {
      newOptions.push({ value, label: value });
    });

    reportCodeOptions.value = newOptions;
    console.log("报表编码选项:", reportCodeOptions.value);
  } catch (error) {
    console.error('获取报表编码失败:', error);
    // 错误处理：保持默认选项
    if (reportCodeOptions.value.length <= 1) {
      reportCodeOptions.value = [
        { value: '', label: '请选择报表编码' },
        { value: '611', label: '611' },
        { value: '601', label: '601' }
      ];
    }
  } finally {
    reportCodeLoading.value = false;
  }
};

// 分页参数
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
});
const addModalVisible = ref(false);
const editingData = ref(null); // 用于存储正在编辑的数据

// 显示新增模态框
const showAddModal = () => {
  editingData.value = null; // 清空编辑数据
  addModalVisible.value = true;
};

// 处理指标保存
const handleIndicatorSaved = async (indicatorData) => {
  try {
    // 转换数据格式为API要求的格式
    const transformedData = {
      name: indicatorData.name,
      code: indicatorData.code,
      measure_unit: indicatorData.unit,
      decimal_places: indicatorData.decimalPlaces,
      different_formula: indicatorData.summaryFormula,
      formula_edit: indicatorData.formula,
      belonging_report: indicatorData.report,
      tag_label: indicatorData.tags ? indicatorData.tags.join(',') : ''
    };

    // 如果是编辑模式，添加ID参数和UPDATE_VERTION字段
    if (editingData.value) {
      // 使用与后端API匹配的参数名称
      transformedData.ID_ = editingData.value.ID_;
      transformedData.UPDATE_VERSION_ = (editingData.value.UPDATE_VERSION_ || 1);
    }

    console.log('转换后的指标数据:', transformedData);

    // 调用API保存指标
    const response = await saveDerivativeIndicator(transformedData);

    console.log('保存指标响应:', response);

    // 显示成功消息
    message.success(editingData.value ? '衍生指标修改成功' : '衍生指标新增成功');

    // 刷新列表
    fetchData();

  } catch (error) {
    console.error('保存指标失败:', error);
    message.error('衍生指标新增失败，请重试');
  }
};

// 处理取消操作
const handleIndicatorCancel = () => {
  console.log('取消新增指标');
};

// 修改 columns 定义
const columns = ref([
  {
    title: '序号',
    dataIndex: 'PAGEHELPER_ROW_ID',
    width: 60,
    align: 'center',
  },
  {
    title: '衍生指标代码',
    dataIndex: 'CODE',
    align: 'center',
  },
  {
    title: '衍生指标名称',
    dataIndex: 'NAME',
    align: 'center',
  },
  {
    title: '分类标签',
    dataIndex: 'processedTags',
    align: 'center',
    customRender: ({ record }) => {
      // 如果有原始的TAG_LABEL，可以考虑添加提示或鼠标悬停效果
      return record.processedTags || record.TAG_LABEL || '-';
    }
  },
  {
    title: '创建机构',
    dataIndex: 'organization',
    align: 'center',
  },
  {
    title: '创建人',
    dataIndex: 'CREATE_BY_NAME',
    align: 'center',
  },
  {
    title: '指标来源',
    dataIndex: 'BELONGING_REPORT',
    align: 'center',
  },
  {
    title: '状态',
    dataIndex: 'status',
    align: 'center',
    key: 'status',
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    align: 'center',
    fixed: 'right',
  },
]);

// 指标列表数据
const tableData = ref([]);
const originalData = ref([]); // 保存原始数据，用于前端过滤
const selectedRowKeys = ref([]);

const rowSelection = computed(() => {
  return {
    type: 'checkbox',
    selectedRowKeys: selectedRowKeys.value,
    onChange: (selectedRowKeysVal) => {
      selectedRowKeys.value = selectedRowKeysVal;
      console.log('选中的行:', selectedRowKeys.value);
    }
  };
});

// 加载状态
const loading = ref(false);

// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    // 构建查询参数
    const params = {
      pageNum: 1, // 前端分页，所以只需要第1页
      pageSize: 1000, // 获取足够多的数据用于前端过滤
    };

    console.log('查询参数:', params);

    // 调用实际API
    const response = await getDerivativeIndicatorsList(params);
    console.log('数据', response);
    if (response && response.data) {
      // 处理数据并保存到原始数据中
      originalData.value = (response.data || []).map((item, index) => {
        // 处理TAG_LABEL，拆分并总结标签
        let processedTags = item.TAG_LABEL || '';
        if (processedTags && typeof processedTags === 'string') {
          // 拆分标签
          const tagArray = processedTags.split(',').filter(tag => tag.trim());
          if (tagArray.length > 0) {
            // 如果标签数量较少（<=3），直接显示所有标签
            if (tagArray.length <= 3) {
              processedTags = tagArray.join('、'); // 使用顿号分隔
            } else {
              // 如果标签数量较多，显示前3个并提示总数
              processedTags = `${tagArray.slice(0, 3).join('、')} 等${tagArray.length}个标签`;
            }

            // 将标签添加到集合中以确保唯一性
            tagArray.forEach(tag => {
              if (tag.trim()) {
                categoryTags.value.add(tag.trim());
              }
            });
          }
        }

        return {
          ...item,
          key: item.ID || `row-${index}-${Date.now()}`, // 确保有唯一的key
          status: item.status || true, // 确保状态字段存在
          organization: "广州市统计局",
          processedTags // 添加处理后的标签字段用于显示
        };
      });

      // 更新分类标签选项
      updateCategoryTagOptions();

      // 应用前端过滤
      applyFrontendFilter();
    } else {
      tableData.value = [];
      originalData.value = [];
      pagination.total = 0;
    }

    console.log('查询结果:', tableData.value);
  } catch (error) {
    console.error('查询衍生指标失败:', error);
    message.error('查询衍生指标失败，请稍后重试');
    tableData.value = [];
    originalData.value = [];
    pagination.total = 0;
  } finally {
    loading.value = false;
  }
};

// 前端过滤函数
const applyFrontendFilter = () => {
  let filtered = [...originalData.value];

  // 应用过滤条件
  if (searchForm.systemRange) {
    filtered = filtered.filter(item => item.systemRange === searchForm.systemRange);
  }

  if (searchForm.reportCode) {
    filtered = filtered.filter(item =>
        item.BELONGING_REPORT &&
        item.BELONGING_REPORT.includes(searchForm.reportCode)
    );
  }

  if (searchForm.indicatorName) {
    filtered = filtered.filter(item =>
        item.NAME && item.NAME.includes(searchForm.indicatorName)
    );
  }

  if (searchForm.indicatorCode) {
    filtered = filtered.filter(item =>
        item.CODE && item.CODE.includes(searchForm.indicatorCode)
    );
  }

  if (searchForm.categoryTag) {
    filtered = filtered.filter(item =>
        item.TAG_LABEL && item.TAG_LABEL.includes(searchForm.categoryTag)
    );
  }

  if (searchForm.organization) {
    filtered = filtered.filter(item => item.organization === searchForm.organization);
  }

  if (searchForm.creator) {
    filtered = filtered.filter(item =>
        item.CREATE_BY_NAME && item.CREATE_BY_NAME.includes(searchForm.creator)
    );
  }

  if (searchForm.status) {
    filtered = filtered.filter(item => item.status === (searchForm.status === '已审核'));
  }

  // 更新分页总数
  pagination.total = filtered.length;

  // 应用分页
  const startIndex = (pagination.current - 1) * pagination.pageSize;
  const endIndex = startIndex + pagination.pageSize;
  tableData.value = filtered.slice(startIndex, endIndex);
};

// 更新分类标签选项
const updateCategoryTagOptions = () => {
  const newOptions = [{ value: '', label: '请选择分类标签' }];
  categoryTags.value.forEach(tag => {
    newOptions.push({ value: tag, label: tag });
  });
  categoryTagOptions.value = newOptions;
  console.log('分类标签选项:', categoryTagOptions.value);
};

// 初始化加载数据
onMounted(() => {
  fetchData();
  fetchReportCodeOptions();
});
updateCategoryTagOptions();

// 处理编辑
const handleEdit = (record) => {
  console.log('修改记录:', record);
  // 存储正在编辑的数据
  editingData.value = {
    ...record,
    tags: record.TAG_LABEL ? record.TAG_LABEL.split(',') : []
  };
  // 打开模态框
  addModalVisible.value = true;
};

// 单个删除
const handleDelete = (record) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除「${record.NAME}」吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        loading.value = true;
        await removeDerivativeIndicator({
          alias: 'derivative_indicators',
          id: record.ID_
        });
        message.success('删除成功');
        // 重新获取数据以确保列表最新
        fetchData();
        // 从选中项中移除已删除的项
        selectedRowKeys.value = selectedRowKeys.value.filter(key => key !== record.key);
      } catch (error) {
        console.error('删除失败:', error);
        message.error('删除失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    }
  });
};

// 批量删除
const handleBatchDelete = async () => {
  // 修复：直接使用 selectedRowKeys.value，不需要再取 .value
  const currentSelected = selectedRowKeys.value;
  console.log('执行批量删除，当前选中的行:', currentSelected);

  if (currentSelected.length === 0) {
    message.warning('请先选择要删除的记录');
    return;
  }

  Modal.confirm({
    title: '批量删除',
    content: `确定要删除选中的 ${currentSelected.length} 条记录吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        loading.value = true;
        // 获取选中的记录对象
        const selectedRecords = tableData.value.filter(item =>
            currentSelected.includes(item.key)
        );

        // 批量删除
        for (const record of selectedRecords) {
          await removeDerivativeIndicator({
            alias: 'derivative_indicators',
            id: record.ID_
          });
        }

        const deleteCount = selectedRecords.length;
        message.success(`成功删除 ${deleteCount} 条记录`);

        // 清空选中状态
        selectedRowKeys.value = [];

        // 重新获取数据以确保列表最新
        fetchData();
      } catch (error) {
        console.error('批量删除失败:', error);
        message.error('批量删除失败，请稍后重试');
      } finally {
        loading.value = false;
      }
    }
  });
};

// 查询操作
const handleSearch = () => {
  // 重置为第一页
  pagination.current = 1;
  selectedRowKeys.value = []; // 清空选中状态
  applyFrontendFilter(); // 应用前端过滤
};

// 重置
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = '';
  });
  pagination.current = 1;
  selectedRowKeys.value = []; // 清空选中状态
  applyFrontendFilter(); // 应用前端过滤
};

// 分页变化处理
const handlePaginationChange = (current, pageSize) => {
  pagination.current = current;
  pagination.pageSize = pageSize;
  selectedRowKeys.value = []; // 清空选中状态
  applyFrontendFilter(); // 应用前端过滤
};

// 定义emit事件
const emit = defineEmits(['goBack', 'showTemplateManage', 'applyIndicators']);

// 应用选中的衍生指标
const handleApply = () => {
  let selectedData = [];

  // 如果有选中的指标，收集选中指标的数据
  if (selectedRowKeys.value.length > 0) {
    const selectedIndicators = tableData.value.filter(item =>
        selectedRowKeys.value.includes(item.key)
    );

    // 收集需要传递的数据：公式、汇总公式和报表编码
    selectedData = selectedIndicators.map(indicator => ({
      formula: indicator.FORMULA_EDIT || indicator.formula_edit,              // 衍生指标公式
      summaryFormula: indicator.DIFFERENT_FORMULA || indicator.different_formula, // 汇总公式
      reportCode: indicator.BELONGING_REPORT    // 报表编码
    }));
  }

  console.log('应用的衍生指标数据:', selectedData);

  emit('applyIndicators', selectedData);
};

// 返回displayMetrics
const goBack = () => {
  try {
    // 使用emit事件通知父组件返回displayMetrics
    emit('goBack');
    console.log('触发返回事件');
  } catch (error) {
    console.error('返回失败:', error);
  }
};

// 显示模板管理页面
const showTemplateManage = () => {
  try {
    // 使用emit事件通知父组件显示TemplateManage页面
    emit('showTemplateManage');
    console.log('触发显示模板管理页面事件');
  } catch (error) {
    console.error('显示模板管理页面失败:', error);
  }
};
</script>

<style scoped>
.search-header {
  background-color: white;
  padding: 20px;
  border-radius: 0 0 17.08px;
  margin-bottom: 16px;
}

.search-row {
  margin-bottom: 16px;
}

.search-row:last-child {
  margin-bottom: 0;
}

/* 修改标签文字样式 */
.search-item span {
  color: rgb(113 113 113 / 100%);
  font-size: 16px;
  white-space: nowrap;
}

/* 修改输入框和选择框样式为椭圆形 */
:deep(.ant-select-selector) {
  border-radius: 20px !important;
  background: rgba(245, 245, 247, 1) !important;
  border: none !important;
}

:deep(.ant-input) {
  border-radius: 20px !important;
  background: rgba(245, 245, 247, 1) !important;
  border: none !important;
}

/* 修改按钮样式为椭圆形 */
:deep(.ant-btn) {
  border-radius: 20px !important;
}

/* 修改placeholder文字颜色 */
:deep(.ant-select-selection-placeholder) {
  color: rgb(55 55 55 / 100%) !important;
}

/* 修改选择框中已选择的文字颜色 */
:deep(.ant-select-selection-item) {
  color: rgb(55 55 55 / 100%) !important;
}

/* 表格行高度样式 */
:deep(.custom-row-height) {
  height: 3.6rem;
}

/* 表格头部样式 */
:deep(.ant-table-thead > tr > th) {
  background-color: #f5f5f5;
  font-size: 1.8rem;
  font-weight: 500;
  text-align: center;
  padding: 0 !important;
  height: 3.6rem;
  line-height: 3.6rem;
}

/* 表格单元格样式 */
:deep(.ant-table-tbody > tr > td) {
  text-align: center;
  padding: 0 !important;
  height: 3.6rem;
  line-height: 3.6rem;
  font-size: 1.4rem;
}

/* 操作按钮样式 */
.edit-btn,
.delete-btn {
  padding: 0;
  height: 36px;
  display: inline-flex;
  align-items: center;
}

/* 开关样式 */
:deep(.ant-switch) {
  margin: 0 auto;
}

/* 右侧搜索区域样式 */
.rightSearch {
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
}

/* 按钮组样式 */
.ant-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 表格容器样式 */
.table-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}
</style>