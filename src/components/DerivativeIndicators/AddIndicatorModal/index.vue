<template>
  <a-modal
      v-model:visible="visible"
      :title="modalTitle"
      width="600px"
      :footer="null"
      :maskClosable="false"
      class="add-indicator-modal"
      @cancel="handleCancel"
  >
    <a-form
        ref="formRef"
        :model="formState"
        :rules="rules"
        layout="vertical"
        class="add-indicator-form"
    >
      <!-- 衍生指标名称和代码（一列布局） -->
      <a-form-item
          label="衍生指标名称"
          name="name"
          :rules="[{ required: true, message: '请输入衍生指标名称' }]"
      >
        <a-input
            v-model:value="formState.name"
            placeholder="请输入衍生指标名称"
            size="large"
            class="form-input"
        />
      </a-form-item>
      <a-form-item label="衍生指标代码">
        <a-input
            v-model:value="formState.code"
            placeholder="自动生成"
            size="large"
            disabled
            class="form-input"
        />
      </a-form-item>

      <!-- 第二行：计量单位和小数显示位数 -->
      <div class="form-row">
        <a-form-item label="计量单位" name="unit" class="form-item">
          <a-input
              v-model:value="formState.unit"
              placeholder="请手动输入计量单位"
              size="large"
              class="form-input"
          />
        </a-form-item>
        <a-form-item
            label="小数显示位数"
            name="decimalPlaces"
            class="form-item"
            :rules="[{ required: true, message: '请输入小数显示位数' }]"
        >
          <a-input-number
              v-model:value="formState.decimalPlaces"
              placeholder="请输入小数位数"
              :min="0"
              :max="10"
              style="width: 100%"
              size="large"
              class="form-input-number"
          />
        </a-form-item>
      </div>

      <!-- 衍生指标公式编辑 -->
      <a-form-item
          name="formula"
          :rules="[{ required: true, message: '请输入衍生指标公式' }]"
      >
        <template #label>
          <div class="formula-label-container">
            <span class="formula-main-label">衍生指标公式编辑</span>
            <span class="formula-editor-label" @click="handleFormulaEditorClick">公式编辑器</span>
          </div>
        </template>
        <a-textarea
            v-model:value="formState.formula"
            placeholder="请输入公式"
            :rows="3"
            class="form-textarea"
        />
      </a-form-item>

      <!-- 汇总公式部分 -->
<!--      <div class="summary-formula-container">-->
<!--        <div class="checkbox-container">-->
<!--          <a-checkbox v-model:checked="formState.useDifferentFormula">-->
<!--            <span class="checkbox-text">汇总时用不同公式</span>-->
<!--          </a-checkbox>-->
<!--          <span class="formula-editor-label" @click="handleSummaryFormulaEditorClick">公式编辑器</span>-->
<!--        </div>-->

