<!-- src/components/InfoTemplate/SummaryModal.vue -->
<template>
  <a-modal :open="visible" title="常用汇总口径" @ok="handleOk" @cancel="handleCancel" width="600px" :mask-closable="true" ok-text="确认" cancel-text="取消">
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
import { ref, watch } from 'vue';

const props = defineProps({
  visible: '',
  currentSumCode: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:visible', 'select']);

const selectedRowKeys = ref([]);

// 根据currentSumCode设置选中状态
const setSelectedRowKeysBySumCode = (sumCode) => {
  if (sumCode) {
    const item = dataSource.find(item => item.code === sumCode);
    if (item) {
      selectedRowKeys.value = [item.key];
    } else {
      selectedRowKeys.value = [];
    }
  } else {
    selectedRowKeys.value = [];
  }
};

// 监听currentSumCode变化
watch(() => props.currentSumCode, (newSumCode) => {
  setSelectedRowKeysBySumCode(newSumCode);
});

// 监听visible变化，当组件显示时设置初始选中状态
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    setSelectedRowKeysBySumCode(props.currentSumCode);
  }
});

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
    code: 'pczxdws',
    name: '普查中心单位数汇总标记',
  },
  {
    key: '2',
    code: 'rkcrs',
    name: '人口处汇总标记',
  },
  {
    key: '3',
    code: 'zydws',
    name: '专业单位数汇总标记',
  },
  {
    key: '4',
    code: 'zyrs',
    name: '专业人数汇总标记',
  },
  {
    key: '5',
    code: 'zyjjzb',
    name: '专业经济指标汇总标记',
  },
];

const handleOk = () => {
  if (selectedRowKeys.value.length > 0) {
    const selectedKey = selectedRowKeys.value[0];
    const selectedItem = dataSource.find(item => item.key === selectedKey);
    if (selectedItem) {
      emit('select', selectedItem.code);
    }
  }
  emit('update:visible', false);
};

const handleCancel = () => {
  emit('update:visible', false);
};

const onSelectChange = (selectedRowKeysArr) => {
  // 实现单选逻辑
  if (selectedRowKeysArr.length > 1) {
    // 如果选择了多项，只保留最后一项
    selectedRowKeys.value = [selectedRowKeysArr[selectedRowKeysArr.length - 1]];
  } else {
    // 如果点击的是已选中的项，则取消选中
    if (selectedRowKeysArr.length === 1 && selectedRowKeys.value.length === 1 && selectedRowKeysArr[0] === selectedRowKeys.value[0]) {
      selectedRowKeys.value = [];
    } else {
      selectedRowKeys.value = selectedRowKeysArr;
    }
  }
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
