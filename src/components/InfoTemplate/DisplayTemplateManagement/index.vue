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
              <a-button class="reset-btn" style="background: rgb(20 21 34 / 100%); border: none; color: white; font-size: 1.6rem; padding-bottom: 30px" @click="handleReset">
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
          <!-- <a-button type="primary" style="background-color: black; color: white; border: none; padding-bottom: 30px">
            <PlusOutlined style="margin-right: 6px; color: white; font-size: 14px" /><span style="font-size: 1.4rem">新增</span>
          </a-button> -->
          <a-button style="margin-left: 10px; background-color: black; color: white; border: none; padding-bottom: 30px" @click="handleDelete">
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
            {{ record.shareArea }}
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

      <!-- 保存模板模态框 -->
      <SaveTemplateModal
          :visible="saveTemplateModalVisible"
          :initial-data="currentEditData"
          :title="currentEditData ? '修改显示模板' : '保存显示模板'"
          @update:visible="saveTemplateModalVisible = $event"
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
import { getDataQueryTemplateList, removeDataQueryTemplate, saveDataQueryTemplate } from '@/api/data-processing';
import SaveTemplateModal from '../../DisplayMetrics.vue/SaveTemplateModal/index.vue';

import { message } from 'ant-design-vue';

import router from '@/router';

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

// 表格列定义
const columns = [
  { title: '序号', dataIndex: 'index', width: 80, align: 'center' },
  { title: '模板名称', dataIndex: 'templateName', align: 'center' },
  { title: '模板说明', dataIndex: 'templateDesc', align: 'center' },
  { title: '创建人', dataIndex: 'creator', align: 'center' },
  {
    title: '共享',
    dataIndex: 'shareArea',
    align: 'center',
    key: 'shareArea',
  },
  {
    title: '操作',
    key: 'operation',
    align: 'center',
    width: 120,
  },
];
const localSearchValue = ref('');
// 表格数据
const dataSource = ref([]);

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

// 加载状态
const loading = ref(false);

// 模态框相关变量
const saveTemplateModalVisible = ref(false);
const currentEditData = ref(null);

// 获取模板数据
const getTemplateList = async () => {
  try {
    loading.value = true;
    const response = await getDataQueryTemplateList({
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
        shareArea: (item.IS_SET_PUBLIC || item.IS_SET_PUBLIC === 'ture' || item.IS_SET_PUBLIC === 'TURE') ? '是' : '否', // 根据实际数据结构调整
        verifiedVersion: item.verified_version || item.VERIFIED_VERSION || '非认证版本',
        UPDATE_VERSION_: item.UPDATE_VERSION_,
        query_condition: item.QUERY_CONDITIONS,
      })) || [];
      pagination.total = response.total || 0;
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



const handleDefaultTemplateClick = (record) => {
  // 在这里处理默认模版的点击事件
  console.log('点击了默认模版:', record);
};

// 编辑模板方法
const handleEdit = (record) => {
  currentEditData.value = {
    name: record.templateName,
    description: record.templateDesc,
    shared: record.shareArea === '是' ? '是' : '否',
    creator: record.creator,
    ID_: record.key, // 保存模板ID
    UPDATE_VERSION_: record.UPDATE_VERSION_
  };
  saveTemplateModalVisible.value = true;
};

// 删除模板功能（批量）
const handleDelete = async () => {
  // 校验是否选择了行
  if (selectedRowKeys.value.length === 0) {
    message.warning('请先选择要删除的模板');
    return;
  }

  try {
    loading.value = true;
    // 批量删除选中的模板
    for (const id of selectedRowKeys.value) {
      await removeDataQueryTemplate(id);
    }
    // 删除成功后显示提示
    message.success('删除成功');
    // 清空选中的行
    selectedRowKeys.value = [];
    // 刷新数据列表
    getTemplateList();
  } catch (error) {
    console.error('删除模板失败:', error);
    message.error('删除模板失败');
  } finally {
    loading.value = false;
  }
};

// 单条删除模板功能
const handleDeleteSingle = async (id) => {
  try {
    loading.value = true;
    console.log(id)
    await removeDataQueryTemplate(id.key);
    message.success('删除成功');
    getTemplateList();
  } catch (error) {
    console.error('删除模板失败:', error);
    message.error('删除模板失败');
  } finally {
    loading.value = false;
  }
};

// 保存模板修改
const handleTemplateSave = async (data) => {
  try {
    loading.value = true;

    // 构建保存参数
    const saveParams = {
      template_name: data.formData.name,
      template_desc: data.formData.description,
      is_set_public: data.formData.shared === '是',
      creator: data.formData.creator,
      ID_: currentEditData.value.ID_, // 模板ID
      UPDATE_VERSION_: currentEditData.value.UPDATE_VERSION_ || 1 // 更新版本，为空则设为1
    };

    // 调用保存API
    await saveDataQueryTemplate(saveParams);

    // 保存成功
    message.success('模板修改成功');

    // 关闭模态框
    saveTemplateModalVisible.value = false;

    // 刷新模板列表
    getTemplateList();
  } catch (error) {
    console.error('修改模板失败:', error);
    message.error('修改模板失败');
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