<!--        <a-form-item-->
<!--            v-if="formState.useDifferentFormula"-->
<!--            name="summaryFormula"-->
<!--            :rules="formState.useDifferentFormula ? [{ required: true, message: '请输入汇总公式' }] : []"-->
<!--            class="summary-form-item"-->
<!--        >-->
<!--          <a-textarea-->
<!--              v-model:value="formState.summaryFormula"-->
<!--              placeholder="请输入汇总单独处理公式"-->
<!--              :rows="3"-->
<!--              class="form-textarea"-->
<!--          />-->
<!--        </a-form-item>-->
<!--      </div>-->

      <!-- 归属报表和标签 -->
      <div class="form-row">
        <a-form-item label="归属报表" class="form-item">
          <a-input
              v-model:value="formState.report"
              placeholder="根据指标公式自动识别"
              size="large"
              disabled
              class="form-input"
          />
        </a-form-item>
        <a-form-item label="标签" class="form-item">
          <div class="tags-container">
            <!-- 显示已添加的标签 -->
            <div v-if="formState.tags.length > 0" class="tags-list">
              <span
                  v-for="(tag, index) in formState.tags"
                  :key="index"
                  class="tag-item"
              >
                {{ tag }}
                <CloseOutlined
                    @click="removeTag(index)"
                    class="tag-remove-icon"
                />
              </span>
            </div>

            <!-- 标签输入区域 -->
            <div class="tag-input-container" v-if="isAddingTag">
              <input
                  v-model="newTagName"
                  type="text"
                  placeholder="请输入标签名称"
                  class="tag-input"
                  @keydown="handleTagInputKeyPress"
              />
              <div class="tag-input-actions">
                <a-button type="primary" size="small" @click="confirmAddTag" style=" background: rgba(84,111,255,1);">确定</a-button>
                <a-button size="small" @click="cancelAddTag">取消</a-button>
              </div>
            </div>

            <!-- 新增标签按钮 -->
            <a-button
                v-else
                type="dashed"
                @click="addTag"
                class="add-tag-btn"
                size="large"
            >
              <PlusOutlined /> 新增标签
            </a-button>
          </div>
        </a-form-item>
      </div>

      <!-- 按钮区域 -->
      <div class="form-actions">
        <a-button
            type="primary"
            @click="handleSave"
            class="save-btn"
            :loading="saveLoading"
            size="large"
        >
          保存
        </a-button>
        <a-button
            @click="handleCancel"
            class="cancel-btn"
            size="large"
        >
          取消
        </a-button>
      </div>
    </a-form>
  </a-modal>

  <!-- 公式编辑器弹窗 - 全屏模式 -->
  <a-modal
      v-model:visible="showEquationEditor"
      title="公式编辑器"
      :closable="false"
      :mask-closable="false"
      :footer="null"
      :width="'100vw'"
      :style="{ top: 0, padding: 0 }"
      :body-style="{ padding: 0, height: '100vh' }"
      wrap-class-name="full-screen-modal"
      class="equation-editor-modal"
  >
    <EquationEditor
        v-model="currentFormula"
        @confirm="handleEquationEditorConfirm"
        @back="handleEquationEditorBack"
    />
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons-vue';
import { message, type FormInstance } from 'ant-design-vue';
import EquationEditor from '../EquationEditor/index.vue';
import { buniscGetData } from '@/api/data-processing';

// 定义props
interface Props {
  visible: boolean;
  editingData: any | null;
}

