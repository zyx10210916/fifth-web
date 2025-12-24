<template>
  <div>

    <div style="flex: 1; background-color: white; padding: 20px; border-radius: 17.08px; height: 80vh">
      <!-- 顶部标题和操作区 -->
      <div style="display: flex; align-items: center; margin-bottom: 20px">
        <div style="display: flex; align-items: center; gap: 12px">
          <span
              style="font-size: 18px; font-weight: 500; letter-spacing: -0.72px; line-height: 24.7px; color: rgb(20 21 34 / 100%)">自定义指标</span>
          <a-tooltip>
            <!--            <template #title></template>-->
            <!--            <QuestionCircleOutlined style="color: #999; cursor: pointer" />-->
          </a-tooltip>
          <span
              style="color: rgb(120 140 255 / 100%); font-weight: 400; font-size: 14px">
           </span>
        </div>
        <div style="margin-left: auto; display: flex; gap: 8px">
          <a-button
              @click="showSaveTemplateModal"
              style="background: #333; color: white; border: none; border-radius: 85px"
          >
            保存为模板
          </a-button>
          <a-button type="primary" style="background: rgb(84 111 255); border-radius: 85px"
                    @click="handleConfirm">确定</a-button>
          <a-button style="border-radius: 85px" @click="backToDetail">返回</a-button>
        </div>
      </div>

      <!-- 筛选条件区域 -->
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px">
        <div style="display: flex; align-items: center; gap: 8px">
          <span style="color: rgb(113 113 113 / 100%); font-size: 16px; font-weight: 400">制度选择</span>
          <a-select v-model:value="systemType" style="width: 200px" placeholder="第五次全国经济普查">
            <a-select-option value="1">第五次全国经济普查</a-select-option>
          </a-select>
        </div>
        <div style="display: flex; align-items: center; gap: 8px">
          <span style="color: rgb(113 113 113 / 100%); font-size: 16px; font-weight: 400">调查频度</span>
          <a-select v-model:value="frequency" style="width: 200px" placeholder="年报">
            <a-select-option value="1">年报</a-select-option>
          </a-select>
        </div>
        <div style="display: flex; align-items: center; gap: 8px">
          <span style="color: rgb(113 113 113 / 100%); font-size: 16px; font-weight: 400">报表</span>
          <a-select v-model:value="reportType" style="width: 200px" :options="reportOptions"  @change="handleTableListChange">
          </a-select>
        </div>
        <div style="display: flex; gap: 8px">
          <a-button @click="selectDerivativeIndicators"
                    style="background: #333; color: white; border: none; border-radius: 5px">
            <template #icon>
              <SettingOutlined style="color: white" />
            </template>
            选择衍生指标
          </a-button>
          <!--          <a-button @click="setAsDefault" style="background: #333; color: white; border: none; border-radius: 5px">-->
          <!--            <template #icon>-->
          <!--              <SettingOutlined style="color: white" />-->
          <!--            </template>-->
          <!--            设为默认显示指标-->
          <!--          </a-button>-->
          <!--          <a-button @click="useDefaultMetrics" style="background: #333; color: white; border: none; border-radius: 5px">-->
          <!--            <template #icon>-->
          <!--              <SettingOutlined style="color: white" />-->
          <!--            </template>-->
          <!--            使用默认显示指标-->
          <!--          </a-button>-->
        </div>
      </div>
      <div style="display: flex; gap: 16px; height: 850px;">
        <!-- 左侧列表区域 -->
        <div style="width: 39vw" class="left-container">
          <!-- 全选/反选和搜索区域 -->
          <div style="display: flex; margin-bottom: 12px; align-items: center; justify-content: space-between">
            <div style="display: flex; align-items: center">
              <a-button style="
                  background: #333;
                  color: white;
                  border: none;
                  border-radius: 5px;
                  padding: 3px 10px;
                  height: 28px;
                  font-size: 13px;
                  display: flex;
                  align-items: center;
                " @click="selectAllLeft">
                <CheckOutlined style="color: white; font-size: 13px" />全选
              </a-button>
              <div style="width: 1px; height: 13px; background: #d9d9d9; margin: 0 8px"></div>
              <a-button style="
                  background: #333;
                  color: white;
                  border: none;
                  border-radius: 5px;
                  padding: 3px 10px;
                  height: 28px;
                  font-size: 13px;
                  display: flex;
                  align-items: center;
                " @click="invertSelectLeft">
                <CloseOutlined style="color: white; font-size: 13px" />反选
              </a-button>
            </div>
            <div style="display: flex; align-items: center; margin-left: 14px">
              <span style="margin-right: 8px; color: rgb(113 113 113 / 100%); font-size: 14px">关键字</span>
              <a-input v-model:value="searchText" placeholder="请输入关键字回车查询"
                       style="width: 260px; margin-right: 8px; height: 32px" @keyup.enter="handleLeftSearch"/>
              <a-button type="primary"
                        style="background: rgb(84 111 255); border-radius: 5px; height: 28px; font-size: 13px" @click="handleLeftSearch">
                <template #icon>
                  <SearchOutlined style="color: white; font-size: 13px" />
                </template>
                查询
              </a-button>
            </div>
          </div>
          <!-- 指标列表区域 -->
          <div style="background: #fff; border: 1px solid #f0f0f0; border-radius: 2px; height:95%; position: relative;">
            <!-- 字母索引快速定位 -->
            <div class="alphabet-index-vertical" v-if="availableLetters.length > 0">
              <div v-for="letter in availableLetters" :key="letter"
                   class="alphabet-letter"
                   @click="scrollToLetter(letter)">
                {{ letter }}
              </div>
            </div>
            <!-- 可滚动的指标内容 -->
            <div style="width: 100%; height: 100%; overflow: auto;">
              <a-checkbox-group v-model:value="leftSelectedItems" style="width: 100%">
                <!-- 按字母分组显示 -->
                <template v-for="(items, letter) in groupedMetrics" :key="letter">
                  <!-- 字母标题 -->
                  <div class="alphabet-header" :id="`letter-${letter}`">
                    {{ letter }}
                  </div>
                  <!-- 该字母下的指标列表 -->
                  <div
                      v-for="item in items"
                      :key="item.id"
                      class="metric-item"
                  >
                    <div class="metric-item-container">
                      <a-checkbox :value="getUniqueKey(item)" :disabled="isInRightList(item.id, item.tableName)">{{ item.name }}</a-checkbox>
                      <!--                    <DeleteOutlined class="delete-icon" />-->
                    </div>
                  </div>
                </template>
              </a-checkbox-group>

              <!-- 底部系统业务指标区域 -->
              <div style="
                background: rgb(237 239 255 / 60%);
                padding: 6px 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
              ">
                <div style="display: flex; align-items: center; gap: 8px">
                  <a-button style="
                    background: #333;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    padding: 2px 8px;
                    height: 24px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                  ">
                    <CheckOutlined style="color: white; font-size: 12px" />全选
                  </a-button>
                  <div style="width: 1px; height: 12px; background: #d9d9d9"></div>
                  <a-button style="
                    background: #333;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    padding: 2px 8px;
                    height: 24px;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                  ">
                    <CloseOutlined style="color: white; font-size: 12px" />反选
                  </a-button>
                  <span style="color: rgb(0 0 0 / 85%)">系统业务指标</span>
                </div>
                <a-button type="primary" style="background: rgb(84 111 255); border-radius: 5px">
                  展开
                  <template #icon>
                    <DownOutlined style="color: white" />
                  </template>
                </a-button>
              </div>
            </div> <!-- 闭合可滚动容器 -->
          </div>
        </div>

        <!-- 右侧区域 -->
        <div style="
            width: 10.4vw;
            height: 100%;
            background: rgb(245 245 247 / 100%);
            border: 1px solid rgb(245 245 247 / 100%);
            border-radius: 4px;
            display: flex;
            justify-content: space-evenly;
            align-items: center;
            gap: 12px;
          " class="right-container">
          <div>
            <a-button class="arrow-button" @click="removeFromRight">
              <LeftOutlined style="color: white; font-size: 14px" />
            </a-button>
          </div>
          <div>
            <a-button class="arrow-button" @click="copyToRight">
              <RightOutlined style="color: white; font-size: 14px" />
            </a-button>
          </div>
        </div>

        <!-- 右侧列表区域 -->
        <div style="width: 40vw; justify-content: space-between" class="left-container">
          <!-- 全选/反选和搜索区域 -->
          <div style="height:100%; ">
            <div style="display: flex; margin-bottom: 12px; align-items: center; justify-content: space-between">
              <div style="display: flex; align-items: center">
                <a-button style="
                    background: #333;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    padding: 3px 10px;
                    height: 28px;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                  " @click="selectAllRight">
                  <CheckOutlined style="color: white; font-size: 13px" />全选
                </a-button>
                <div style="width: 1px; height: 13px; background: #d9d9d9; margin: 0 8px"></div>
                <a-button style="
                    background: #333;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    padding: 3px 10px;
                    height: 28px;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                  " @click="invertSelectRight">
                  <CloseOutlined style="color: white; font-size: 13px" />反选
                </a-button>
              </div>
              <div style="display: flex; align-items: center; margin-left: 14px">
                <span style="margin-right: 8px; color: rgb(113 113 113 / 100%); font-size: 14px">模板</span>
                <a-select v-model:value="selectedTemplate" :options="templateList" @change="loadTemplate" style="width: 200px" placeholder="请选择模板"></a-select>
                <a-button  @click="deleteTemplate" type="primary"
                           style="background: rgb(84 111 255); border-radius: 5px; height: 28px; font-size: 13px; margin-left: 5px">
                  <template #icon>
                    <DeleteOutlined style="color: white; font-size: 13px " />
                  </template>
                  删除模板
                </a-button>
              </div>
            </div>
            <!-- 指标列表区域 -->
            <div style="background: #fff; border: 1px solid #f0f0f0; border-radius: 2px;height:95%; overflow: auto;" >
              <a-checkbox-group v-model:value="rightSelectedItems" style="width: 100%">
                <div
                    v-for="item in selectMetricsList"
                    :key="getUniqueKey(item)"
                    class="metric-item"
                    draggable="true"
                    @dragstart="handleDragStart($event, item)"
                    @dragover.prevent="handleDragOver($event)"
                    @dragenter.prevent="handleDragEnter($event, item)"
                    @dragleave.prevent="handleDragLeave($event, item)"
                    @drop="handleDrop($event, item)"
                    @dragend="handleDragEnd($event, item)"
                >
                  <div style="display: flex; align-items: center; width: 100%; justify-content: space-between">
                    <a-checkbox :value="getUniqueKey(item)">{{ getDisplayText(item) }}</a-checkbox>
                    <DeleteOutlined class="delete-icon" @click.stop="deleteRightItem(item.id, item.tableName)" />
                  </div>
                </div>
              </a-checkbox-group>
            </div>
          </div>

          <!--          <div class="sort-buttons" style="height:5%; ">-->
          <!--            <a-button class="sort-button" @click="moveToTop">-->
          <!--              <template #icon>-->
          <!--                <VerticalAlignTopOutlined class="sort-icon" />-->
          <!--              </template>-->
          <!--              置顶-->
          <!--            </a-button>-->
          <!--            <a-button class="sort-button" @click="moveUp">-->
          <!--              <template #icon>-->
          <!--                <ArrowUpOutlined class="sort-icon" />-->
          <!--              </template>-->
          <!--              上升-->
          <!--            </a-button>-->
          <!--            <a-button class="sort-button" @click="moveDown">-->
          <!--              <template #icon>-->
          <!--                <ArrowDownOutlined class="sort-icon" />-->
          <!--              </template>-->
          <!--              下降-->
          <!--            </a-button>-->
          <!--            <a-button class="sort-button" @click="moveToBottom">-->
          <!--              <template #icon>-->
          <!--                <VerticalAlignBottomOutlined class="sort-icon" />-->
          <!--              </template>-->
          <!--              置底-->
          <!--            </a-button>-->
          <!--          </div>-->
        </div>
      </div>
    </div>

    <SaveTemplateModal
        :visible="saveTemplateModalVisible"
        @update:visible="handleVisibleChange"
        :current-metrics="selectMetricsList"
        @save="handleSaveTemplate"
        @cancel="handleCancelSaveTemplate"
    />
  </div>
