<template>
  <a-modal
      :visible="visible"
      title="新增汇总模板"
      width="500px"
      :footer="null"
      :closable="true"
      :maskClosable="false"
      class="save-template-modal"
      @cancel="handleCancel"
      @ok="handleOk"
  >
    <div class="template-form">
      <!-- 显示模板名称 -->
      <div class="form-item">
        <label class="form-label">汇总模板名称<span class="required">*</span></label>
        <a-input
            v-model:value="formData.name"
            placeholder="请输入汇总模板名称"
            class="form-input"
            :maxlength="50"
        />
      </div>

      <!-- 模板描述 -->
      <div class="form-item">
        <label class="form-label">模板描述<span class="required">*</span></label>
        <a-textarea
            v-model:value="formData.description"
            placeholder="请输入模板描述"
            :rows="3"
            class="form-textarea"
            :maxlength="200"
        />
      </div>

      <!-- 共享和创建人 -->
      <div class="form-row">
        <div class="form-item half-width">
          <label class="form-label">创建人</label>
          <a-input
              v-model:value="formData.creator"
              placeholder="请输入创建人"
              class="form-input"
          />
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="form-buttons">
        <a-button
            type="primary"
            class="save-btn"
            @click="handleSave"
            :loading="loading"
        >
          保存
        </a-button>
        <a-button
            class="cancel-btn"
            @click="handleCancel"
            :disabled="loading"
        >
          取消
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { useUserStore } from '@/store/modules/user';
import { getUserProfile } from '@/api/user/index';

// 定义表单数据类型
interface TemplateFormData {
  name: string;
  description: string;
  shared: '是' | '否';
  creator: string;
}

// 定义props接口
interface Props {
  visible: boolean;
  initialData?: Partial<TemplateFormData>;
  currentMetrics?: any[];
}

// 定义emit事件类型
interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'save', data: { formData: TemplateFormData; metrics: any[] }): void;
  (e: 'cancel'): void;
}

// 定义props
const props = withDefaults(defineProps<Props>(), {
  visible: false,
  initialData: () => ({}),
  currentMetrics: () => []
});

// 定义emit
const emit = defineEmits<Emits>();

// 加载状态
const loading = ref(false);

// 使用用户store
const userStore = useUserStore();

// 获取当前用户名
const getCurrentUsername = async (): Promise<string> => {
  try {
    // 首先检查store中是否已有用户信息
    if (userStore.user_name) {
      return userStore.user_name;
    }

    // 如果store中没有，则尝试直接调用API获取
    const response = await getUserProfile();
    const userData = response.data?.user || response.data;
    if (userData) {
      // 提取用户名（支持多种可能的字段名）
      return userData.username || userData.name || userData.userName || userData.user_name || '';
    }

    // 作为最后的后备方案，尝试从localStorage获取
    const userInfoStr = localStorage.getItem('user-info');
    if (userInfoStr) {
      const userInfo = JSON.parse(userInfoStr);
      return userInfo.username || userInfo.name || userInfo.userName || userInfo.user_name || '';
    }
  } catch (error) {
    console.warn('获取当前用户信息失败:', error);
  }
  return '';
};

// 默认表单数据
const defaultFormData: TemplateFormData = {
  name: '',
  description: '',
  shared: '是',
  creator: userStore.user_name || ''
};

// 表单数据
const formData = reactive<TemplateFormData>({ ...defaultFormData });

// 计算属性：表单是否有效
const isFormValid = computed(() => {
  return formData.name.trim() !== '' && formData.description.trim() !== '';
});

// 监听visible变化
watch(() => props.visible, (newVal: boolean) => {
  if (newVal) {
    // 重置表单数据
    Object.assign(formData, defaultFormData, props.initialData);

    // 如果没有通过initialData传入creator，则异步获取当前用户
    if (!props.initialData?.creator) {
      (async () => {
        try {
          const username = await getCurrentUsername();
          if (username) {
            formData.creator = username;
          }
        } catch (error) {
          console.warn('设置当前用户名失败:', error);
        }
      })();
    }
  }
});

// 组件挂载时尝试获取用户信息
onMounted(async () => {
  try {
    // 如果store中没有用户信息，尝试获取
    if (!userStore.user_name) {
      await userStore.info();
      // 如果通过store获取成功，更新默认值
      if (userStore.user_name) {
        defaultFormData.creator = userStore.user_name;
      }
    }
  } catch (error) {
    console.warn('初始化用户信息失败:', error);
  }
});

// 表单验证
const validateForm = (): boolean => {
  if (!formData.name.trim()) {
    message.error('请输入显示模板名称');
    return false;
  }

  if (!formData.description.trim()) {
    message.error('请输入模板描述');
    return false;
  }

  if (props.currentMetrics.length === 0) {
    message.error('请先选择指标');
    return false;
  }

  return true;
};

