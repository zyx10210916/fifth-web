<!-- src/components/InfoTemplate/TagQueryModal.vue -->
<template>
  <a-modal
      :open="visible"
      @ok="handleOk"
      @cancel="handleCancel"
      title="查询标签"
      :footer="null"
      width="500px"
      :mask-closable="true"
  >
    <div class="tag-tree-container">
      <a-collapse v-model:activeKey="activeKeys" class="mt-8" expandIconPosition="start"
                  v-for="(category, idx) in categories" :key="category.id">
        <a-collapse-panel :key="category.id">
          <template #header>
            <div class="panel-header">
              <span class="title-text">{{ category.isPrivate !== '1' ? '公有' : category.categroyName }}</span>
              <span>(<span style="color: #546fff">{{ getSelectedTagsCount(category) }}/{{ getTotalTagsCount(category) }}</span>)</span>
            </div>
          </template>

          <template #extra>
            <!-- 只有当 isPrivate 不为 '1' 时才显示新建分类按钮 -->
            <a-space v-if="category.isPrivate !== '1'" align="center" style="gap: 0">
              <a-button type="link" style="color: #546fff" @click.stop="createNewCategory(category.id)"><PlusOutlined /> 新建分类</a-button>
            </a-space>
            <!-- 如果是私有分类，显示添加标签按钮 -->
            <a-button v-else type="link" style="color: #546fff" @click.stop="startAddPrivateTag(category.id)">
            </a-button>
          </template>

          <!-- 新建分类输入框（只在非私有分类下显示） -->
          <div v-if="category.isPrivate !== '1' && isCreatingNewCategory && newCategoryParentId === category.id" class="section new-category-section">
            <div class="section-header">
              <div class="new-category-input-container">
                <a-input
                    v-model:value="newCategoryName"
                    class="new-category-input"
                    placeholder="请输入分类名称"
                    size="small"
                    @press-enter="confirmCreateCategory"
                />
                <div class="new-category-options" style="margin-top: 8px; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">私有分类</span>
                  <a-switch v-model:checked="newCategoryIsPrivate" size="small" />
                </div>
                <div class="new-category-actions">
                  <CheckOutlined class="confirm-icon" @click="confirmCreateCategory" />
                  <CloseOutlined class="cancel-icon" @click="cancelCreateCategory" />
                </div>
              </div>
            </div>
          </div>

          <!-- 非私有分类：显示子分类 -->
          <div v-if="category.isPrivate !== '1'" class="section" v-for="(subCategory, subIdx) in category.tagsDtoList" :key="subCategory.id">
            <div class="section-header">
              <span class="section-title">{{ subCategory.categroyName }}</span>
              <div class="section-actions" @click="pinSection(category.id, subCategory.id)">
                <span class="divider">|</span>
                <PushpinFilled
                    class="pin-icon"
                    :class="{ 'pinned': isSectionPinned(category.id, subCategory.id) }"
                />
              </div>
            </div>

            <div class="tag-grid">
              <div
                  v-for="(tag, tagIdx) in subCategory.tags"
                  :key="tag.ID_"
                  class="tag-btn-container"
                  @mouseenter="hoveredTag = `${subCategory.id}-${tagIdx}`"
                  @mouseleave="hoveredTag = null"
              >
                <a-button
                    class="tag-btn"
                    :class="{ active: isTagSelected(subCategory.id, tagIdx) }"
                    @click="toggleTag(subCategory.id, tagIdx, tag)"
                >
                  {{ tag.TAG_NAME }}
                </a-button>
                <CloseOutlined
                    v-if="hoveredTag === `${subCategory.id}-${tagIdx}`"
                    class="delete-icon"
                    @click="deleteTag(subCategory.id, tagIdx, tag)"
                />
              </div>

              <!-- 加号按钮 - 显示输入框或加号 -->
              <div v-if="subCategory.isAdding" class="add-tag-input-container">
                <a-input
                    ref="inputRef"
                    v-model:value="subCategory.newTagName"
                    placeholder="请输入标签名称"
                    size="small"
                    @press-enter="confirmAddTag(category.id, subCategory.id)"
                />
                <div class="add-tag-actions">
                  <CheckOutlined class="confirm-icon" @click="confirmAddTag(category.id, subCategory.id)" />
                  <CloseOutlined class="cancel-icon" @click="cancelAddTag(category.id, subCategory.id)" />
                </div>
              </div>
              <a-button
                  v-else
                  class="tag-btn add-btn plus-circle"
                  @click="startAddTag(category.id, subCategory.id)"
              >
                <PlusOutlined />
              </a-button>
            </div>
          </div>

          <!-- 私有分类：直接显示标签 -->
          <div v-if="category.isPrivate === '1'" class="section">
            <div class="tag-grid">
              <div
                  v-for="(tag, tagIdx) in category.tags"
                  :key="tag.ID_"
                  class="tag-btn-container"
                  @mouseenter="hoveredTag = `private-${category.id}-${tagIdx}`"
                  @mouseleave="hoveredTag = null"
              >
                <a-button
                    class="tag-btn"
                    :class="{ active: isPrivateTagSelected(category.id, tagIdx) }"
                    @click="togglePrivateTag(category.id, tagIdx, tag)"
                >
                  {{ tag.TAG_NAME }}
                </a-button>
                <CloseOutlined
                    v-if="hoveredTag === `private-${category.id}-${tagIdx}`"
                    class="delete-icon"
                    @click="deletePrivateTag(category.id, tagIdx, tag)"
                />
              </div>

              <!-- 私有分类添加标签输入框 -->
              <div v-if="category.isAddingPrivateTag" class="add-tag-input-container">
                <a-input
                    ref="privateInputRef"
                    v-model:value="category.newPrivateTagName"
                    placeholder="请输入标签名称"
                    size="small"
                    @press-enter="confirmAddPrivateTag(category.id)"
                />
                <div class="add-tag-actions">
                  <CheckOutlined class="confirm-icon" @click="confirmAddPrivateTag(category.id)" />
                  <CloseOutlined class="cancel-icon" @click="cancelAddPrivateTag(category.id)" />
                </div>
              </div>
              <a-button
                  v-else-if="category.isPrivate === '1'"
                  class="tag-btn add-btn plus-circle"
                  @click="startAddPrivateTag(category.id)"
              >
                <PlusOutlined />
              </a-button>
            </div>
          </div>
        </a-collapse-panel>
      </a-collapse>
    </div>
  </a-modal>
  <!-- AllConditions模态框 -->
  <AllConditions
      :visible="allConditionsVisible"
      :query-params="tempQueryCriteria"
      :index-query-date="props.indexQueryDate"
      @update:visible="allConditionsVisible = $event"
      @handle-ok="handleAllConditionsOk"
      @cancel="handleAllConditionsCancel"
  />