</template>

<script setup lang="ts">
import '@/assets/styles/modules/searchHear.less';
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue';
// 导入拼音转换库
import { pinyin } from 'pinyin-pro';
import { useForm } from './useFormHooks';
import { useList } from './useListHooks';
import { message } from 'ant-design-vue';
import { saveDataQueryTemplate, removeDataQueryTemplate, getDataQueryTemplateList } from '@/api/data-processing';
// #region 功能A
import {
  SearchOutlined,
  ReloadOutlined,
  CheckOutlined,
  SettingOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  CloseOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
} from '@ant-design/icons-vue';
import SaveTemplateModal from './SaveTemplateModal/index.vue';

const saveTemplateModalVisible = ref<boolean>(false);
interface MetricItem {
  id: string;
  name: string;
  tableName?: string; // 新增：指标所属的表名
}

interface TemplateItem {
  value: string;
  label: string;
  metrics: string[];
  reportCode: string;
}
// 添加获取显示文本的方法
const getDisplayText = (item: MetricItem) => {
  const tableName = item.tableName || reportCode.value;
  // 获取报表选项中的标签作为表号显示
  const reportOption = reportOptions.value.find(option => option.code === tableName);
  const tableLabel = reportOption ? reportOption.label : tableName;
  return `${tableLabel}-${item.name}`;
};
const emit = defineEmits(['selectDerivativeIndicators','back-to-detail']);
const selectDerivativeIndicators = () => {
  emit('selectDerivativeIndicators');
};