// 保存处理
const handleSave = async (): Promise<void> => {
  if (!validateForm()) {
    return;
  }

  loading.value = true;

  try {
    // 模拟保存操作
    await new Promise(resolve => setTimeout(resolve, 500));

    // 触发保存事件
    emit('save', {
      formData: { ...formData },
      metrics: [...props.currentMetrics]
    });

    // message.success('模板保存成功');
    emit('update:visible', false);
  } catch (error) {
    message.error('保存失败，请重试');
  } finally {
    loading.value = false;
  }
};

// 取消处理
const handleCancel = (): void => {
  emit('cancel');
  emit('update:visible', false);
};

// 处理确定按钮（Modal的OK事件）
const handleOk = (): void => {
  handleSave();
};
</script>

<style scoped lang="scss">
.template-form {
  padding: 0;
}

.form-item {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 16px;
  align-items: flex-start; /* 确保两个表单项顶部对齐 */
}

.form-item.half-width {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.5;
  white-space: nowrap; /* 防止标签换行 */
}

.form-label .required {
  color: #ff4d4f;
  margin-left: 4px;
}

/* 统一输入控件的高度 */
.form-input,
.form-textarea {
  width: 100%;
  border-radius: 4px;
  height: 40px; /* 固定高度 */
  line-height: 36px; /* 垂直居中 */
}

.form-textarea {
  resize: vertical;
  height: auto; /* 文本域不固定高度 */
  min-height: 80px; /* 设置最小高度 */
  line-height: 1.5; /* 文本域行高恢复默认 */
}

/* 重点：统一选择框和输入框的高度 */
:deep(.save-template-modal .ant-select) {
  height: 36px; /* 设置选择框容器高度 */
}

:deep(.save-template-modal .ant-select-selector) {
  height: 36px !important; /* 强制设置选择框高度 */
  min-height: 36px !important;
  line-height: 34px !important; /* 垂直居中，考虑边框 */
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding-left: 12px !important; /* 增大选择框中内容与左边框的距离 */
}

:deep(.save-template-modal .ant-select-selection-item) {
  line-height: 34px !important; /* 选中项垂直居中 */
  display: flex;
  align-items: center;
}

:deep(.save-template-modal .ant-select-selection-placeholder) {
  line-height: 34px !important; /* 占位符垂直居中 */
  display: flex;
  align-items: center;
}

:deep(.save-template-modal .ant-select-arrow) {
  display: flex;
  align-items: center;
  height: 100%;
}

/* 输入框样式 */
:deep(.save-template-modal .ant-input) {
  height: 36px;
  line-height: 36px;
  border-radius: 4px;
  border: 1px solid #d9d9d9;
  padding-left: 12px; /* 增大placeholder与左边框的距离 */
}

:deep(.save-template-modal .ant-input:focus),
:deep(.save-template-modal .ant-select-focused .ant-select-selector) {
  border-color: #546fff;
  box-shadow: 0 0 0 2px rgba(84, 111, 255, 0.2);
}

/* 确保两个表单项内的控件高度一致 */
.form-row .form-item.half-width :deep(.ant-select),
.form-row .form-item.half-width :deep(.ant-input) {
  height: 36px;
}

.form-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 20px;
  padding-top: 8px;
}

.save-btn {
  background-color: #546fff;
  border-color: #546fff;
  width: 80px;
  height: 40px;
  border-radius: 12px;
  font-size: 14px;

  &:hover,
  &:focus {
    background-color: #4058ff;
    border-color: #4058ff;
  }
}

.cancel-btn {
  background-color: #f5f5f5;
  border-color: #d9d9d9;
  color: #d9d9d9;
  color: #d9d9d9;
  width: 80px;
  height: 40px;
  border-radius: 12px;
  font-size: 14px;

  &:hover,
  &:focus {
    background-color: #e6f7ff;
    border-color: #40a9ff;
    color: #40a9ff;
  }
}

/* 模态框样式调整 */
:deep(.save-template-modal .ant-modal-header) {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 24px;
  border-radius: 8px 8px 0 0;
}

:deep(.save-template-modal .ant-modal-title) {
  color: #333;
  font-weight: 500;
  font-size: 16px;
  line-height: 1.5;
}

:deep(.save-template-modal .ant-modal-body) {
  padding: 32px 24px 8px 24px; /* 增大顶部padding，增加与标题的间隔 */
}

:deep(.save-template-modal .ant-modal-close) {
  top: 16px;
  right: 24px;
  color: #999;

  &:hover {
    color: #666;
  }
}

:deep(.save-template-modal .ant-modal-close-x) {
  width: 24px;
  height: 24px;
  line-height: 24px;
}

:deep(.save-template-modal .ant-input[disabled]) {
  background-color: #f5f5f5;
  color: rgba(0, 0, 0, 0.25);
  padding-left: 12px; /* 确保禁用状态下也有适当的内边距 */
}
</style>