</template>

<script setup>
import { ref, watch, nextTick, reactive } from 'vue';
import {
  PushpinFilled,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons-vue';
import { getTags, saveTag, removeTag } from '@/api/data-processing';
import AllConditions from './AllConditions/index.vue';

const props = defineProps({
  visible: Boolean,
  searchForm: {
    type: Object,
    default: () => ({
      currentReport: '',
      reportType: '',
      indexQuery: '',
      reportPeriod: '1',
      filter: '1',
      operator: 'eq',
      queryValue: '',
      all: '1'
    })
  },
  indexQueryDate: String
});

const emit = defineEmits(['update:visible', 'confirm']);

const selectedTags = ref([]);
const activeKeys = ref([]);
const inputRef = ref(null);
const privateInputRef = ref(null);
const hoveredTag = ref(null);

// AllConditions模态框相关状态
const allConditionsVisible = ref(false);
const currentAddingTagInfo = reactive({
  categoryId: '',
  subCategoryId: '',
  tagName: '',
  isPrivate: false
});
const tempQueryCriteria = reactive({
  currentReport: '',
  reportType: '',
  indexQuery: '',
  reportPeriod: '1',
  filter: '1',
  operator: 'eq',
  queryValue: '',
  all: '1',
  columnQueries: []
});

// 记录被固定的section (格式: {categoryId: {subCategoryId: boolean}})
const pinnedSections = ref({});

// 分类数据
const categories = ref([]);

// 加载标签数据
const loadTagData = async () => {
  try {
    console.log('开始加载标签数据');
    const result = await getTags();

    if (result && result.code === 200) {
      console.log('获取到的标签数据:', result.data);
      categories.value = result.data || [];

      // 初始化所有分类为展开状态
      activeKeys.value = categories.value.map(cat => cat.id);

      // 为每个分类添加响应式属性
      categories.value.forEach(category => {
        // 为非私有分类的子分类添加属性
        if (category.isPrivate !== '1' && category.tagsDtoList) {
          category.tagsDtoList.forEach(subCategory => {
            subCategory.isAdding = false;
            subCategory.newTagName = '';
          });
        }

        // 为私有分类添加属性
        if (category.isPrivate === '1') {
          category.isAddingPrivateTag = false;
          category.newPrivateTagName = '';

          // 确保tags数组存在
          if (!category.tags) {
            category.tags = [];
          }
        }
      });
    } else {
      console.error('获取标签数据失败:', result?.message || '未知错误');
      categories.value = [];
    }
  } catch (error) {
    console.error('获取标签数据失败:', error);
    categories.value = [];
  }
};

// 检查标签是否被选中（非私有分类）
const isTagSelected = (subCategoryId, tagIndex) => {
  return selectedTags.value.some(tag =>
      tag.subCategoryId === subCategoryId && tag.tagIndex === tagIndex && !tag.isPrivate
  );
};

// 检查私有分类标签是否被选中
const isPrivateTagSelected = (categoryId, tagIndex) => {
  return selectedTags.value.some(tag =>
      tag.categoryId === categoryId && tag.tagIndex === tagIndex && tag.isPrivate
  );
};

const toggleTag = (subCategoryId, tagIndex, tag) => {
  const existingIndex = selectedTags.value.findIndex(t =>
      t.subCategoryId === subCategoryId && t.tagIndex === tagIndex && !t.isPrivate
  );

  if (existingIndex > -1) {
    selectedTags.value.splice(existingIndex, 1);
  } else {
    // 单选模式：清空现有选中，然后添加新选中的标签
    selectedTags.value = [{
      subCategoryId,
      tagIndex,
      tagData: tag,
      isPrivate: false
    }];
  }

  // 如果选中了标签，立即触发确认事件
  if (selectedTags.value.length > 0) {
    const selectedTag = selectedTags.value[0];
    const queryCriteria = selectedTag.tagData?.QUERY_CRITERIA || {};
    emit('confirm', queryCriteria);
    emit('update:visible', false);
  }
};

// 切换私有分类标签
const togglePrivateTag = (categoryId, tagIndex, tag) => {
  const existingIndex = selectedTags.value.findIndex(t =>
      t.categoryId === categoryId && t.tagIndex === tagIndex && t.isPrivate
  );

  if (existingIndex > -1) {
    selectedTags.value.splice(existingIndex, 1);
  } else {
    // 单选模式：清空现有选中，然后添加新选中的标签
    selectedTags.value = [{
      categoryId,
      tagIndex,
      tagData: tag,
      isPrivate: true
    }];
  }

  // 如果选中了标签，立即触发确认事件
  if (selectedTags.value.length > 0) {
    const selectedTag = selectedTags.value[0];
    const queryCriteria = selectedTag.tagData?.QUERY_CRITERIA || {};
    emit('confirm', queryCriteria);
    emit('update:visible', false);
  }
};

const pinSection = (categoryId, subCategoryId) => {
  if (!pinnedSections.value[categoryId]) {
    pinnedSections.value[categoryId] = {};
  }

  if (pinnedSections.value[categoryId][subCategoryId]) {
    pinnedSections.value[categoryId][subCategoryId] = false;
  } else {
    pinnedSections.value[categoryId][subCategoryId] = true;

    // 将固定的子分类移到前面
    const category = categories.value.find(cat => cat.id === categoryId);
    if (category && category.tagsDtoList) {
      const subCategoryIndex = category.tagsDtoList.findIndex(sub => sub.id === subCategoryId);
      if (subCategoryIndex > -1) {
        const [pinnedSubCategory] = category.tagsDtoList.splice(subCategoryIndex, 1);
        category.tagsDtoList.unshift(pinnedSubCategory);
      }
    }
  }
};

// 检查section是否被固定
const isSectionPinned = (categoryId, subCategoryId) => {
  return pinnedSections.value[categoryId]?.[subCategoryId] || false;
};

// 开始添加标签（非私有分类）
const startAddTag = (categoryId, subCategoryId) => {
  const category = categories.value.find(cat => cat.id === categoryId);
  if (!category || !category.tagsDtoList) return;

  const subCategory = category.tagsDtoList.find(sub => sub.id === subCategoryId);
  if (subCategory) {
    subCategory.isAdding = true;
    subCategory.newTagName = '';

    nextTick(() => {
      const inputElements = document.querySelectorAll('.add-tag-input-container .ant-input');
      const visibleInput = Array.from(inputElements).find(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
      });

      if (visibleInput) {
        visibleInput.focus();
      }
    });
  }
};