// 顶部表单相关变量
const searchForm = reactive({
  creator: '', // 创建人
  status: '状态', // 状态
});
// 所有指标(左侧列表)
// const metricsList = ref([
//   {
//     id: '1',
//     name: '唯一码',
//   },
// ]);
const metricsList = ref<MetricItem[]>([]);// 搜索过滤后的指标
const filteredMetricsList = ref<MetricItem[]>([]); // 搜索过滤后的指标
// 按字母分组的指标数据
const groupedMetrics = ref<Record<string, MetricItem[]>>({}); // 按首字母分组的指标

// 获取字符串的首字母（中文转拼音首字母，英文直接取首字母）
const getFirstLetter = (str: string): string => {
  if (!str || typeof str !== 'string' || str.length === 0) {
    return '#';
  }

  const firstChar = str.charAt(0);

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

// 按字母对指标进行排序和分组
const sortAndGroupMetrics = (metrics: MetricItem[]): Record<string, MetricItem[]> => {
  // 按指标名称排序
  const sortedMetrics = [...metrics].sort((a, b) => {
    // 先比较首字母
    const aFirstLetter = getFirstLetter(a.name);
    const bFirstLetter = getFirstLetter(b.name);

    if (aFirstLetter !== bFirstLetter) {
      // 特殊字符'#'放在最后
      if (aFirstLetter === '#') return 1;
      if (bFirstLetter === '#') return -1;
      return aFirstLetter.localeCompare(bFirstLetter);
    }

    // 首字母相同，比较完整名称
    return a.name.localeCompare(b.name, 'zh-CN');
  });

  // 按首字母分组
  const grouped: Record<string, MetricItem[]> = {};
  sortedMetrics.forEach(item => {
    const firstLetter = getFirstLetter(item.name);
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(item);
  });

  return grouped;
};

// 获取当前可用的字母列表（按顺序排列）
const availableLetters = computed(() => {
  // 获取所有字母键
  const letters = Object.keys(groupedMetrics.value);
  // 按字母顺序排序，确保#号在最后
  return letters.sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });
});

