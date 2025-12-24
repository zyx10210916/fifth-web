<template>
  <Modal
      v-model:open="visible"
      title="导出选项"
      @ok="handleExportConfirm"
      @cancel="handleExportCancel"
      okText="确定"
      cancelText="取消"
      width="400px"
  >
    <div class="export-option">
<!--      <h4 class="option-title">导出范围</h4>-->
      <RadioGroup v-model:value="exportScope" class="radio-group-inline">
        <Radio :value="1" class="radio-item-inline">导出全部</Radio>
        <Radio :value="2" class="radio-item-inline">导出当前页</Radio>
      </RadioGroup>
    </div>
    <div class="export-option">
      <h4 class="option-title">下载格式</h4>
      <Select v-model:value="exportFormat" class="format-select">
        <SelectOption value="xlsx">Excel (.xlsx)</SelectOption>
<!--        <SelectOption value="csv">CSV (.csv)</SelectOption>-->
      </Select>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, defineModel, defineEmits } from 'vue';
import { Modal, RadioGroup, Radio, Select, SelectOption } from 'ant-design-vue';

// 使用 defineModel 简化 v-model 实现
const visible = defineModel<boolean>('visible', { default: false });
const emit = defineEmits(['export-confirm']);

const exportScope = ref(1); // 1: 全部, 2: 当前页
const exportFormat = ref('xlsx'); // xlsx, csv

const handleExportConfirm = () => {
  emit('export-confirm', exportScope.value, exportFormat.value);
  visible.value = false;
};

const handleExportCancel = () => {
  visible.value = false;
};
</script>

<style lang="less" scoped>
.export-option {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.option-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
}

.radio-group-inline {
  display: flex;
  gap: 24px;
}

.radio-item-inline {
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(240, 240, 240, 0.5);
  }

  &:active {
    background-color: rgba(230, 230, 230, 0.8);
  }
}

.format-select {
  width: 100%;
  margin-top: 4px;
}

:deep(.ant-radio) {
  margin-right: 8px;
}

:deep(.ant-radio-inner) {
  transform: scale(1.1);
}

:deep(.ant-radio-checked .ant-radio-inner) {
  border-color: #1890ff;
  background-color: #1890ff;
}

:deep(.ant-modal-header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 24px;
}

:deep(.ant-modal-body) {
  padding: 24px;
}

:deep(.ant-modal-title) {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

:deep(.ant-btn-primary) {
  background-color: #1890ff;
  border-color: #1890ff;

  &:hover {
    background-color: #40a9ff;
    border-color: #40a9ff;
  }
}
</style>