// 开始添加私有分类标签
const startAddPrivateTag = (categoryId) => {
  const category = categories.value.find(cat => cat.id === categoryId);
  if (!category || category.isPrivate !== '1') return;

  category.isAddingPrivateTag = true;
  category.newPrivateTagName = '';

  nextTick(() => {
    const inputElements = document.querySelectorAll('.add-tag-input-container .ant-input');
    const visibleInput = Array.from(inputElements).find(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && el.offsetParent !== null;
    });

    if (visibleInput) {
      visibleInput.focus();
    }
  });
};

// 确认添加标签（非私有分类）
const confirmAddTag = async (categoryId, subCategoryId) => {
  const category = categories.value.find(cat => cat.id === categoryId);
  if (!category || !category.tagsDtoList) return;

  const subCategory = category.tagsDtoList.find(sub => sub.id === subCategoryId);
  if (!subCategory || !subCategory.newTagName.trim()) {
    if (subCategory) {
      subCategory.isAdding = false;
      subCategory.newTagName = '';
    }
    return;
  }

  // 保存当前标签信息，准备弹出AllConditions模态框
  Object.assign(currentAddingTagInfo, {
    categoryId,
    subCategoryId,
    tagName: subCategory.newTagName.trim(),
    isPrivate: false
  });

  // 初始化临时查询条件 - 首先清空当前值
  Object.keys(tempQueryCriteria).forEach(key => {
    if (key === 'columnQueries') {
      tempQueryCriteria[key] = [];
    } else {
      tempQueryCriteria[key] = '';
    }
  });

  // 复制基本字段
  Object.assign(tempQueryCriteria, {
    currentReport: props.searchForm?.currentReport || props.searchForm?.tableName || '',
    reportType: props.searchForm?.reportType || props.searchForm?.specialtyCode || '',
    indexQuery: props.searchForm?.indexQuery || '',
    reportPeriod: props.searchForm?.reportPeriod || '1',
    filter: props.searchForm?.filter || '1',
    operator: props.searchForm?.operator || 'eq',
    queryValue: props.searchForm?.queryValue || '',
    all: props.searchForm?.all || '1'
  });

  // 处理查询条件 - 支持两种格式：
  // 1. getDataData格式：通过columnQueries数组
  // 2. searchForm格式：通过indexQuery、operator和queryValue
  const columnQueries = [];

  // 优先处理columnQueries数组（getDataData格式）
  if (Array.isArray(props.searchForm?.columnQueries) && props.searchForm.columnQueries.length > 0) {
    console.log('Using columnQueries from getDataData format');
    // 转换columnQueries格式，确保字段名称正确
    props.searchForm.columnQueries.forEach(query => {
      columnQueries.push({
        columnName: query.columnName || query.indexQuery || '',
        columnValue: query.columnValue || query.queryValue || '',
        queryMode: query.queryMode || query.operator || 'eq',
        logicalSymbol: query.logicalSymbol || '并且'
      });
    });
  }
  // 然后检查是否有indexQuery（searchForm格式）
  else if (props.searchForm?.indexQuery) {
    console.log('Using indexQuery from searchForm format');
    columnQueries.push({
      columnName: props.searchForm.indexQuery,
      columnValue: props.searchForm.queryValue || '',
      queryMode: props.searchForm.operator || 'eq',
      logicalSymbol: '并且'
    });
  }

  // 设置转换后的columnQueries
  tempQueryCriteria.columnQueries = columnQueries;

  // 添加调试日志，确认查询条件是否正确处理
  console.log('tempQueryCriteria after processing:', tempQueryCriteria);
  console.log('columnQueries for display:', columnQueries);

  // 打开AllConditions模态框
  allConditionsVisible.value = true;
};

