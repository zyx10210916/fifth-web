<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="title">筛选条件</h3>
        <button class="close-btn" @click="closeModal">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor"
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z">
            </path>
          </svg>
        </button>
      </div>

      <div class="modal-content">
        <div class="category-nav">
          <div v-for="(cat, index) in categories" :key="index" class="nav-item"
            :class="{ active: activeCategory === index }" @click="scrollToSection(index)">
            {{ cat.name }}
          </div>
        </div>

        <div class="content-area" ref="scrollContainer" @scroll="onScroll">
          <div class="filter-section" id="section-0">
            <h4 class="section-main-title">地区选择</h4>
            <div v-for="dist in FILTER_MAP.regions" :key="dist.code" class="district-group">
              <div class="dist-header" @click="toggleDistExpand(dist.code)">
                <span class="arrow" :class="{ expanded: expandedDistricts.includes(dist.code) }">▶</span>
                <label class="checkbox-wrapper" @click.stop>
                  <input type="checkbox" :checked="selectedAreaCodes.includes(dist.code)"
                    @change="toggle(selectedAreaCodes, dist.code)">
                  <span class="checkbox-label" :class="{ checked: selectedAreaCodes.includes(dist.code) }">{{ dist.name
                    }}</span>
                </label>
              </div>
              <div class="street-options" v-if="expandedDistricts.includes(dist.code)">
                <label v-for="street in dist.streets" :key="street.code" class="checkbox-wrapper">
                  <input type="checkbox" :checked="selectedAreaCodes.includes(street.code)"
                    @change="toggle(selectedAreaCodes, street.code)">
                  <span class="checkbox-label" :class="{ checked: selectedAreaCodes.includes(street.code) }">{{
                    street.name }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="filter-section" id="section-1">
            <h4 class="section-main-title">行业部门</h4>
            <div class="filter-options">
              <div v-for="(code, name) in FILTER_MAP.industryDept" :key="code" class="option-pill"
                :class="{ active: selectedDepts.includes(code) }" @click="toggle(selectedDepts, code)">
                {{ name }}
              </div>
            </div>
          </div>

          <div class="filter-section" id="section-2">
            <h4 class="section-main-title">注册类型</h4>
            <div class="filter-options grid-2">
              <div v-for="(code, name) in FILTER_MAP.registerType" :key="code" class="option-pill"
                :class="{ active: selectedRegTypes.includes(code) }" @click="toggle(selectedRegTypes, code)">
                {{ name }}
              </div>
            </div>
          </div>

          <div class="filter-section" id="section-3">
            <h4 class="section-main-title">单位规模</h4>
            <div class="filter-options">
              <div v-for="(code, name) in FILTER_MAP.unitSizes" :key="code" class="option-pill"
                :class="{ active: selectedUnitSizes.includes(code) }" @click="toggle(selectedUnitSizes, code)">
                {{ name }}
              </div>
            </div>
          </div>

          <div class="filter-section" id="section-4">
            <h4 class="section-main-title">经营形式</h4>
            <div class="filter-options">
              <div v-for="(code, name) in FILTER_MAP.businessOperationType" :key="code" class="option-pill"
                :class="{ active: selectedBizTypes.includes(code) }" @click="toggle(selectedBizTypes, code)">
                {{ name }}
              </div>
            </div>
          </div>

          <div class="filter-section" id="section-5">
            <h4 class="section-main-title">控股情况</h4>
            <div class="filter-options">
              <div v-for="(code, name) in FILTER_MAP.holdingSituation" :key="code" class="option-pill"
                :class="{ active: selectedHoldings.includes(code) }" @click="toggle(selectedHoldings, code)">
                {{ name }}
              </div>
            </div>
          </div>

          <div class="filter-section" id="section-6">
            <h4 class="section-main-title">行业门类</h4>
            <div class="filter-options grid-2">
              <div v-for="(code, name) in FILTER_MAP.industryCategory" :key="code" class="option-pill"
                :class="{ active: selectedIndCats.includes(code) }" @click="toggle(selectedIndCats, code)">
                {{ name }}
              </div>
            </div>
          </div>
          <div style="height: 400px;"></div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="action-btn clear-btn" @click="clearAll">清除</button>
        <button class="action-btn apply-btn" @click="apply">确定</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { FILTER_MAP } from './filter-config';
 
const props = defineProps<{ 
  isVisible: boolean;
  currentParams: any;
}>();
 
const emit = defineEmits(['update:isVisible', 'apply']);
 
const categories = [
  { name: '地区' }, { name: '行业部门' }, { name: '注册类型' },
  { name: '单位规模' }, { name: '经营形式' }, { name: '控股情况' }, { name: '行业门类' }
];
 
const activeCategory = ref(0);
const scrollContainer = ref<HTMLElement | null>(null);
const expandedDistricts = ref<string[]>([]);
 
// 选中状态
const selectedAreaCodes = ref<string[]>([]);
const selectedDepts = ref<string[]>([]);
const selectedRegTypes = ref<string[]>([]);
const selectedUnitSizes = ref<string[]>([]);
const selectedBizTypes = ref<string[]>([]);
const selectedHoldings = ref<string[]>([]);
const selectedIndCats = ref<string[]>([]);
 
// 初始化选中状态 
watch(() => props.isVisible, (visible) => {
  if (visible && props.currentParams) {
    const p = props.currentParams;
    selectedAreaCodes.value = p.area ? p.area.split(',') : [];
  }
});

function toggleDistExpand(code: string) {
  const idx = expandedDistricts.value.indexOf(code);
  if (idx > -1) expandedDistricts.value.splice(idx, 1);
  else expandedDistricts.value.push(code);
}
 
function toggle(list: string[], code: string) {
  const i = list.indexOf(code);
  if (i > -1) list.splice(i, 1);
  else list.push(code);
}
 
function scrollToSection(index: number) {
  activeCategory.value = index;
  const target = document.getElementById(`section-${index}`);
  if (target && scrollContainer.value) {
    scrollContainer.value.scrollTo({
      top: target.offsetTop - 10,
      behavior: 'smooth'
    });
  }
}
 
function onScroll() {
  if (!scrollContainer.value) return;
  const containerTop = scrollContainer.value.getBoundingClientRect().top;
  for (let i = 0; i < categories.length; i++) {
    const section = document.getElementById(`section-${i}`);
    if (section) {
      const rect = section.getBoundingClientRect();
      if (rect.top - containerTop <= 60) {
        activeCategory.value = i;
      }
    }
  }
}
 
function clearAll() {
  selectedAreaCodes.value = [];
  selectedDepts.value = [];
  selectedRegTypes.value = [];
  selectedUnitSizes.value = [];
  selectedBizTypes.value = [];
  selectedHoldings.value = [];
  selectedIndCats.value = [];
}
 
function apply() {
  emit('apply', {
    area: selectedAreaCodes.value.join(','),
    industryDept: selectedDepts.value.join(','),
    registerType: selectedRegTypes.value.join(','),
    unitScale: selectedUnitSizes.value.join(','),
    businessOperationType: selectedBizTypes.value.join(','),
    holdingSituation: selectedHoldings.value.join(','),
    industryCategory: selectedIndCats.value.join(',')
  });
  closeModal();
}
 
function closeModal() { 
  emit('update:isVisible', false); 
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
}

.modal-container {
  background: #fff;
  border-radius: 12px;
  width: 850px;
  height: 800px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header .title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
}

.modal-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧导航 */
.category-nav {
  width: 140px;
  background: #f8f9fb;
  border-right: 1px solid #eee;
  padding: 10px 0;
}

.nav-item {
  padding: 18px 10px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  text-align: center;
  transition: all 0.3s;
  position: relative;
}

.nav-item.active {
  background: #fff;
  color: #546fff;
  font-weight: bold;
}

.nav-item.active::after {
  content: "";
  position: absolute;
  right: 0;
  top: 25%;
  height: 50%;
  width: 3px;
  background: #546fff;
}

/* 右侧内容 */
.content-area {
  flex: 1;
  padding: 0 30px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.filter-section {
  padding: 30px 0;
  border-bottom: 1px solid #f5f5f5;
}

.section-main-title {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 25px;
}

/* 地区复选框 */
.district-group {
  margin-bottom: 15px;
}

.dist-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  cursor: pointer;
}

.arrow {
  font-size: 10px;
  color: #bbb;
  margin-right: 10px;
  transition: transform 0.2s;
}

.arrow.expanded {
  transform: rotate(90deg);
}

.checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-right: 15px;
  user-select: none;
}

.checkbox-wrapper input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #546fff;
}

.checkbox-label {
  margin-left: 8px;
  font-size: 14px;
  color: #666;
}

.checkbox-label.checked {
  color: #546fff;
  font-weight: 500;
}

.street-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding-left: 30px;
  margin-top: 10px;
}

/* 选项卡 */
.filter-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.option-pill {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 22px;
  font-size: 13px;
  color: #555;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
  padding: 0 12px;
  text-align: center;
}

.option-pill:hover {
  background: #eef2ff;
  color: #546fff;
}

.option-pill.active {
  background: #f0f4ff;
  color: #546fff;
  border-color: #546fff;
  font-weight: bold;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  gap: 15px;
}

.action-btn {
  width: 110px;
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
}

.apply-btn {
  background: #546fff;
  color: #fff;
}

.clear-btn {
  background: #f5f5f5;
  color: #666;
}

.content-area::-webkit-scrollbar {
  width: 5px;
}

.content-area::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 10px;
}
</style>