// 定义emit事件
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'saved', data: any): void;
  (e: 'cancel'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 公式编辑器相关状态
const showEquationEditor = ref(false);
const currentFormulaType = ref('formula'); // 'formula' 或 'summaryFormula'

// 计算属性用于v-model绑定
const currentFormula = computed({
  get: () => {
    return currentFormulaType.value === 'summaryFormula' ? formState.summaryFormula : formState.formula;
  },
  set: (value) => {
    if (currentFormulaType.value === 'summaryFormula') {
      formState.summaryFormula = value;
    } else {
      formState.formula = value;
    }
  }
});

// 表单数据接口
interface IndicatorForm {
  name: string;
  code: string;
  unit: string;
  decimalPlaces: number | null;
  formula: string;
  useDifferentFormula: boolean;
  summaryFormula: string;
  report: string;
  tags: string[];
}

// 响应式数据
const visible = ref(false);
const saveLoading = ref(false);
const formRef = ref<FormInstance>();
const isAddingTag = ref(false);
const newTagName = ref('');
// 报表列表相关
const reportList = ref<Array<{value: string; label: string}>>([]);
const reportListLoading = ref(false);

// 计算模态框标题
const modalTitle = computed(() => {
  return props.editingData ? '修改指标' : '新增指标';
});

// 表单数据
const formState = reactive<IndicatorForm>({
  name: '', // 默认值
  code: '',
  unit: '',
  decimalPlaces: 2,
  formula: '',
  useDifferentFormula: false,
  summaryFormula: '',
  report: '',
  tags: []
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入衍生指标名称', trigger: 'blur' }
  ],
  decimalPlaces: [
    { required: true, message: '请输入小数显示位数', trigger: 'blur' }
  ],
  formula: [
    { required: true, message: '请输入衍生指标公式', trigger: 'blur' }
  ]
};



// 监听内部visible变化，同步到父组件
watch(visible, (newVal) => {
  emit('update:visible', newVal);
});

// 监听公式编辑器显示状态，控制页面滚动
watch(showEquationEditor, (newVal) => {
  if (newVal) {
    // 禁止滚动
    document.body.style.overflow = 'hidden';
  } else {
    // 恢复滚动
    document.body.style.overflow = '';
  }
});

// 不再从公式中提取归属报表，仅使用EquationEditor传递的原始表号数据

// 组件卸载时恢复滚动
onUnmounted(() => {
  document.body.style.overflow = '';
});

// 已删除从公式中提取表号的相关函数
// extractReportFromFormula 和 updateReportFromFormula 函数已被移除
// 现在仅使用EquationEditor传递的原始表号数据

// 生成指标代码
const generateIndicatorCode = () => {
  const timestamp = new Date().getTime();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  formState.code = `IND_${timestamp}_${random}`;
};

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields();
  }
  // 重置表单数据
  formState.name = '';
  formState.code = '';
  formState.unit = '万元';
  formState.decimalPlaces = 2;
  formState.formula = '';
  formState.useDifferentFormula = false;
  formState.summaryFormula = '';
  formState.report = '';
  formState.tags = [];
  isAddingTag.value = false;
  newTagName.value = '';
};

// 填充编辑数据
const fillEditingData = () => {
  if (!props.editingData) return;

  // 填充表单数据
  formState.name = props.editingData.NAME || '';
  formState.code = props.editingData.CODE || '';
  formState.unit = props.editingData.MEASURE_UNIT || '万元';
  formState.decimalPlaces = props.editingData.DECIMAL_PLACES || 2;
  formState.formula = props.editingData.FORMULA_EDIT || '';
  formState.useDifferentFormula = !!(props.editingData.DIFFERENT_FORMULA);
  formState.summaryFormula = props.editingData.DIFFERENT_FORMULA || '';
  formState.report = props.editingData.BELONGING_REPORT || '601-1';
  formState.tags = props.editingData.tags || [];
};

// 监听editingData变化
watch(() => props.editingData, (newData) => {
  if (newData && visible.value) {
    fillEditingData();
  }
}, { deep: true });

// 组件挂载时获取报表列表
onMounted(() => {
});

// 监听模态框显示状态
watch(() => props.visible, (newVisible) => {
  visible.value = newVisible;
  if (newVisible) {
    // 如果报表列表为空，尝试重新获取
    if (reportList.value.length === 0) {
    }

    if (props.editingData) {
      nextTick(() => {
        fillEditingData();
      });
    } else {
      resetForm();
      // 生成代码
      generateIndicatorCode();
    }
  }
});

// 开始添加标签
const addTag = () => {
  isAddingTag.value = true;
  // 下一步自动聚焦输入框
  nextTick(() => {
    const inputElement = document.querySelector('.tag-input') as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  });
};

// 确认添加标签
const confirmAddTag = () => {
  if (newTagName.value && newTagName.value.trim() !== '') {
    const trimmedTag = newTagName.value.trim();
    // 检查标签是否已存在
    if (formState.tags.includes(trimmedTag)) {
      message.warning('该标签已存在，请输入其他标签名');
      return;
    }
    formState.tags.push(trimmedTag);
    newTagName.value = '';
    isAddingTag.value = false;
  }
};

// 取消添加标签
const cancelAddTag = () => {
  newTagName.value = '';
  isAddingTag.value = false;
};

// 处理输入框回车事件
const handleTagInputKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    confirmAddTag();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    cancelAddTag();
  }
};