// 确认添加私有分类标签
const confirmAddPrivateTag = async (categoryId) => {
  const category = categories.value.find(cat => cat.id === categoryId);
  if (!category || category.isPrivate !== '1') return;

  if (!category.newPrivateTagName.trim()) {
    category.isAddingPrivateTag = false;
    category.newPrivateTagName = '';
    return;
  }

  // 保存当前标签信息，准备弹出AllConditions模态框
  Object.assign(currentAddingTagInfo, {
    categoryId,
    subCategoryId: '',
    tagName: category.newPrivateTagName.trim(),
    isPrivate: true
  });

  // 初始化临时查询条件 - 首先清空当前值
  Object.keys(tempQueryCriteria).forEach(key => {
    if (key === 'columnQueries') {
      tempQueryCriteria[key] = [];
    } else {
      tempQueryCriteria[key] = '';
    }
  });

  // 复制基本字段
  Object.assign(tempQueryCriteria, {
    currentReport: props.searchForm?.currentReport || props.searchForm?.tableName || '',
    reportType: props.searchForm?.reportType || props.searchForm?.specialtyCode || '',
    indexQuery: props.searchForm?.indexQuery || '',
    reportPeriod: props.searchForm?.reportPeriod || '1',
    filter: props.searchForm?.filter || '1',
    operator: props.searchForm?.operator || 'eq',
    queryValue: props.searchForm?.queryValue || '',
    all: props.searchForm?.all || '1'
  });

  // 处理查询条件 - 支持两种格式：
  // 1. getDataData格式：通过columnQueries数组
  // 2. searchForm格式：通过indexQuery、operator和queryValue
  const columnQueries = [];

  // 优先处理columnQueries数组（getDataData格式）
  if (Array.isArray(props.searchForm?.columnQueries) && props.searchForm.columnQueries.length > 0) {
    console.log('Using columnQueries from getDataData format');
    // 转换columnQueries格式，确保字段名称正确
    props.searchForm.columnQueries.forEach(query => {
      columnQueries.push({
        columnName: query.columnName || query.indexQuery || '',
        columnValue: query.columnValue || query.queryValue || '',
        queryMode: query.queryMode || query.operator || 'eq',
        logicalSymbol: query.logicalSymbol || '并且'
      });
    });
  }
  // 然后检查是否有indexQuery（searchForm格式）
  else if (props.searchForm?.indexQuery) {
    console.log('Using indexQuery from searchForm format');
    columnQueries.push({
      columnName: props.searchForm.indexQuery,
      columnValue: props.searchForm.queryValue || '',
      queryMode: props.searchForm.operator || 'eq',
      logicalSymbol: '并且'
    });
  }

  // 设置转换后的columnQueries
  tempQueryCriteria.columnQueries = columnQueries;

  // 添加调试日志，确认查询条件是否正确处理
  console.log('tempQueryCriteria after processing:', tempQueryCriteria);
  console.log('columnQueries for display:', columnQueries);

  // 打开AllConditions模态框
  allConditionsVisible.value = true;
};