// 滚动到指定字母位置
const scrollToLetter = (letter: string) => {
  const element = document.getElementById(`letter-${letter}`);
  if (element) {
    // 使用平滑滚动
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
};
const searchText = ref('') // 搜索关键词
// 下拉框相关变量
const systemType = ref('1'); // 制度选择默认值
const frequency = ref('1'); // 调查频度默认值
const reportType = ref(''); // 报表默认值
const reportOptions = ref([]); // 报表下拉框选项
const reportCode=ref('')
// 指标选择相关变量
const leftSelectedItems = ref<string[]>([])  // 左侧选中项
const selectMetricsList = ref<MetricItem[]>([]);   // 选择的指标(右侧列表)
const rightSelectedItems = ref<string[]>([]) // 右侧选中项
const DEFAULT_METRICS_KEY = 'default_metrics'; // 本地存储, 默认指标

// 拖放相关变量
const draggedItem = ref<MetricItem | null>(null); // 存储当前拖动的项
// 模板相关变量
const selectedTemplate = ref(''); // 选择的模板
const templateList = ref<TemplateItem[]>([]); // 模板数据
const TEMPLATES_KEY = 'metric_templates'; // 本地存储, 指标模板

// 初始化模板列表，添加默认选项
const initializeTemplateList = () => {
  // 清空现有模板列表
  templateList.value = [];
  // 添加默认占位选项
  templateList.value.unshift({
    value: '',
    label: '请选择模板',
    metrics: [],
    reportCode: ''
  });
}
// 或者创建一个新的方法来生成唯一键
const getUniqueKey = (item: MetricItem) => {
  return `${item.id}_${item.tableName || reportCode.value}`;
}
interface Props {
  selectedMetrics: string;
  TABLE_CODE: string;
  columnsAndTable?: Array<{tableName: string; columns: string}>; // 添加这一行
}

const props = defineProps<Props>();
// 左侧列表搜索
const handleLeftSearch = () => {
  const keyword = searchText.value.toLowerCase();
  if (!keyword) {
    filteredMetricsList.value=[...metricsList.value]
  } else {
    filteredMetricsList.value=metricsList.value.filter(item =>
        item.name.toLowerCase().includes(keyword)
    );
  }
  // 按字母排序并分组
  groupedMetrics.value = sortAndGroupMetrics(filteredMetricsList.value);
};

// 处理可见性变化
const handleVisibleChange = (value: boolean): void => {
  saveTemplateModalVisible.value = value;
};



// 显示保存模板模态框
const showSaveTemplateModal = (): void => {
  if (selectMetricsList.value.length === 0) {
    message.warning('请先选择指标');
    return;
  }
  saveTemplateModalVisible.value = true;
};

// 获取并处理模板数据的统一函数
const fetchAndProcessTemplates = async () => {
  try {
    // 初始化分页参数
    let pageNo = 1;
    const pageSize = 100; // 设置一个合理的页面大小
    let totalTemplates = [];
    let hasMoreData = true;
    let totalCount = 0;
    // 分页遍历获取所有数据
    while (hasMoreData) {
      // 构建请求参数
      const param = {
        pageNo: pageNo,
        pageSize: pageSize,
        params: {},
        sortField: '',
        sortOrder: 'asc'
      };

      // 调用API获取当前页数据
      const response = await getDataQueryTemplateList(param);

      // 处理响应数据
      let currentPageTemplates = [];


      if (response && response.data) {
        // 记录总数（如果是第一页）
        if (pageNo === 1) {
          totalCount = response.data.total || 0;
        }

        // 获取当前页的记录，兼容各种可能的字段名
        if (Array.isArray(response.data.records)) {
          currentPageTemplates = response.data.records;
        } else if (Array.isArray(response.data.list)) {
          currentPageTemplates = response.data.list;
        } else if (Array.isArray(response.data)) {
          currentPageTemplates = response.data;
        }

        // 将当前页数据添加到总数组中
        if (currentPageTemplates.length > 0) {
          totalTemplates = totalTemplates.concat(currentPageTemplates);
        }

        // 判断是否还有更多数据
        hasMoreData = totalTemplates.length < totalCount && currentPageTemplates.length === pageSize;
      } else if (Array.isArray(response)) {
        // 兼容直接返回数组的情况
        currentPageTemplates = response;
        totalTemplates = totalTemplates.concat(currentPageTemplates);
        hasMoreData = false;
      } else {
        // 无法识别的响应格式，停止分页
        hasMoreData = false;
        console.warn('无法识别的API响应格式');
      }

      // 如果当前页没有数据，停止分页
      if (currentPageTemplates.length === 0) {
        hasMoreData = false;
        console.log('当前页没有数据，停止分页');
      }

      // 准备获取下一页
      pageNo++;

      // 添加一个小延迟，避免请求过于频繁
      if (hasMoreData) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('totalTemplates内容:', totalTemplates);

    // 初始化模板列表并添加默认选项
    initializeTemplateList();

    // 转换数据格式，兼容大小写不同的字段名
    const formattedTemplates = totalTemplates.map((template, index) => {

      // 获取所有可能的字段名变体
      const id = template.ID_ || template.id || template.ID || index.toString();
      const label = template.TEMPLATE_NAME || template.template_name || template.label || `模板${id}`;
      const queryCondition = template.QUERY_CONDITION || template.query_condition || [];
      const templateDesc = template.TEMPLATE_DESC || template.template_desc || template.description || '';
      const isSetPublic = template.IS_SET_PUBLIC || false;
      const createByName = template.CREATE_BY_NAME || '';
      const createTime = template.CREATE_TIME_ || '';

      const result = {
        value: id.toString(),
        label: label,
        id: id,
        metrics: queryCondition,
        description: templateDesc,
        shared: isSetPublic ? '是' : '否',
        creator: createByName,
        createTime: createTime
      };

      return result;
    });

    // 添加格式化后的模板
    templateList.value.push(...formattedTemplates);

    // 确保下拉框默认为"请选择模板"，不自动选择任何选项
    selectedTemplate.value = '';

    return true;
  } catch (error) {
    console.error('获取模板数据失败:', error);
    // 初始化模板列表并添加默认选项
    initializeTemplateList();
    return false;
  }
};

// 处理模板保存
const handleSaveTemplate = async (saveData: {
  formData: { name: string; description: string; shared: '是' | '否'; creator: string };
  metrics: any[]
}): Promise<void> => {
  const { formData: templateForm, metrics } = saveData;

  try {
    // 构建并保存到后端的数据
    const dataQueryTemplate = {
      template_name: templateForm.name,
      template_desc: templateForm.description,
      is_set_public: templateForm.shared === '是',
      creator: templateForm.creator,
      query_condition: selectMetricsList.value.map(item => item.id), // 将选中的指标作为查询条件
      tag_big_classify: '指标模板',
      tag_middle_classify: '自定义指标模板'
    };

    // 调用后端API保存数据
    console.log('准备保存数据到后端:', dataQueryTemplate);
    const saveResult = await saveDataQueryTemplate(dataQueryTemplate);
    console.log('后端保存结果:', saveResult);

    // 保存成功后重新从API获取最新的模板列表
    await fetchAndProcessTemplates();

    // 确保显示默认选项
    selectedTemplate.value = '';

    message.success(`模板"${templateForm.name}"保存成功`);
  } catch (error) {
    console.error('保存模板失败:', error);
    message.error('模板保存失败，请重试');
  }
};

// 处理取消保存模板
const handleCancelSaveTemplate = (): void => {
  console.log('取消保存模板');
};



/**
 * @desc: 列表下拉框切换处理
 * @param value
 * @param option
 * @return {*}
 */
const handleTableListChange =async (value,option) => {
  reportType.value = value;
  reportCode.value = option.code;

  // 加载对应的指标数据
  const listRes = await useList().loadListData(reportType.value);
  // 为指标数据添加表名信息
  metricsList.value = listRes.map(item => ({
    ...item,
    tableName: reportCode.value // 设置指标所属的表名
  }));
  filteredMetricsList.value = [...metricsList.value]; // 更新过滤列表
  // 按字母排序并分组
  groupedMetrics.value = sortAndGroupMetrics(filteredMetricsList.value);
};

/**
 * @desc: 检查项是否已在右侧列表中（只有同一表内的相同指标才视为重复）
 * @param id 项id
 * @param tableName 表名
 * @return {*}
 */
const isInRightList = (id, tableName) => {
  return selectMetricsList.value.some(item =>
      item.id === id && item.tableName === tableName
  )
}
// 左侧全选
// 左侧全选
const selectAllLeft = () => {
  // 过滤出未在右侧列表中的项（考虑表名）
  const availableItems = filteredMetricsList.value
      .filter(item => !isInRightList(item.id, item.tableName))
      .map(item => getUniqueKey(item));
  leftSelectedItems.value = [...availableItems];
};

/**
 * @desc: 左侧反选
 * @return {*}
 */
// 左侧反选
const invertSelectLeft = () => {
  // 获取所有可用项ID（考虑表名）
  const availableKeys = filteredMetricsList.value
      .filter(item => !isInRightList(item.id, item.tableName))
      .map(item => getUniqueKey(item));

  // 计算反选后的ID集合
  const currentSelected = new Set(leftSelectedItems.value);
  const inverted = availableKeys.filter(key => !currentSelected.has(key));

  leftSelectedItems.value = inverted;
};

/**
 * @desc: 右侧全选
 * @return {*}
 */
const selectAllRight = () => {
  rightSelectedItems.value = selectMetricsList.value.map(item => getUniqueKey(item));
};

/**
 * @desc: 右侧反选
 * @return {*}
 */
const invertSelectRight = () => {
  const allKeys = selectMetricsList.value.map(item => getUniqueKey(item));
  const currentSelected = new Set(rightSelectedItems.value);
  const inverted = allKeys.filter(key => !currentSelected.has(key));
  rightSelectedItems.value = inverted;
};

/**
 * @desc: 将左侧项复制至右侧
 * @return {*}
 */
const copyToRight = () => {
  if (leftSelectedItems.value.length === 0) return

  // 根据唯一键找到要复制的项
  const itemsToCopy = metricsList.value.filter((item) => {
    const uniqueKey = getUniqueKey(item);
    return leftSelectedItems.value.includes(uniqueKey);
  })

  // 为新添加的项设置表名
  itemsToCopy.forEach(item => {
    if (!item.tableName) {
      item.tableName = reportCode.value;
    }
  });

  // 过滤掉已经在右侧列表中的项（基于唯一键）
  const newItems = itemsToCopy.filter(newItem =>
      !selectMetricsList.value.some(existingItem =>
          getUniqueKey(existingItem) === getUniqueKey(newItem)
      )
  );

  // 将新项添加至右侧（允许同名不同表的指标）
  selectMetricsList.value = [...selectMetricsList.value, ...newItems]

  // 清空左侧选中状态
  leftSelectedItems.value = [];
}

/**
 * @desc: 将右侧项移至左侧
 * @return {*}
 */
const removeFromRight = () => {
  if (rightSelectedItems.value.length === 0) return

  // 根据唯一键找到要移除的项
  const removeItems = selectMetricsList.value.filter(item => {
    const uniqueKey = getUniqueKey(item);
    return rightSelectedItems.value.includes(uniqueKey);
  });

  // 从右侧列表移除项
  selectMetricsList.value = selectMetricsList.value.filter(item => {
    const uniqueKey = getUniqueKey(item);
    return !rightSelectedItems.value.includes(uniqueKey);
  })

  // 清空右侧选中状态
  rightSelectedItems.value = []

  // 从左侧选中状态中移除已删除的项，恢复未选中状态
  const removeKeys = removeItems.map(item => getUniqueKey(item));
  leftSelectedItems.value = leftSelectedItems.value.filter(key =>
      !removeKeys.includes(key)
  )
}

/**
 * @desc: 删除右侧单个项
 * @param id 删除项的id
 * @return {*}
 */
const deleteRightItem = (id, tableName) => {
  // 从右侧列表移除该项（基于id和tableName）
  selectMetricsList.value = selectMetricsList.value.filter(
      (item: MetricItem) => !(item.id === id && item.tableName === tableName)
  )

  // 从右侧选中状态中移除该项
  const uniqueKey = `${id}_${tableName}`;
  rightSelectedItems.value = rightSelectedItems.value.filter(key => key !== uniqueKey)

  // 从左侧选中状态中移除该项, 恢复未选中状态
  leftSelectedItems.value = leftSelectedItems.value.filter(key => key !== uniqueKey)
}



/**
 * @desc: 置顶
 * @return {*}
 */
const moveToTop = () => {
  if (rightSelectedItems.value.length === 0) return;

  // 保留选中项的顺序
  const selectedItems = rightSelectedItems.value
      .map(key => selectMetricsList.value.find(item => getUniqueKey(item) === key))
      .filter(Boolean) as MetricItem[];

  // 非选中项
  const unselectedItems = selectMetricsList.value.filter(
      item => !rightSelectedItems.value.includes(getUniqueKey(item))
  );

  // 新顺序：选中项 + 非选中项
  selectMetricsList.value = [...selectedItems, ...unselectedItems];
};

/**
 * @desc: 置底
 * @return {*}
 */
const moveToBottom = () => {
  if (rightSelectedItems.value.length === 0) return;

  // 非选中项
  const unselectedItems = selectMetricsList.value.filter(
      item => !rightSelectedItems.value.includes(getUniqueKey(item))
  );

  // 保留选中项的顺序
  const selectedItems = rightSelectedItems.value
      .map(key => selectMetricsList.value.find(item => getUniqueKey(item) === key))
      .filter(Boolean) as MetricItem[];

  // 新顺序：非选中项 + 选中项
  selectMetricsList.value = [...unselectedItems, ...selectedItems];
};

/**
 * @desc: 上升
 * @return {*}
 */
const moveUp = () => {
  if (rightSelectedItems.value.length !== 1) return; // 仅支持单个选中项移动

  const key = rightSelectedItems.value[0];
  const index = selectMetricsList.value.findIndex(item => getUniqueKey(item) === key);

  if (index > 0) {
    // 交换位置
    const newList = [...selectMetricsList.value];
    [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
    selectMetricsList.value = newList;
  }
};

/**
 * @desc: 下降（交换位置）
 * @return {*}
 */
const moveDown = () => {
  if (rightSelectedItems.value.length !== 1) return; // 仅支持单个选中项移动

  const key = rightSelectedItems.value[0];
  const index = selectMetricsList.value.findIndex(item => getUniqueKey(item) === key);

  if (index < selectMetricsList.value.length - 1) {
    // 交换位置
    const newList = [...selectMetricsList.value];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
    selectMetricsList.value = newList;
  }
};
/**
 * @desc: 设置为默认指标
 * @return {*}
 */
const setAsDefault = () => {
  if (selectMetricsList.value.length === 0) {
    message.warning('请先选择指标');
    return;
  }

  const defaultConfig = {
    reportCode: reportCode.value,
    metrics: selectMetricsList.value.map(item => item.id)
  };
  localStorage.setItem(DEFAULT_METRICS_KEY, JSON.stringify(defaultConfig));
  message.success('已设置为默认显示指标');
};

/**
 * @desc: 使用默认指标
 * @return {*}
 */
const useDefaultMetrics = () => {
  const defaultConfigStr = localStorage.getItem(DEFAULT_METRICS_KEY);
  if (!defaultConfigStr) {
    message.warning('暂无默认指标配置');
    return;
  }

  const defaultConfig = JSON.parse(defaultConfigStr);
  if (defaultConfig.reportCode !== reportCode.value) {
    message.warning('当前报表无默认指标配置');
    return;
  }

  // 加载默认指标
  const defaultMetrics = defaultConfig.metrics;
  const itemsToAdd = metricsList.value.filter(item =>
      defaultMetrics.includes(item.id)
  );
  selectMetricsList.value = itemsToAdd;
  message.success('已加载默认指标');
};


/**
 * @desc: 拖动开始
 * @param event 拖放事件
 * @param item 拖动的项
 * @return {*}
 */
const handleDragStart = (event: DragEvent, item: MetricItem) => {
  draggedItem.value = item;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    // 设置一个简单的拖动数据
    event.dataTransfer.setData('text/plain', getUniqueKey(item));
  }
  // 为拖动的元素添加样式
  if (event.target instanceof HTMLElement) {
    event.target.classList.add('dragging');
  }
};

/**
 * @desc: 拖动经过
 * @param event 拖放事件
 * @return {*}
 */
const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

/**
 * @desc: 拖动进入
 * @param event 拖放事件
 * @param item 目标项
 * @return {*}
 */
const handleDragEnter = (event: DragEvent, item: MetricItem) => {
  event.preventDefault();
  // 为目标元素添加样式
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.classList.add('drag-over');
  }
};

/**
 * @desc: 拖动离开
 * @param event 拖放事件
 * @param item 目标项
 * @return {*}
 */
const handleDragLeave = (event: DragEvent, item: MetricItem) => {
  event.preventDefault();
  // 为目标元素移除样式
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.classList.remove('drag-over');
  }
};