// 移除标签
const removeTag = (index: number) => {
  formState.tags.splice(index, 1);
};

// 保存指标
const handleSave = async () => {
  if (!formRef.value) return;

  try {
    // 验证表单
    await formRef.value.validate();

    saveLoading.value = true;

    // 准备提交数据
    const submitData = {
      ...formState,
      // 过滤空标签
      tags: formState.tags.filter(tag => tag.trim() !== '')
    };

    console.log('提交的数据:', submitData);

    emit('saved', submitData);
    visible.value = false;

  } catch (error) {
    console.error('表单验证失败:', error);
  } finally {
    saveLoading.value = false;
  }
};

// 取消操作
const handleCancel = () => {
  visible.value = false;
  emit('cancel');
};

// 处理公式编辑器点击事件
const handleFormulaEditorClick = () => {
  currentFormulaType.value = 'formula';
  showEquationEditor.value = true;
};

// 处理汇总公式编辑器点击事件
const handleSummaryFormulaEditorClick = () => {
  // 如果未勾选汇总时用不同公式，先勾选
  if (!formState.useDifferentFormula) {
    formState.useDifferentFormula = true;
  }
  currentFormulaType.value = 'summaryFormula';
  showEquationEditor.value = true;
};

// 处理公式编辑器确认事件
const handleEquationEditorConfirm = (formula: string, originalTableCodes?: string[]) => {
  if (currentFormulaType.value === 'summaryFormula') {
    formState.summaryFormula = formula;
    message.success('汇总公式已成功导入');
  } else {
    formState.formula = formula;
    message.success('公式已成功导入');
  }

  // 如果EquationEditor传递了原始表号数据，直接使用
  if (originalTableCodes && originalTableCodes.length > 0) {
    formState.report = originalTableCodes.join(',');
    showEquationEditor.value = false;
    return;
  }

  // 否则继续使用原有逻辑从公式中提取
  // 公式更新后会通过watch自动更新归属报表
  showEquationEditor.value = false;
};

// 处理公式编辑器返回事件
const handleEquationEditorBack = () => {
  showEquationEditor.value = false;
};
</script>

