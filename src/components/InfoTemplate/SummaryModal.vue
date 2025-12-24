<!-- src/components/InfoTemplate/SummaryModal.vue -->
<template>
  <a-modal :open="visible" title="常用汇总口径" @ok="handleOk" @cancel="handleCancel" :footer="null" width="600px" :mask-closable="true">
    <div class="summary-container">
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :pagination="false"
        size="small"
        :row-selection="{ type: 'checkbox', selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
      >
        <template #bodyCell="{ column, text }">
          <template v-if="column.dataIndex === 'name'">
            <span>{{ text }}</span>
          </template>
        </template>
      </a-table>
    </div>
  </a-modal>
</template>

<script setup>
  import { ref } from 'vue';

  const props = defineProps({
    visible: '',
})

  const emit = defineEmits(['update:visible']);

  const selectedRowKeys = ref([]);

  const columns = [
    {
      title: '代码',
      dataIndex: 'code',
      width: '100px',
    },
    {
      title: '名称',
      dataIndex: 'name',
      ellipsis: true,
    },
  ];

  const dataSource = [
    {
      key: '1',
      code: 'rkcrs',
      name: '普查中心单位汇总口径（普查单位口径的单位数据汇总标记）',
    },
    {
      key: '2',
      code: 'rkcrs',
      name: '普查中心单位汇总口径（普查单位口径的单位数据汇总标记）',
    },
    {
      key: '3',
      code: 'rkcrs',
      name: '普查中心单位汇总口径（普查单位口径的单位数据汇总标记）',
    },
    {
      key: '4',
      code: 'rkcrs',
      name: '普查中心单位汇总口径（普查单位口径的单位数据汇总标记）',
    },
    {
      key: '5',
      code: 'rkcrs',
      name: '普查中心单位汇总口径（普查单位口径的单位数据汇总标记）',
    },
  ];

  const handleOk = () => {
    emit('update:visible', false);
  };

  const handleCancel = () => {
    emit('update:visible', false);
  };

  const onSelectChange = (keys) => {
    selectedRowKeys.value = keys;
  };
</script>

<style lang="less" scoped>
  .summary-container {
    padding: 8px;
  }

  :deep(.ant-table-thead > tr > th) {
    background: #fafafa;
    font-weight: normal;
    text-align: center !important;
    padding: 8px 16px;
    font-size: 14px;
  }

  :deep(.ant-table-tbody > tr > td) {
    padding: 8px 16px;
    font-size: 14px;
    text-align: center;
    font-weight: normal;
  }

  :deep(.ant-table-tbody > tr) {
    &:hover {
      td {
        background: #f5f5f5;
      }
    }
  }

  :deep(.ant-modal-header) {
    border-bottom: 1px solid #f0f0f0;
    padding: 16px 24px;
  }

  :deep(.ant-modal-body) {
    padding: 16px;
  }

  :deep(.ant-table-wrapper) {
    border: 1px solid #f0f0f0;
    border-radius: 2px;
  }
</style>
