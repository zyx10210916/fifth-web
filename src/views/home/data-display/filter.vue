<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h3>筛选条件</h3>
        <button class="close-btn" @click="closeModal">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"></path>
          </svg>
        </button>
      </div>
 
      <div class="modal-content">
        <!-- 左侧分类导航 -->
        <div class="category-nav">
          <div 
            v-for="(category, index) in categories" 
            :key="index"
            class="nav-item"
            :class="{ active: activeCategory === index }"
            @click="activeCategory = index"
          >
            {{ category.name }}
          </div>
        </div>
 
        <!-- 右侧内容区域（可滚动） --> 
        <div class="content-area" @scroll="handleScroll">
          <!-- 地区筛选 -->
          <div v-show="activeCategory === 0" class="filter-section">
            <h4 class="section-title">地区</h4>
            <div class="filter-options">
              <div 
                v-for="region in regions" 
                :key="region"
                class="option-item"
                :class="{ active: selectedRegions.includes(region) }"
                @click="toggleSelection(selectedRegions, region)"
              >
                <span class="check-icon">
                  <svg v-if="selectedRegions.includes(region)" viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                  </svg>
                </span>
                <span class="option-label">{{ region }}</span>
              </div>
            </div>
          </div>
 
          <!-- 注册类型筛选 -->
          <div v-show="activeCategory === 1" class="filter-section">
            <h4 class="section-title">注册类型</h4>
            <div class="filter-options">
              <div 
                v-for="type in registrationTypes" 
                :key="type"
                class="option-item"
                :class="{ active: selectedRegistrationTypes.includes(type) }"
                @click="toggleSelection(selectedRegistrationTypes, type)"
              >
                <span class="check-icon">
                  <svg v-if="selectedRegistrationTypes.includes(type)" viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                  </svg>
                </span>
                <span class="option-label">{{ type }}</span>
              </div>
            </div>
          </div>
 
          <!-- 单位规模筛选 -->
          <div v-show="activeCategory === 2" class="filter-section">
            <h4 class="section-title">单位规模</h4>
            <div class="filter-options">
              <div 
                v-for="size in unitSizes" 
                :key="size"
                class="option-item"
                :class="{ active: selectedUnitSizes.includes(size) }"
                @click="toggleSelection(selectedUnitSizes, size)"
              >
                <span class="check-icon">
                  <svg v-if="selectedUnitSizes.includes(size)" viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                  </svg>
                </span>
                <span class="option-label">{{ size }}</span>
              </div>
            </div>
          </div>
 
          <!-- 经营形式筛选 -->
          <div v-show="activeCategory === 3" class="filter-section">
            <h4 class="section-title">经营形式</h4>
            <div class="filter-options">
              <div 
                v-for="mode in operationModes" 
                :key="mode"
                class="option-item"
                :class="{ active: selectedOperationModes.includes(mode) }"
                @click="toggleSelection(selectedOperationModes, mode)"
              >
                <span class="check-icon">
                  <svg v-if="selectedOperationModes.includes(mode)" viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                  </svg>
                </span>
                <span class="option-label">{{ mode }}</span>
              </div>
            </div>
          </div>
 
          <!-- 行业门类筛选 -->
          <div v-show="activeCategory === 4" class="filter-section">
            <h4 class="section-title">行业门类</h4>
            <div class="filter-options">
              <div 
                v-for="category in industryCategories" 
                :key="category"
                class="option-item"
                :class="{ active: selectedIndustryCategories.includes(category) }"
                @click="toggleSelection(selectedIndustryCategories, category)"
              >
                <span class="check-icon">
                  <svg v-if="selectedIndustryCategories.includes(category)" viewBox="0 0 24 24" width="14" height="14">
                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                  </svg>
                </span>
                <span class="option-label">{{ category }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      <div class="modal-footer">
        <button class="action-btn clear-btn" @click="clearAllSelections">清除</button>
        <button class="action-btn apply-btn" @click="applyFilters">确定</button>
      </div>
    </div>
  </div>
</template>
 
<script setup lang="ts">
import { ref, nextTick } from 'vue';
 
const props = defineProps<{
  isVisible: boolean;
}>();
 
const emit = defineEmits(['update:isVisible', 'apply']);
 
// 左侧分类导航
const categories = ref([
  { name: '地区', id: 'region-section' },
  { name: '注册类型', id: 'type-section' },
  { name: '单位规模', id: 'size-section' },
  { name: '经营形式', id: 'mode-section' },
  { name: '行业门类', id: 'category-section' }
]);
const activeCategory = ref(0);
 
// 筛选数据 
const regions = ref(['越秀区', '荔湾区', '海珠区', '天河区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区', '从化区', '增城区']);
 
const registrationTypes = ref([
  '内资企业',
  '有限责任公司',
  '国有独资公司',
  '私营有限责任公司',
  '其他有限责任公司',
  '股份有限公司',
  '私营股份有限公司',
  '其他股份有限公司',
  '非公司企业法人',
  '全民所有制企业（国有企业）',
  '集体所有制企业（集体企业）',
  '股份合作企业',
  '联营企业',
  '个人独资企业',
  '合伙企业',
  '其他内资企业',
  '港澳台投资企业',
  '港澳台投资有限责任公司',
  '港澳台投资股份有限公司',
  '港澳台投资合伙企业',
  '其他港澳台投资企业',
  '外商投资企业',
  '外商投资有限责任公司',
  '外商投资股份有限公司',
  '外商投资合伙企业',
  '其他外商投资企业',
  '农民专业合作社（联合社）',
  '个体工商户'
]);
 
const unitSizes = ref(['大型', '中型', '小型', '微型']);
 
const operationModes = ref([
  '独立门店',
  '连锁总店（总部）',
  '连锁直营店',
  '连锁加盟店',
  '其他'
]);
 
const industryCategories = ref([
  '农、林、牧、渔业',
  '采矿业',
  '制造业',
  '电力、热力、燃气及水生产和供应业',
  '建筑业',
  '批发和零售业',
  '交通运输、仓储和邮政业',
  '住宿和餐饮业',
  '信息传输、软件和信息技术服务业',
  '金融业',
  '房地产业',
  '租赁和商务服务业',
  '科学研究和技术服务业',
  '水利、环境和公共设施管理业',
  '居民服务、修理和其他服务业',
  '教育',
  '卫生和社会工作',
  '文化、体育和娱乐业',
  '公共管理、社会保障和社会组织',
  '国际组织'
]);
 
// 选中的筛选条件
const selectedRegions = ref<string[]>([]);
const selectedRegistrationTypes = ref<string[]>([]);
const selectedUnitSizes = ref<string[]>([]);
const selectedOperationModes = ref<string[]>([]);
const selectedIndustryCategories = ref<string[]>([]);
 
function toggleSelection(selectedList: string[], item: string) {
  const index = selectedList.indexOf(item);
  if (index > -1) {
    selectedList.splice(index, 1);
  } else {
    selectedList.push(item);
  }
}
 
function clearAllSelections() {
  selectedRegions.value = [];
  selectedRegistrationTypes.value = [];
  selectedUnitSizes.value = [];
  selectedOperationModes.value = [];
  selectedIndustryCategories.value = [];
}
 
function applyFilters() {
  const filters = {
    regions: selectedRegions.value,
    registrationTypes: selectedRegistrationTypes.value,
    unitSizes: selectedUnitSizes.value,
    operationModes: selectedOperationModes.value,
    industryCategories: selectedIndustryCategories.value,
  };
  
  emit('apply', filters);
  closeModal();
}
 
function closeModal() {
  emit('update:isVisible', false);
}
 
// 滚动同步
const handleScroll = (event: Event) => {
  const scrollTop = (event.target as HTMLElement).scrollTop;
  const sections = document.querySelectorAll('.filter-section');
  
  // 找出当前可见的区域 
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i] as HTMLElement;
    const offsetTop = section.offsetTop - 20;
    
    if (scrollTop >= offsetTop) {
      activeCategory.value = i;
      break;
    }
  }
};
 