<style scoped lang="less">
/* 公式编辑器全屏模态框样式 */
:deep(.equation-editor-modal) {
  .ant-modal {
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .ant-modal-content {
    width: 100vw !important;
    height: 100vh !important;
    border-radius: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .ant-modal-body {
    height: 100vh !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: hidden !important;
  }

  .ant-modal-header {
    display: none !important;
  }
}

/* 防止页面滚动 */
body.modal-open {
  overflow: hidden !important;
}

.add-indicator-modal {
  :deep(.ant-modal-content) {
    border-radius: 8px;
  }

  :deep(.ant-modal-header) {
    border-bottom: 1px solid #f0f0f0;
    padding: 16px 24px;
  }

  :deep(.ant-modal-title) {
    font-size: 16px;
    font-weight: 600;
    color: #262626;
  }

  :deep(.ant-modal-body) {
    padding: 24px;
  }
}

.add-indicator-form {
  margin-top: 20px;
  .form-row {
    display: flex;
    gap: 16px;

    .form-item {
      flex: 1;
      margin-bottom: 16px;
    }
  }

  :deep(.ant-form-item-label) {
    font-weight: 500;
    margin-bottom: 4px;

    > label {
      color: #262626;
      font-size: 14px;

      &.ant-form-item-required::before {
        content: '*' !important;
        color: #ff4d4f;
        margin-right: 4px;
      }
    }
  }

  .form-input,
  .form-select,
  .form-input-number {
    width: 100%;

    :deep(.ant-select-selector) {
      border-radius: 6px;
    }

    :deep(.ant-input) {
      border-radius: 6px;
    }
  }

  .form-input-number {
    position: relative;
    overflow: hidden;

    /* 覆盖默认样式 */
    :deep(.ant-input-number-handler-wrap) {
      position: static;
      height: auto;
    }

    /* 整体容器 */
    :deep(.ant-input-number) {
      position: relative;
      display: flex;
      align-items: center;
    }

    /* 减号按钮 - 左侧 */
    :deep(.ant-input-number-handler-down) {
      background-color: rgba(227, 227, 232, 0.5);
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 40px;
      border-right: none;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }

    /* 加号按钮 - 右侧 */
    :deep(.ant-input-number-handler-up) {
      background-color: rgba(227, 227, 232, 0.5);
      position: absolute;
      right: 0;
      top: 0;
      height: 100%;
      width: 40px;
      border-left: none;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-bottom: none;
    }

    /* 输入框区域 */
    :deep(.ant-input-number-input-wrap) {
      flex: 1;
      padding: 0 32px;
    }

    /* 输入框 */
    :deep(.ant-input-number-input) {
      text-align: center;
      border-radius: 6px;
    }
  }

  /* 公式标签容器样式 */
  .formula-label-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 540px;
  }

  /* 主标签样式 */
  .formula-main-label {
    font-weight: 500;
    color: #262626;
    font-size: 14px;
  }

  /* 公式编辑器标签样式 */
  .formula-editor-label {
    font-size: 14px;
    color: #0091ff; /* 蓝色，与图片一致 */
    cursor: pointer;
  }

  /* 汇总公式容器样式 */
  .summary-formula-container {
    margin-bottom: 16px;
  }

  /* 复选框容器样式 */
  .checkbox-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  /* 复选框文字样式 */
  .checkbox-text {
    margin-right: 8px;
  }

  /* 汇总表单项目样式 */
  .summary-form-item {
    margin-bottom: 0;
  }

  /* 隐藏默认标签 */
  .summary-form-item:deep(.ant-form-item-label) {
    display: none;
  }

  /* 汇总公式区域的星号样式 */
  .summary-formula-container:has(.ant-checkbox-checked) .summary-form-item:deep(.ant-form-item-label)::before {
    content: '*';
    color: #ff4d4f;
    margin-right: 4px;
  }

  /* 公式文本区域样式 */
  .form-textarea {
    :deep(.ant-input) {
      border-radius: 6px;
      resize: none;
    }
  }

  .tags-container {
    .add-tag-btn {
      width: 100%;
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      margin-bottom: 10px;
      gap: 8px;

      .tag-item {
        display: inline-flex;
        align-items: center;
        background: #f0f0f0;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;

        .tag-remove-icon {
          margin-left: 4px;
          color: #999;
          cursor: pointer;
          font-size: 10px;

          &:hover {
            color: #ff4d4f;
          }
        }
      }
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
    padding-top: 16px;

    .cancel-btn {
      border-radius: 6px;
      padding: 0 20px;
      height: 40px;
      background-color: rgba(249,249,250,1);
      color: rgba(227,227,232,1);
      border: 1px solid rgba(227,227,232,1);
    }

    .save-btn {
      border-radius: 6px;
      padding: 0 20px;
      height: 40px;
      background: rgba(84,111,255,1);
      border-color: rgba(84,111,255,1);
    }

    .cancel-btn:hover{
      color: #1890ff;
      border: 1px solid #1890ff;
    }
  }
}
.tag-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.tag-input {
  flex: 1;
  padding: 6px 11px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.tag-input:focus {
  border-color: #40a9ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.tag-input-actions {
  display: flex;
  gap: 8px;
}

</style>

<style>
/* 全局样式，确保全屏模态框正常工作 */
.full-screen-modal {
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
}

.full-screen-modal .ant-modal {
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  max-width: 100vw !important;
  max-height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
}

.full-screen-modal .ant-modal-content {
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.full-screen-modal .ant-modal-body {
  height: 100vh !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
}

.full-screen-modal .ant-modal-header {
  display: none !important;
}
</style>