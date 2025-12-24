<script setup>
import { reactive, ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
// import SaveEditorTemplateModal from '../SaveEditorTemplateModal/index.vue';
import { SearchOutlined } from '@ant-design/icons-vue';
import { useRouter } from 'vue-router';
import { buniscGetData, indexGetData } from '@/api/data-processing/index';
import { pinyin } from 'pinyin-pro';
// 添加占位符提示相关的响应式数据
const showPlaceholderHint = ref(false);
const placeholderPosition = ref(0);
const lastClickedIndicator = ref(null);
// 核心函数：获取文本首字的拼音首字母（大写）
const getFirstPinyinLetter = (text) => {
  if (!text || typeof text !== 'string' || text.length === 0) {
    return '#';
  }

  const firstChar = text.charAt(0);

  try {
    // 使用 pinyin-pro 库获取拼音首字母
    const firstLetter = pinyin(firstChar, { pattern: 'first', toneType: 'none' }).toUpperCase();
    // 验证结果是否是有效的字母
    if (/^[A-Z]$/.test(firstLetter)) {
      return firstLetter;
    }
    return '#';
  } catch (error) {
    console.error('拼音转换错误:', error);
    return '#';
  }
};

const router = useRouter();
const resetForm = () => {
  formulaText.value = '';
  validationMessage.value = '';
  isValidationSuccess.value = false;
  selectedReport.value = null;
  selectedIndicators.value = [];
  indicatorData.value = [];
  // 重置搜索条件
  indicatorSearchQuery.value = '';
  // 清除选中报表行的状态
  selectedReportRow.value = null;
};
import { defineEmits } from 'vue';

// 将单一的排序状态改为对象，分别控制不同面板
const panelSortStates = ref({
  mainIndicator: true,     // 主指标面板排序状态
  derivedIndicator: true   // 衍生指标面板排序状态
});
// 为每个面板维护独立的当前字母状态
const panelCurrentLetters = ref({
  mainIndicator: '',
  derivedIndicator: ''
});
const handleConfirm = () => {
  // 验证公式
  handleValidate();

  // 如果验证通过，触发 confirm 事件和update:modelValue事件将公式传递出去
  if (isValidationSuccess.value) {
    // 将Set转换为数组传递
    const originalTableCodes = Array.from(usedOriginalTableCodes.value);
    emit('confirm', formulaText.value, originalTableCodes);
    emit('update:modelValue', formulaText.value);
  }
};

// 控制保存模板模态框显示状态
const isTemplateModalVisible = ref(false);

const handleSaveTemplate = () => {
  // 验证公式
  handleValidate();

  // 如果验证通过，显示保存模板模态框
  if (isValidationSuccess.value) {
    isTemplateModalVisible.value = true;
  }
};

// 处理模板保存
const handleTemplateSave = (data) => {
  emit('saveTemplate', {
    // 优先使用模态框传递的公式，如果没有则使用当前编辑器中的公式
    formula: data.formula !== undefined ? data.formula : formulaText.value,
    ...data
  });
};

// 处理模板取消
const handleTemplateCancel = () => {
  isTemplateModalVisible.value = false;
};
import { defineProps } from 'vue';

const props = defineProps({
  // 支持v-model绑定的公式值
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['back', 'confirm', 'update:modelValue', 'saveTemplate']);
// 注意：confirm事件现在会传递两个参数：formula和originalTableCodes
const validationMessage = ref('');
const isValidationSuccess = ref(false);
const validateParentheses = (formula) => {
  const stack = [];
  for (let i = 0; i < formula.length; i++) {
    const char = formula[i];
    if (char === '(') {
      stack.push(i);
    } else if (char === ')') {
      if (stack.length === 0) {
        return { valid: false, error: `位置 ${i} 处发现多余的右括号 ')'` };
      }
      stack.pop();
    }
  }

  if (stack.length > 0) {
    return { valid: false, error: `存在未闭合的左括号 '('，位置: ${stack}` };
  }

  return { valid: true };
};

const handleValidate = () => {
// 清除之前的验证结果
  validationMessage.value = '';
  isValidationSuccess.value = false;

// 1. 检查公式是否为空
  if (!formulaText.value || formulaText.value.trim() === '') {
    validationMessage.value = '公式不能为空';
    isValidationSuccess.value = false;
    return;
  }

  try {
// 2. 验证公式基本结构
    const formula = formulaText.value;
    console.log(formula)
// 3. 检查是否包含至少一个有效指标
    const usedIndicators = indicatorData.value.filter(indicator =>
        formula.includes(indicator.COLUMN_NAME)
    );

    if (usedIndicators.length === 0) {
      validationMessage.value = '公式中至少需要包含一个有效指标';
      isValidationSuccess.value = false;
      return;
    }
    // 3. 检查括号匹配
    const parenthesesResult = validateParentheses(formula);
    if (!parenthesesResult.valid) {
      validationMessage.value = parenthesesResult.error;
      isValidationSuccess.value = false;
      return;
    }

// 4. 检查是否包含运算符（新增验证）
// 检查是否存在任何运算符、比较符或函数
    const operatorPatterns = [
      /\+/, /\-/, /\*/, /\//, /=/, />/, /</, /\(/, /\)/, /:/,
      /&&/, /\|\|/, />=/, /<=/, /!=/,
      /前缀/, /非前缀/, /后缀/, /非后缀/, /包含/, /不包含/, /为空/, /非空/,/or/,/and/
    ];

    const hasOperators = operatorPatterns.some(pattern => pattern.test(formula));

// 5. 检查重复指标问题
// 统计每个指标在公式中出现的次数
    const indicatorCount = {};
    usedIndicators.forEach(indicator => {
      const matches = formula.match(new RegExp(indicator.COLUMN_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || [];
      indicatorCount[indicator.COLUMN_NAME] = matches.length;
    });

// 如果有指标出现多次但没有运算符，提示需要添加运算符
    const hasRepeatedIndicators = Object.values(indicatorCount).some(count => count > 1);
    if (hasRepeatedIndicators && !hasOperators) {
      validationMessage.value = '检测到重复指标，但未发现运算符，请添加适当的运算符';
      isValidationSuccess.value = false;
      return;
    }

// // 6. 检查多个不同指标但没有运算符的情况
//     const uniqueIndicators = Object.keys(indicatorCount).length;
//     if (uniqueIndicators > 1 && !hasOperators) {
//       validationMessage.value = '检测到多个指标，但未发现运算符，请添加适当的运算符';
//       isValidationSuccess.value = false;
//       return;
//     }

// 7. 如果只有一个指标但没有赋值操作，也给出提示（可选）
//     if (uniqueIndicators === 1 && !formula.includes('=')) {
// // 检查是否是简单的指标名称（没有其他操作）
//       const firstName = Object.keys(indicatorCount)[0];
//       const isSimpleIndicator = formula === firstName && indicatorCount[firstName] === 1;
//       if (isSimpleIndicator) {
//         validationMessage.value = '检测到单一指标，如需计算请添加运算符或赋值操作';
//       }
//     }

// 8. 检查运算符使用是否合理
// 检查是否有连续的运算符（除了负号）
    const invalidOperatorPattern = /[\+\-\*\/]=|=[\+\-\*\/]|[+\*\/]{2,}|[^=][<>]=?[<>]/;
    if (invalidOperatorPattern.test(formula)) {
      validationMessage.value = '存在不合法的运算符组合';
      isValidationSuccess.value = false;
      return;
    }

// 9. 检查是否以运算符结尾（除了负号）
    if (/[+\*\/\-=<>]$/.test(formula) && !/[\)]$/.test(formula)) {
      validationMessage.value = '公式不能以运算符结尾';
      isValidationSuccess.value = false;
      return;
    }

// 10. 检查是否有空的括号
    if (/\(\s*\)/.test(formula)) {
      validationMessage.value = '存在空括号';
      isValidationSuccess.value = false;
      return;
    }

// 11. 简单的语法检查 - 检查赋值语句
    const assignmentParts = formula.split('=');
    if (assignmentParts.length > 2) {
      validationMessage.value = '赋值语句格式错误，只能有一个等号';
      isValidationSuccess.value = false;
      return;
    }

// 12. 如果有赋值操作，检查左侧是否为合法的赋值目标
//     if (assignmentParts.length === 2) {
//       const leftSide = assignmentParts[0].trim();
// // 左侧应该是一个指标名称
//       const isValidTarget = indicatorData.value.some(indicator =>
//           indicator.COLUMN_NAME === leftSide
//       );
//
//       if (!isValidTarget) {
//         validationMessage.value = '赋值语句左侧必须是有效的指标名称';
//         isValidationSuccess.value = false;
//         return;
//       }
//     }

// 13. 验证通过
    if (!validationMessage.value) {
      validationMessage.value = '验证通过';
      isValidationSuccess.value = true;
    }

  } catch (error) {
    validationMessage.value = '公式验证失败: ' + (error.message || '未知错误');
    isValidationSuccess.value = false;
  }
};
/**
 * 处理返回按钮点击事件
 */
const handleBackClick = () => {
  // 点击返回时，将当前的公式文本传递回父组件
  emit('back', formulaText.value);
};
// 新增：记录选中的报表行，用于控制高亮状态
const selectedReportRow = ref(null);
// 新增：记录是否点击了报表区域外部
const isClickOutsideReport = ref(false);
// 添加选中的报表和指标数据
const selectedReport = ref(null);
const selectedIndicators = ref([]);
// 新增：收集所有使用过的原始表号数据
const usedOriginalTableCodes = ref(new Set());

// 处理报表点击事件
const handleReportClick = async (report) => {
  if (!report || !report.TABLE_NAME) {
    console.error('报表数据不完整，缺少表名（TABLE_NAME）');
    return;
  }

  selectedReport.value = report; indicatorData.value = [];
  // 清空旧数据
  try {
    const response = await indexGetData(
        { pageNo: 1,
          pageSize: 1000,
          sortField: '',
          sortOrder: "asc",
          params:
              { Q_TABLE_CODE_S_LK: report.TABLE_CODE } });
    console.log(report.TABLE_CODE)
    if (response)
    {
      console.log(response)
      if (response.data.length != 0){
        indicatorData.value = response.data;
      }else {
        const response2 = await indexGetData(
            { pageNo: 1,
              pageSize: 1000,
              sortField: '',
              sortOrder: "asc",
              params: {
                Q_TABLE_NUM_S_LK: report.TABLE_CODE
              } });
        if (response2) {
          console.log(response2)
          indicatorData.value = response2.data;
          console.log('根据表名查询到的指标数据:', indicatorData.value);
        }else {
          console.error('获取指标数据失败:', response?.message || '接口返回异常');
        }
      }

      console.log('根据表名查询到的指标数据:', indicatorData.value);
    } else {
      console.error('获取指标数据失败:', response?.message || '接口返回异常');
    }
  }
  catch (error) { console.error('请求指标接口出错:', error); } };

// 处理表号，移除连字符
const processTableCode = (tableCode) => {
  if (!tableCode) return '';
  // 将表号中的连字符移除，如611-1 -> 6111，B611-1 -> B6111
  return tableCode.replace(/-/g, '');
};

// 处理指标点击事件
const handleIndicatorClick = (indicator) => {
  lastClickedIndicator.value = indicator;

  // 如果显示占位符提示，则插入到占位符位置
  if (showPlaceholderHint.value) {
    insertAtPlaceholder();
    return;
  }

  const textarea = document.querySelector('.draggable-input');
  const cursorPosition = textarea.selectionStart;
  const currentValue = formulaText.value;

  // 关键修改：使用表号而不是表名（格式：表号.指标名），并移除连字符
  const tableCode = selectedReport.value?.TABLE_NUM || '';
  // 收集原始表号数据
  if (tableCode) {
    usedOriginalTableCodes.value.add(tableCode);
  }
  const processedTableCode = processTableCode(tableCode);
  const fullIndicatorName = processedTableCode ? `${processedTableCode}.${indicator.COLUMN_NAME}` : indicator.COLUMN_NAME;

  // 在光标位置插入带表号的指标代码
  formulaText.value =
      currentValue.substring(0, cursorPosition) +
      fullIndicatorName +  // 使用拼接后的完整名称
      currentValue.substring(cursorPosition);

  // 更新光标位置
  nextTick(() => {
    textarea.focus();
    textarea.setSelectionRange(
        cursorPosition + fullIndicatorName.length,  // 光标位置需匹配新插入的长度
        cursorPosition + fullIndicatorName.length
    );
  });
};


// 处理运算符点击事件
const handleOperatorClick = (operator) => {
  const textarea = document.querySelector('.draggable-input');
  const cursorPosition = textarea.selectionStart;
  const currentValue = formulaText.value;

  let insertText = operator;
  let placeholderOffset = 0;

  // 根据操作符类型确定插入的文本
  switch(operator) {
    case 'like_prefix':
      insertText = " LIKE '{xxxx}' ";
      placeholderOffset = 7; // 插入位置到占位符的距离
      break;
    case 'not_like_prefix':
      insertText = " NOT LIKE '{xxxx}' ";
      placeholderOffset = 11;
      break;
    case 'like_suffix':
      insertText = " LIKE '{xxxx}' ";
      placeholderOffset = 7;
      break;
    case 'not_like_suffix':
      insertText = " NOT LIKE '{xxxx}' ";
      placeholderOffset = 11;
      break;
    case 'like_contains':
      insertText = " LIKE '{xxxx}' ";
      placeholderOffset = 7;
      break;
    case 'not_like_contains':
      insertText = " NOT LIKE '{xxxx}' ";
      placeholderOffset = 11;
      break;
    case 'is_empty':
      insertText = " = '{xxxx}' ";
      placeholderOffset = 4;
      break;
    case 'is_not_empty':
      insertText = " != '{xxxx}' ";
      placeholderOffset = 5;
      break;
    default:
      // 其他操作符保持原样
      break;
  }

  // 在光标位置插入运算符
  formulaText.value =
      currentValue.substring(0, cursorPosition) +
      insertText +
      currentValue.substring(cursorPosition);

  // 更新光标位置
  nextTick(() => {
    let newCursorPosition = cursorPosition + insertText.length;

    // 如果是带有占位符的操作符，将光标定位到占位符位置
    if (placeholderOffset > 0) {
      newCursorPosition = cursorPosition + placeholderOffset;

      // 显示占位符提示
      showPlaceholderHint.value = true;
      placeholderPosition.value = newCursorPosition;

      // 计算占位符在textarea中的实际位置
      setTimeout(() => {
        highlightPlaceholder(textarea, newCursorPosition);
      }, 0);
    }

    textarea.focus();
    textarea.setSelectionRange(newCursorPosition, newCursorPosition);
  });
};

// 公式文本，初始值来自props
const formulaText = ref(props.modelValue || '');

// 监听props变化，更新公式文本
watch(() => props.modelValue, (newValue) => {
  if (newValue !== formulaText.value) {
    formulaText.value = newValue || '';
  }
}, { immediate: true });
// 高亮占位符位置
const highlightPlaceholder = (textarea, position) => {
  const textareaRect = textarea.getBoundingClientRect();
  const dummyDiv = document.createElement('div');
  const textareaStyle = window.getComputedStyle(textarea);

  // 复制textarea的样式到dummy div
  dummyDiv.style.position = 'absolute';
  dummyDiv.style.visibility = 'hidden';
  dummyDiv.style.whiteSpace = 'pre-wrap';
  dummyDiv.style.wordWrap = 'break-word';
  dummyDiv.style.boxSizing = 'border-box';
  dummyDiv.style.width = textareaStyle.width;
  dummyDiv.style.height = textareaStyle.height;
  dummyDiv.style.padding = textareaStyle.padding;
  dummyDiv.style.fontFamily = textareaStyle.fontFamily;
  dummyDiv.style.fontSize = textareaStyle.fontSize;
  dummyDiv.style.lineHeight = textareaStyle.lineHeight;
  dummyDiv.style.border = textareaStyle.border;

  // 获取光标前的文本
  const textBeforeCursor = formulaText.value.substring(0, position);
  dummyDiv.textContent = textBeforeCursor;
  document.body.appendChild(dummyDiv);

  // 计算光标位置
  const cursorRect = dummyDiv.getBoundingClientRect();

  // 移除dummy div
  document.body.removeChild(dummyDiv);

  // 设置提示框位置
  const hintOverlay = document.querySelector('.hint-overlay');
  if (hintOverlay) {
    hintOverlay.style.left = (textareaRect.left + 10) + 'px';
    hintOverlay.style.top = (textareaRect.top + 30) + 'px'; // 简化定位
    hintOverlay.style.width = '120px';
    hintOverlay.style.height = '24px';
  }
};
// 初始化运算符列表
const operators = reactive([
  { id: 1, symbol: '+', name: '加' },
  { id: 2, symbol: '-', name: '减' },
  { id: 3, symbol: '*', name: '乘' },
  { id: 4, symbol: '/', name: '除' },
  { id: 5, symbol: '=', name: '赋值' },
  { id: 6, symbol: '>', name: '大于' },
  { id: 7, symbol: '<', name: '小于' },
  { id: 8, symbol: '>=', name: '大于等于' },
  { id: 9, symbol: '<=', name: '小于等于' },
  { id: 10, symbol: '!=', name: '不等于' },
  { id: 11, symbol: '&&', name: '并且' },
  { id: 12, symbol: '||', name: '或者' },
  { id: 13, symbol: 'like_prefix', name: '前缀' },
  { id: 14, symbol: 'not_like_prefix', name: '非前缀' },
  { id: 15, symbol: 'like_suffix', name: '后缀' },
  { id: 16, symbol: 'not_like_suffix', name: '非后缀' },
  { id: 17, symbol: 'like_contains', name: '包含' },
  { id: 18, symbol: 'not_like_contains', name: '不包含' },
  { id: 19, symbol: 'is_empty', name: '为空' },
  { id: 20, symbol: 'is_not_empty', name: '非空' }
]);

// 控制常用运算符下拉框的显示/隐藏
const showOperators = ref(true);
// 插入指标到占位符位置
const insertAtPlaceholder = () => {
  // 隐藏提示
  showPlaceholderHint.value = false;

  // 如果有选中的指标，则插入到占位符位置
  if (lastClickedIndicator.value) {
    const textarea = document.querySelector('.draggable-input');
    const currentValue = formulaText.value;

    // 找到占位符 {xxxx} 的起始和结束位置
    const placeholderStart = currentValue.indexOf('{xxxx}');

    if (placeholderStart !== -1) {
      // 替换占位符 {xxxx} 为实际指标名（带表号）
      const beforePlaceholder = currentValue.substring(0, placeholderStart);
      const afterPlaceholder = currentValue.substring(placeholderStart + 6); // +6 是 '{xxxx}' 的长度

      // 关键修改：使用表号而不是表名（格式：表号.指标名），并移除连字符
      const tableCode = selectedReport.value?.TABLE_NUM || '';
      // 收集原始表号数据
      if (tableCode) {
        usedOriginalTableCodes.value.add(tableCode);
      }
      const processedTableCode = processTableCode(tableCode);
      const fullIndicatorName = processedTableCode ? `${processedTableCode}.${lastClickedIndicator.value.COLUMN_NAME}` : lastClickedIndicator.value.COLUMN_NAME;

      formulaText.value = beforePlaceholder + fullIndicatorName + afterPlaceholder;

      // 更新光标位置
      nextTick(() => {
        const newPosition = placeholderStart + fullIndicatorName.length;
        textarea.focus();
        textarea.setSelectionRange(newPosition, newPosition);
      });
    }
  }
};
// 切换下拉框显示状态
const toggleOperators = () => {
  showOperators.value = !showOperators.value;
};

// 报表数据 - 从接口获取
const reportData = ref([]);
const indicatorData = ref([]);

// 搜索框数据
const reportSearchQuery = ref('');
const indicatorSearchQuery = ref('');

// 指标排序控制 - 默认开启
const isIndicatorSorted = ref(true);

// 修改切换指标排序状态的方法，支持独立控制不同面板
const toggleIndicatorSort = (panel) => {
  panelSortStates.value[panel] = !panelSortStates.value[panel];
};

// 当前选中的字母
const selectedAlphabet = ref('');
const currentLetter = ref('');


// 修改滚动到指定字母的方法，支持独立控制不同面板
const scrollToLetter = (letter, panel) => {
  const element = document.getElementById(`letter-${letter}`);
// 根据面板获取对应的容器
  let container;
  if (panel === 'mainIndicator') {
    container = document.querySelectorAll('.indicator-table-container')[0];
  } else if (panel === 'derivedIndicator') {
    container = document.querySelectorAll('.indicator-table-container')[1];
  }

  if (element && container) {
    container.scrollTop = element.offsetTop;
    // 更新对应面板的当前字母状态
    panelCurrentLetters.value[panel] = letter;
  }
};
// 修改获取表格中实际存在的字母列表的计算属性，分别获取两个面板的字母
const mainAvailableLetters = computed(() => {
  const letters = groupedIndicatorData.value.map(group => group.letter);
  return letters.sort();
});

const derivedAvailableLetters = computed(() => {
  const letters = groupedDerivedIndicatorData.value.map(group => group.letter);
  return letters.sort();
});
// // 滚动到指定字母
// const scrollToLetter = (letter) => {
//   const element = document.getElementById(`letter-${letter}`);
//   const container = document.querySelector('.indicator-table-container');
//   if (element && container) {
//     container.scrollTop = element.offsetTop - 40;
//     currentLetter.value = letter;
//   }
// };

// 获取表格中实际存在的字母列表
const availableLetters = computed(() => {
// 从groupedIndicatorData中获取所有存在的字母
  const letters = groupedIndicatorData.value.map(group => group.letter);
// 按字母顺序排序
  return letters.sort();
});

// 修改计算属性，根据面板分别返回排序后的数据
const sortedIndicatorData = computed(() => {
  const filteredData = indicatorData.value.filter(item =>
      (item.COLUMN_NAME.includes(indicatorSearchQuery.value) ||
          item.COLUMN_CODE.includes(indicatorSearchQuery.value) ||
          item.TABLE_NAME.includes(indicatorSearchQuery.value)) &&
      (!selectedAlphabet.value || item.COLUMN_NAME.charAt(0) === selectedAlphabet.value)
  );

// 主指标面板排序状态
  if (panelSortStates.value.mainIndicator) {
    return [...filteredData].sort((a, b) => a.COLUMN_NAME.localeCompare(b.COLUMN_NAME, 'zh-CN'));
  }
  return filteredData;
});
// 为衍生指标面板添加独立的计算属性
const sortedDerivedIndicatorData = computed(() => {
  const filteredData = indicatorData.value.filter(item =>
      (item.COLUMN_NAME.includes(indicatorSearchQuery.value) ||
          item.COLUMN_CODE.includes(indicatorSearchQuery.value) ||
          item.TABLE_NAME.includes(indicatorSearchQuery.value)) &&
      (!selectedAlphabet.value || item.COLUMN_NAME.charAt(0) === selectedAlphabet.value)
  );

// 衍生指标面板排序状态
  if (panelSortStates.value.derivedIndicator) {
    return [...filteredData].sort((a, b) => a.COLUMN_NAME.localeCompare(b.COLUMN_NAME, 'zh-CN'));
  }
  return filteredData;
});
// 按字母分组的指标数据，用于在表格中显示字母前缀
// 为衍生指标面板添加独立的分组计算属性
const groupedDerivedIndicatorData = computed(() => {
  // const filteredAndSorted = sortedDerivedIndicatorData.value;
  // const groupedMap = {};
  //
  // filteredAndSorted.forEach(item => {
  //   const letter = getFirstPinyinLetter(item.COLUMN_NAME);
  //   if (!groupedMap[letter]) {
  //     groupedMap[letter] = {
  //       letter: letter,
  //       items: []
  //     };
  //   }
  //   groupedMap[letter].items.push(item);
  // });
  //
  // return Object.values(groupedMap).sort((a, b) => a.letter.localeCompare(b.letter, 'zh-CN'));
  return [];
});
// 修改分组计算属性，使用新的拼音函数
const groupedIndicatorData = computed(() => {
  const filteredAndSorted = sortedIndicatorData.value;
  const groupedMap = {};

  // 先按拼音首字母分组
  filteredAndSorted.forEach(item => {
    const letter = getFirstPinyinLetter(item.COLUMN_NAME);
    if (!groupedMap[letter]) {
      groupedMap[letter] = {
        letter: letter,
        items: []
      };
    }
    groupedMap[letter].items.push(item);
  });

  // 转换为数组并按字母排序
  return Object.values(groupedMap).sort((a, b) => a.letter.localeCompare(b.letter, 'zh-CN'));
});

// 节流函数
const throttle = (fn, delay) => {
  let timeoutId = undefined;
  let lastExecTime = 0;

  return (...args) => {
    const currentTime = Date.now();

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }

    if (currentTime - lastExecTime >= delay) {
      fn(...args);
      lastExecTime = currentTime;
    } else {
      timeoutId = setTimeout(() => {
        fn(...args);
        lastExecTime = Date.now();
        timeoutId = undefined;
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// 修改更新当前字母的方法，支持独立控制不同面板
const updateCurrentLetter = (panel) => {
// 根据面板获取对应的容器
  let container;
  if (panel === 'mainIndicator') {
    container = document.querySelectorAll('.indicator-table-container')[0];
  } else if (panel === 'derivedIndicator') {
    container = document.querySelectorAll('.indicator-table-container')[1];
  }

  if (!container) return;

  const containerTop = container.scrollTop;
  const headers = Array.from(container.querySelectorAll('.alphabet-group-header'));

  const activeHeader = headers.reverse().find((header) => {
    return header.offsetTop <= containerTop + 50;
  });

  if (activeHeader) {
    const letter = activeHeader.getAttribute('data-letter') || '';
    panelCurrentLetters.value[panel] = letter;
  }
};

// 使用节流函数包装滚动处理
const handleScroll = throttle(updateCurrentLetter, 100);
// 修改节流函数包装滚动处理，支持独立控制不同面板
const handleMainScroll = throttle(() => updateCurrentLetter('mainIndicator'), 100);
const handleDerivedScroll = throttle(() => updateCurrentLetter('derivedIndicator'), 100);
// 报表表格列配置
const reportColumns = [
  { title: '序号', dataIndex: 'serialNumber', key: 'serialNumber',width:150 },
  { title: '表号', dataIndex: 'TABLE_NUM', key: 'TABLE_NUM' ,width:150},
  { title: '表名', dataIndex: 'TABLE_NAME', key: 'TABLE_NAME' },
];

// 过滤后的报表数据
const filteredReportData = computed(() => {
  return reportData.value.filter(item =>
      item.TABLE_NUM.includes(reportSearchQuery.value) ||
      item.TABLE_NAME.includes(reportSearchQuery.value)
  );
});

// 分页配置
const pagination = ref({
  total: 0,
  current: 1,
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total) => `共 ${total} 条`,
  pageSizeOptions: ['10', '20', '30', '40', '50'],
  locale: {
    items_per_page: '条/页',
    jump_to: '前往'
  }
});

// 修改分页变化处理
const handlePaginationChange = (page, pageSize) => {
  pagination.value.current = page;
  pagination.value.pageSize = pageSize;
  // 重新加载数据
  loadReportData(page, pageSize);
};

// 修改搜索处理
const handleReportSearch = () => {
  loadReportData(pagination.value.current, pagination.value.pageSize);
};
// 新增输入框变化处理方法
const handleReportInputChange = () => {
  // 输入变化时重置到第一页
  pagination.value.current = 1;
  // 使用节流避免频繁请求
  throttledReportSearch();
};
// 创建节流版的报表搜索方法（间隔300ms）
const throttledReportSearch = throttle(() => {
  loadReportData(1, pagination.value.pageSize);
}, 300);
// 新增报表数据加载函数
const loadReportData = async (pageNo = 1, pageSize = 10) => {
  try {
    const response = await buniscGetData({
      pageNo,
      pageSize,
      sortField: "TABLE_NAME",
      sortOrder: "asc",
      params:
          { Q_TABLE_NAME_S_LK: reportSearchQuery.value }
    });

    if (response) {
      if (response.data.length != 0){
        console.log(response)
        reportData.value = response.data.map((item, index) => ({
          ...item,
          serialNumber: (pageNo - 1) * pageSize + index + 1
        }));
        pagination.value.total = response.totalCount;
      }else {
        const res = await buniscGetData({
          pageNo,
          pageSize,
          sortField: "TABLE_NAME",
          sortOrder: "asc",
          params:  { Q_TABLE_NUM_S_LK: reportSearchQuery.value}
        });
        if (res){
          console.log(res)
          reportData.value = res.data.map((item, index) => ({
            ...item,
            serialNumber: (pageNo - 1) * pageSize + index + 1
          }));
          pagination.value.total = res.totalCount;
        }

      }
    }
  } catch (error) {
    console.error('获取报表数据出错:', error);
  }
};
// 修改计算属性
const paginatedReportData = computed(() => {
  // 当使用远程分页时，直接返回reportData
  return reportData.value;
});

// 设置表格高度相关变量
const containerRef = ref(null);
const tableHeight = ref(0);
const leftPanelRef = ref(null);
const leftPanelHeight = ref(0);

// 初始化时设置总数
onMounted(async () => {
  nextTick(() => {
    calculateTableHeight();
    window.addEventListener('resize', calculateTableHeight);
    // 修复滚动监听
    const containers = document.querySelectorAll('.indicator-table-container');
    containers.forEach((container, index) => {
      container.addEventListener('scroll', index === 0 ? handleMainScroll : handleDerivedScroll);
    });
  });
  // 初始加载第一页数据
  await loadReportData(1, pagination.value.pageSize);
});

// 计算表格高度的函数
const calculateTableHeight = () => {
  if (containerRef.value) {
// 获取容器高度
    const containerHeight = containerRef.value.clientHeight;
// 减去顶部操作区域的高度（根据实际情况调整）
    tableHeight.value = containerHeight - 220; // 220px 是顶部操作区域、搜索区域等的高度估计值
  }

  if (leftPanelRef.value) {
// 获取左侧面板高度
    const panelHeight = leftPanelRef.value.clientHeight;
    leftPanelHeight.value = panelHeight - 50; // 减去面板内边距等
  }
};

// 组件卸载时移除事件监听器
onUnmounted(() => {
  window.removeEventListener('resize', calculateTableHeight);

// 移除滚动监听
  const indicatorContainer = document.querySelector('.indicator-table-container');
  if (indicatorContainer) {
    indicatorContainer.removeEventListener('scroll', handleScroll);
  }
});

// 测试行相关
const testRowName = ref('测试1');
const isEditingTestRow = ref(false);

// 切换测试行编辑状态
const toggleTestRowEdit = () => {
  isEditingTestRow.value = !isEditingTestRow.value;
};

// 保存测试行修改
const saveTestRow = () => {
  isEditingTestRow.value = false;
};
// 修改报表行点击事件处理器
const customRowHandler = (record) => {
  return {
    style: {
      cursor: 'pointer',
      // 选中行保持高亮颜色（悬停效果）
      backgroundColor: selectedReportRow.value === record ? '#f0f5ff' : ''
    },
    onClick: () => {
      console.log("点击了报表行:", record);
      handleReportClick(record); // 加载该报表的指标数据
      selectedReportRow.value = record; // 标记当前选中行
      isClickOutsideReport.value = false; // 重置外部点击状态
    }
  };
};
defineExpose({
  resetForm
});
</script>
<template>
  <div class="flex-col justify-start items-start relative page equation-editor-container" ref="containerRef">
    <div class="editor-content">
      <div class="section_11"></div>
      <div class="flex-col section pos">
        <div class="flex-row justify-center relative section_2">
          <div class="flex-row items-center pos_2" @click="handleBackClick">
            <img class="shrink-0 image" src="/src/assets/images/5f98434fc06fa50e59f5a548bf6d250d.png" />
            <span class="font_2 text_3" style="cursor: pointer">返回</span>
            <span class="font text">设置汇总口径</span>
          </div>

        </div>
        <div class="flex-row items-center group">
          <div class="flex-col shrink-0 section_3" ref="leftPanelRef">
            <div class="flex-row self-stretch group_4" @click="toggleOperators">
              <span class="font text_4">常用运算符</span>
              <img class="shrink-0 image ml-184 transition-transform duration-300"
                   :class="{ 'rotate-180': showOperators }"
                   src="/src/assets/images/061f910a423ed5b571cdb54d8fce4319.png" style="cursor: pointer"/>
            </div>
            <transition name="slide-down">
              <div v-if="showOperators" class="flex-col self-stretch group_5">
                <div class="flex-row">
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('+')">
                    <span class="font_6 text_8" style="width: 30px">+加</span>
                  </div>

                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('-')">
                    <span class="font_6 text_8" style="width: 30px">-减</span>
                  </div>
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('*')">
                    <span class="font_6 text_8" style="width: 30px">*乘</span>
                  </div>
                </div>
                <div class="flex-row mt-12">
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('/')">
                    <span class="font_6 text_8" style="width: 50px">÷除</span>
                  </div>

                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('=')">
                    <span class="font_6 text_8" style="width: 50px">=赋值</span>
                  </div>
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('>')">
                    <span class="font_6 text_8" style="width: 50px">＞大于</span>
                  </div>
                </div>
                <div class="flex-row mt-12">
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('<')">
                    <span class="font_6 text_8" style="width: 50px">＜小于</span>
                  </div>
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('>=')">
                    <span class="font_6 text_8" style="width: 80px">≥大于等于</span>
                  </div>
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('(')">
                    <span class="font_6 text_8" style="width: 50px">(左括号</span>
                  </div>
                </div>
                <div class="flex-row mt-12">
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick(')')">
                    <span class="font_6 text_8" style="width: 50px">)右括号</span>
                  </div>
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('<=')">
                    <span class="font_6 text_8" style="width: 80px"><=小于等于</span>
                  </div>
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('!=')">
                    <span class="font_6 text_8" style="width: 80px">!=不等于</span>
                  </div>
                </div>
                <div class="flex-row mt-12">
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('|')">
                    <span class="font_6 text_8" style="width: 50px">||或者</span>
                  </div>
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('&')">
                    <span class="font_6 text_8" style="width: 80px">&&并且</span>
                  </div>
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('like_prefix')">
                    <span class="font_6 text_8" style="width: 50px;cursor: pointer">前缀</span>
                  </div>
                </div>
                <div class="flex-row mt-12">
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('not_like_prefix')">
                    <span class="font_6 text_8" style="width: 50px;cursor: pointer">非前缀</span>
                  </div>
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('like_suffix')">
                    <span class="font_6 text_8" style="width: 50px;cursor: pointer">后缀</span>
                  </div>
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('not_like_suffix')">
                    <span class="font_6 text_8" style="width: 50px;cursor: pointer">非后缀</span>
                  </div>
                </div>
                <div class="flex-row mt-12">

                  <div class="flex-col justify-start items-center relative text-wrapper_29 ml-9" @click="() => handleOperatorClick('like_contains')">
                    <span class="font_12 text_22 text_55" style="cursor: pointer">包含</span>
                  </div>
                  <div class="flex-col justify-start items-center text-wrapper_30 ml-9" @click="() => handleOperatorClick('not_like_contains')">
                    <span class="font_12 text_22 text_56" style="cursor: pointer">不包含</span>
                  </div>
                  <div class="flex-col justify-start items-center shrink-0 relative text-wrapper_3 ml-9" @click="() => handleOperatorClick('is_empty')">
                    <span class="font_6 text_8" style="width: 50px;cursor: pointer">为空</span>
                  </div>
                </div>
                <div class="flex-row mt-12">

                  <div class="flex-col justify-start items-center text-wrapper_32 ml-9" @click="() => handleOperatorClick('is_not_empty')">
                    <span class="font_12 text_22 text_62" style="cursor: pointer">非空</span>
                  </div>
                </div>
              </div>
            </transition>
            <div class="flex-row self-stretch view_5">
              <span class="font text_68">其他运算符、函数、控制语句</span>
            </div>
            <span class="self-start text_70">查看函数说明示例</span>
            <div class="flex-col justify-start items-start self-stretch view_6">
              <div class="flex-row group_18">
                <div class="flex-col self-start group_14">
                  <span class="self-start font_4 text_73">通用函数</span>
                  <span class="self-start font_13 text_76 mt-17" @click="() => handleOperatorClick('or')" style="cursor: pointer">或者OR</span>
                  <span class="self-start font_13 text_76 mt-17" @click="() => handleOperatorClick('and')" style="cursor: pointer">并且AND</span>

                </div>
              </div>
            </div>
          </div>
          <div class="flex-col flex-1 ml-31">
            <!-- 表格区域容器 -->
            <div class="flex-row gap-6" >
              <!-- 报表部分 -->
              <div class="flex-col flex-1" style="display: flex; flex-direction: column; min-height: 0;">
                <div class="flex-row justify-between items-center group_2 mb-5">
                  <span class="font_3">报表</span>
                  <div class="flex-row items-center">
                    <div class="flex-row shrink-0 group_1">
                      <div class="flex-col justify-start items-start text-wrapper">
                        <input v-model="reportSearchQuery" class="font_4 text_5 w-40 h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="请输入表名"
                               @input="handleReportInputChange"
                        />
                      </div>
                      <a-button type="primary" class="search-button" @click="handleReportSearch">
                        <template #icon><SearchOutlined /></template>
                        搜索
                      </a-button>
                    </div>
                  </div>
                </div>

                <div class="table-container report-table-container">
                  <a-table
                      :columns="reportColumns"
                      :data-source="paginatedReportData"
                      :pagination="false"
                      bordered
                      size="small"
                      :customRow="customRowHandler"
                  />
                </div>

                <!-- Ant Design Vue 分页组件 -->
                <div class="pagination mt-4">
                  <a-pagination
                      v-model:current="pagination.current"
                      v-model:pageSize="pagination.pageSize"
                      :pageSizeOptions="pagination.pageSizeOptions"
                      :showSizeChanger="pagination.showSizeChanger"
                      :showQuickJumper="pagination.showQuickJumper"
                      :showTotal="pagination.showTotal"
                      :total="pagination.total"
                      :locale="pagination.locale"
                      @change="handlePaginationChange"
                      @showSizeChange="handlePaginationChange"
                  />
                </div>
              </div>
              <!-- 指标部分 -->
              <div class="flex-col flex-1" style="display: flex; flex-direction: column; min-height: 0;">
                <div class="zhibiao" style="border-left: 1px solid #e8e8e8;padding: 5px">
                  <!-- 指标标题和搜索 -->
                  <div class="flex-row justify-between items-center group_2 mb-5">
                    <span class="font_3">指标</span>
                    <div class="flex-row items-center">
                      <div class="flex-row shrink-0 group_1">
                        <div class="flex-col justify-start items-start text-wrapper">
                          <input v-model="indicatorSearchQuery" class="font_4 text_5 w-40 h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请输入搜索内容" />
                        </div>
                        <a-button type="primary" class="search-button" @click="handleReportSearch">
                          <template #icon><SearchOutlined /></template>
                          搜索
                        </a-button>
                      </div>
                    </div>
                  </div>

                  <!--                &lt;!&ndash; 测试1行 - 放置在表格上方 &ndash;&gt;-->
                  <!--                <div class="test-row-container mb-3 p-2 border border-gray-200 rounded-md bg-gray-50">-->
                  <!--                  <div class="editable-row">-->
                  <!--                    <input v-if="isEditingTestRow" type="text" v-model="testRowName" class="edit-input" @blur="saveTestRow" @keyup.enter="saveTestRow">-->
                  <!--                    <span v-else class="test-row-name">测试1</span>-->
                  <!--                    <span class="edit-icon" @click="toggleTestRowEdit">✏️</span>-->
                  <!--                  </div>-->
                  <!--                </div>-->

                  <!-- 表格和控制区域容器 -->
                  <div class="table-with-controls-container">
                    <!-- 表格容器 -->
                    <div class="table-container indicator-table-container" @scroll="handleScroll">
                      <table class="report-table">
                        <thead>
                        <tr>
                          <th class="small-header">
                            <span class="column-name-small">所有列</span>
                          </th>
                        </tr>
                        </thead>
                        <tbody>
                        <template v-for="group in groupedIndicatorData" :key="group.letter">
                          <!-- 字母分组行 -->
                          <tr class="alphabet-group-header" :id="`letter-${group.letter}`" :data-letter="group.letter"  v-if="panelSortStates.mainIndicator">
                            <td class="alphabet-group-cell">{{ group.letter }}</td>
                          </tr>
                          <!-- 指标数据行 -->
                          <tr v-for="item in group.items" :key="item.id" @click="() => handleIndicatorClick(item)">
                            <td>{{ item.COLUMN_NAME  }}</td>
                          </tr>
                        </template>
                        <!-- 当没有数据时显示 -->
                        <tr v-if="groupedIndicatorData.length === 0">
                          <td class="no-data">暂无数据</td>
                        </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- 右侧控制区域 - 竖直排列 -->
                    <div class="right-controls-vertical">
                      <!-- 排序按钮 -->
                      <div class="sort-control" @click="toggleIndicatorSort('mainIndicator')" :class="{ 'active': panelSortStates.mainIndicator }" :title="panelSortStates.mainIndicator ? '排序已开启' : '排序已关闭'">
                        <span>字符索引</span>
                        <div class="toggle-switch">
                          <div class="toggle-switch-track"></div>
                          <div class="toggle-switch-thumb"></div>
                        </div>
                      </div>

                      <!-- 字母索引 -->
                      <div class="alphabet-index-vertical" v-if="panelSortStates.mainIndicator && availableLetters.length > 0 ">
                        <div class="alphabet-letters-vertical">
                    <span class="alphabet-letter"
                          v-for="letter in mainAvailableLetters"
                          :key="letter"
                          @click="scrollToLetter(letter, 'mainIndicator')"
                          :class="{ 'selected': panelCurrentLetters.mainIndicator === letter}">
                      {{ letter }}
                    </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div style=" border-left: 1px solid #e8e8e8;border-top: 1px solid #e8e8e8;border-bottom: 1px solid #e8e8e8;padding: 5px">
                  <!-- 指标标题和搜索 -->
                  <div class="flex-row justify-between items-center group_2 mb-5" >
                    <span class="font_3">衍生指标</span>
                    <div class="flex-row items-center">
                      <div class="flex-row shrink-0 group_1">
                        <div class="flex-col justify-start items-start text-wrapper">
                          <input class="font_4 text_5 w-40 h-8 px-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="请输入搜索内容" />
                        </div>
                        <a-button type="primary" class="search-button" @click="handleReportSearch">
                          <template #icon><SearchOutlined /></template>
                          搜索
                        </a-button>
                      </div>
                    </div>
                  </div>

                  <!-- 测试1行 - 放置在表格上方 -->
                  <!--                <div class="test-row-container mb-3 p-2 border border-gray-200 rounded-md bg-gray-50">-->
                  <!--                  <div class="editable-row">-->
                  <!--                    <input v-if="isEditingTestRow" type="text" v-model="testRowName" class="edit-input" @blur="saveTestRow" @keyup.enter="saveTestRow">-->
                  <!--                    <span v-else class="test-row-name">测试1</span>-->
                  <!--                    <span class="edit-icon" @click="toggleTestRowEdit">✏️</span>-->
                  <!--                  </div>-->
                  <!--                </div>-->

                  <!-- 表格和控制区域容器 -->
                  <div class="table-with-controls-container">
                    <!-- 表格容器 -->
                    <div class="table-container indicator-table-container" @scroll="handleScroll">
                      <table class="report-table">
                        <thead>
                        <tr>
                          <th class="small-header">
                            <span class="column-name-small">所有列</span>
                          </th>
                        </tr>
                        </thead>
                        <tbody>
                        <template v-for="group in groupedDerivedIndicatorData" :key="group.letter">
                          <!-- 字母分组行 -->
                          <tr class="alphabet-group-header" :id="`letter-${group.letter}`" :data-letter="group.letter" v-if="panelSortStates.derivedIndicator">
                            <td class="alphabet-group-cell">{{ group.letter }}</td>
                          </tr>
                          <!-- 指标数据行 -->
                          <tr v-for="item in group.items" :key="item.id" @click="() => handleIndicatorClick(item)">
                            <td>{{ item.name }}</td>
                          </tr>
                        </template>
                        <!-- 当没有数据时显示 -->
                        <tr v-if="groupedDerivedIndicatorData.length === 0">
                          <td class="no-data">暂无数据</td>
                        </tr>
                        </tbody>
                      </table>
                    </div>

                    <!-- 右侧控制区域 - 竖直排列 -->
                    <div class="right-controls-vertical">
                      <!-- 排序按钮 -->
                      <div class="sort-control" @click="toggleIndicatorSort('derivedIndicator')" :class="{ 'active': panelSortStates.derivedIndicator }" :title="panelSortStates.derivedIndicator ? '排序已开启' : '排序已关闭'">
                        <span>字符索引</span>
                        <div class="toggle-switch">
                          <div class="toggle-switch-track"></div>
                          <div class="toggle-switch-thumb"></div>
                        </div>
                      </div>

                      <!-- 字母索引 -->
                      <div class="alphabet-index-vertical" v-if="panelSortStates.derivedIndicator && availableLetters.length > 0">
                        <div class="alphabet-letters-vertical">
                    <span class="alphabet-letter"
                          v-for="letter in derivedAvailableLetters"
                          :key="letter"
                          @click="scrollToLetter(letter, 'derivedIndicator')"
                          :class="{ 'selected': panelCurrentLetters.derivedIndicator === letter }">
                      {{ letter }}
                    </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
            </div>

            <!-- 公式验证信息提示和公式编写 (移动到表格下方) -->
            <div class="flex-row justify-between items-end group_15 mt-20">
              <div class="flex-col">
                <span class="font text_75">公式验证信息提示</span>
                <!-- 添加验证结果显示 -->
                <div
                    v-if="validationMessage"
                    :class="['validation-message', { 'success': isValidationSuccess, 'error': !isValidationSuccess }]"        style="margin-top: 10px; padding: 8px; border-radius: 4px;"
                >
                  {{ validationMessage }}
                </div>
                <div class="flex-row mt-20">
                  <span class="font_7 text_79">公式编写</span>
                </div>
              </div>
              <div class="flex-row group_16">
<!--                <div class="flex-col justify-start items-center text-wrapper_13 ">-->
<!--                  <span class="font_5 text_78" style="cursor: pointer; " @click="handleSaveTemplate">保存模板</span>-->
<!--                </div>-->

                <div class="flex-col justify-start items-center text-wrapper_13 ml-9">
                  <span class="font_5 text_77" @click="handleValidate" style="cursor: pointer;">验证</span>
                </div>

                <div class="flex-col justify-start items-center text-wrapper_14 ml-9">
                  <span class="font_5 text_78" style="cursor: pointer;"  @click="handleConfirm">确定</span>
                </div>
              </div>
            </div>
            <div class="draggable-input-container">
            <textarea
                class="draggable-input"
                placeholder="请输入汇总单独处理公式"
                v-model="formulaText"
                ref="draggableInputRef"
            ></textarea>

              <!-- 添加占位符提示 -->
              <div class="placeholder-hint" v-if="showPlaceholderHint" @click="insertAtPlaceholder">
                <div class="hint-overlay">
                  <span class="hint-text">点击此处插入指标数据</span>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 保存模板模态框 -->
<!--  <SaveEditorTemplateModal-->
<!--      v-model:visible="isTemplateModalVisible"-->
<!--      :formula="formulaText"-->
<!--      @save="handleTemplateSave"-->
<!--      @cancel="handleTemplateCancel"-->
<!--  />-->
</template>

<style scoped lang="less">
.placeholder-hint {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  pointer-events: none;
}
.zhibiao{
  display: flex;
  flex-direction: column;
}
.draggable-input{
  border: 1px solid rgba(200, 200, 208, 1);
  border-radius: 8px;
  padding: 10px;
  width: 100%;
  height: 100px;
}
/* 新增：表格和控制区域容器 */
.table-with-controls-container {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  height: 200px; /* 与表格容器高度保持一致 */
  justify-content: space-between;
}
.sort-control span {
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

/* 字母索引样式 */
.alphabet-index-vertical {
  display: flex;
  magrin-top: -10px;
  flex-direction: column;
  gap: 6px;
}

.alphabet-letters-vertical {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 4px;
}

.alphabet-letter {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 22px;
  height: 22px;
  cursor: pointer;
  color: #666;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  border-radius: 3px;
  user-select: none;
}

.alphabet-letter:hover {
  background-color: #f0f0f5;
  color: #846fff;
  transform: scale(1.1);
}

.alphabet-letter.selected {
  background-color: #846fff;
  color: white;
  transform: scale(1.1);
}
/* 新增右侧控制区域样式 */
.right-controls-vertical {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  background-color: white;
  height: 200px; /* 与表格高度保持一致 */
  width: 120px;
  flex-shrink: 0;
  margin-top: -10px;
  overflow-y: auto; /* 添加垂直滚动条 */
}

/* 排序控件样式 */
.sort-control {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  overflow: hidden;
  transition: background-color 0.3s ease;
}


.sort-control span {
  font-size: 12px;
  color: #333;
  font-weight: 500;
}


.alphabet-index {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-left: 1px solid #e0e0e0;
  height: fit-content;
  min-height: 200px;
  width: 25px;
  flex-shrink: 0;
}

.alphabet-letters-vertical {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 4px;
}

.alphabet-letter {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 22px;
  height: 22px;
  cursor: pointer;
  color: #666;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  border-radius: 3px;
  user-select: none;
}

.alphabet-letter:hover {
  background-color: #f0f0f5;
  color: #846fff;
  transform: scale(1.1);
}

.alphabet-letter.selected {
  background-color: #846fff;
  color: white;
  transform: scale(1.1);
}
.ml-184 {
  margin-left: 184px;
}
.mt-17 {
  margin-top: 17px;
}
.ml-31 {
  margin-left: 31px;
}
.ml-15 {
  margin-left: 15px;
}
.ml-51 {
  margin-left: 51px;
}
.ml-27 {
  margin-left: 27px;
}
.ml-29 {
  margin-left: 29px;
}
.ml-3 {
  margin-left: 3px;
}
.ml-9 {
  margin-left: 9px;
}

/* 表头样式调整 */
.small-header {
  display: flex;
  align-items: center;
  background-color: #fff; /* 添加白色背景 */
}
.column-name-small {
  font-size: 12px; /* 缩小列名字体 */
  margin-right: 5px;
}
.sort-icon-small {
  font-size: 12px;
}
/* 测试行样式 */
.test-row {
  background-color: #f0f5ff;
}
.editable-row {
  display: flex;
  align-items: center;
}
.test-row-name {
  margin-right: 5px;
}
.edit-icon {
  cursor: pointer;
  font-size: 12px;
  margin-left: 5px;
}
.edit-input {
  width: 100px;
  padding: 2px 5px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
}

/* 表格区域容器 */
.flex-row.gap-6 {
  display: flex;
  gap: 16px; /* 减小间距以适应较小视口 */
  align-items: flex-start;
  flex: 1;
  min-height: 0;
  overflow-x: auto; /* 添加水平滚动支持 */
}

/* 表格容器基础样式 */
.table-container {
  overflow-x: auto;
}

/* 报表表格容器 */
.report-table-container {
  width:100%;
  max-height: 430px; /* 设置合理高度，与指标表格保持一致 */
  overflow-y: auto; /* 添加垂直滚动条 */
}

/* 指标表格容器 */
.indicator-table-container {
  flex: 1;
  min-width: 200px; /* 降低表格最小宽度 */
  max-height: 200px; /* 与报表表格高度保持一致 */
  overflow-y: auto; /* 添加垂直滚动条 */

}

/* 报表表格样式 */
.report-table {
  width: 100%;
  min-width: 300px; /* 降低表格最小宽度 */
  border-collapse: collapse;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;

  th, td {
    padding: 6px 12px; /* 缩小行高 */
    text-align: left;
    font-size: 14px;
  }

  th {
    background-color: #f5f5f7;
    font-weight: 600;
    color: #333;
    height: 5px;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  tr:last-child td {
    border-bottom: none;
  }

  th{
    background-color: #fff;
  }
  tr:hover {
    background-color: #f9f9f9;
  }

  td {
    color: #666;
  }
}

/* 分页样式 - Ant Design Vue 分页组件 */
.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* 搜索框样式 */
.text-wrapper input {
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 0 8px;
  outline: none;
  transition: all 0.3s ease;
}

.text-wrapper input:focus {
  border-color: #846fff;
  box-shadow: 0 0 0 2px rgba(132, 111, 255, 0.1);
}

/* 排序按钮样式 */
.section_4 {
  cursor: pointer;
  transition: all 0.3s ease;
  color: #333; /* 为排序按钮添加默认颜色 */
}

.section_4:hover {
  opacity: 0.8;
  color: #846fff; /* 排序按钮悬停颜色 */
}

/* 搜索按钮样式 - Ant Design Vue 按钮组件 */
.search-button {
  background-color: rgb(84, 111, 255) !important;
  border-color:rgb(84, 111, 255) !important;
  border-radius: 16px !important;
  padding: 2px 16px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
}

.search-button:hover {
  background-color: rgb(84, 111, 255) !important;
  border-color: rgb(84, 111, 255) !important;
  box-shadow: 0 2px 8px rgb(84, 111, 255) !important;
}

/* 排序按钮动画效果 - 开关样式 */
.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-switch-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e0e0e0;
  border-radius: 12px;
  transition: background-color 0.3s ease;
}

.toggle-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 激活状态 */
.toggle-switch.active .toggle-switch-track {
  background-color: #846fff;
}

.toggle-switch.active .toggle-switch-thumb {
  transform: translateX(20px);
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);
}

/* 悬停效果 */
.toggle-switch:hover {
  transform: scale(1.05);
}

/* 点击效果 */
.toggle-switch:active .toggle-switch-thumb {
  transform: scale(0.9);
}

.toggle-switch.active:active .toggle-switch-thumb {
  transform: translateX(20px) scale(0.9);
}



/* 表格分隔线 */
.table-divider {
  width: 1px;
  background-color: #030303;
  margin: 0 10px; /* 减小分隔线的左右边距 */
}

/* 字母分组标题样式 */
.alphabet-group-header {
}

.alphabet-group-cell {
  font-weight: bold;
  color: #846fff;
  padding-left: 10px !important;
}

/* 表格和字母索引并列容器 */
.table-with-index-container {
  display: flex;
  align-items: flex-start;
  gap: 0;
  width: 100%;
  flex: 1;
  min-height: 0;
}
/* 字母索引样式 - 与表格并列显示 */
.alphabet-index {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border-left: 1px solid #e0e0e0;
  height: 400px; /* 与表格高度保持一致 */
  width: 25px; /* 略微减小字母索引宽度 */
  flex-shrink: 0;
  overflow-y: auto; /* 字母索引可滚动 */
}

/* 垂直字母列表 */
.alphabet-letters-vertical {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 4px;
}

.alphabet-letter {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 22px;
  height: 10px;
  cursor: pointer;
  color: #666;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  border-radius: 3px;
  user-select: none;
}

.alphabet-letter:hover {
  background-color: #f0f0f5;
  color: #846fff;
  transform: scale(1.1);
}

.alphabet-letter.selected {
  background-color: #846fff;
  color: white;
  transform: scale(1.1);
}

/* 水平字母列表（保留旧样式） */
.alphabet-letters {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
/* 添加验证消息样式 */
.validation-message.success {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.validation-message.error {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  color: #ff4d4f;
}
.alphabet-letter:hover {
  background-color: #f0f0f5;
  color: #846fff;
}

.alphabet-letter.selected {
  background-color: #846fff;
  color: white;
}

/* 无数据样式 */
.no-data {
  text-align: center;
  color: #999;
  padding: 20px !important;
}

/* 字母索引下拉动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
.report-table-row {
  cursor: pointer;
}
/* 搜索按钮样式 */
.group_1 .section_4 {
  background-color: #846fff; /* 搜索按钮背景色 */
  color: white; /* 搜索按钮文字颜色 */
  padding: 4px 12px;
  border-radius: 4px;

  img {
    filter: brightness(0) invert(1); /* 将搜索图标变为白色 */
  }

  &:hover {
    background-color: #6a51e6; /* 搜索按钮悬停背景色 */
    color: white;
    opacity: 0.9;
  }
}
.page {
  display: flex;
  background-color: rgb(245, 245, 247);
  width: 100%;
  overflow: hidden;
  height: 80vh;
  .section_11 {
    margin-right: 347px;
    background-color: rgb(229, 229, 229);
    width: 1px;
    height: 567.5px;
  }
  .section {
    background-color: rgb(255, 255, 255);
    border-radius: 18px;
    mix-blend-mode: NOTTHROUGH;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    width: 100%;
    .section_2 {
      padding: 20.5px 26px 16px;
      background-color: rgb(235, 239, 255);
      border-radius: 18px 18px 0px 0px;
      .pos_2 {
        position: absolute;
        left: 26px;
        top: 50%;
        transform: translateY(-50%);
        .text_3 {
          margin-left: 6.5px;
          line-height: 12px;
          letter-spacing: -0.5px;
        }
        .text {
          margin-left: 24.5px;
          line-height: 16.5px;
        }
      }
      .text_2 {
        line-height: 16.5px;
      }
    }
    .group {
      padding: 18px 9.5px 15px 20px;
      display: flex;
      align-items: flex-start;
      min-height: 0;
      .section_3 {
        padding: 10px 5px 26.5px;
        background-color: rgb(245, 245, 247);
        border-radius: 10px;
        mix-blend-mode: NOTTHROUGH;
        width: 310px; /* 调整宽度 */
        flex-shrink: 0;
        .group_4 {
          padding: 0 5px;
          .text_4 {
            line-height: 17px;
          }
        }
        .group_5 {
          margin-top: 33.5px;

          .text-wrapper_2 {

            padding: 10.5px 0 3.5px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
          }
          .text-wrapper_3 {
            padding-top: 13px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
            .text_8 {
              text-align: center;
              transform: rotate(0deg);
              width: 20px;
              margin-top: -5px;
            }
          }
          .font_6 {
            font-size: 14px;
            font-family: AlibabaPuHuiTi;
            line-height: 16.5px;
            color: rgb(176, 176, 184);
          }
          .view {
            margin-right: 13px;
            padding: 10.5px 0 3.5px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
          }
          .text_7 {
            text-align: center;
            transform: rotate(0deg);
            width: 14px;
            margin-top: -5px;
          }
          .text-wrapper_6 {
            padding: 10px 0 4px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
          }
          .equal-division {
            flex-shrink: 0;
            .equal-division-item {
              position: relative;
              flex-shrink: 0;
              .text_14 {
                color: rgb(84, 111, 255);
                text-align: center;
                transform: rotate(0deg);
                width: 31px;
              }
            }
            .text-wrapper_7 {
              padding: 6.5px 0 7.5px;
              background-color: rgb(237, 240, 255);
              border-radius: 5px;
              box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
              width: 89px;
              height: 32px;
              border: solid 1px rgb(84, 111, 255);
            }
            .text-wrapper_37 {
              padding: 6.5px 0 7.5px;
              background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
              border-radius: 5px;
              box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
              width: 89px;
              height: 32px;
              border: solid 1px rgb(237, 240, 255);
            }
            .text_15 {
              text-align: center;
              transform: rotate(0deg);
              width: 38px;
            }
          }
          .text-wrapper_1 {
            padding: 6.5px 0 7.5px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
            .text_20 {
              text-align: center;
              transform: rotate(0deg);
              width: 34px;
            }
          }
          .text-wrapper_36 {
            padding: 7px 0 7px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
          }
          .text-wrapper_15 {
            margin-right: 13px;
            padding: 6.5px 0 7.5px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
            .text_23 {
              text-align: center;
            }
            .text_34 {
              text-align: center;
            }
            .text_39 {
              text-align: center;
              transform: rotate(0deg);
              width: 49px;
            }
            .text_40 {
              text-align: center;
              transform: rotate(0deg);
              width: 41px;
            }
          }
          .text-wrapper_18 {
            padding: 6.5px 0 7.5px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
            .text_32 {
              text-align: center;
              transform: rotate(0deg);
              width: 51px;
            }
          }
          .text-wrapper_19 {
            padding: 7.5px 0 9.5px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
            .text_33 {
              line-height: 13px;
            }
          }
          .text_22 {
            transform: rotate(0deg);
          }
          .view_1 {
            margin-right: 0;
          }
          .text-wrapper_22 {
            padding: 6.5px 0 7.5px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
          }
          .text_21 {
            text-align: center;
            transform: rotate(0deg);
            width: 35px;
          }
          .text-wrapper_25 {
            padding: 7.5px 0 9.5px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
            .text_49 {
              line-height: 13px;
            }
          }
          .font_12 {
            font-size: 14px;
            font-family: AlibabaPuHuiTi;
            line-height: 13px;
            color: rgb(176, 176, 184);
          }
          .text-wrapper_26 {
            padding: 7.5px 0 9.5px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
            .text_50 {
              line-height: 13px;
            }
          }
          .section_13 {
            background-color: rgb(250, 251, 255);
            border-radius: 5px;
            box-shadow: 0px 2px 10px rgba(84, 111, 255, 0.06);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
            .text-wrapper_12 {
              padding: 7.5px 0 9.5px;
              background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
              border-radius: 5px;
              box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
              width: 89px;
              border: solid 1px rgb(237, 240, 255);
              .text_51 {
                line-height: 13px;
              }
            }
          }
          .text-wrapper_28 {
            padding: 7.5px 0 9.5px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
            .text_54 {
              line-height: 13px;
            }
          }
          .text-wrapper_29 {
            padding: 7.5px 0 10px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
            .text_55 {
              line-height: 12.5px;
            }
          }
          .text-wrapper_30 {
            padding: 7.5px 0 9.5px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
            .text_56 {
              line-height: 13px;
            }
          }
          .text-wrapper_31 {
            padding: 7.5px 0 10px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
            .text_61 {
              line-height: 12.5px;
            }
          }
          .text-wrapper_32 {
            padding: 7.5px 0 9.5px;
            background-image: linear-gradient(0deg, rgb(245, 246, 255) 0%, rgb(255, 255, 255) 100%);
            border-radius: 5px;
            box-shadow: 0px 3px 0px rgba(176, 176, 184, 0.3), 0px 2px 4px rgba(84, 111, 255, 0.03);
            width: 89px;
            height: 32px;
            border: solid 1px rgb(237, 240, 255);
            .text_62 {
              line-height: 13px;
            }
          }
        }
        .view_5 {
          margin-top: 35.5px;
          padding: 0 3.5px;
          .text_68 {
            line-height: 17px;
          }
        }
        .text_70 {
          margin-left: 3px;
          margin-top: 26px;
          color: rgb(84, 111, 255);
          font-size: 12px;
          font-family: AlibabaPuHuiTi;
          line-height: 11px;
        }
        .view_6 {
          margin-top: 26px;
          .group_18 {
            margin-left: 2.5px;
            .group_14 {
              margin-left: 24.5px;
              width: 171.5px;
              .text_73 {
                color: rgb(20, 21, 34);
                letter-spacing: -0.5px;
              }
              .font_13 {
                font-size: 14px;
                font-family: AlibabaPuHuiTi;
                line-height: 13px;
                color: rgba(55, 55, 55, 0.7);
              }
              .text_74 {
                margin-left: 19px;
                line-height: 13px;
              }
              .text_76 {
                margin-left: 19px;
                line-height: 13px;
              }
              .text_80 {
                margin-left: 20px;
                line-height: 13px;
              }
              .text_81 {
                margin-left: 19px;
                line-height: 13.5px;
              }
            }
            .image_4 {
              margin-left: -196px;
              margin-top: 3px;
              width: 33px;
              height: 180.5px;
            }
          }
        }
      }
      .group_2 {
        padding: 0 3px;
        .font_3 {
          font-size: 20px; /* 减小字体大小，提高可读性 */
          font-family: AlibabaPuHuiTi;
          letter-spacing: -0.5px;
          font-weight: 500;
          line-height: 18.5px;
          color: rgb(20, 21, 34);
        }
        .group_3 {
          margin-right: 18px;
          .group_1 {
            margin-bottom: 2px;
          }
          .text_6 {
            line-height: 18px;
          }
          .group_22 {
            margin-top: 2px;
          }
          .text-wrapper {
            padding: 8.5px 0 7px;
            background-color: rgb(245, 245, 247);
            border-radius: 85px;
            mix-blend-mode: NOTTHROUGH;
            width: 258px;
            height: 32px;
            border: solid 1px rgba(235, 235, 255, 0.05);
            .text_5 {
              margin-left: 16.5px;
            }
          }
          .section_4 {
            padding: 8px 15.5px 6px 16px;
            background-color: rgb(84, 111, 255);
            border-radius: 85px;
            mix-blend-mode: NOTTHROUGH;
            height: 32px;
            border: solid 1px rgba(235, 235, 255, 0.05);
          }
        }
      }
      .font_4 {
        font-size: 14px; /* 减小字体大小，提高可读性 */
        font-family: AlibabaPuHuiTi;
        line-height: 14.5px;
        width: 258px;
        height: 32px;
        border-radius: 85px;
        background-color: rgb(245, 245, 247);
      }
      .group_6 {
        margin-top: 39px;
        padding-left: 4px;
        .section_6 {
          margin-top: 3px;
          padding: 13px 0 12px 33px;
          background-color: rgb(245, 245, 247);
          height: 45px;
          .text-wrapper_5 {
            padding: 3.5px 0 4px;
            width: 60px;
            border-right: solid 1px rgb(166, 166, 166);
            .text_11 {
              line-height: 13px;
            }
          }
          .text_12 {
            margin-left: 92.5px;
            line-height: 13px;
          }
          .section_7 {
            margin-left: 83.5px;
            background-color: rgb(166, 166, 166);
            width: 1px;
            height: 20px;
          }
        }
        .text-wrapper_4 {
          margin-top: 3px;
          padding: 16px 0 15.5px;
          background-color: rgb(245, 245, 247);
          width: 581px;
          height: 45px;
          .text_13 {
            line-height: 13px;
          }
        }
        .font_8 {
          font-size: 14px;
          font-family: AlibabaPuHuiTi;
          line-height: 13px;
          color: rgb(55, 55, 55);
        }
        .section_5 {
          margin-bottom: 2px;
          padding: 15px 16.5px 15px;
          background-color: rgb(224, 231, 255);
          width: 453px;
          height: 46px;
          .text_10 {
            line-height: 13px;
          }
        }
        .text_9 {
          margin-top: 7px;
          line-height: 12.5px;
        }
      }
      .group_23 {
        padding-left: 3.5px;
        padding-right: 3.5px;
        .group_9 {
          margin-top: 5.5px;
          .section_8 {
            background-color: rgb(255, 255, 255);
            height: 36px;
            .text-wrapper_10 {
              margin-right: 184px;
              padding: 11.5px 0 11.5px;
              background-color: rgba(255, 255, 255, 0);
              width: 397px;
              height: 36px;
              .text_18 {
                margin-left: 41px;
                line-height: 13px;
              }
            }
            .text-wrapper_23 {
              padding: 13.5px 0 13px;
              background-color: rgba(255, 255, 255, 0);
              width: 93px;
              height: 36px;
              .text_46 {
                line-height: 10px;
              }
            }
            .text-wrapper_24 {
              margin-right: 184px;
              padding: 11.5px 0 11px;
              background-color: rgba(255, 255, 255, 0);
              width: 397px;
              height: 36px;
              .text_47 {
                margin-left: 41px;
                line-height: 13px;
              }
            }
            .text-wrapper_33 {
              padding: 13px 0 12.5px;
              background-color: rgba(255, 255, 255, 0);
              width: 93px;
              height: 36px;
              .text_64 {
                line-height: 10px;
              }
            }
          }
          .text_19 {
            line-height: 11px;
          }
          .section_9 {
            background-color: rgba(157, 167, 227, 0.06);
            height: 36px;
            .text-wrapper_16 {
              padding: 13px 0 13px;
              background-color: rgba(255, 255, 255, 0);
              width: 93px;
              height: 36px;
              .text_26 {
                line-height: 10px;
              }
            }
            .text-wrapper_17 {
              margin-right: 184px;
              padding: 11.5px 0 11px;
              background-color: rgba(255, 255, 255, 0);
              width: 397px;
              height: 36px;
              .text_29 {
                margin-left: 40.5px;
                line-height: 13px;
              }
            }
          }
          .font_9 {
            font-size: 14px;
            font-family: AlibabaPuHuiTi;
            line-height: 10px;
            color: rgb(90, 96, 107);
          }
          .text-wrapper_9 {
            padding: 13px 0 13px;
            background-color: rgba(255, 255, 255, 0);
            width: 205px;
            height: 36px;
            .text_17 {
              margin-left: 41px;
            }
            .text_27 {
              margin-left: 41px;
            }
            .text_1 {
              margin-left: 41px;
            }
            .text_82 {
              margin-left: 41px;
            }
          }
          .font_11 {
            font-size: 14px;
            font-family: AlibabaPuHuiTi;
            line-height: 13px;
            color: rgb(90, 96, 107);
          }
          .text_25 {
            margin-top: 4px;
          }
          .group_10 {
            height: 37px;
            .text_31 {
              margin-top: -37px;
            }
          }
          .group_11 {
            margin-top: -6px;
          }
          .text-wrapper_8 {
            padding: 13.5px 0 13px;
            background-color: rgba(255, 255, 255, 0);
            width: 93px;
            height: 36px;
            .text_41 {
              line-height: 9.5px;
            }
          }
          .text-wrapper_21 {
            margin-right: 184px;
            padding: 11.5px 0 11px;
            background-color: rgba(255, 255, 255, 0);
            width: 397px;
            height: 36px;
            .text_36 {
              line-height: 13px;
            }
            .text_37 {
              margin-left: 41px;
            }
            .text_43 {
              margin-left: 40.5px;
              line-height: 13px;
            }
            .text_44 {
              margin-left: 41px;
            }
            .text_53 {
              margin-left: 40.5px;
              line-height: 13px;
            }
            .text_59 {
              margin-left: 40.5px;
            }
            .text_65 {
              margin-left: 40.5px;
              line-height: 13px;
            }
          }
          .text-wrapper_20 {
            padding: 13px 0 13px;
            background-color: rgba(255, 255, 255, 0);
            width: 93px;
            height: 36px;
          }
          .text_83 {
            margin-top: 2px;
          }
          .section_10 {
            background-color: rgb(255, 255, 255);
          }
          .section_12 {
            background-color: rgba(157, 167, 227, 0.06);
          }
          .text_66 {
            margin-top: 18px;
          }
          .group_12 {
            height: 49px;
            .section_14 {
              background-color: rgb(255, 255, 255);
              width: 880px;
              height: 15px;
              border-bottom: solid 2px rgba(229, 229, 229, 0.6);
            }
            .group_13 {
              border-radius: 100px;
              width: 165.5px;
              height: 10px;
            }
            .text_71 {
              margin-top: -16px;
            }
            .image_3 {
              margin-right: 142px;
              width: 405px;
              height: 27px;
            }
          }
        }
        .group_8 {
          width: 49.5px;
          .image_2 {
            width: 33px;
            height: 33px;
          }
          .text_24 {
            margin-top: 9px;
          }
          .text_30 {
            margin-top: 21.5px;
            line-height: 8.5px;
          }
          .text_38 {
            margin-top: 21.5px;
          }
          .text_45 {
            margin-top: 21.5px;
          }
          .text_48 {
            margin-top: 21.5px;
          }
          .text_52 {
            margin-top: 21.5px;
            line-height: 8.5px;
          }
          .text_57 {
            margin-top: 21.5px;
          }
          .text_60 {
            margin-left: 17px;
            margin-top: 21.5px;
          }
          .text_63 {
            margin-left: 15px;
            margin-top: 21.5px;
            line-height: 10.5px;
          }
          .text_67 {
            margin-top: 19.5px;
          }
          .text_69 {
            margin-top: 21.5px;
          }
          .text_72 {
            margin-top: 21.5px;
          }
        }
        .font_10 {
          font-size: 12px;
          font-family: AlibabaPuHuiTi;
          line-height: 8.5px;
          color: rgb(184, 184, 184);
        }
      }
      .group_15 {
        margin-top: 28.5px;
        margin-bottom: 20px; /* 添加底部边距，确保内容不被截断 */
        .text_75 {
          line-height: 16.5px;
        }
        .text_79 {
          line-height: 13px;
        }
        .group_16 {
          margin-right: 12px;
          .text-wrapper_13 {
            padding: 9px 0 7px;
            background-color: rgb(20, 21, 34);
            border-radius: 85px;
            mix-blend-mode: NOTTHROUGH;
            width: 83px;
            height: 32px;
            border: solid 1px rgba(235, 235, 255, 0.05);
            .text_77 {
              line-height: 14px;
            }
          }
          .text-wrapper_14 {
            padding: 8.5px 0 7px;
            background-color: rgb(84, 111, 255);
            border-radius: 85px;
            mix-blend-mode: NOTTHROUGH;
            width: 83px;
            height: 32px;
            border: solid 1px rgba(235, 235, 255, 0.05);
            .text_78 {
              line-height: 15px;
            }
          }
        }
      }
      .font_7 {
        font-size: 14px;
        font-family: AlibabaPuHuiTi;
        line-height: 13px;
        color: rgb(112, 112, 113);
      }
      .font_5 {
        font-size: 14px; /* 减小字体大小，提高可读性 */
        font-family: AlibabaPuHuiTi;
        line-height: 14.5px;
        color: rgb(255, 255, 255);
      }
      .section_16 {
        margin-right: 12px;
        padding: 10px;
        background-color: rgb(255, 255, 255);
        border-radius: 8px;
        height: 100px;
        border: solid 1px rgb(200, 200, 208);
      }
    }
    .font {
      font-size: 14px; /* 减小字体大小，提高可读性 */
      font-family: AlibabaPuHuiTi;
      letter-spacing: -0.5px;
      line-height: 16.5px;
      color: rgb(20, 21, 34);
    }
    .image {
      width: 16px;
      height: 16px;
    }
    .font_2 {
      font-size: 12px; /* 减小字体大小，提高可读性 */
      font-family: AlibabaPuHuiTi;
      line-height: 13px;
      color: rgb(84, 111, 255);
    }
  }
  .pos {
    position: absolute;
    left: -2px;
    right: 0;
    top: -2px;
  }
}
/* 添加下拉动画 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 旋转图标动画 */
.transition-transform {
  transition-property: transform;
}
.duration-300 {
  transition-duration: 300ms;
}
.rotate-180 {
  transform: rotate(180deg);
}
</style>
<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans',
  'Droid Sans', 'Helvetica Neue', 'Microsoft Yahei', sans-serif;
}

body * {
  box-sizing: border-box;
  flex-shrink: 0;
}

.flex-row {
  display: flex;
  flex-direction: row;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.justify-start {
  justify-content: flex-start;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.items-start {
  align-items: flex-start;
}

.items-end {
  align-items: flex-end;
}

.items-center {
  align-items: center;
}

.self-start {
  align-self: flex-start;
}

.self-stretch {
  align-self: stretch;
}

.flex-1 {
  flex: 1 1 0%;
}

.shrink-0 {
  flex-shrink: 0;
}

.relative {
  position: relative;
}

.mt-4 {
  margin-top: 4px;
}

.mt-12 {
  margin-top: 12px;
}

.mt-20 {
  margin-top: 20px;
}

report-table-container .ant-table-tbody > tr {
  cursor: pointer;
}

/*.report-table-container .ant-table-tbody > tr:hover {*/
/*  background-color: #f0f5ff;*/
/*}*/

/* 添加指标行点击效果 */
.indicator-table-container tr:not(.alphabet-group-header) {
  cursor: pointer;
}

.indicator-table-container tr:not(.alphabet-group-header):hover {
  background-color: #f0f5ff;
}

/* 运算符点击效果 */
.text-wrapper_3 {
  cursor: pointer;
}

.text-wrapper_3:hover {
  background-color: #f0f5ff;
}

.edit-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* 排序开关样式 - 添加动画效果 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 24px;
  cursor: pointer;
}

.toggle-switch-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e0e0e0;
  border-radius: 24px;
  transition: background-color 0.3s ease;
}

.toggle-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 激活状态下的样式 */
.sort-control.active .toggle-switch-track {
  background-color: #3b82f6;
}

.sort-control.active .toggle-switch-thumb {
  transform: translateX(22px);
}

/* 页面整体样式 - 实现页面覆盖效果 */
.page {
  padding: 20px;
  overflow-y: hidden;
  height: 80vh;
  background-color: #fff; /* 确保背景为白色，覆盖其他内容 */
}

/* 确保表格内容完整显示 */
.table-container {
  flex: 1;
  min-height: 0;
}

.indicator-table-container .report-table td {
  padding: 4px 12px; /* 进一步缩小行高 */
  line-height: 1.2; /* 控制行高 */
}

.indicator-table-container .report-table tr {
  height: 24px; /* 设置固定行高 */
}

/* 覆盖容器样式 - 类似StatisticalDefinition的实现 */
.equation-editor-container {
  width: 100%;
  /*height: 100%;*/
  background: white;
  overflow: hidden; /* 防止外层滚动 */
}

/* 确保公式编辑器覆盖整个视口 */
:deep(.ant-layout) {
  min-height: 100vh;
}

/* 防止页面其他部分滚动 */
:global(body) {
  overflow: hidden;
}

/* 确保组件内部内容完整显示 */
.editor-content {
  overflow-y: hidden;
  height: calc(100vh - 100px); /* 减去头部和底部的高度 */
}

</style>