/**
 * @desc: 放置
 * @param event 拖放事件
 * @param targetItem 目标项
 * @return {*}
 */
const handleDrop = (event: DragEvent, targetItem: MetricItem) => {
  event.preventDefault();
  // 移除所有目标元素的样式
  const allMetricItems = document.querySelectorAll('.metric-item');
  allMetricItems.forEach(item => item.classList.remove('drag-over'));

  if (!draggedItem.value) return;

  // 找到拖动项和目标项的索引
  const draggedIndex = selectMetricsList.value.findIndex(
      item => getUniqueKey(item) === getUniqueKey(draggedItem.value!)
  );
  const targetIndex = selectMetricsList.value.findIndex(
      item => getUniqueKey(item) === getUniqueKey(targetItem)
  );

  // 如果没有找到索引或索引相同，则不执行任何操作
  if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
    return;
  }

  // 调整列表顺序
  const newList = [...selectMetricsList.value];
  // 先从列表中删除拖动项
  newList.splice(draggedIndex, 1);
  // 再将拖动项插入到目标位置
  newList.splice(targetIndex, 0, draggedItem.value);
  // 更新响应式数组
  selectMetricsList.value = newList;
};

/**
 * @desc: 拖动结束
 * @param event 拖放事件
 * @param item 拖动的项
 * @return {*}
 */
