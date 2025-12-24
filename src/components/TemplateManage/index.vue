<template>
  <div>
    <div class="search-header">
      <div class="search-row">
        <div class="search-item">
          <a-space>
            <a-button type="link" class="link-btn" disabled style="margin-left: 2.5rem">模板查询</a-button>
            <a-input
              v-model:value="searchForm.all"
              style="width: 15rem; border-radius: 85px; font-size: 1.6rem"
              class="custom-select"
              placeholder="请输入模板名称"
            />
          </a-space>
        </div>
        <div class="search-item" style="margin-left: 1.5rem">
          <a-space>
            <a-button type="primary" class="search-btn" style="font-size: 1.6rem">
              <template #icon><SearchOutlined style="color: white" /></template>
              <span style="font-size: 1.6rem">查询</span>
            </a-button>
            <a-button class="reset-btn" style="background: rgb(20 21 34 / 100%); border: none; color: white; font-size: 1.6rem">
              <template #icon><ReloadOutlined style="color: white" /></template>
              <span style="font-size: 1.6rem">重置</span>
            </a-button>
          </a-space>
        </div>
      </div>
    </div>
    <div class="table-container">
      <div style="display: flex; align-items: center; justify-content: flex-start; margin-bottom: 10px">
        <a-button type="primary" style="background-color: black; color: white; border: none">
          <PlusOutlined style="margin-right: 6px; color: white; font-size: 14px" /><span style="font-size: 1.4rem">新增</span>
        </a-button>
        <a-button style="margin-left: 10px; background-color: black; color: white; border: none">
          <DeleteOutlined style="margin-right: 6px; color: white; font-size: 14px" /><span style="font-size: 1.4rem">删除</span>
        </a-button>
        <a-button style="margin-left: 10px; background-color: black; color: white; border: none">
          <SettingOutlined style="margin-right: 6px; color: white; font-size: 14px" /><span style="font-size: 1.4rem">设置共享地区</span>
        </a-button>
      </div>
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
        :pagination="{
          total: 320,
          pageSize: 12,
          showTotal: (total) => `共 ${total} 条`,
          showSizeChanger: true,
          locale: {
            items_per_page: '条/页',
          },
        }"
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
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup>
  import '@/assets/styles/modules/census.less';
  import '@/assets/styles/modules/searchHear.less';
  import { ref, reactive } from 'vue';
  import { SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue';

  const searchForm = reactive({
    currentReport: '611',
    reportType: '1',
    reportPeriod: '1',
    filter: '1',
    indexQuery: '1',
    notEmpty: '1',
    multiCondition: '1',
  });

  // 表格选中行的 key 数组
  const selectedRowKeys = ref([]);

  // 表格列定义
  const columns = [
    { title: '序号', dataIndex: 'index', width: 80, align: 'center' },
    { title: '模板名称', dataIndex: 'templateName', align: 'center' },
    { title: '模板说明', dataIndex: 'templateDesc', align: 'center' },
    { title: '创建时间', dataIndex: 'createTime', align: 'center' },
    { title: '创建人', dataIndex: 'creator', align: 'center' },
    {
      title: '共享地区',
      dataIndex: 'shareArea',
      align: 'center',
      key: 'shareArea',
    },
    {
      title: '默认模版',
      dataIndex: 'verifiedVersion',
      align: 'center',
      key: 'defaultTemplate', // 添加 key 用于识别该列
    },
    { title: '是否设置选项', dataIndex: 'viewSettings', align: 'center' },
    { title: '标签大类', dataIndex: 'maxValue', align: 'center' },
    { title: '标签中类', dataIndex: 'middleValue', align: 'center' },
    { title: '标签小类', dataIndex: 'minValue', align: 'center' },
  ];

  // 模拟的表格数据
  const dataSource = ref([
    {
      key: '1',
      index: 1,
      templateName: '110',
      templateDesc: 'test',
      createTime: '广州市',
      creator: '张罗意（自营）',
      shareArea: '查看',
      verifiedVersion: '非认证版本',
      viewSettings: '否',
      maxValue: 'xxxxx',
      middleValue: 'xxxxx',
      minValue: 'xxxxx',
    },
    // ... 可以添加更多数据
  ]);

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
</script>

<style scoped>
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