// 点击左侧导航时滚动到对应区域 
watch(activeCategory, (newVal) => {
  nextTick(() => {
    const sections = document.querySelectorAll('.filter-section');
    if (sections[newVal]) {
      const contentArea = document.querySelector('.content-area') as HTMLElement;
      contentArea.scrollTo({
        top: (sections[newVal] as HTMLElement).offsetTop - 20,
        behavior: 'smooth'
      });
    }
  });
});
</script>
 
<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
 
.modal-container {
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
 
.modal-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
}
 
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}
 
.close-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #999;
  transition: color 0.2s;
  border-radius: 4px;
}
 
.close-btn:hover {
  color: #333;
  background-color: #f5f5f5;
}
 
.modal-content {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
 
.category-nav {
  width: 120px;
  padding: 10px 0;
  background-color: #f9f9f9;
  overflow-y: auto;
}
 
.nav-item {
  padding: 12px 16px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  transition: all 0.2s;
  border-radius: 6px;
  margin: 4px 8px;
}
 
.nav-item:hover {
  background-color: #f0f0f0;
}
 
.nav-item.active {
  background-color: #f0f6ff;
  color: #1a73e8;
  font-weight: 500;
}
 
.content-area {
  flex: 1;
  padding: 0 20px 20px 20px;
  overflow-y: auto;
  scroll-behavior: smooth;
}
 
.filter-section {
  margin-bottom: 30px;
  padding-top: 20px;
}
 
.section-title {
  margin: 0 0 15px 0;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}
 
.filter-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}
 
.option-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: #f5f5f5;
  color: #555;
}
 
.option-item:hover {
  background-color: #eaeaea;
}
 
.option-item.active {
  background-color: #e1ecfe;
  color: #1a73e8;
  border: 1px solid #1a73e8;
}
 
.check-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-right: 8px;
  color: currentColor;
}
 
.option-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
 
.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 16px 20px;
  background-color: #fff;
  gap: 12px;
}
 
.action-btn {
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  outline: none;
}
 
.clear-btn {
  background-color: #f5f5f5;
  color: #666;
}
 
.clear-btn:hover {
  background-color: #e0e0e0;
}
 
.apply-btn {
  background-color: #1a73e8;
  color: white;
}
 
.apply-btn:hover {
  background-color: #0d62c9;
}
 
/* 自定义滚动条 */
.content-area::-webkit-scrollbar {
  width: 6px;
}
 
.content-area::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}
 
.content-area::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}
 
.content-area::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
 
.category-nav::-webkit-scrollbar {
  width: 4px;
}
 
.category-nav::-webkit-scrollbar-thumb {
  background: #c1c1c1;
}
</style>