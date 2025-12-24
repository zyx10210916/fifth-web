<template>
  <div class="form-container">
    <a-form layout="inline">
      <a-form-item :label="'模板名称'">
        <a-input
            v-model:value="templateName"
            style="width: 160px;
          border-radius: 1.8rem;
          background: rgb(245 245 245 / 100%);
          border: none;"
            placeholder="请输入模板名称"
            @pressEnter="handleSearch"
        >
        </a-input>
      </a-form-item>
      <a-form-item :label="'年份'">
        <a-select v-model:value="selectedYear" style="width: 160px;">
          <a-select-option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick, computed } from 'vue';

// 定义事件
const emit = defineEmits(['search']);

const templateName = ref('');
const selectedYear = ref(new Date().getFullYear());

// 计算年份选项，最近10年
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 10; i++) {
    years.push(currentYear - i);
  }
  return years;
});

// 搜索处理函数
const handleSearch = () => {
  console.log('搜索模板名称:', templateName.value, '年份:', selectedYear.value);
  // 触发搜索事件，传递查询参数
  emit('search', {
    templateName: templateName.value,
    year: selectedYear.value
  });
};

watch(templateName, () => {
  handleSearch();
});
</script>

<style lang="scss" scoped>
.form-container {
  padding: 1.6rem;
  margin-bottom: 1.2rem;
  background-color: white;
  border-radius: 0 0 18px 18px;
  height:6.5%;

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