// 取消添加标签（非私有分类）
const cancelAddTag = (categoryId, subCategoryId) => {
  const category = categories.value.find(cat => cat.id === categoryId);
  if (!category || !category.tagsDtoList) return;

  const subCategory = category.tagsDtoList.find(sub => sub.id === subCategoryId);
  if (subCategory) {
    subCategory.isAdding = false;
    subCategory.newTagName = '';
  }
};

// 取消添加私有分类标签
const cancelAddPrivateTag = (categoryId) => {
  const category = categories.value.find(cat => cat.id === categoryId);
  if (category && category.isPrivate === '1') {
    category.isAddingPrivateTag = false;
    category.newPrivateTagName = '';
  }
};

// 删除标签（非私有分类）
const deleteTag = async (subCategoryId, tagIndex, tag) => {
  if (!tag.ID_) {
    console.error('未找到标签的有效ID');
    return;
  }

  try {
    const result = await removeTag({
      id: tag.ID_
    });

    if (result && result.code === 200) {
      // 从对应的子分类中删除标签
      categories.value.forEach(category => {
        if (category.tagsDtoList) {
          category.tagsDtoList.forEach(subCategory => {
            if (subCategory.id === subCategoryId && subCategory.tags) {
              subCategory.tags.splice(tagIndex, 1);

              // 从选中标签中移除
              selectedTags.value = selectedTags.value.filter(selectedTag =>
                  !(selectedTag.subCategoryId === subCategoryId && selectedTag.tagIndex === tagIndex && !selectedTag.isPrivate)
              );
            }
          });
        }
      });
    } else {
      console.error('标签删除失败:', result?.message || '未知错误');
    }
  } catch (error) {
    console.error('删除标签时发生错误:', error);
  }
};

// 删除私有分类标签
const deletePrivateTag = async (categoryId, tagIndex, tag) => {
  if (!tag.ID_) {
    console.error('未找到标签的有效ID');
    return;
  }

  try {
    const result = await removeTag({
      id: tag.ID_
    });

    if (result && result.code === 200) {
      // 直接从分类的tags数组中删除标签
      const category = categories.value.find(cat => cat.id === categoryId);
      if (category && category.tags) {
        category.tags.splice(tagIndex, 1);

        // 从选中标签中移除
        selectedTags.value = selectedTags.value.filter(selectedTag =>
            !(selectedTag.categoryId === categoryId && selectedTag.tagIndex === tagIndex && selectedTag.isPrivate)
        );
      }
    } else {
      console.error('私有分类标签删除失败:', result?.message || '未知错误');
    }
  } catch (error) {
    console.error('删除私有分类标签时发生错误:', error);
  }
};

const handleOk = () => {
  if (selectedTags.value.length > 0) {
    const selectedTag = selectedTags.value[0];
    const queryCriteria = selectedTag.tagData?.QUERY_CRITERIA || {};
    emit('confirm', queryCriteria);
  }
  emit('update:visible', false);
};