const handleDragEnd = (event: DragEvent, item: MetricItem) => {
  // 移除拖动元素的样式
  if (event.target instanceof HTMLElement) {
    event.target.classList.remove('dragging');
  }
  // 移除所有目标元素的样式
  const allMetricItems = document.querySelectorAll('.metric-item');
  allMetricItems.forEach(item => item.classList.remove('drag-over'));
  // 清除临时存储的拖动项
  draggedItem.value = null;
};

/**
 * @desc: 加载模板
 * @return {*}
 */
const loadTemplate = (value: string) => {
  const template = templateList.value.find(tpl => tpl.value === value);
  if (!template) return;

  // 清空当前选择
  selectMetricsList.value = [];
  rightSelectedItems.value = [];

  // 添加模板中的指标
  const templateMetrics = template.metrics;
  const itemsToAdd = metricsList.value.filter(item =>
      templateMetrics.includes(item.id)
  );
  selectMetricsList.value.push(...itemsToAdd);
};

/**
 * @desc: 删除模板
 * @return {*}
 */
const deleteTemplate = async () => {
  if (!selectedTemplate.value) return;

  try {
    // 先从本地删除模板
    const templateToDelete = templateList.value.find(tpl => tpl.value === selectedTemplate.value);

    console.log("da",templateToDelete)

    await removeDataQueryTemplate(templateToDelete.id);
    console.log('后端模板删除成功:', templateToDelete.id);
    selectMetricsList.value = [];
    message.success('模板删除成功');
    await fetchAndProcessTemplates();
    // 清空选择，确保显示默认选项
    selectedTemplate.value = '';
  } catch (error) {
    console.error('删除模板失败:', error);
    message.error('模板删除失败，请重试');
    // 错误时重新从API获取模板列表
    const success = await fetchAndProcessTemplates();
    // 如果API调用失败，降级到localStorage
    if (!success) {
      const savedTemplates = localStorage.getItem(TEMPLATES_KEY);
      if (savedTemplates) {
        templateList.value = JSON.parse(savedTemplates);
      } else {
        templateList.value = [];
      }
    }
    // 清空选择，确保显示默认选项
    selectedTemplate.value = '';
  }
};

