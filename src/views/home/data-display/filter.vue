<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <header class="modal-header">
        <h3 class="modal-title">筛选条件</h3>
        <button class="modal-close-btn" @click="closeModal">×</button>
      </header>
      
      <main class="modal-body">
        <div class="filter-group">
          <h4 class="filter-group-title">地区</h4>
          <div class="filter-tags">
            <button v-for="tag in regions" :key="tag" 
                    class="tag-btn" 
                    :class="{ 'active': selectedRegions.includes(tag) }"
                    @click="toggleSelection(selectedRegions, tag)">
              {{ tag }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <h4 class="filter-group-title">行业部门</h4>
          <div class="filter-tags">
            <button v-for="tag in industries" :key="tag" 
                    class="tag-btn"
                    :class="{ 'active': selectedIndustries.includes(tag) }"
                    @click="toggleSelection(selectedIndustries, tag)">
              {{ tag }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <h4 class="filter-group-title">注册类型</h4>
          <div class="filter-tags">
            <button v-for="tag in registrationTypes" :key="tag" 
                    class="tag-btn"
                    :class="{ 'active': selectedRegistrationTypes.includes(tag) }"
                    @click="toggleSelection(selectedRegistrationTypes, tag)">
              {{ tag }}
            </button>
          </div>
        </div>
        
        <div class="filter-group">
          <h4 class="filter-group-title">单位规模</h4>
          <div class="filter-tags">
            <button v-for="tag in unitSizes" :key="tag" 
                    class="tag-btn"
                    :class="{ 'active': selectedUnitSizes.includes(tag) }"
                    @click="toggleSelection(selectedUnitSizes, tag)">
              {{ tag }}
            </button>
          </div>
        </div>
        
        <div class="filter-group">
          <h4 class="filter-group-title">经营方式</h4>
          <div class="filter-tags">
            <button v-for="tag in operationModes" :key="tag" 
                    class="tag-btn"
                    :class="{ 'active': selectedOperationModes.includes(tag) }"
                    @click="toggleSelection(selectedOperationModes, tag)">
              {{ tag }}
            </button>
          </div>
        </div>
        
        <div class="filter-group">
          <h4 class="filter-group-title">行业门类</h4>
          <div class="filter-tags">
            <button v-for="tag in industryCategories" :key="tag" 
                    class="tag-btn"
                    :class="{ 'active': selectedIndustryCategories.includes(tag) }"
                    @click="toggleSelection(selectedIndustryCategories, tag)">
              {{ tag }}
            </button>
          </div>
        </div>
      </main>
      
      <footer class="modal-footer">
        <button class="action-btn clear-btn" @click="clearAllSelections">清空</button>
        <button class="action-btn apply-btn" @click="applyFilters">确定</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isVisible: boolean;
}>();

const emit = defineEmits(['update:isVisible', 'apply']);

const regions = ref(['越秀区', '荔湾区', '海珠区', '天河区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '从化区', '增城区']);
const industries = ref(['专业1', '专业2', '专业3', '专业4', '专业5', '专业6', '专业7', '专业8']);
const registrationTypes = ref(['企业', '个体户', '事业单位', '其他']); // 示例
const unitSizes = ref(['大型', '中型', '小型', '微型']); // 示例
const operationModes = ref(['自主经营', '租赁经营', '合作经营', '其他']); // 示例
const industryCategories = ref(['门类1', '门类2', '门类3', '门类4', '门类5', '门类6']); // 示例


const selectedRegions = ref<string[]>([]);
const selectedIndustries = ref<string[]>([]);
const selectedRegistrationTypes = ref<string[]>([]);
const selectedUnitSizes = ref<string[]>([]);
const selectedOperationModes = ref<string[]>([]);
const selectedIndustryCategories = ref<string[]>([]);


function toggleSelection(selectedList: string[], tag: string) {
  const index = selectedList.indexOf(tag);
  if (index > -1) {
    selectedList.splice(index, 1);
  } else {
    selectedList.push(tag);
  }
}

function clearAllSelections() {
  selectedRegions.value = [];
  selectedIndustries.value = [];
  selectedRegistrationTypes.value = [];
  selectedUnitSizes.value = [];
  selectedOperationModes.value = [];
  selectedIndustryCategories.value = [];
}

function applyFilters() {
  const filters = {
    regions: selectedRegions.value,
    industries: selectedIndustries.value,
    registrationTypes: selectedRegistrationTypes.value,
    unitSizes: selectedUnitSizes.value,
    operationModes: selectedOperationModes.value,
    industryCategories: selectedIndustryCategories.value,
  };
  
  // 触发 apply 事件，将筛选条件传递给父组件
  emit('apply', filters);
  closeModal();
}

function closeModal() {
  emit('update:isVisible', false);
}
</script>

<style scoped>
/* 模态框背景遮罩 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* 确保在最顶层 */
}

/* 模态框内容容器 */
.modal-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 500px; /* 调整宽度以匹配截图 */
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}

/* 模态框头部 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
}

/* 模态框主体内容 */
.modal-body {
  padding: 10px 20px;
  overflow-y: auto; /* 确保内容过多时可以滚动 */
}

.filter-group {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #f0f0f0;
}

.filter-group:last-child {
  border-bottom: none;
}

.filter-group-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
  font-weight: bold;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-btn {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #d9d9d9;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.tag-btn:hover {
  border-color: #1890ff;
}

.tag-btn.active {
  background-color: #e6f7ff;
  color: #1890ff;
  border-color: #1890ff;
  font-weight: bold;
}

/* 模态框底部 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 20px;
  border-top: 1px solid #eee;
  gap: 10px;
  flex-shrink: 0; /* 防止底部被压缩 */
}

.action-btn {
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.clear-btn {
  background-color: #fff;
  color: #666;
  border: 1px solid #d9d9d9;
}

.apply-btn {
  background-color: #1890ff;
  color: #fff;
  border: 1px solid #1890ff;
}
</style>