<template>
  <div>
    <div class="search-header">
      <div class="search-row">

        <div class="search-item" style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
          <div style="display: flex; align-items: center;">
            <a-button type="link" class="link-btn" disabled style="margin-left: 2.5rem">模板查询</a-button>
            <a-input
                v-model:value="localSearchValue"
                style="width: 15rem; border-radius: 85px; font-size: 1.6rem; margin-left: 1px; border: 1px solid #f0f0f0; background-color: #f0f0f0"
                class="custom-select"
                placeholder="请输入模板名称"
            />
            <a-space style="margin-left: 1rem">
              <a-button type="primary" class="search-btn" style="font-size: 1.6rem; padding-bottom: 30px; background-color: #546fff" @click="handleSearch">
                <template #icon><SearchOutlined style="color: white" /></template>
                <span style="font-size: 1.6rem">查询</span>
              </a-button>
              <a-button class="reset-btn" style="background: rgb(20 21 34 / 100%); border: none; color: white; font-size: 1.6rem;padding-bottom: 30px" @click="handleReset">
                <template #icon><ReloadOutlined style="color: white" /></template>
                <span style="font-size: 1.6rem">重置</span>
              </a-button>
            </a-space>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="font-size: 1.6rem;">当前报表:{{ tableId }} {{ tableName || searchForm.currentReport }} </span>
          </div>
        </div>
      </div>
    </div>
    <div class="table-container">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px">
        <div>
          <!--          <a-button type="primary" style="background-color: black; color: white; border: none">-->
          <!--            <PlusOutlined style="margin-right: 6px; color: white; font-size: 14px" /><span style="font-size: 1.4rem">新增</span>-->
          <!--          </a-button>-->
          <a-button style="margin-left: 10px; background-color: black; color: white; border: none" @click="handleDelete">
            <DeleteOutlined style="margin-right: 6px; color: white; font-size: 14px" /><span style="font-size: 1.4rem">删除</span>
          </a-button>
        </div>
        <a-button class="back-btn" style="background-color: black; color: white; border: none;  border-radius: 20px; padding-bottom: 30px" @click="handleBack">
          <LeftOutlined style="margin-right: 6px; color: white; font-size: 14px; " /><span style="font-size: 1.4rem;">返回</span>
        </a-button>
      </div>
      <a-table
          :columns="columns"
          :data-source="dataSource"
          :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
          :pagination="pagination"
          :loading="loading"
          @change="handlePaginationChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button type="link" class="link-btn">查看</a-button>
            </a-space>
          </template>
          <template v-else-if="column.key === 'shareArea'">
            <a class="share-area-link" @click="handleShareAreaClick(record)">{{ record.shareArea }}</a>
          </template>
          <template v-else-if="column.key === 'defaultTemplate'">
            <a class="share-area-link" @click="handleDefaultTemplateClick(record)">{{ record.verifiedVersion }}</a>
          </template>
          <template v-else-if="column.key === 'operation'">
            <a-space>
              <a-button type="link" class="link-btn" @click="handleEdit(record)" style="color: #52c41a">
                <template #icon><EditOutlined style="color: #52c41a" /></template>
                修改
              </a-button>
              <a-button type="link" class="link-btn" danger @click="handleDeleteSingle(record)">
                <template #icon><DeleteOutlined style="color: #ff4d4f" /></template>
                删除
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <!-- 查询模板模态框 -->
      <QueryTemplateModal
          v-model:visible="queryTemplateModalVisible"
          :initial-data="currentEditData"
          :query-conditions="{}"
          @save="handleTemplateSave"
      />
    </div>
  </div>
</template>