const handleCancel = () => {
  emit('update:visible', false);
};

// 获取分类中选中的标签数量
const getSelectedTagsCount = (category) => {
  if (category.isPrivate === '1') {
    // 私有分类：直接计算分类的tags数组
    if (!category.tags) return 0;
    let count = 0;
    category.tags.forEach((tag, tagIndex) => {
      if (isPrivateTagSelected(category.id, tagIndex)) {
        count++;
      }
    });
    return count;
  } else {
    // 非私有分类：计算子分类中的标签
    if (!category.tagsDtoList) return 0;
    let count = 0;
    category.tagsDtoList.forEach(subCategory => {
      if (subCategory.tags) {
        subCategory.tags.forEach((tag, tagIndex) => {
          if (isTagSelected(subCategory.id, tagIndex)) {
            count++;
          }
        });
      }
    });
    return count;
  }
};

// 获取分类中标签总数
const getTotalTagsCount = (category) => {
  if (category.isPrivate === '1') {
    // 私有分类：直接返回tags数组的长度
    return category.tags ? category.tags.length : 0;
  } else {
    // 非私有分类：子分类中标签总数
    if (!category.tagsDtoList) return 0;
    let count = 0;
    category.tagsDtoList.forEach(subCategory => {
      if (subCategory.tags) {
        count += subCategory.tags.length;
      }
    });
    return count;
  }
};

watch(() => props.visible, (newVal) => {
  if (newVal) {
    selectedTags.value = [];
    pinnedSections.value = {};

    // 重置所有添加状态
    categories.value.forEach(category => {
      if (category.isPrivate !== '1' && category.tagsDtoList) {
        category.tagsDtoList.forEach(subCategory => {
          subCategory.isAdding = false;
          subCategory.newTagName = '';
        });
      }
      if (category.isPrivate === '1') {
        category.isAddingPrivateTag = false;
        category.newPrivateTagName = '';
      }
    });

    // 加载标签数据
    loadTagData();
  }
});

// 新建分类相关
const isCreatingNewCategory = ref(false);
const newCategoryName = ref('');
const newCategoryParentId = ref('');
const newCategoryIsPrivate = ref(false);

// 显示新建分类的输入框
const createNewCategory = (parentId) => {
  const category = categories.value.find(cat => cat.id === parentId);
  if (category && category.isPrivate === '1') return;

  isCreatingNewCategory.value = true;
  newCategoryName.value = '';
  newCategoryParentId.value = parentId;

  nextTick(() => {
    const inputElement = document.querySelector('.new-category-input');
    if (inputElement) {
      inputElement.focus();
    }
  });
};

// 确认创建新分类
const confirmCreateCategory = async () => {
  if (newCategoryName.value && newCategoryName.value.trim()) {
    try {
      const category = categories.value.find(cat => cat.id === newCategoryParentId.value);
      if (category && category.isPrivate === '1') {
        console.error('私有分类不允许新建子分类');
        isCreatingNewCategory.value = false;
        return;
      }

      const categoryData = {
        category_name: newCategoryName.value.trim(),
        is_private: newCategoryIsPrivate.value ? '1' : '0',
        parent_category_id: newCategoryParentId.value,
        sort: 125,
      };

      const result = await saveTag(categoryData, {alias: 'query_tag_categories'});

      if (result && result.code === 200) {
        console.log('新建分类API调用成功:', result.data);

        const newSubCategory = {
          id: result.data?.id || `new-subcategory-${Date.now()}`,
          categroyName: newCategoryName.value.trim(),
          isPrivate: newCategoryIsPrivate.value ? '1' : '0',
          parentCategoryId: newCategoryParentId.value,
          sort: 125,
          tags: []
        };

        const parentCategory = categories.value.find(cat => cat.id === newCategoryParentId.value);
        if (parentCategory) {
          if (!parentCategory.tagsDtoList) {
            parentCategory.tagsDtoList = [];
          }
          parentCategory.tagsDtoList.push(newSubCategory);
        }

        isCreatingNewCategory.value = false;
        newCategoryName.value = '';
        newCategoryParentId.value = '';
        newCategoryIsPrivate.value = false;
      } else {
        console.error('新建分类失败:', result?.message || '未知错误');
        isCreatingNewCategory.value = false;
      }
    } catch (error) {
      console.error('创建分类时发生错误:', error);
      isCreatingNewCategory.value = false;
    }
  }
};

// 取消创建新分类
const cancelCreateCategory = () => {
  isCreatingNewCategory.value = false;
  newCategoryName.value = '';
  newCategoryParentId.value = '';
  newCategoryIsPrivate.value = false;
};