/**
 * @desc: 确定按钮点击处理
 * @return {*}
 */
/**
 * @desc: 确定按钮点击处理
 * @return {*}
 */
const handleConfirm = () => {
  // 获取右侧列表中被选中的项
  const selectedItems = selectMetricsList.value.filter(item =>
      rightSelectedItems.value.includes(getUniqueKey(item))
  );

  // 如果没有选中任何项，则传递所有项
  const itemsToProcess = selectedItems.length > 0 ? selectedItems : selectMetricsList.value;

  // ====== 构建 columnsAndTable ======
  const tableOrder = []; // 记录表名的顺序
  const tableGroups: Record<string, string[]> = {}; // 存储每个表的指标

  itemsToProcess.forEach(item => {
    const tableName = item.tableName || reportCode.value;
    if (!tableGroups[tableName]) {
      tableGroups[tableName] = [];
      tableOrder.push(tableName);
    }
    tableGroups[tableName].push(item.id);
  });

  const columnsAndTable = tableOrder.map(tableName => ({
    tableName,
    columns: tableGroups[tableName].join(',')
  }));

  // ====== 构建 allColumnsAndTable（右侧所有项，不管是否勾选） ======
  const allTableOrder: string[] = [];
  const allTableGroups: Record<string, string[]> = {};

  selectMetricsList.value.forEach(item => {
    const tableName = item.tableName || reportCode.value;
    if (!allTableGroups[tableName]) {
      allTableGroups[tableName] = [];
      allTableOrder.push(tableName);
    }
    allTableGroups[tableName].push(item.id);
  });

  const allColumnsAndTable = allTableOrder.map(tableName => ({
    tableName,
    columns: allTableGroups[tableName].join(',')
  }));

  emit('back-to-detail', {
    tableCode: reportCode.value,
    metrics: itemsToProcess.map(item => item.id).join(','),
    columnsAndTable: columnsAndTable,       // 勾选项
    allColumnsAndTable: allColumnsAndTable, // 所有右侧项
    fromSetting: true
  });
};

/**
 * @desc: 返回按钮点击处理
 * @return {*}
 */
const backToDetail=()=>{
  emit('back-to-detail',{tableCode: reportCode.value});
}

onMounted(async () => {
  // 获取报表
  const optionRes = await useForm().getReportOptions();
  reportOptions.value = optionRes || [];
  if (optionRes && optionRes.length > 0) {
    reportType.value = optionRes[0].value;
    reportCode.value = optionRes[0].code;
  }

  // 获取当前报表的指标
  const ListRes = await useList().loadListData(reportType.value);
  metricsList.value = ListRes.map(item => ({
    ...item,
    tableName: reportCode.value
  }));

  filteredMetricsList.value = [...metricsList.value];
  // 按字母排序并分组
  groupedMetrics.value = sortAndGroupMetrics(filteredMetricsList.value);

  // 初始化模板列表并添加默认选项
  initializeTemplateList();
  // 使用统一函数获取模板数据
  const success = await fetchAndProcessTemplates();
  // 如果API调用失败，降级到localStorage
  if (!success) {
    const savedTemplates = localStorage.getItem(TEMPLATES_KEY);
    if (savedTemplates) {
      templateList.value = JSON.parse(savedTemplates);
    }
  }

// ====== 多表指标回显处理 ======
  if (props.columnsAndTable && props.columnsAndTable.length > 0) {
    console.log("处理多表配置:", props.columnsAndTable);

    // 先把所有表的字段都拉回来，做成字典
    const allTables: any[] = [];
    for (const tableConfig of props.columnsAndTable) {
      // 找到对应的报表配置
      const matchedReport = reportOptions.value.find(
          r => r.code === tableConfig.tableName || r.label.includes(tableConfig.tableName)
      );
      if (!matchedReport) continue;

      const fields = await useList().loadListData(matchedReport.value); // 用 ID_ 请求
      allTables.push({
        tableName: tableConfig.tableName,
        columns: fields || []
      });
    }

    const allSelectedItems: MetricItem[] = [];

    props.columnsAndTable.forEach(tableConfig => {
      const selectedIds = tableConfig.columns
          .split(",")
          .filter(id => id.trim());

      console.log(`表 ${tableConfig.tableName} 的选中指标:`, selectedIds);

      selectedIds.forEach(id => {
        const tableDef = allTables.find(t => t.tableName === tableConfig.tableName);
        const fieldDef = tableDef?.columns.find(c => c.id === id);

        let matchedItem: MetricItem;
        if (fieldDef) {
          matchedItem = {
            id: fieldDef.id,
            name: fieldDef.name, // 映射成中文
            tableName: tableConfig.tableName
          };
        } else {
          matchedItem = {
            id,
            name: id,
            tableName: tableConfig.tableName
          };
        }

        const isDuplicate = allSelectedItems.some(
            item => item.id === matchedItem.id && item.tableName === matchedItem.tableName
        );
        if (!isDuplicate) {
          allSelectedItems.push(matchedItem);
        }
      });
    });

    console.log("最终选中的所有指标:", allSelectedItems);
    selectMetricsList.value = allSelectedItems;
  }
});


</script>

<style scoped lang="scss">
/* 排序按钮组 */
.sort-buttons {
  display: flex;

  /* flex-direction: column; */
  gap: 8px;
  padding: 12px;

  /* background: rgba(245, 245, 247, 1); */

  /* border: 1px solid rgba(245, 245, 247, 1); */
  border-radius: 4px;
}