<script setup>
import '@/assets/styles/modules/census.less';
import '@/assets/styles/modules/searchHear.less';
import { ref, defineProps, defineEmits, onMounted, reactive } from 'vue';
import { SearchOutlined, ReloadOutlined, LeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';
import { getDataConditionQueryTemplateList, removeDataConditioonTemplate, saveDataConditionQueryTemplate } from '@/api/data-processing';
import { message } from 'ant-design-vue';

import router from '@/router';
import QueryTemplateModal from '../QueryTemplateModal/index.vue';

// 定义props以接收searchForm数据
const props = defineProps({
  searchForm: {
    type: Object,
    required: true,
    default: () => ({
      currentReport: '',
      reportType: '1',
      reportPeriod: '1',
      filter: '1',
      indexQuery: '1',
      notEmpty: '1',
      multiCondition: '1',
      all: ''
    })
  },
  tableName: {
    type: String,
    default: ''
  },
  tableId: {
    type: String,
    default: ''
  }
});

// 定义emit事件（保留emit机制，同时使用router返回）
const emit = defineEmits(['back']);

// 返回方法
const handleBack = () => {
  // 只触发emit事件，由父组件控制返回逻辑
  emit('back');
};

// 表格选中行的 key 数组
const selectedRowKeys = ref([]);

// 本地搜索值，不使用父组件传递的searchForm.all
const localSearchValue = ref('');

// 模态框相关状态
const queryTemplateModalVisible = ref(false);
// 当前编辑的模板数据
const currentEditData = ref(null);

// 表格列定义
const columns = [
  { title: '序号', dataIndex: 'index', width: 80, align: 'center' },
  { title: '模板名称', dataIndex: 'templateName', align: 'center' },
  { title: '模板描述', dataIndex: 'templateDesc', align: 'center' },
  { title: '创建人', dataIndex: 'creator', align: 'center' },
  {
    title: '常用模板',
    dataIndex: 'is_used',
    align: 'center',
    customRender: ({text}) => {
      // 处理字符串和数字两种情况
      const value = String(text);
      if (value === '1') return '是';
      if (value === '2') return '否';
      return text;
    }
  },
  {
    title: '是否设置共享',
    dataIndex: 'is_shared',
    align: 'center',
    customRender: ({text}) => {
      // 处理字符串和数字两种情况
      const value = String(text);
      if (value === '1') return '是';
      if (value === '2') return '否';
      return text;
    }
  },
  {
    title: '操作',
    key: 'operation',
    align: 'center',
    width: 120,
  },
];

// 分页数据
const pagination = reactive({
  pageNo: 1,
  pageSize: 12,
  total: 0,
  showTotal: (total) => `共 ${total} 条`,
  showSizeChanger: true,
  locale: {
    items_per_page: '条/页',
  },
});

// 表格数据
const dataSource = ref([]);

// 加载状态
const loading = ref(false);

// 获取模板数据
const getTemplateList = async () => {
  try {
    loading.value = true;
    const response = await getDataConditionQueryTemplateList({
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      sortField: '',
      sortOrder: '',
      params: {
        Q_TEMPLATE_NAME_S_LK: localSearchValue.value || '',
      }
    });
    if (response.data) {
      dataSource.value = response.data.map((item, index) => ({
        key: item.id || item.ID_,
        index: (pagination.pageNo - 1) * pagination.pageSize + index + 1,
        templateName: item.template_name || item.TEMPLATE_NAME,
        templateDesc: item.template_desc || item.TEMPLATE_DESC,
        creator: item.creator || item.CREATE_BY_NAME || item.cjr,
        is_shared: item.is_share || item.IS_SHARE,
        is_used: item.is_used || item.IS_USED,
        verifiedVersion: item.verified_version || item.VERIFIED_VERSION,
        createTime: item.create_time || item.CREATE_TIME,
        UPDATE_VERSION_: item.update_version || item.UPDATE_VERSION_,
      })) || [];
      pagination.total = response.data.total || 0;
    } else {
      message.error('获取模板数据失败');
    }
  } catch (error) {
    console.error('获取模板数据失败:', error);
    message.error('获取模板数据失败');
  } finally {
    loading.value = false;
  }
};

// 分页变化处理
const handlePaginationChange = (page, pageSize) => {
  pagination.pageNo = page;
  pagination.pageSize = pageSize;
  getTemplateList();
};

// 搜索功能
const handleSearch = () => {
  pagination.pageNo = 1;
  getTemplateList();
};

// 重置功能
const handleReset = () => {
  // 重置本地搜索条件
  localSearchValue.value = '';
  pagination.pageNo = 1;
  getTemplateList();
};

// 组件挂载时获取数据
onMounted(() => {
  getTemplateList();
});

// 选择表格行时的回调
const onSelectChange = (newSelectedRowKeys) => {
  selectedRowKeys.value = newSelectedRowKeys;
};

const handleShareAreaClick = (record) => {
  // 在这里处理点击事件
  console.log('点击了共享地区:', record);
};

const handleDefaultTemplateClick = (record) => {
  // 在这里处理默认模版的点击事件
  console.log('点击了默认模版:', record);
};

// 删除模板功能
const handleDelete = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要删除的模板');
    return;
  }

  try {
    loading.value = true;
    // 遍历选中的模板ID并逐个删除
    for (const id of selectedRowKeys.value) {
      await removeDataConditioonTemplate(id);
    }
    message.success('删除成功');
    // 清空选中的行
    selectedRowKeys.value = [];
    // 刷新数据列表
    getTemplateList();
  } catch (error) {
    console.error('删除模板失败:', error);
    message.error('删除失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 修改模板功能
const handleEdit = (record) => {
  // 设置当前编辑的数据，转换格式为模态框需要的格式
  currentEditData.value = {
    name: record.templateName,
    description: record.templateDesc,
    shared: record.is_shared === '1' ? '是' : '否',
    isCommon: record.is_used === '1' ? '是' : '否',
    creator: record.creator,
    ID_: record.key, // 保存模板ID
    UPDATE_VERSION_: record.UPDATE_VERSION_ || 0 // 保存版本号，如果没有则设为0
  };
  // 打开模态框
  queryTemplateModalVisible.value = true;
};

// 单个删除模板功能
const handleDeleteSingle = async (record) => {
  try {
    loading.value = true;
    await removeDataConditioonTemplate(record.key);
    message.success('删除成功');
    // 刷新数据列表
    getTemplateList();
  } catch (error) {
    console.error('删除模板失败:', error);
    message.error('删除失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 处理模板保存事件
const handleTemplateSave = async (data) => {
  try {
    loading.value = true;

    // 构建保存参数
    const saveParams = {
      templateName: data.formData.name,
      templateDesc: data.formData.description,
      is_share: data.formData.shared,
      is_used: data.formData.isCommon,
      cjr: data.formData.creator,
      ...data.queryConditions,
    };

    // 如果是修改模式，添加ID_和UPDATE_VERSION_参数
    if (currentEditData.value) {
      saveParams.ID_ = currentEditData.value.ID_;
      // 根据UPDATE_VERSION_的值设置，如果为空或0则设为1，否则使用当前值
      saveParams.UPDATE_VERSION_ = currentEditData.value.UPDATE_VERSION_ ? currentEditData.value.UPDATE_VERSION_ : 1;
    }

    // 调用保存API
    await saveDataConditionQueryTemplate(saveParams);

    message.success('保存成功');
    // 关闭模态框
    queryTemplateModalVisible.value = false;
    // 刷新数据列表
    getTemplateList();
  } catch (error) {
    console.error('保存模板失败:', error);
    message.error('保存失败，请重试');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.search-btn, .reset-btn{
  border-radius: 20px;
}

:deep(.ant-input::placeholder) {
  color: black !important;
}

.table-container {
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

:deep(.ant-table) {
  background: transparent;
}

/* 设置表格行高 */
:deep(.ant-table-thead > tr > th) {
  text-align: center;
  height: 3.6rem;
  padding: 0 !important; /* 移除默认内边距以确保精确高度 */
  line-height: 3.6rem; /* 确保文字垂直居中 */
  font-size: 1.8rem;
  font-weight: 500;
}

:deep(.ant-table-tbody > tr > td) {
  text-align: center;
  height: 3.6rem;
  padding: 0 !important;
  font-size: 1.4rem;
  line-height: 3.6rem;
}

.link-btn {
  padding: 0;
}

:deep(.ant-pagination-total-text) {
  font-size: 1.4rem;
}

:deep(.ant-pagination-item-link) {
  font-size: 1.4rem;
}

:deep(.ant-pagination-item-ellipsis) {
  font-size: 1.4rem;
}

/* 共享地区列的样式 */
.share-area-link {
  color: #1890ff;
  cursor: pointer;
}

.share-area-link:hover {
  text-decoration: underline;
}

/* 确保表格内容居中 */
:deep(.ant-table-thead > tr > th),
:deep(.ant-table-tbody > tr > td) {
  text-align: center;
}

:deep(.ant-btn) {
  padding: 0.4rem 1.5rem;
}
</style>