// AllConditions模态框确认处理
const handleAllConditionsOk = async (conditions) => {
  try {
    // 如果有从AllConditions返回的条件数据，则更新tempQueryCriteria
    if (conditions && conditions.length > 0) {
      // 将多个条件保存到queryParams中
      Object.assign(tempQueryCriteria, {
        columnQueries: conditions
      });
    }

    // 构建符合SaveTagParams接口要求的数据格式
    // 从tempQueryCriteria中提取查询条件数组
    let queryCriteriaArray = [];

    // 优先使用columnQueries数组（如果有）
    if (Array.isArray(tempQueryCriteria.columnQueries) && tempQueryCriteria.columnQueries.length > 0) {
      queryCriteriaArray = [...tempQueryCriteria.columnQueries];
    }
    // 否则检查是否有单个查询条件
    else if (tempQueryCriteria.indexQuery) {
      queryCriteriaArray = [{
        columnName: tempQueryCriteria.indexQuery,
        columnValue: tempQueryCriteria.queryValue || '',
        queryMode: tempQueryCriteria.operator || 'eq',
        logicalSymbol: '并且'
      }];
    }

    // 保留完整的查询条件信息用于前端显示，但仅将查询条件数组传给后端
    const fullQueryCriteria = JSON.stringify(tempQueryCriteria);

    const tagData = {
      query_criteria: queryCriteriaArray, // 后端API需要的是数组格式
      category_id: currentAddingTagInfo.isPrivate ? currentAddingTagInfo.categoryId : currentAddingTagInfo.subCategoryId,
      tag_name: currentAddingTagInfo.tagName
    };

    console.log('Saving tag with format: query_cirteria as array, not stringified');
    const result = await saveTag(tagData);

    if (result && result.code === 200) {
      console.log('标签添加成功:', result.data);

      // 创建新标签对象
      const newTag = {
        CATEGORY_ID: currentAddingTagInfo.isPrivate ? currentAddingTagInfo.categoryId : currentAddingTagInfo.subCategoryId,
        ID_: result.data?.id || `new-tag-${Date.now()}`,
        QUERY_CRITERIA: JSON.stringify(tempQueryCriteria),
        TAG_NAME: currentAddingTagInfo.tagName
      };

      if (currentAddingTagInfo.isPrivate) {
        // 私有分类处理
        const category = categories.value.find(cat => cat.id === currentAddingTagInfo.categoryId);
        if (category && category.isPrivate === '1') {
          if (!category.tags) {
            category.tags = [];
          }
          category.tags.push(newTag);
          category.isAddingPrivateTag = false;
          category.newPrivateTagName = '';
        }
      } else {
        // 非私有分类处理
        const category = categories.value.find(cat => cat.id === currentAddingTagInfo.categoryId);
        if (category && category.tagsDtoList) {
          const subCategory = category.tagsDtoList.find(sub => sub.id === currentAddingTagInfo.subCategoryId);
          if (subCategory) {
            if (!subCategory.tags) {
              subCategory.tags = [];
            }
            subCategory.tags.push(newTag);
            subCategory.isAdding = false;
            subCategory.newTagName = '';
          }
        }
      }

      // 关闭AllConditions模态框
      allConditionsVisible.value = false;
    } else {
      console.error('标签添加失败:', result?.message || '未知错误');
    }
  } catch (error) {
    console.error('添加标签时发生错误:', error);
  }
};

// AllConditions模态框取消处理
const handleAllConditionsCancel = () => {
  // 关闭模态框，不保存标签
  allConditionsVisible.value = false;

  // 重置标签添加状态
  if (currentAddingTagInfo.isPrivate) {
    const category = categories.value.find(cat => cat.id === currentAddingTagInfo.categoryId);
    if (category && category.isPrivate === '1') {
      category.isAddingPrivateTag = false;
      category.newPrivateTagName = '';
    }
  } else {
    const category = categories.value.find(cat => cat.id === currentAddingTagInfo.categoryId);
    if (category && category.tagsDtoList) {
      const subCategory = category.tagsDtoList.find(sub => sub.id === currentAddingTagInfo.subCategoryId);
      if (subCategory) {
        subCategory.isAdding = false;
        subCategory.newTagName = '';
      }
    }
  }
};

</script>

<style scoped>
/* 样式保持不变 */
.tag-tree-container {
  max-height: 500px;
  overflow-y: auto;
}

.tag-tree-container::-webkit-scrollbar {
  width: 6px;
}

