<!--
 * @文件路径: \fifth-web\src\views\home\data-processing\quick-summary\head-form\Index.vue
 * @作者名称: shenjiamin
 * @创建日期: 2025-08-27 17:18:30
 * @简要说明: 下拉框选择
 * @编辑时间: 2025-09-02 09:47:07
 * Copyright (c) 2025 by shenjiamin, All Rights Reserved.
-->
<template>
  <div class="form-container">
    <a-form layout="inline">
      <a-form-item :label="'制度选择'">
        <a-select v-model:value="listVal" :options="listOptions"  @change="handleListChange"> </a-select>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
  import { onMounted, ref ,nextTick} from 'vue';
  import { useFormHooks } from './useFormHooks';

  const props = defineProps({
    list: {
      type: String,
      default: '公司法人主要经济指标',
    },
  });

  const emit = defineEmits(['change:value']);

  const listVal = ref(props.list);
  const listOptions = ref([]);

  /**
   * @desc: 列表下拉框切换处理
   * @param value
   * @param option
   * @return {*}
   */
  const handleListChange = (value,option) => {
    listVal.value = value;
    emit('change:value', value,option);
  };

  onMounted(async () => {
    const listRes = await useFormHooks().getListOptions();
    listOptions.value = listRes || [];

    if (listRes && listRes.length > 0) {
      listVal.value = listRes[0].value;
      emit('change:value', listRes[0].value,listRes[0]);
    }
  });
</script>

<style lang="scss" scoped>
  .form-container {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    background-color: white;
    border-radius: 0 0 18px 18px;
    height: 10%;

    :deep(.ant-form) {
      gap: 1.2rem;

      .ant-form-item {
        margin-bottom: 0;
        margin-right: 1.2rem;
      }

      .ant-form-item-label {
        label {
          color: rgb(113 113 113 / 100%);
          font-size: 1.4rem;
          height: 3.2rem;
          padding-right: 0.8rem;
        }
      }

      .ant-select-selector {
        width: 160px;
        border-radius: 1.8rem;
        background: rgb(245 245 245 / 100%);
        border: none;

        .ant-select-selection-placeholder {
          color: rgb(0 0 0 / 85%);
        }
      }

      &:hover .ant-select-selector {
        background: rgb(245 245 245 / 100%);
        box-shadow: none;
      }

      .ant-select-selection-item {
        font-size: 1.4rem;
        color: rgba(55, 55, 55, 1);
      }
    }
  }
</style>