/* 排序按钮 */
.sort-button {
  /* width: 100%; */
  height: 24px;

  /* height: 32px; */
  background: rgb(20 21 34 / 100%);
  border: none;
  color: white;
  border-radius: 5px !important;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 12px;
  font-size: 13px;
}

.sort-button:hover {
  background: rgb(20 21 34 / 80%);
  color: white;
}

/* 排序图标 */
.sort-icon {
  color: white;
  font-size: 14px;
}

.metric-item:last-child {
  border-bottom: none;
}

.metric-item:hover {
  background-color: #fafafa;
}

.copy-icon {
  color: rgb(84 111 255);
  cursor: pointer;
  margin-left: 8px;
  font-size: 13px;
}

.metric-item:hover .copy-icon {
  visibility: visible;
}

/* 字母标题样式 */
.alphabet-header {
  background-color: #f5f5f7;
  color: #333;
  font-size: 14px;
  font-weight: 600;
  padding: 8px 16px;
  margin: 0;
  border-bottom: 1px solid #e0e0e0;
}

/* 字母索引垂直排列样式 */
.alphabet-index-vertical {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 10px;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  z-index: 10;
}

.alphabet-letter {
  width: 20px;
  height: 20px;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s;
}

.alphabet-letter:hover {
  background-color: #e6f7ff;
  color: #1890ff;
  font-weight: bold;
}

:deep(.ant-checkbox-wrapper) {
  color: rgb(0 0 0 / 85%);
  font-size: 13px;
}

/* :deep(.ant-input) {
  border-radius: 5px;
  background: #f5f5f7;
  border: none;
  font-size: 13px;
} */

/* :deep(.ant-input::placeholder) {
  color: #373737;
  font-size: 13px;
} */

/* :deep(.ant-btn) {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 3px 10px;
  font-size: 13px;
} */

:deep(.ant-btn-text:hover) {
  background: transparent;
  color: rgb(84 111 255);
}

:deep(.ant-checkbox-group) {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
}

.search-header {
  background-color: white;
  padding: 20px;
  border-radius: 17.08px;
  margin-bottom: 16px;
}

.search-row {
  margin-bottom: 16px;
}

.search-row:last-child {
  margin-bottom: 0;
}

/* 修改标签文字样式 */
.search-item span {
  color: rgb(113 113 113 / 100%);
  font-size: 16px;
  white-space: nowrap;
}

/* 修改输入框和选择框样式 */
:deep(.ant-select-selector) {
  border-radius: 85px !important;
  background: rgb(245 245 247 / 100%) !important;
  border: none !important;
}

:deep(.ant-input) {
  border-radius: 85px !important;
  background: rgb(245 245 247 / 100%) !important;
  border: none !important;
}

/* 修改placeholder文字颜色 */

/* :deep(.ant-input::placeholder) {
  color: rgba(55, 55, 55, 1) !important;
}

:deep(.ant-select-selection-placeholder) {
  color: rgba(55, 55, 55, 1) !important;
} */

/* 修改选择框中已选择的文字颜色 */
:deep(.ant-select-selection-item) {
  color: rgb(55 55 55 / 100%) !important;
}

/* 表格行高度样式 */
:deep(.custom-row-height) {
  height: 36px;
}

/* 表格头部样式 */
:deep(.ant-table-thead > tr > th) {
  background-color: #f5f5f5;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  padding: 0 !important;
  height: 36px;
  line-height: 36px;
}

/* 表格单元格样式 */
:deep(.ant-table-tbody > tr > td) {
  text-align: center;
  padding: 0 !important;
  height: 36px;
  line-height: 36px;
}

/* 操作按钮样式 */
.edit-btn,
.delete-btn {
  padding: 0;
  height: 36px;
  display: inline-flex;
  align-items: center;
}

/* 开关样式 */
:deep(.ant-switch) {
  margin: 0 auto;
}

/* 右侧搜索区域样式 */
.rightSearch {
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
}

/* 按钮组样式 */
.ant-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 表格容器样式 */
.table-container {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

/* 底部系统业务指标区域样式调整 */
.system-indicator {
  background: rgb(237 239 255 / 60%);
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.system-indicator .ant-btn {
  height: 28px;
  font-size: 13px;
  padding: 3px 10px;
}

/* 添加新的样式 */
.left-container {
  display: flex;
  flex-direction: column;
}

.right-container {
  height: calc(100% - 24px);

  /* 减去margin-bottom的值 */
  min-height: 385px;

  /* 设置最小高度，确保有内容时能正常显示 */
  display: flex;
}

/* 确保列表容器占满剩余空间 */
.metric-item {
  padding: 8px 14px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.metric-item:hover {
  background-color: #f5f5f5;
}

/* 拖动时的样式 */
.metric-item[draggable="true"]:active {
  cursor: grabbing;
}

/* 拖动过程中的样式 */
.metric-item[draggable="true"].dragging {
  opacity: 0.5;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transform: rotate(0.1deg);
}

/* 拖动到目标位置时的样式 */
.metric-item[draggable="true"].drag-over {
  border-bottom: 2px solid #1890ff;
  background-color: #e6f7ff;
}

.arrow-button {
  width: 32px;
  height: 32px;
  background: rgb(20 21 34 / 100%);
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.arrow-button:hover {
  background: rgb(20 21 34 / 80%);
}

/* 指标项容器 */
.metric-item-container {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
}

/* 删除图标 */
.delete-icon {
  color: black;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    color: #d43030;
  }
}

/* 模板搜索区域 */
.template-search-container {
  display: flex;
  align-items: center;
  margin-left: 14px;
}

/* 模板标签 */
.template-label {
  margin-right: 8px;
  color: rgb(113 113 113 / 100%);
  font-size: 14px;
}

/* 模板选择框 */
.template-select {
  width: 200px;
}

/* 搜索按钮 */
.search-button {
  background: rgb(84 111 255);
  border-radius: 85px;
  height: 28px;
  font-size: 13px;
}

/* 搜索图标 */
.search-icon {
  color: white;
  font-size: 13px;
}
</style>