.tag-tree-container::-webkit-scrollbar-track {
  background: white;
  border-radius: 3px;
}

.tag-tree-container::-webkit-scrollbar-thumb {
  background: #f1f1f1;
  border-radius: 3px;
}

.tag-tree-container::-webkit-scrollbar-thumb:hover {
  background: #d9d9d9;
}

.mt-8 {
  margin-top: 8px;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 4px;
}

.title-text {
  font-size: 14px;
  font-weight: 500;
  color: rgb(55, 55, 55);
}

.section {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

/* 为最后一个子分类移除底部边框 */
:deep(.ant-collapse-content-box) .section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.pin-icon {
  color: #546fff;
  font-size: 14px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.pin-icon:hover {
  transform: scale(1.15);
  color: #1d39ff;
}

.pin-icon.pinned {
  transform: rotate(-45deg);
  color: #1d39ff;
}

.pin-icon.pinned:hover {
  transform: rotate(-45deg) scale(1.15);
}

.divider {
  color: #d9d9d9;
  margin: 0 4px;
}

.tag-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  justify-items: stretch;
  width: 80%;
  max-width: 400px;
  margin: 0 auto;
}

.tag-btn-container {
  position: relative;
  width: 100%;
}

.tag-btn {
  height: 32px;
  padding: 0 14px;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  font-size: 12px;
  white-space: nowrap;
  background: white;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  transition: all 0.25s;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-btn.active {
  background: #546fff;
  border-color: #546fff;
  color: white;
  justify-content: flex-start;
}

.tag-btn.add-btn {
  border-style: dashed;
  color: #999;
  justify-content: center;
}

.tag-btn.add-btn:not(.plus-circle){
  width: 100% !important;
  padding: 0 14px !important;
  border-radius: 10px;
  justify-content: center;
}

.plus-circle {
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  justify-content: center;
}

.tag-btn.add-btn:hover {
  border-color: #546fff;
  color: #546fff;
}

.delete-icon {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 14px;
  color: #ff4d4f;
  background: white;
  border-radius: 50%;
  padding: 2px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1;
  transition: all 0.2s ease;
}

.delete-icon:hover {
  color: #fff;
  background: #ff4d4f;
  transform: scale(1.1);
}

.add-tag-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 165px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  padding: 0 8px;
  background: white;
  box-sizing: border-box;
}

.add-tag-input-container :deep(.ant-input) {
  border: none;
  outline: none;
  box-shadow: none;
  font-size: 12px;
  padding: 0;
  height: 24px;
  flex: 1;
}

.add-tag-input-container :deep(.ant-input:focus) {
  border: none;
  box-shadow: none;
}

.add-tag-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.confirm-icon, .cancel-icon {
  font-size: 12px;
  cursor: pointer;
  transition: color 0.2s;
  padding: 2px;
}

.confirm-icon {
  color: #52c41a;
}

.confirm-icon:hover {
  color: #389e0d;
}

.cancel-icon {
  color: #ff4d4f;
}

.cancel-icon:hover {
  color: #d9363e;
}

:deep(.ant-collapse) {
  background: transparent;
  border: none;
}

:deep(.ant-collapse-panel) {
  border: none !important;
}

:deep(.ant-collapse .ant-collapse-content > .ant-collapse-content-box) {
  padding: 0 !important;
}

:deep(.ant-collapse-header) {
  padding: 8px !important;
  align-items: center !important;
  background: #e0e7ff !important;
}

:deep(.ant-collapse-item-active .ant-collapse-header) {
  background: rgba(245, 245, 247, 1) !important;
}

:deep(.ant-collapse-content) {
  background: white;
}

:deep(.ant-modal-content) {
  padding: 20px;
}

:deep(.ant-modal-header) {
  border-bottom: none;
  padding: 0;
  margin-bottom: 20px;
}

:deep(.ant-modal-title) {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  text-align: center;
}

:deep(.ant-modal-body) {
  padding: 0;
}

.new-category-section {
  background-color: #f0f5ff;
  border: 1px dashed #546fff;
}

.new-category-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.new-category-input {
  flex: 1;
  max-width: 200px;
}

.new-category-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.new-category-actions .confirm-icon,
.new-category-actions .cancel-icon {
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  transition: all 0.2s;
}

.new-category-actions .confirm-icon {
  color: #52c41a;
}

.new-category-actions .confirm-icon:hover {
  color: #389e0d;
  transform: scale(1.1);
}

.new-category-actions .cancel-icon {
  color: #ff4d4f;
}

.new-category-actions .cancel-icon:hover {
  color: #d9363e;
  transform: scale(1.1);
}
</style>


