<!--
 * @文件路径: \fifth-web\src\views\home\data-processing\quick-summary\index.vue
 * @作者名称: shenjiamin
 * @创建日期: 2025-08-27 18:01:19
 * @简要说明: 快速汇总主页面
 * @编辑时间: 2025-09-04 16:46:17
 * Copyright (c) 2025 by shenjiamin, All Rights Reserved.
-->
<template>
  <div v-if="!showStatisticalDefinition" class="quick-summary-container">
    <QuickSummaryForm :list="curList" @change:value="handleFormChange"></QuickSummaryForm>

    <div class="content-box">
      <!-- 栏目选择 -->
      <div class="column-container">
        <div class="left-container">
          <div class="select-container">
            <!-- 搜索框 -->
            <a-input v-model:value="searchValue" placeholder="请输入" style="height: 30px;">
              <template #suffix>
                <SearchOutlined />
              </template>
            </a-input>
            <!-- 衍生指标按钮 -->
            <a-button class="derive-btn" @click="handleDerive">
              <QuestionCircleFilled style="display: inline-block"/>
              衍生指标
            </a-button>
          </div>
          <!-- 树 -->
          <div class="tree-container">
            <a-tree
                :show-line="true"
                :default-expanded-keys="['0-0']"
                :tree-data="filteredTreeData"
            >
              <template #title="{ title, data }">
                <div
                    class="tree-node"
                    draggable="true"
                    @dragstart="handleDragStart(data)"
                    @dragend="handleDragEnd"
                    :class="{ dragging: isDraggingId === data.key }"
                >
                  <span class="tree-node-title" :class="{ 'leaf-node': !data.children || data.children.length === 0 }">
                    <span v-if="title.indexOf(processedSearchValue) > -1">
                      {{ title.substring(0, title.indexOf(processedSearchValue)) }}
                      <span style="color: #f50">{{ processedSearchValue }}</span>
                      {{ title.substring(title.indexOf(processedSearchValue) + searchValue.length) }}
                    </span>
                    <span v-else>
                      {{ title }}
                    </span>
                  </span>
                </div>
              </template>
            </a-tree>
          </div>
        </div>

        <!-- 栏目 -->
        <div class="column">
          <div class="title-box main-title-box">
            <span class="text">主栏</span>
            <span class="tips"></span>
            <span class="btn refresh-btn" @click="resetColumns">
              <ReloadOutlined />
            </span>
          </div>
          <div class="column-box">
            <div class="main">
              <!-- 主栏接收容器 -->
              <div
                  class="content-box"
                  @dragenter.prevent="handleDragEnter('main')"
                  @dragover.prevent="handleDragOver('main', $event)"
                  @dragleave="handleDragLeave('main')"
                  @drop="handleDrop('main')"
                  :class="{ 'drag-over': activeDropArea === 'main', 'drag-disabled': isDuplicateInArea('main') }"
              >
                <!-- 总计勾选框 -->
                <div class="total-box chekbox-item-box">
                  <span>总计</span>
                  <a-checkbox
                      v-model:checked="isTotalChecked"
                      :disabled="true"
                      @change="handleTotalCheckChange"
                  ></a-checkbox>
                </div>
                <!-- 主栏已选节点 -->
                <div class="item-box" v-for="(item, idx) in mainList" :key="idx">
                  <template v-if="!['total'].includes(item.key)">
                    <span class="label ellipsis" :title="item.listNum ? `${item.listNum} ${item.title}` : item.title"
                          style="max-width: 150px">
                       {{ item.listNum ? `${item.listNum} ${item.title}` : item.title }}
                    </span>
                    <div class="setting-box">
                      <!-- 截位下拉选择框 -->
                      <a-select
                          v-model:value="item.formatType"
                          size="small"
                          style="width: 80px;"
                          :options="formatOptions"
                          @change="handleFormatTypeChange(item)"
                          default-value="truncate"
                      />

                      <!-- 输入框  -->
                      <a-input
                          v-model:value="item.formatValue"
                          size="small"
                          style="width: 50px; height: 25px"
                          :placeholder="getInputPlaceholder(item.formatType)"
                          type="text"
                          @blur="handleFormatValueBlur(item)"
                      />

                      <div class="btn delete-btn" @click="handleDelete('main', idx)">
                        <DeleteOutlined />
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <!-- 宾栏：接收"指标"类型节点 -->
            <div class="side">
              <div class="title-box">
                <span class="text">宾栏</span>
                <span class="tips"></span>
                <span class="refresh-btn"></span>
              </div>
              <!-- 宾栏接收容器 -->
              <div
                  class="content-box"
                  @dragenter.prevent="handleDragEnter('side')"
                  @dragover.prevent="handleDragOver('side', $event)"
                  @dragleave="handleDragLeave('side')"
                  @drop="handleDrop('side')"
                  :class="{ 'drag-over': activeDropArea === 'side', 'drag-disabled': isDuplicateInArea('side') }"
              >
                <!-- 普通指标项 -->
                <div class="item-box normal-item" v-for="(item, idx) in normalSideList" :key="idx">
                  <span class="label ellipsis" :title="item.title">
                    {{ item.listNum }} {{ item.title }}
                  </span>
                  <div class="btns setting-box">
                    <a-select
                        v-if="!item.formula || item.formula.trim() === ''"
                        v-model:value="item.method"
                        :options="options"
                        default-active-first-option
                        size="small"
                    />
                    <span class="btn" @click="handleSet">
                      <SettingOutlined />
                    </span>
                    <span class="btn delete-btn" @click="handleDelete('side', idx)">
                      <DeleteOutlined />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 表格 -->
      <div class="table-container">
        <RectangleTab
            :list="tabsConfig"
            :clickable="true"
            @click:item="handleOverviewItem"
            :tabList="tabsConfig"
        />

        <!-- 简化表格渲染 -->
        <a-table
            :dataSource="tableDataSource"
            :columns="columns"
            :loading="tableLoading"
            size="small"
            :pagination="false"
            :scroll="{ x: 1080, y: 860  }"
            :rowClassName="getRowClassName"
            virtual
            :virtual-scroll="virtualScrollConfig"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.dataIndex === 'index'">
              {{ (index + 1) }}
            </template>

            <template v-if="record.isSeparator">
              <td :colspan="columns.length" style="text-align: center; background: #f0f2f5; font-weight: bold;">
                <!-- 分隔行内容 -->
              </td>
            </template>
          </template>
        </a-table>
      </div>
    </div>
  </div>

  <!-- 统计口径设置组件 -->
  <div v-if="showStatisticalDefinition" class="statistical-definition-container">
    <StatisticalDefinition
        ref="statisticalDefinitionRef"
        @back="handleCloseStatisticalDefinition"
        @confirm="handleStatisticalDefinitionConfirm"
    />
  </div>

  <!-- 衍生指标弹窗 -->
  <a-modal
      v-model:open="deriveModalVisible"
      title="衍生指标"
      width="1200px"
      @cancel="handleDeriveCancel"
  >
    <yanshengzhibiao ref="deriveFormRef" @select-column="handleSelectDeriveColumn"/>
    <template #footer>
      <a-button @click="handleDeriveCancel">取消</a-button>
    </template>
  </a-modal>

  <!-- 图表弹窗 -->
  <a-modal
      v-model:open="chartModalVisible"
      title="统计图表"
      width="1000px"
      destroyOnClose
      :footer="null"
      :body-style="{ maxHeight: '80vh', overflow: 'auto' }"
  >
    <div v-if="chartDataList.length === 0" class="no-chart-data">
      <p>暂无图表数据</p>
    </div>
    <div v-else class="chart-container">
      <div v-for="(chartData, index) in chartDataList" :key="index" class="single-chart-wrapper">
        <div v-if="xAxisDataList[index]" class="chart-title">
          表格 {{ index + 1 }} - 统计图表
        </div>
        <LineChart
            :chart-data="chartData"
            :x-axis-data="xAxisDataList[index]"
        />
      </div>
    </div>
  </a-modal>

  <!-- 保存模板模态框 -->
  <SummaryTemplateModal
      v-model:visible="templateModalVisible"
      :current-metrics="[...mainList, ...normalSideList]"
      @save="handleTemplateSave"
  />
</template>

<script setup lang="ts">
import yanshengzhibiao from './yanshengzhibiao/index.vue';
import { computed, ref, watch, onMounted, shallowRef, triggerRef, onUnmounted, onBeforeUnmount } from 'vue';
import { saveDataQueryTemplate, saveSumTemplate } from '@/api/data-processing';
import StatisticalDefinition from '@/components/StatisticalDefinition/index.vue';
import QuickSummaryForm from './head-form/Index.vue';
import LineChart from '@/components/Summary/LineChart/index.vue';
import router from '@/router';

// 定义组件props
const props = defineProps<{
  queryData?: any
}>();
import {
  QuestionCircleFilled,
  ReloadOutlined,
  SettingOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  SaveOutlined, BarChartOutlined,
  LeftOutlined,
} from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import RectangleTab from '@/components/CustomTabs/RectangleTab.vue';
import { useTree } from './hooks/useTreeHooks';
import { useFilterHooks } from './hooks/useFilterHooks';
import { useTableHooks } from './hooks/useTableHooks';
import { cacheControl, type CacheConfig } from '@/utils/cacheControl';
import { quickSummaryApi, type FindQuickSumaryParams } from '@/api/data-processing/index';
import WorkerManager from '@/utils/worker/workerManager';
import type {
  ProcessProgressMessage,
  DataProcessedMessage,
  WorkerErrorMessage
} from '@/workers/types';

// 定义接口类型
interface TableField {
  key: string;
  title: string;
  listNum?: string;
  tableName?: string;
  tablecode?: string;
  method?: string;
  formatType?: string;
  formatValue?: string;
  digit?: string;
}

interface SystemItem {
  key: string;
  title: string;
  method: string;
  checked: boolean;
}

interface SideField extends TableField {
  formula?: string;
}

interface DragNode {
  key: string;
  title: string;
  listNum?: string;
  tableName?: string;
  tablecode?: string;
  method?: string;
}

interface TableRow {
  key: string;
  isHeader?: boolean;
  isTotalRow?: boolean;
  isSeparator?: boolean;
  isEmpty?: boolean;
  tableIndex?: number;
  [key: string]: any;
}

interface SummaryQuery {
  tableNum: string;
  tableName: string;
  groupFields: string[];
  sumFields: string[];
  interceptQueries: { columnName: string; value: string }[];
}

// 格式化选项配置
const formatOptions = [
  { label: '截位', value: 'truncate' },
];

/**
 * @desc: 格式化类型变化处理
 */
const handleFormatTypeChange = (item: TableField): void => {
  // 如果选择"截位"，设置默认位数
  if (item.formatType === 'truncate' && !item.formatValue) {
    item.formatValue = '';
  }
};

/**
 * @desc: 获取输入框占位符文本
 */
const getInputPlaceholder = (formatType: string): string => {
  switch (formatType) {
    case 'truncate':
      return '值';
    default:
      return '值';
  }
};

/**
 * @desc: 格式化值失焦处理
 */
const handleFormatValueBlur = (item: TableField): void => {
  if (item.formatType === 'truncate') {
  }
};

// 缓存配置 - 增强内存管理
const cacheConfig = ref<CacheConfig>({
  maxMemoryMB: 300,
  maxLocalStorageKB: 512,
  cleanupInterval: 15 * 60 * 1000, // 延长清理间隔，避免频繁清理
  enableMonitoring: true
});

// 缓存统计
const cacheStats = ref<{
  memoryUsed: number;
  localStorageSize: number;
  sessionStorageSize: number;
  indexedDBSize: number;
  cacheCount: number;
  lastCleanup: Date;
} | null>(null);

// 统计和清理定时器
let statsInterval: number | null = null;
let cleanupInterval: number | null = null;

/**
 * @desc: 初始化缓存控制
 */
const initCacheControl = (): number => {
  cacheControl.updateConfig(cacheConfig.value);

  // 异步获取缓存统计
  const loadCacheStats = async (): Promise<void> => {
    try {
      cacheStats.value = await cacheControl.getCacheStats();
    } catch (error) {
      console.warn('获取缓存统计失败:', error);
      // 设置默认值
      cacheStats.value = {
        memoryUsed: 0,
        localStorageSize: 0,
        sessionStorageSize: 0,
        indexedDBSize: 0,
        cacheCount: 0,
        lastCleanup: new Date()
      };
    }
  };

  loadCacheStats();

  // 启动定时安全更新缓存统计
  const interval = window.setInterval(async () => {
    try {
      cacheStats.value = await cacheControl.getCacheStats();
    } catch (error) {
      console.warn('更新缓存统计失败:', error);
    }
  }, 10000);

  return interval;
};

// 内存监控阈值 - 设置较低的阈值以便及早干预
const MEMORY_THRESHOLD_MB = 500;
const fixedEmptyRows = 100; // 固定空行数量
const MEMORY_CHECK_INTERVAL = 5000; // 更频繁地检查内存使用

/**
 * @desc: 启动内存监控 - 增强版
 */
const startMemoryMonitoring = (): void => {
  if (!('memory' in performance)) return;

  setInterval(() => {
    const memory = (performance as any).memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);

    if (usedMB > MEMORY_THRESHOLD_MB || usedMB / limitMB > 0.7) {
      // 执行紧急内存清理
      emergencyMemoryCleanup();
    }
  }, MEMORY_CHECK_INTERVAL);
};

/**
 * @desc: 紧急内存清理 - 更彻底的清理
 */
const emergencyMemoryCleanup = (): void => {
  console.warn('执行紧急内存清理...');
  // 清理不必要的数据引用
  cleanupPreviousData();

  // 清理缓存
  try {
    cacheControl.clearCache('previous-table-data');
  } catch (error) {
    console.warn('清理缓存失败:', error);
  }

  // 强制垃圾回收（如果可用）
  if (typeof window.gc === 'function') {
    try {
      window.gc();
    } catch (error) {
      console.warn('垃圾回收调用失败:', error);
    }
  }
};

/**
 * @desc: 手动清除缓存
 */
const manualCleanup = async (): Promise<void> => {
  try {
    // 使用安全清理方法
    await cacheControl.safeCleanup();
    cacheStats.value = await cacheControl.getCacheStats();
    message.success('安全缓存清理完成，token已保护');
  } catch (error) {
    console.error('缓存清理失败:', error);
    message.error('缓存清理失败');
  }
};

// 页面可见性变化处理
let hiddenTimer: number | null = null;
let pageHiddenStartTime: number | null = null;
let cleanupTimer: number | null = null;

/**
 * @desc: 页面可见性变化处理
 */
const handleVisibilityChangeSimple = (): void => {
  if (document.hidden) {
    pageHiddenStartTime = Date.now();

    // 清除现有计时器
    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
    }

    // 只在长时间离开时清理（5分钟）
    cleanupTimer = window.setTimeout(async () => {
      if (document.hidden && pageHiddenStartTime && (Date.now() - pageHiddenStartTime) > (5 * 60 * 1000 - 1000)) {
        try {
          await cacheControl.safeCleanup();
        } catch (error) {
          console.error('缓存清理失败:', error);
        }
      }
      cleanupTimer = null;
    }, 5 * 60 * 1000); // 5分钟
  } else {
    const hiddenDuration = pageHiddenStartTime ? (Date.now() - pageHiddenStartTime) : 0;

    // 清除清理计时器
    if (cleanupTimer) {
      clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }

    // 短暂离开不清理
    if (hiddenDuration < 60000) { // 1分钟内
      return;
    }

    pageHiddenStartTime = null;
  }
};

// WorkerManager实例
let workerManager: WorkerManager | null = null;

// 数据处理相关状态
const processingProgress = ref(0);
const processedCount = ref(0);
const totalCount = ref(0);

/**
 * @desc: 使用Worker处理数据 - 支持增量渲染版本
 */
const processDataWithWorker = async (resDataList: any[], isCurrentTask: () => boolean): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 清理之前的Worker
    if (workerManager) {
      workerManager.terminate();
    }


    // 检查是否已取消或不是当前任务
    if (renderAbortController?.signal.aborted || !isCurrentTask()) {
      resolve();
      return;
    }

    // 添加取消信号监听
    const abortHandler = () => {
      workerManager?.terminate();
      resolve();
    };
    renderAbortController?.signal.addEventListener('abort', abortHandler);

    try {
      // 创建新的WorkerManager
      workerManager = new WorkerManager();
      const worker = workerManager.createWorker();

      // 设置进度回调
      workerManager.onMessage('PROCESS_PROGRESS', (data) => {
        processingProgress.value = data.progress;
      });

      // 设置数据处理完成回调
      workerManager.onMessage('DATA_PROCESSED', (data) => {
        if (data.partial) {
          // 处理部分数据更新
          tableDataList.value = data.data || [];
          triggerRef(tableDataList);
        } else if (data.complete) {
          // 处理完成
          tableDataList.value = data.data || [];
          triggerRef(tableDataList);
          processingProgress.value = 100;

          // 移除取消信号监听
          renderAbortController?.signal.removeEventListener('abort', abortHandler);

          // 延迟清理以避免影响性能
          setTimeout(() => {
            processingProgress.value = 0;
            if (workerManager) {
              workerManager.terminate();
            }
          }, 500);

          resolve();
        }
      });

      // 设置错误处理
      workerManager.onError((error) => {
        console.error('Worker处理错误:', error);

        // 移除取消信号监听
        renderAbortController?.signal.removeEventListener('abort', abortHandler);

        // 立即降级到主线程处理
        console.warn('Worker处理失败，正在降级到主线程处理...');
        workerManager?.terminate();

        // 降级处理
        processDataInMainThread(resDataList, isCurrentTask)
            .then(resolve)
            .catch(reject);
      });

      // 发送数据给Worker处理
      workerManager.postMessage({
        type: 'PROCESS_TABLE_DATA',
        data: resDataList,
        params: {
          chunkSize: 100, // 增大块大小，提高处理效率
          batchSize: 30, // 增大批次大小，减少批次数量
        }
      });

    } catch (error) {
      console.error('Worker初始化失败:', error);
      // 降级到主线程处理
      processDataInMainThread(resDataList)
          .then(resolve)
          .catch(reject);
    }
  });
};

/**
 * @desc: 小数据量直接处理和显示（无分批、无增量渲染）
 */
const processSmallDataSetDirectly = (resDataList: any[], isCurrentTask: () => boolean): void => {
  try {
    // 检查是否已取消或不是当前任务
    if (renderAbortController?.signal.aborted || !isCurrentTask()) {
      return;
    }
    allTableDataCache.value = {key: '', data: []};

    tableDataList.value = [];
    triggerRef(tableDataList);
    // 初始化表格数据列表
    const allTablesData: any[] = [];

    // 一次性处理所有数据
    for (let tableIndex = 0; tableIndex < resDataList.length; tableIndex++) {
      // 检查是否已取消或不是当前任务
      if (renderAbortController?.signal.aborted || !isCurrentTask()) {
        return;
      }
      const resData = resDataList[tableIndex];
      const tableRows: TableRow[] = [];

      // 处理表头
      if (resData.columns && resData.columns.length) {
        const headerRow: TableRow = {isHeader: true, key: `header-${tableIndex}`};
        resData.columns.slice(0, 15).forEach((col: any) => {
          headerRow[col.key] = col.title;
        });
        tableRows.push(headerRow);
      }

      // 处理所有数据行
      if (resData.rows && resData.rows.length) {
        for (let i = 0; i < resData.rows.length; i++) {
          // 检查是否已取消或不是当前任务
          if (renderAbortController?.signal.aborted || !isCurrentTask()) {
            return;
          }
          const row = resData.rows[i];
          const newObj: TableRow = {key: row.key || `row-${i}`};

          if (row.key === 'total_row') {
            // 处理总计行
            (resData.columns || []).slice(0, 15).forEach((col: any) => {
              const colKey = col.key;
              const colDataIndex = col.dataIndex;
              let targetValue = '';

              if (colKey === 'index') {
                targetValue = '总计';
                newObj[colKey] = targetValue;
                return;
              }

              if (colDataIndex && row.data && Object.prototype.hasOwnProperty.call(row.data, colDataIndex)) {
                targetValue = row.data[colDataIndex];
              } else if (row.data && Object.prototype.hasOwnProperty.call(row.data, colKey)) {
                targetValue = row.data[colKey];
              }

              newObj[colKey] = targetValue  === null || targetValue === undefined ? '' : targetValue;
            });

            newObj.isTotalRow = true;
            newObj.key = `total-${tableIndex}-${i}`;
          } else {
            // 处理普通行
            (resData.columns || []).slice(0, 15).forEach((col: any) => {
              const colKey = col.key;
              const colDataIndex = col.dataIndex;
              let targetValue = '';

              if (colDataIndex && row.data && Object.prototype.hasOwnProperty.call(row.data, colDataIndex)) {
                targetValue = row.data[colDataIndex];
              } else if (row.data && Object.prototype.hasOwnProperty.call(row.data, colKey)) {
                targetValue = row.data[colKey];
              }

              newObj[colKey] = targetValue === null || targetValue === undefined ? '' : targetValue;
            });
            newObj.isNormalRow = true;
          }

          tableRows.push(newObj);
        }
      }

      allTablesData.push(tableRows);
    }

    // 一次性更新数据，不使用triggerRef以减少响应式开销
    tableDataList.value = allTablesData;
    triggerRef(tableDataList);
    tableLoading.value = false;

  } catch (error) {
    console.error('小数据量直接处理失败:', error);
    tableLoading.value = false;
    // 降级到标准处理方法
    processDataInMainThread(resDataList, () => true);
  }
};

/**
 * @desc: 主线程处理数据（Worker失败时的降级方案）- 支持增量渲染
 */
const processDataInMainThread = async (resDataList: any[], isCurrentTask: () => boolean): Promise<void> => {
  try {
    // 检查是否已取消或不是当前任务
    if (renderAbortController?.signal.aborted || !isCurrentTask()) {
      return;
    }

    // 初始化表格数据列表
    tableDataList.value = [];
    triggerRef(tableDataList);

    let firstBatchShown = false;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 80; // 更新间隔
    const MAX_BATCH_SIZE = 600;  // 批次大小

    // 限制处理的数据量
    const safeDataList = resDataList.slice(0, 1000);

    // 增量处理每个表
    for (let tableIndex = 0; tableIndex < safeDataList.length; tableIndex++) {
      // 检查是否已取消或不是当前任务
      if (renderAbortController?.signal.aborted || !isCurrentTask()) {
        return;
      }

      const resData = safeDataList[tableIndex];
      const tableRows: TableRow[] = [];

      // 处理表头
      if (resData.columns && resData.columns.length) {
        const headerRow: TableRow = {isHeader: true, key: `header-${tableIndex}`};
        resData.columns.slice(0, 15).forEach((col: any) => {
          headerRow[col.key] = col.title;
        });
        tableRows.push(headerRow);

        // 使用requestAnimationFrame确保平滑更新
        await new Promise(resolve => requestAnimationFrame(resolve));
        tableDataList.value = [...tableDataList.value, tableRows];
        triggerRef(tableDataList);

        if (!firstBatchShown) {
          firstBatchShown = true;
          tableLoading.value = false;
        }
      }

      // 增量处理数据行
      if (resData.rows && resData.rows.length) {
        // 检查是否已取消或不是当前任务
        if (renderAbortController?.signal.aborted || !isCurrentTask()) {
          return;
        }

        const safeRows = resData.rows.slice(0, 5000); // 限制最大行数
        const totalRows = safeRows.length;

        // 动态调整批次大小 - 增大批次大小
        const batchSize = Math.min(MAX_BATCH_SIZE, Math.ceil(totalRows / 50));

        // 分批处理
        for (let i = 0; i < totalRows; i += batchSize) {
          // 检查是否已取消或不是当前任务
          if (renderAbortController?.signal.aborted || !isCurrentTask()) {
            return;
          }
          const batch = safeRows.slice(i, i + batchSize);
          const batchRows: TableRow[] = [];

          // 处理当前批次
          for (const row of batch) {
            // 检查是否已取消或不是当前任务
            if (renderAbortController?.signal.aborted || !isCurrentTask()) {
              return;
            }
            const newObj: TableRow = {key: row.key || `row-${i}`};

            if (row.key === 'total_row') {
              // 处理总计行
              (resData.columns || []).slice(0, 15).forEach((col: any) => {
                const colKey = col.key;
                const colDataIndex = col.dataIndex;
                let targetValue = '';

                if (colKey === 'index') {
                  targetValue = '总计';
                  newObj[colKey] = targetValue;
                  return;
                }

                if (colDataIndex && row.data && Object.prototype.hasOwnProperty.call(row.data, colDataIndex)) {
                  targetValue = row.data[colDataIndex];
                } else if (row.data && Object.prototype.hasOwnProperty.call(row.data, colKey)) {
                  targetValue = row.data[colKey];
                }

                newObj[colKey] = targetValue === null || targetValue === undefined ? '' : targetValue;
              });

              newObj.isTotalRow = true;
              newObj.key = `total-${tableIndex}-${i}`;
            } else {
              // 处理普通行
              (resData.columns || []).slice(0, 15).forEach((col: any) => {
                const colKey = col.key;
                const colDataIndex = col.dataIndex;
                let targetValue = '';

                if (colDataIndex && row.data && Object.prototype.hasOwnProperty.call(row.data, colDataIndex)) {
                  targetValue = row.data[colDataIndex];
                } else if (row.data && Object.prototype.hasOwnProperty.call(row.data, colKey)) {
                  targetValue = row.data[colKey];
                }

                newObj[colKey] = targetValue === null || targetValue === undefined ? '' : targetValue;
              });
              newObj.isNormalRow = true;
            }

            batchRows.push(newObj);
          }

          // 更新当前表格的数据
          const updatedTables = [...tableDataList.value];
          if (!updatedTables[tableIndex]) {
            updatedTables[tableIndex] = [];
          }
          updatedTables[tableIndex] = [...updatedTables[tableIndex], ...batchRows];

          // 节流更新UI
          const now = Date.now();
          if (now - lastUpdateTime > UPDATE_INTERVAL) {
            await new Promise(resolve => requestAnimationFrame(resolve));
            tableDataList.value = updatedTables;
            triggerRef(tableDataList);
            lastUpdateTime = now;
          }

          // 更新进度
          processingProgress.value = Math.round((i / totalRows) * 100);

          // 让出主线程，提高响应性
          await new Promise(resolve => setTimeout(resolve, 0));

          // 检查内存使用
          if ('memory' in performance) {
            const memory = (performance as any).memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            if (usedMB > MEMORY_THRESHOLD_MB) {
              emergencyMemoryCleanup();
            }
          }
        }
      }

      // 每处理完一个表就让出主线程 - 缩短等待时间
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    processingProgress.value = 100;
    setTimeout(() => {
      processingProgress.value = 0;
    }, 500);

  } catch (error) {
    console.error('主线程处理数据失败:', error);
    processingProgress.value = 0;
    throw error;
  }
};

// 优化虚拟滚动配置 - 高性能配置
const virtualScrollConfig = {
  height: '100%',
  itemHeight: 40,
  overscan: 5, // 增加overscan以提供更平滑的滚动体验
  useDynamicItemSize: false, // 禁用动态行高以提高性能
  debounceScroll: true,
  scrollThrottle: 8, // 减少节流时间以提高响应性
  buffer: 0, // 减少缓冲区以节省内存
  disableHover: true // 禁用hover事件以提高性能
};

// 添加统计口径公式存储
const statisticalFormula = ref('');
const statisticalDefinitionRef = ref<InstanceType<typeof StatisticalDefinition> | null>(null);
// 衍生指标弹窗控制
const deriveModalVisible = ref(false);
const deriveFormRef = ref<any>(null);
// 控制统计口径设置组件的显示
const showStatisticalDefinition = ref(false);

/**
 * @desc: 处理关闭统计口径设置组件
 */
const handleCloseStatisticalDefinition = (): void => {
  showStatisticalDefinition.value = false;
};

/**
 * @desc: 添加接收统计口径公式的方法
 */
const handleStatisticalDefinitionConfirm = (formula: string): void => {
  statisticalFormula.value = formula;
  showStatisticalDefinition.value = false;
};

/**
 * @desc: 处理从衍生指标弹窗选择的列数据
 */
const handleSelectDeriveColumn = (data: SideField): void => {
  addToSideColumn(data);
  deriveModalVisible.value = false;
};

/**
 * @desc: 添加到宾栏的专门方法
 */
const addToSideColumn = (data: SideField): void => {
  if (['code', 'sampleCount'].includes(data.key)) return;

  const isDuplicate = normalSideList.value.some((item) => item.key === data.key);
  if (!isDuplicate) {
    normalSideList.value.push({
      key: data.key,
      title: data.title,
      listNum: data.listNum || '',
      tableName: data.tableName || data.tablecode,
      tablecode: data.tablecode,
      method: data.method || 'count',
      formula: data.formula || ''
    });
    updateSideList();
  } else {
    message.warning('该指标已存在宾栏中');
  }
};

/**
 * @desc: 衍生指标弹窗取消
 */
const handleDeriveCancel = (): void => {
  deriveModalVisible.value = false;
};

// 顶部表单
const curList = ref('');
const curOption = ref<any>({});

// 树
const treeData = ref<any[]>([]);
const isDraggingId = ref<string | null>(null);
const draggingNode = ref<DragNode | null>(null);

// 主宾栏数据结构
const mainList = ref<TableField[]>([]);

const systemItems = ref<SystemItem[]>([
  {key: 'code', title: '代码', method: 'count', checked: false},
  {key: 'sampleCount', title: '调查对象数量', method: 'count', checked: false},
]);

const normalSideList = ref<SideField[]>([]);
const sideList = ref<SideField[]>([]);
const isTotalChecked = ref(true);
const activeDropArea = ref<string | null>(null);
const options = [
  {label: '计数', value: 'count'},
  {label: '求和', value: 'sum'},
  {label: '平均', value: 'avg'},
];

// 表格相关
const { generateColumns } = useTableHooks();
const tableLoading = ref(false);
// 动态生成 tabsConfig，根据 queryData 是否为空决定是否显示返回按钮
const tabsConfig = computed(() => {
  const config = [
    {
      title: '执行汇总',
      key: 'executeSummary',
      icon: PlayCircleOutlined,
      iconFont: 1.6,
    },
    {
      title: '绘制图表',
      key: 'drawChart',
      icon: BarChartOutlined,
      iconFont: 1.6,
    },
    {
      title: '保存模板',
      key: 'saveTemplate',
      icon: SaveOutlined,
      iconFont: 1.6,
    },
  ];

  // 如果 queryData 不为空，在执行汇总按钮左侧添加返回按钮
  if (props.queryData) {
    config.unshift({
      title: '返回',
      key: 'back',
      icon: LeftOutlined,
      iconFont: 1.6,
    });
  }

  return config;
});

// 保存模板模态框相关
import SummaryTemplateModal from '@/components/Summary/SummaryTemplateModal/index.vue';
const templateModalVisible = ref(false);

/**
 * @desc: 处理保存模板
 */
const handleTemplateSave = async (data: any): Promise<void> => {
  try {
    // 构建处理后提交执行汇总的字段结构 (与executeSummary函数中相同的逻辑)
    const summaryQueries: any[] = [];

    // 处理主栏字段分组
    mainList.value.forEach(item => {
      if (item.key === 'total') return; // 跳过总计

      // 使用 listNum 作为 tableNum，tableName 作为 tableName
      const tableNum = item.listNum || curOption.value?.code || '';
      const tableName = item.tableName || item.tablecode || curOption.value?.code || '';

      // 查找是否已存在该表的配置
      let tableConfig = summaryQueries.find(query => query.tableNum === tableNum);
      if (!tableConfig) {
        tableConfig = {
          tableNum: tableNum,
          tableName: tableName,
          groupFields: [],
          sumFields: [],
          interceptQueries: []
        };
        summaryQueries.push(tableConfig);
      }

      // 添加分组字段（主栏字段）- 直接使用字段名
      tableConfig.groupFields.push(item.key);

      if (item.formatValue && item.formatValue.trim() !== '') {
        tableConfig.interceptQueries.push({
          columnName: item.key,
          value: item.formatValue
        });
      }
    });

    // 处理系统项
    const checkedSystem = systemItems.value.filter((item) => item.checked);
    checkedSystem.forEach(item => {
      // 使用 listNum 作为 tableNum，tableName 作为 tableName
      const tableNum = item.listNum || curOption.value?.code || '';
      const tableName = item.tableName || item.tablecode || curOption.value?.code || '';

      let tableConfig = summaryQueries.find(query => query.tableNum === tableNum);
      if (!tableConfig) {
        tableConfig = {
          tableNum: tableNum,
          tableName: tableName,
          groupFields: [],
          sumFields: [],
          interceptQueries: []
        };
        summaryQueries.push(tableConfig);
      }

      // 添加汇总字段（系统项）- 使用双引号包裹字段名
      tableConfig.sumFields.push(`${item.method}("${item.title}")`);
    });

    // 处理普通项（包括衍生指标）
    normalSideList.value.forEach(item => {
      // 使用 listNum 作为 tableNum，tableName 作为 tableName
      const tableNum = item.listNum || curOption.value?.code || '';
      const tableName = item.tableName || item.tablecode || curOption.value?.code || '';

      let tableConfig = summaryQueries.find(query => query.tableNum === tableNum);
      if (!tableConfig) {
        tableConfig = {
          tableNum: tableNum,
          tableName: tableName,
          groupFields: [],
          sumFields: [],
          interceptQueries: []
        };
        summaryQueries.push(tableConfig);
      }

      // 添加汇总字段（普通项）
      if (item.formula && item.formula.trim() !== '') {
        tableConfig.sumFields.push(item.formula);
      } else {
        tableConfig.sumFields.push(`${item.method}("${item.title}")`);
      }
    });

    // 添加统计口径公式（如果存在）
    if (statisticalFormula.value && statisticalFormula.value.trim() !== '') {
      // 如果没有表配置，创建一个默认的
      if (summaryQueries.length === 0) {
        const defaultTableNum = curOption.value?.code || 'default';
        const defaultTableName = curOption.value?.code || 'default';
        summaryQueries.push({
          tableNum: defaultTableNum,
          tableName: defaultTableName,
          groupFields: [],
          sumFields: [],
          interceptQueries: []
        });
      }

      // 添加到第一个表的汇总字段
      summaryQueries[0].sumFields.push(statisticalFormula.value);
    }

    // 构建模板数据
    const templateData = {
      template_name: data.formData.name,
      template_desc: data.formData.description,
      cjr: data.formData.creator,
      sum_op: summaryQueries,
      sfzmb: '1',
      type: '1', // 表示快速汇总
    };

    console.log('保存模板数据:', templateData);

    // 调用API保存汇总模板
    await saveSumTemplate(templateData);

    message.success('模板保存成功');
    templateModalVisible.value = false;
  } catch (error) {
    console.error('模板保存失败:', error);
    message.error('模板保存失败');
  }
};
const columns = ref<any[]>(generateColumns(26));
const tableData = ref<any[]>([]);
const tableDataList = shallowRef<any[]>([]); // 使用shallowRef避免深度响应式
const effectiveMainColumnCount = ref(0);

// 图表弹窗相关
const chartModalVisible = ref(false);
const chartDataList = ref([]);
const xAxisDataList = ref([]);

// 树hooks
const { loadTreeData } = useTree();
// 搜索hooks
const { searchValue, processedSearchValue, filteredTreeData } = useFilterHooks(treeData);

/**
 * @desc: 顶部下拉框切换处理
 */
const handleFormChange = async (val: string, option: any): Promise<void> => {
  curList.value = val;
  curOption.value = option;
};

/**
 * @desc: 衍生指标按钮点击处理
 */
const handleDerive = (): void => {
  deriveModalVisible.value = true;
};

/**
 * @desc: 添加节点到主栏/宾栏的方法
 */
const addToColumn = (area: 'main' | 'side', node: DragNode): void => {
  if (isDuplicateInArea(area)) {
    message.warning('该指标已存在于当前栏目中');
    return;
  }

  if (area === 'side') {
    if (['code', 'sampleCount'].includes(node.key)) return;

    normalSideList.value.push({
      key: node.key,
      title: node.title,
      listNum: node.listNum || '',
      tableName: node.tableName || node.tablecode,
      tablecode: node.tablecode,
      method: 'count',
    });
    updateSideList();
  }

  if (area === 'main') {
    const systemKeys = ['total', 'code', 'sampleCount'];
    if (systemKeys.includes(node.key)) return;

    mainList.value.push({
      key: node.key,
      title: node.title,
      listNum: node.listNum || '',
      tableName: node.tableName || node.tablecode,
      tablecode: node.tablecode,
      method: 'count',
      formatType: 'truncate',
      formatValue: ''
    });
  }
};

/**
 * @desc: 处理拖拽开始
 */
const handleDragStart = (data: any): void => {
  if (!data.key || !data.title) return;

  const dragData: DragNode = {
    key: data.key,
    title: data.title,
    listNum: data.listNum,
    tableName: data.tableName || data.tablecode,
    tablecode: data.tablecode,
    method: data.type || 'count',
  };

  localStorage.setItem('dragTreeNode', JSON.stringify(dragData));
  isDraggingId.value = data.key;
  draggingNode.value = {key: data.key, title: data.title};
};

/**
 * @desc: 处理拖拽进入
 */
const handleDragEnter = (area: 'main' | 'side'): void => {
  activeDropArea.value = area;
};

/**
 * @desc: 处理拖拽悬停
 */
const handleDragOver = (area: 'main' | 'side', event: DragEvent): void => {
  if (!event.dataTransfer) return;

  activeDropArea.value = area;

  if (isDuplicateInArea(area)) {
    event.dataTransfer.effectAllowed = 'none';
    event.dataTransfer.dropEffect = 'none';
  } else {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.dropEffect = 'copy';
  }
};

/**
 * @desc: 处理拖拽离开
 */
const handleDragLeave = (area: 'main' | 'side'): void => {
  if (activeDropArea.value === area) {
    activeDropArea.value = null;
  }
};

/**
 * @desc: 处理拖拽结束
 */
const handleDragEnd = (): void => {
  isDraggingId.value = null;
  localStorage.removeItem('dragTreeNode');
  draggingNode.value = null;
};

/**
 * @desc: 处理拖拽放置
 */
const handleDrop = (area: 'main' | 'side'): void => {
  try {
    const dragNode = JSON.parse(localStorage.getItem('dragTreeNode') || '{}') as DragNode;
    if (dragNode.key && dragNode.title) {
      activeDropArea.value = null;
      draggingNode.value = null;
      addToColumn(area, dragNode);
    }
  } catch (error) {
    console.error('解析拖拽数据失败:', error);
    message.error('拖拽操作失败，请重试');
  }
};

/**
 * @desc: 检测当前拖拽节点是否重复
 */
const isDuplicateInArea = (area: 'main' | 'side'): boolean => {
  if (!draggingNode.value) return false;

  try {
    const dragData = JSON.parse(localStorage.getItem('dragTreeNode') || '{}');
    const draggingKey = dragData.key;
    const draggingTableCode = dragData.tablecode;

    // 检查当前区域是否重复
    let isCurrentDuplicate = false;
    if (area === 'side') {
      const sideItems = [
        ...systemItems.value.filter((item) => item.checked).map((item) => ({key: item.key})),
        ...normalSideList.value.map((item) => ({key: item.key, tablecode: item.tablecode})),
      ];
      isCurrentDuplicate = sideItems.some(item =>
          item.key === draggingKey &&
          (item.tablecode === draggingTableCode || !item.tablecode || !draggingTableCode)
      );
    } else {
      isCurrentDuplicate = mainList.value.some(item =>
          item.key === draggingKey &&
          (item.tablecode === draggingTableCode || !item.tablecode || !draggingTableCode)
      );
    }

    // 检查跨区域是否重复
    let isCrossDuplicate = false;
    if (area === 'side') {
      isCrossDuplicate = mainList.value.some(item =>
          item.key === draggingKey &&
          (item.tablecode === draggingTableCode || !item.tablecode || !draggingTableCode)
      );
    } else {
      const sideKeys = [
        ...systemItems.value.filter((item) => item.checked).map((item) => item.key),
        ...normalSideList.value.map((item) => ({key: item.key, tablecode: item.tablecode})),
      ];
      isCrossDuplicate = sideKeys.some(item =>
          item.key === draggingKey &&
          (item.tablecode === draggingTableCode || !item.tablecode || !draggingTableCode)
      );
    }

    return isCurrentDuplicate || isCrossDuplicate;
  } catch (error) {
    console.error('检查重复失败:', error);
    return false;
  }
};

/**
 * @desc: 重置主栏和宾栏
 */
const resetColumns = (): void => {
  mainList.value = [];
  isTotalChecked.value = false;

  systemItems.value.forEach((item) => {
    item.checked = false;
    item.method = 'count';
  });

  normalSideList.value = [];
  updateSideList();
  tableData.value = [];

  // 强制清理内存
  cleanupPreviousData();

  message.success('已重置主栏和宾栏');
};

/**
 * @desc: 处理总计勾选变化
 */
const handleTotalCheckChange = (checked: boolean): void => {
  const totalItem = {key: 'total', title: '总计'};
  if (checked) {
    const isExist = mainList.value.some((item) => item.key === 'total');
    if (!isExist) mainList.value.push(totalItem as TableField);
  } else {
    mainList.value = mainList.value.filter((item) => item.key !== 'total');
  }
};

/**
 * @desc: 更新宾栏列表
 */
function updateSideList(): void {
  const checkedSystemItems = systemItems.value
      .filter((item) => item.checked)
      .map((item) => ({key: item.key, title: item.title, method: item.method} as SideField));

  const checkedNormalItems = normalSideList.value.map((item) => ({
    key: item.key,
    title: item.title,
    listNum: item.listNum,
    tableName: item.tableName,
    tablecode: item.tablecode,
    method: item.method,
    formula: item.formula
  }));

  sideList.value = [...checkedSystemItems, ...checkedNormalItems];
}

/**
 * @desc: 处理设置按钮点击
 */
const handleSet = (): void => {
  showStatisticalDefinition.value = true;
};

/**
 * @desc: 处理删除操作
 */
const handleDelete = (area: 'main' | 'side', index: number): void => {
  if (area === 'side') {
    normalSideList.value.splice(index, 1);
    updateSideList();
  } else if (area === 'main') {
    mainList.value.splice(index, 1);
  }
};

/**
 * @desc: 获取行类名
 */
const getRowClassName = (record: any) => {
  if (record.isSeparator) {
    return 'separator-row';
  }
  if (record.isEmpty) {
    return 'empty-row';
  }
  if (record.isTotalRow) {
    return 'total-row';
  }
  return 'hover-row';
};

// 添加内存管理 - 优化版
let previousData: any[] | null = null;

/**
 * @desc: 在加载新数据前清理旧数据 - 增强版
 */
const cleanupPreviousData = (): void => {
  if (previousData) {
    // 更彻底的解除引用，帮助GC
    try {
      // 递归清除对象属性
      const deepClean = (obj: any): void => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
          for (let i = obj.length - 1; i >= 0; i--) {
            deepClean(obj[i]);
            delete obj[i];
          }
          obj.length = 0;
        } else {
          for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              deepClean(obj[key]);
              delete obj[key];
            }
          }
        }
      };

      deepClean(previousData);
    } catch (error) {
      console.warn('深度清理失败:', error);
    }
    previousData = null;
  }
};

/**
 * @desc: 处理大数据集的轻量级方法 - 支持增量渲染
 */
const processLargeDataSet = async (resDataList: any[], isCurrentTask: () => boolean): Promise<void> => {
  try {
    // 检查是否已取消或不是当前任务
    if (renderAbortController?.signal.aborted || !isCurrentTask()) {
      return;
    }

    // 严格限制数据量
    const safeDataList = resDataList.slice(0, 1000);

    // 初始化表格数据列表
    tableDataList.value = [];
    triggerRef(tableDataList);

    let firstBatchShown = false;
    let lastUpdateTime = 0;
    const UPDATE_INTERVAL = 1000; // 最小更新间隔（毫秒）

    // 增量处理每个表
    for (let tableIndex = 0; tableIndex < safeDataList.length; tableIndex++) {
      const resData = safeDataList[tableIndex];
      const tableRows: TableRow[] = [];

      // 处理表头
      if (resData.columns && resData.columns.length) {
        const headerRow: TableRow = {isHeader: true, key: `header-${tableIndex}`};
        resData.columns.slice(0, 15).forEach((col: any) => {
          headerRow[col.key] = col.title;
        });
        tableRows.push(headerRow);


        // 使用requestAnimationFrame确保平滑更新
        await new Promise(resolve => requestAnimationFrame(resolve));
        tableDataList.value = [...tableDataList.value, tableRows];
        triggerRef(tableDataList);

        // 当表头显示后，关闭加载状态
        if (!firstBatchShown) {
          firstBatchShown = true;
          tableLoading.value = false;
        }
      }

      // 增量处理数据行
      if (resData.rows && resData.rows.length) {
        // 更严格的数据量限制
        const safeRows = resData.rows.slice(0, 50000); // 限制最大行数
        const totalRows = safeRows.length;

        // 根据数据量动态调整批次大小 - 增大批次大小
        const batchSize = totalRows > 1000 ? 100 : (totalRows > 100 ? 60 : 30);

        // 预分配当前表格的数据数组
        const currentTableData: TableRow[] = [];
        if (tableDataList.value[tableIndex]) {
          currentTableData.push(...tableDataList.value[tableIndex]);
        }

        // 分批处理
        for (let i = 0; i < totalRows; i += batchSize) {
          // 检查是否已取消
          if (renderAbortController?.signal.aborted) {
            return;
          }

          const endIndex = Math.min(i + batchSize, totalRows);

          // 直接处理批次，避免创建中间数组
          for (let j = i; j < endIndex; j++) {
            const row = safeRows[j];
            const newObj: TableRow = {key: row.key || `row-${j}`};

            // 只处理必要的列数据，进一步减少内存使用
            const columnsToProcess = (resData.columns || []).slice(0, 10);
            const columnCount = columnsToProcess.length;

            if (row.key === 'total_row') {
              // 处理总计行
              for (let k = 0; k < columnCount; k++) {
                const col = columnsToProcess[k];
                const colKey = col.key;
                const colDataIndex = col.dataIndex;
                let targetValue = '';

                if (colKey === 'index') {
                  targetValue = '总计';
                  newObj[colKey] = targetValue;
                  continue;
                }

                if (row.data) {
                  targetValue = colDataIndex && Object.prototype.hasOwnProperty.call(row.data, colDataIndex)
                      ? row.data[colDataIndex]
                      : Object.prototype.hasOwnProperty.call(row.data, colKey) ? row.data[colKey] : '';
                }

                newObj[colKey] = targetValue === null || targetValue === undefined ? '' : targetValue;
              }

              newObj.isTotalRow = true;
              newObj.key = `total-${tableIndex}-${j}`;
            } else {
              // 处理普通行 - 更高效的属性访问方式
              for (let k = 0; k < columnCount; k++) {
                const col = columnsToProcess[k];
                const colKey = col.key;
                const colDataIndex = col.dataIndex;

                if (row.data) {
                  const targetValue = colDataIndex && Object.prototype.hasOwnProperty.call(row.data, colDataIndex)
                      ? row.data[colDataIndex]
                      : Object.prototype.hasOwnProperty.call(row.data, colKey) ? row.data[colKey] : '';

                  if (targetValue !== null && targetValue !== undefined) {
                    newObj[colKey] = targetValue;
                  } else {
                    newObj[colKey] = '';
                  }
                } else {
                  newObj[colKey] = '';
                }
              }
              newObj.isNormalRow = true;
            }

            currentTableData.push(newObj);
          }

          // 节流更新UI，实现增量渲染
          const now = Date.now();
          if (now - lastUpdateTime > UPDATE_INTERVAL) {
            await new Promise(resolve => requestAnimationFrame(resolve));

            // 避免数组展开操作
            const updatedTables = [...tableDataList.value];
            updatedTables[tableIndex] = currentTableData;

            tableDataList.value = updatedTables;
            triggerRef(tableDataList);
            lastUpdateTime = now;
          }

          // 更新进度
          processingProgress.value = Math.round((i / totalRows) * 100);

          // 让出主线程
          await new Promise(resolve => setTimeout(resolve, 0));

          // 检查内存，必要时进行紧急清理
          if ('memory' in performance) {
            const memory = (performance as any).memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
            if (usedMB > MEMORY_THRESHOLD_MB) {
              emergencyMemoryCleanup();
            }
          }
        }
      }

      // 每处理完一个表就让出主线程
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    processingProgress.value = 100;
    setTimeout(() => {
      processingProgress.value = 0;
    }, 500);

  } catch (error) {
    console.error('处理大数据集失败:', error);
    tableLoading.value = false; // 出错时也关闭加载状态
    throw error;
  }
};

/**
 * @desc: 执行汇总 - 支持增量渲染
 */
// 用于取消正在进行的增量渲染任务的控制器
let renderAbortController: AbortController | null = null;
// 当前正在执行的任务ID
let currentTaskId: number = 0;

const executeSummary = async (): Promise<void> => {
  try {
    // 生成新的任务ID
    const taskId = ++currentTaskId;

    // 取消任何正在进行的旧渲染任务
    if (renderAbortController) {
      renderAbortController.abort();
      renderAbortController = null;
    }

    // 创建新的控制器用于当前任务
    renderAbortController = new AbortController();

    // 立即清空表格数据并更新UI
    tableDataList.value = [];
    triggerRef(tableDataList);

    // 检查是否被新任务中断
    const isCurrentTask = () => taskId === currentTaskId;
    if (!isCurrentTask()) {
      return;
    }

    effectiveMainColumnCount.value = mainList.value.filter(item => item.key !== "total").length
    // console.log("当前有效列", effectiveMainColumnCount.value)
    columns.value = generateColumns(26, 1);

    // 安全清理旧缓存，保护token
    await cacheControl.safeCleanup();

    // 保存当前数据为缓存（用于回退）
    cacheControl.setCache('previous-table-data', tableDataList.value, 10);

    // 参数校验：主宾栏至少选择一个
    const checkedSystem = systemItems.value.filter((item) => item.checked);
    if (mainList.value.length === 0 && checkedSystem.length + normalSideList.value.length === 0) {
      message.warning('请至少选择一个主栏或宾栏字段');
      return;
    }

    // 按tablecode分组处理字段
    const summaryQueries: SummaryQuery[] = [];

    // 处理主栏字段分组
    mainList.value.forEach(item => {
      if (item.key === 'total') return; // 跳过总计

      // 使用 listNum 作为 tableNum，tableName 作为 tableName
      const tableNum = item.listNum || curOption.value?.code || '';
      const tableName = item.tableName || item.tablecode || curOption.value?.code || '';

      // 查找是否已存在该表的配置
      let tableConfig = summaryQueries.find(query => query.tableNum === tableNum);
      if (!tableConfig) {
        tableConfig = {
          tableNum: tableNum,
          tableName: tableName,
          groupFields: [],
          sumFields: [],
          interceptQueries: []
        };
        summaryQueries.push(tableConfig);
      }

      // 添加分组字段（主栏字段）- 直接使用字段名
      tableConfig.groupFields.push(item.key);

      if (item.formatValue && item.formatValue.trim() !== '') {
        tableConfig.interceptQueries.push({
          columnName: item.key,
          value: item.formatValue
        });
      }
    });

    // 处理系统项
    checkedSystem.forEach(item => {
      // 使用 listNum 作为 tableNum，tableName 作为 tableName
      const tableNum = item.listNum || curOption.value?.code || '';
      const tableName = item.tableName || item.tablecode || curOption.value?.code || '';

      let tableConfig = summaryQueries.find(query => query.tableNum === tableNum);
      if (!tableConfig) {
        tableConfig = {
          tableNum: tableNum,
          tableName: tableName,
          groupFields: [],
          sumFields: [],
          interceptQueries: []
        };
        summaryQueries.push(tableConfig);
      }

      // 添加汇总字段（系统项）- 使用双引号包裹字段名
      tableConfig.sumFields.push(`${item.method}("${item.title}")`);
    });

    // 处理普通项（包括衍生指标）
    normalSideList.value.forEach(item => {
      // 使用 listNum 作为 tableNum，tableName 作为 tableName
      const tableNum = item.listNum || curOption.value?.code || '';
      const tableName = item.tableName || item.tablecode || curOption.value?.code || '';

      let tableConfig = summaryQueries.find(query => query.tableNum === tableNum);
      if (!tableConfig) {
        tableConfig = {
          tableNum: tableNum,
          tableName: tableName,
          groupFields: [],
          sumFields: [],
          interceptQueries: []
        };
        summaryQueries.push(tableConfig);
      }

      // 添加汇总字段（普通项）
      if (item.formula && item.formula.trim() !== '') {
        tableConfig.sumFields.push(item.formula);
      } else {
        tableConfig.sumFields.push(`${item.method}("${item.title}")`);
      }
    });

    // 添加统计口径公式（如果存在）
    if (statisticalFormula.value && statisticalFormula.value.trim() !== '') {
      // 如果没有表配置，创建一个默认的
      if (summaryQueries.length === 0) {
        const defaultTableNum = curOption.value?.code || 'default';
        const defaultTableName = curOption.value?.code || 'default';
        summaryQueries.push({
          tableNum: defaultTableNum,
          tableName: defaultTableName,
          groupFields: [],
          sumFields: [],
          interceptQueries: []
        });
      }

      // 添加到第一个表的汇总字段
      summaryQueries[0].sumFields.push(statisticalFormula.value);
    }

    // 构建接口参数并请求数据
    const params: FindQuickSumaryParams = {
      summaryQueries: summaryQueries
    };

    console.log('param', params.summaryQueries);

    tableLoading.value = true;
    const res = await quickSummaryApi(params);

    console.log('data',res.data);
    if (res.code === 200) {
      // 保存旧数据引用，用于后续清理
      previousData = tableDataList.value;

      // 尝试垃圾回收
      if (typeof window.gc === 'function') {
        try {
          window.gc();
        } catch (error) {
          console.warn('垃圾回收调用失败:', error);
        }
      }

      const resDataList = res.data || [];

      // 智能判断数据处理方式 - 增强版
      const totalRows = resDataList.reduce((total, table) => total + (table.rows?.length || 0), 0);
      const isSmallDataSet = totalRows < 50; // 更小的阈值，避免小数据集使用Worker
      const isMediumDataSet = totalRows >= 50 && totalRows < 5000;
      const isLargeDataSetFlag = isLargeDataSet(resDataList);

      // 检查内存使用
      let shouldUseLightProcessing = false;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        if (usedMB > MEMORY_THRESHOLD_MB * 0.8) {
          shouldUseLightProcessing = true;
          console.warn('内存使用较高，启用轻量级处理模式');
          // message.warning('当前内存使用较高，系统将启用轻量级数据处理模式');
        }
      }

      // 智能选择处理策略
      if (shouldUseLightProcessing || isLargeDataSetFlag) {
        // 超大数据集或内存不足时，使用限制数据量的增量处理
        await processLargeDataSet(resDataList, isCurrentTask);
      } else if (isSmallDataSet) {
        // 小数据量直接处理并显示，不使用异步和增量渲染
        processSmallDataSetDirectly(resDataList, isCurrentTask);
      } else if (isMediumDataSet && WorkerManager.isSupported()) {
        try {
          // 中等数据量尝试使用Worker，但增加更严格的错误处理
          await processDataWithWorker(resDataList, isCurrentTask);
        } catch (workerError) {
          console.warn('Worker处理失败，降级到主线程:', workerError);
          await processDataInMainThread(resDataList, isCurrentTask);
        }
      } else {
        // 默认使用主线程处理
        await processDataInMainThread(resDataList, isCurrentTask);
      }

      // 缓存新数据
      try {
        cacheControl.setCache('table-data', tableDataList.value, 15);
      } catch (error) {
        console.warn('缓存数据失败，可能数据量过大:', error);
      }

    } else {
      message.error(`接口返回异常：${res.message || '未知错误'}`);
    }

  } catch (error) {
    console.error('执行汇总失败：', error);
    message.error('执行汇总失败，请重试');

    // 安全恢复缓存数据
    try {
      const cachedData = cacheControl.getCache('previous-table-data');
      if (cachedData) {
        tableDataList.value = cachedData;
        message.info('已安全恢复上次缓存的数据');
      }
    } catch (cacheError) {
      console.error('恢复缓存数据失败:', cacheError);
    }

  } finally {
    tableLoading.value = false;
    // 清理AbortController
    renderAbortController = null;
  }
};


const allTableDataCache = ref({
  key: '',
  data: [] as TableRow[]
});

/**
 * @desc: 检测是否为大数据集
 */
const isLargeDataSet = (dataList: any[]): boolean => {
  if (!dataList || dataList.length === 0) return false;

  // 超过3个表或任何表超过5000行则视为大数据集
  if (dataList.length > 3) return true;

  for (const table of dataList) {
    if (table.rows && table.rows.length > 5000) {
      return true;
    }
    // 列数过多也视为大数据集
    if (table.columns && table.columns.length > 20) {
      return true;
    }
  }

  return false;
};

// 计算所有表格数据 - 高性能优化版
const allTableData = computed((): TableRow[] => {
  if (tableDataList.value.length === 0) return [];

  // 使用更高效的缓存键生成方式
  const cacheKey = tableDataList.value.map(table => table.length).join('-');
  if (allTableDataCache.value.key === cacheKey) {
    return allTableDataCache.value.data;
  }

  // 预分配数组大小以减少内存重分配
  const totalTables = tableDataList.value.length;
  const estimatedRowCount = Math.min(
      tableDataList.value.reduce((total, table) => total + table.length, 0) + totalTables,
      2000 // 严格限制最大渲染行数
  );
  const allRows: TableRow[] = new Array(estimatedRowCount);
  let rowIndex = 0;

  // 分批处理表格数据
  for (let tableIndex = 0; tableIndex < tableDataList.value.length && rowIndex < estimatedRowCount; tableIndex++) {
    const tableData = tableDataList.value[tableIndex];

    if (tableIndex > 0 && rowIndex < estimatedRowCount) {
      // 添加分隔行
      allRows[rowIndex++] = {
        key: `separator-${tableIndex}`,
        isSeparator: true,
        tableIndex: tableIndex + 1
      };
    }

    // 限制处理的行数
    const maxRemainingRows = estimatedRowCount - rowIndex;
    const rowsToProcess = Math.min(tableData.length, maxRemainingRows);

    // 避免创建额外的中间数组，直接处理并填充到结果数组
    for (let i = 0; i < rowsToProcess && rowIndex < estimatedRowCount; i++) {
      const row = tableData[i];
      // 避免不必要的对象展开操作，直接创建新对象
      allRows[rowIndex++] = {
        key: row.key || `table-${tableIndex}-row-${i}`,
        tableIndex: tableIndex + 1,
        isSeparator: false,
        isHeader: row.isHeader,
        isTotalRow: row.isTotalRow,
        isEmpty: row.isEmpty,
        index: row.index
      };
      // 只复制必要的列数据
      const keys = Object.keys(row);
      for (const key of keys) {
        if (!['key', 'isSeparator', 'isHeader', 'isTotalRow', 'isEmpty', 'tableIndex'].includes(key)) {
          allRows[rowIndex - 1][key] = row[key];
        }
      }
    }
  }

  // 截断数组到实际使用长度
  allRows.length = rowIndex;

  // 缓存计算结果 - 限制缓存大小
  if (allRows.length < 5000) {
    allTableDataCache.value = { key: cacheKey, data: allRows };
  }

  return allRows;
});

// 数据行 + 优化的空行处理
const tableDataSource = computed((): TableRow[] => {
  const originalRows = allTableData.value || [];

  // 动态调整空行数量，避免过多空行占用内存
  const dynamicEmptyRows = Math.min(fixedEmptyRows, Math.max(50, 200 - originalRows.length));

  // 使用更高效的方式创建空行数组
  const emptyRows: TableRow[] = [];
  for (let i = 0; i < dynamicEmptyRows; i++) {
    emptyRows[i] = {
      key: `empty-row-${originalRows.length + i}`,
      isEmpty: true,
    };
  }

  // 避免数组展开操作，直接使用concat以提高性能
  return originalRows.concat(emptyRows);
});

/**
 * @desc: 表格标签页点击处理
 */
const handleOverviewItem = (item: any): void => {
  switch (item.title) {
    case '返回':
      // 如果 queryData 不为空，则跳转到相应的 InfoTemplate 页面
      if (props.queryData) {
        // 使用 sessionStorage 存储整个props.queryData
        sessionStorage.setItem('quickSummaryQueryData', JSON.stringify(props.queryData));
        // 跳转到 data-processing 页面，并设置 activeTabKey 为 1（数据查询）
        sessionStorage.setItem('quickSummaryActiveTabKey', '1');
        // 跳转到数据处理页面
        router.push('/home/data-processing');
        window.location.reload(); // 刷新页面以确保数据正确加载
      }
      break;
    case '执行汇总':
      executeSummary();
      break;
    case '设置汇总口径':
      showStatisticalDefinition.value = true;
      break;
    case '绘制图表':
      // 准备图表数据
      prepareChartData();
      // 打开图表弹窗
      chartModalVisible.value = true;
      break;
    case '保存模板':
      // 打开保存模板模态框
      templateModalVisible.value = true;
      break;
  }
};

/**
 * @desc: 准备图表数据
 */
const prepareChartData = () => {
  // 从tableDataList中提取图表数据
  const dataTables = tableDataList.value || [];
  console.log('dataTables', dataTables);

  // 清空现有图表数据
  chartDataList.value = [];
  xAxisDataList.value = [];

  if (dataTables.length === 0) {
    // 没有数据时返回空数据
    return;
  }

  // 遍历所有表格，为每个表格生成图表数据
  dataTables.forEach((table, tableIndex) => {
    if (!table || table.length === 0) {
      // 当前表格没有数据，跳过
      return;
    }

    // 提取表头行和普通数据行（排除表头行、总计行和其他特殊行）
    const headerRow = table.find((row: any) => row.isHeader);
    const dataRows = table.filter((row: any) => !row.isHeader && !row.isTotalRow && !row.isSeparator && !row.isEmpty);

    if (!headerRow || dataRows.length === 0) {
      // 当前表格没有有效数据，跳过
      return;
    }

    // 获取所有列的键名（按顺序）
    const allColumns = Object.keys(headerRow).filter(key => !['key', 'isHeader', 'isTotalRow', 'isSeparator', 'isEmpty', 'tableIndex'].includes(key));

    if (allColumns.length === 0) {
      // 当前表格没有有效列，跳过
      return;
    }

    // A列作为x轴（专业代码）
    const aColumnKey = 'A'; // 固定使用A列作为专业代码
    const xAxisData = dataRows.map(row => row[aColumnKey] || '未知');

    // A列后每列作为一个系列（y轴数据）
    const series = [];
    // 遍历所有列，跳过A列（x轴）和index列（序号）
    allColumns.forEach(columnKey => {
      if (columnKey === 'A' || columnKey === 'index') return;

      const columnName = headerRow[columnKey] || columnKey; // 使用表头作为系列名称

      // 提取该列的所有数据值，并转换为数字
      const columnData = dataRows.map(row => {
        const value = row[columnKey];
        // 尝试将值转换为数字
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
          // 移除可能的千分位逗号并转换为数字
          const numValue = parseFloat(value.replace(/,/g, ''));
          return isNaN(numValue) ? 0 : numValue;
        }
        return 0;
      });

      series.push({
        name: columnName,
        data: columnData
      });
    });

    // 为当前表格添加图表数据
    if (series.length > 0 && xAxisData.length > 0) {
      chartDataList.value.push(series);
      xAxisDataList.value.push(xAxisData);
    }
  });
};

// 监听顶部表单列表切换
watch(
    () => curList.value,
    async (newData) => {
      try {
        const res = await loadTreeData(newData);
        treeData.value = res;
        // treeData加载完成后，更新主栏字段的中文名称
        updateMainFieldTitles();
      } catch (error) {
        console.error('加载树数据失败:', error);
        message.error('加载数据失败，请重试');
      }
    },
    {
      immediate: true,
      deep: true,
    },
);

// 更新主栏字段的中文名称
const updateMainFieldTitles = () => {
  try {
    if (!treeData.value || !treeData.value.length) return;

    // 从treeData中构建字段映射表
    const fieldMap = new Map();
    const collectFields = (node) => {
      if (node.children) {
        node.children.forEach(child => {
          fieldMap.set(child.key, child.title);
          collectFields(child);
        });
      }
    };

    // 收集所有字段
    treeData.value.forEach(node => {
      collectFields(node);
    });

    // 更新主栏字段的title
    mainList.value.forEach(item => {
      if (fieldMap.has(item.key)) {
        item.title = fieldMap.get(item.key);
      }
    });

    console.log('主栏字段中文名称已更新');
  } catch (error) {
    console.error('更新主栏字段中文名称失败:', error);
  }
};

// 监听主栏列表变化，动态更新列配置
watch(
    () => mainList.value,
    (newMainList) => {
      // 只计算当前有效的主栏列数， 不更新列配置
      const newCount = newMainList.filter(item => item.key !== "total").length
      effectiveMainColumnCount.value = newCount;
    },
    {immediate: true, deep: true},
);

// 组件挂载
onMounted(() => {
  try {
    // 初始化缓存控制
    statsInterval = initCacheControl();

    // 检查是否有sumOp数据需要解析
    parseSumOpData();

    effectiveMainColumnCount.value = mainList.value.filter(item => item.key !== "total").length
    columns.value = generateColumns(26, effectiveMainColumnCount.value);

    // 启动内存监控
    startMemoryMonitoring();

    // 页面可见性变化监听
    document.addEventListener('visibilitychange', handleVisibilityChangeSimple);

    // 设置缓存标记
    cacheControl.setCache('table-loading-start', Date.now(), 5);

  } catch (error) {
    console.error('组件挂载失败:', error);
  }
});

// 解析sumOp数据
const parseSumOpData = () => {
  try {
    console.log('开始解析sumOp数据');
    // 从sessionStorage获取sumOp数据
    const sumOpData = sessionStorage.getItem('summarySumOpData');
    console.log('sumOpData:', sumOpData);
    if (sumOpData) {
      const sumOp = JSON.parse(sumOpData);
      console.log('解析后的sumOp:', sumOp, '类型:', typeof sumOp);

      // 清空现有数据
      mainList.value = [];
      normalSideList.value = [];

      // 确保sumOp是数组
      let sumOpArray = [];

      if (Array.isArray(sumOp)) {
        // 如果已经是数组，直接使用
        sumOpArray = sumOp;
      } else if (typeof sumOp === 'string') {
        // 如果是字符串，尝试解析
        try {
          // 尝试解析字符串为数组
          sumOpArray = JSON.parse(sumOp);
        } catch (e) {
          // 如果解析失败，说明可能是Java风格的字符串
          console.log('字符串不是JSON格式，尝试处理Java风格字符串:', sumOp);

          // 移除外层的方括号
          let str = sumOp.trim();
          if (str.startsWith('[') && str.endsWith(']')) {
            str = str.substring(1, str.length - 1);
          }

          // 分割对象
          const objects = [];
          let inObject = false;
          let startPos = 0;
          let braceCount = 0;

          for (let i = 0; i < str.length; i++) {
            if (str[i] === '{') {
              if (!inObject) {
                inObject = true;
                startPos = i;
              }
              braceCount++;
            } else if (str[i] === '}') {
              braceCount--;
              if (inObject && braceCount === 0) {
                objects.push(str.substring(startPos, i + 1));
                inObject = false;
              }
            }
          }

          // 解析每个对象
          for (const objStr of objects) {
            const obj = {};
            // 移除对象的大括号
            let content = objStr.substring(1, objStr.length - 1);

            // 分割键值对
            const pairs = [];
            let inArray = 0;
            let inQuotes = false;
            let quoteChar = '';
            let start = 0;

            for (let i = 0; i < content.length; i++) {
              const char = content[i];

              // 处理引号
              if (char === '"' || char === "'") {
                if (!inQuotes) {
                  inQuotes = true;
                  quoteChar = char;
                } else if (quoteChar === char) {
                  inQuotes = false;
                }
              }

              // 处理数组
              if (char === '[' && !inQuotes) inArray++;
              if (char === ']' && !inQuotes) inArray--;

              // 分割键值对
              if (char === ',' && !inQuotes && inArray === 0) {
                pairs.push(content.substring(start, i).trim());
                start = i + 1;
              }
            }

            if (start < content.length) {
              pairs.push(content.substring(start).trim());
            }

            // 解析每个键值对
            for (const pair of pairs) {
              const equalsIndex = pair.indexOf('=');
              if (equalsIndex > 0) {
                const key = pair.substring(0, equalsIndex).trim();
                let value = pair.substring(equalsIndex + 1).trim();

                // 解析值
                if (value.startsWith('[') && value.endsWith(']')) {
                  // 数组值
                  const arrayContent = value.substring(1, value.length - 1);

                  if (key === 'interceptQueries') {
                    // 特殊处理interceptQueries，它包含对象数组
                    const queries = [];
                    let inQueryObject = false;
                    let queryStart = 0;
                    let queryBraceCount = 0;

                    for (let j = 0; j < arrayContent.length; j++) {
                      const ch = arrayContent[j];
                      if (ch === '{') {
                        if (!inQueryObject) {
                          inQueryObject = true;
                          queryStart = j;
                        }
                        queryBraceCount++;
                      } else if (ch === '}') {
                        queryBraceCount--;
                        if (inQueryObject && queryBraceCount === 0) {
                          const queryStr = arrayContent.substring(queryStart, j + 1);
                          // 解析查询对象
                          const queryObj = {};
                          const queryPairs = queryStr.substring(1, queryStr.length - 1).split(',');

                          for (const queryPair of queryPairs) {
                            const eqIndex = queryPair.indexOf('=');
                            if (eqIndex > 0) {
                              const qKey = queryPair.substring(0, eqIndex).trim();
                              let qValue = queryPair.substring(eqIndex + 1).trim();

                              // 解析查询值
                              if ((qValue.startsWith('"') && qValue.endsWith('"')) ||
                                  (qValue.startsWith("'") && qValue.endsWith("'"))) {
                                qValue = qValue.substring(1, qValue.length - 1);
                              }

                              queryObj[qKey] = qValue;
                            }
                          }

                          queries.push(queryObj);
                          inQueryObject = false;
                        }
                      }
                    }

                    obj[key] = queries;
                  } else {
                    // 普通数组
                    const elements = [];
                    let inQuotes2 = false;
                    let quoteChar2 = '';
                    let elemStart = 0;

                    for (let i = 0; i < arrayContent.length; i++) {
                      const char = arrayContent[i];

                      if (char === '"' || char === "'") {
                        if (!inQuotes2) {
                          inQuotes2 = true;
                          quoteChar2 = char;
                        } else if (quoteChar2 === char) {
                          inQuotes2 = false;
                        }
                      }

                      if (char === ',' && !inQuotes2) {
                        const element = arrayContent.substring(elemStart, i).trim();
                        // 移除引号
                        if ((element.startsWith('"') && element.endsWith('"')) ||
                            (element.startsWith("'") && element.endsWith("'"))) {
                          elements.push(element.substring(1, element.length - 1));
                        } else {
                          elements.push(element);
                        }
                        elemStart = i + 1;
                      }
                    }

                    if (elemStart < arrayContent.length) {
                      const element = arrayContent.substring(elemStart).trim();
                      if ((element.startsWith('"') && element.endsWith('"')) ||
                          (element.startsWith("'") && element.endsWith("'"))) {
                        elements.push(element.substring(1, element.length - 1));
                      } else {
                        elements.push(element);
                      }
                    }

                    obj[key] = elements;
                  }
                } else if (/^\d+$/.test(value)) {
                  // 数字
                  obj[key] = parseInt(value, 10);
                } else if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                  // 字符串
                  obj[key] = value.substring(1, value.length - 1);
                } else {
                  obj[key] = value;
                }
              }
            }

            sumOpArray.push(obj);
          }
        }
      } else if (sumOp && typeof sumOp === 'object') {
        // 如果是单个对象，包装成数组
        sumOpArray = [sumOp];
      }

      console.log('处理后的sumOpArray:', sumOpArray);

      // 解析sumOp数据
      sumOpArray.forEach((tableConfig, index) => {
        console.log(`处理tableConfig ${index}:`, tableConfig);
        const { tableNum, tableName, groupFields, sumFields, interceptQueries = [] } = tableConfig;

        // 处理groupFields - 确保是数组
        let groupFieldsArray = [];
        if (Array.isArray(groupFields)) {
          groupFieldsArray = groupFields;
        } else if (typeof groupFields === 'string') {
          // 按逗号分割字符串
          groupFieldsArray = groupFields.split(',').map(item => item.trim());
        }

        console.log('处理后的groupFieldsArray:', groupFieldsArray);

        // 处理interceptQueries - 确保是数组
        let interceptQueriesArray = [];
        if (Array.isArray(interceptQueries)) {
          interceptQueriesArray = interceptQueries;
        } else if (typeof interceptQueries === 'string') {
          // 如果是字符串，尝试解析
          try {
            interceptQueriesArray = JSON.parse(interceptQueries);
          } catch (e) {
            console.log('interceptQueries不是JSON格式，尝试解析为Java风格数组:', interceptQueries);
            // 简化处理：尝试解析为[{columnName=year,value=6}]格式
            if (interceptQueries.startsWith('[') && interceptQueries.endsWith(']')) {
              const content = interceptQueries.substring(1, interceptQueries.length - 1);
              if (content.includes('{')) {
                // 包含对象
                const queries = [];
                let inObj = false;
                let objStart = 0;
                let objBraceCount = 0;

                for (let i = 0; i < content.length; i++) {
                  const ch = content[i];
                  if (ch === '{') {
                    if (!inObj) {
                      inObj = true;
                      objStart = i;
                    }
                    objBraceCount++;
                  } else if (ch === '}') {
                    objBraceCount--;
                    if (inObj && objBraceCount === 0) {
                      const objStr = content.substring(objStart, i + 1);
                      const queryObj = {};
                      const pairs = objStr.substring(1, objStr.length - 1).split(',');

                      for (const pair of pairs) {
                        const eqIndex = pair.indexOf('=');
                        if (eqIndex > 0) {
                          const qKey = pair.substring(0, eqIndex).trim();
                          let qValue = pair.substring(eqIndex + 1).trim();

                          // 解析查询值
                          if ((qValue.startsWith('"') && qValue.endsWith('"')) ||
                              (qValue.startsWith("'") && qValue.endsWith("'"))) {
                            qValue = qValue.substring(1, qValue.length - 1);
                          }

                          queryObj[qKey] = qValue;
                        }
                      }

                      queries.push(queryObj);
                      inObj = false;
                    }
                  }
                }

                interceptQueriesArray = queries;
              }
            }
          }
        }

        console.log('处理后的interceptQueriesArray:', interceptQueriesArray);

        // 创建拦截条件映射，便于查找
        const interceptQueriesMap = {};
        interceptQueriesArray.forEach(query => {
          if (query && query.columnName) {
            interceptQueriesMap[query.columnName] = query.value || '';
          }
        });

        console.log('interceptQueries映射:', interceptQueriesMap);

        // 将分组字段添加到主栏
        groupFieldsArray.forEach(field => {
          if (field) { // 确保field不为空
            // 检查是否有对应的拦截条件
            const formatValue = interceptQueriesMap[field] || '';

            const mainItem = {
              key: field,
              title: field,
              listNum: String(tableNum),
              tableName: tableName || '',
              tablecode: tableName || '',
              formatType:'truncate',
              formatValue: formatValue
            };
            console.log('添加到主栏:', mainItem);
            mainList.value.push(mainItem);
          }
        });

        // 处理sumFields - 确保是数组
        let sumFieldsArray = [];
        if (Array.isArray(sumFields)) {
          sumFieldsArray = sumFields;
        } else if (typeof sumFields === 'string') {
          // 按逗号分割字符串
          sumFieldsArray = sumFields.split(',').map(item => item.trim());
        }

        console.log('处理后的sumFieldsArray:', sumFieldsArray);

        // 将汇总字段添加到宾栏
        sumFieldsArray.forEach(field => {
          if (field) { // 确保field不为空
            // 解析汇总方法和字段名
            let method = 'count';
            let title = field;
            let originalField = field;

            // 解析类似sum("字段名")、count("字段名")、avg("字段名")的格式
            const match = field.match(/^(count|sum|avg)\(["'](.+)["']\)$/);
            if (match) {
              method = match[1];
              title = match[2];
            }

            const sideItem = {
              key: `${method}_${title}_${tableNum}_${index}`,
              title: title,
              listNum: String(tableNum),
              tableName: tableName || '',
              tablecode: tableName || '',
              method: method,
              // formula: originalField,
              formula: '',
            };
            console.log('添加到宾栏:', sideItem);
            normalSideList.value.push(sideItem);
          }
        });
      });

      console.log('最终主栏数据:', mainList.value);
      console.log('最终宾栏数据:', normalSideList.value);

      // 移除sessionStorage中的sumOp数据，避免重复解析
      sessionStorage.removeItem('summarySumOpData');

      // 自动执行汇总
      console.log('执行汇总');
      executeSummary();
    }
  } catch (error) {
    console.error('解析sumOp数据失败:', error);
  }
};

// 组件卸载前清理
onBeforeUnmount(() => {
  // 提前清理一些资源
  if (workerManager) {
    workerManager.terminate();
  }
});

// 组件卸载时的清理逻辑
onUnmounted(() => {
  // 移除事件监听
  document.removeEventListener('visibilitychange', handleVisibilityChangeSimple);

  // 清理定时器
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }

  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }

  if (hiddenTimer) {
    clearTimeout(hiddenTimer);
    hiddenTimer = null;
  }

  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }

  // 使用安全清理
  cacheControl.safeCleanup().catch(console.error);

  // 清理数据引用
  cleanupPreviousData();
});
</script>

<style lang="scss" scoped>
.separator-row {
  background: #f0f2f5 !important;

  td {
    text-align: center !important;
    font-weight: bold !important;
    font-size: 1.6rem !important;
    color: #333 !important;
  }
}

.empty-row {
  background: #000000;

  td {
    color: transparent !important;
  }
}

.quick-summary-container {
  display: flex;
  flex-direction: column;
  height: 100%;

  .content-box {
    flex-grow: 1;
    display: flex;
    width: 100%;
    height: 100%;
    border-radius: 18px;
    background: rgba(255, 255, 255, 1);

    &.drag-disabled {
      border-color: #ff4d4f !important;
      background-color: rgba(255, 77, 79, 0.05);

      &::before {
        content: '字段不可重复添加';
        display: block;
        color: #ff4d4f;
        font-size: 1.4rem;
        text-align: center;
        padding: 8px 0;
      }
    }

    &.drag-over.drag-disabled {
      box-shadow: 0 0 8px rgba(255, 77, 79, 0.3);
    }

    .column-container {
      display: flex;
      padding: 14px 0 17px 0;
      width: 35%;

      .left-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 0 14px;
        width: 100%;

        .select-container {
          display: flex;
          gap: 10px;
          height: 24px;
          width: 57%;

          :deep(.ant-input) {
            background-color: rgba(245, 245, 247, 1);
          }

          :deep(.ant-input-affix-wrapper) {
            padding: 0px 8px;
            background: rgba(245, 245, 247, 1);
            color: rgba(113, 113, 113, 1);
            font-size: 1.6rem;
          }

          :deep(.ant-input-suffix) {
            margin-inline-start: -14px;
            color: rgba(113, 113, 113, 0.7);
            z-index: 10;
          }

          .derive-btn {
            padding: 0 15px;
            padding-bottom: 30px;
            height: auto;
            color: rgba(113, 113, 113, 1);
            font-size: 1.6rem;

            .anticon-question-circle {
              margin: 0;
              color: rgba(229, 229, 229, 1);
            }
          }

          :deep(.ant-btn-default:not(:disabled):hover) {
            color: rgba(84, 111, 255, 1);

            .anticon-question-circle {
              color: rgba(84, 111, 255, 1);
            }
          }
        }

        .tree-container {
          flex: 1;
          padding: 20px 12px;
          width: 100%;
          height: 100%;
          border-radius: 10px;
          margin-top: 10px;
          background: rgba(245, 245, 247, 1);
          box-sizing: border-box;
          overflow: auto;
          white-space: normal; /* 确保容器本身也允许换行 */

          :deep(.ant-tree) {
            background-color: transparent;
            .ant-tree-switcher {
              display: inline-flex;
              align-items: flex-start; /* 顶部对齐 */
              width: 16px;
              color: rgb(204, 204, 204);
              margin-top: 2px; /* 微调位置使其与文本行首对齐 */
            }

            .ant-tree-treenode {
              align-items: flex-start; /* 顶部对齐以支持多行文本 */
              white-space: normal; /* 允许文本自动换行 */
              width: 100%; /* 确保节点容器占满宽度 */
            }

            /* 针对Ant Design Tree内部的内容包裹器 */
            .ant-tree-node-content-wrapper {
              white-space: normal !important; /* 强制允许换行 */
              word-break: break-all !important; /* 强制长单词换行 */
              width: calc(100% - 24px); /* 减去缩进和图标宽度 */
              display: inline-block; /* 确保与图标在同一行 */
              vertical-align: top; /* 顶部对齐 */
            }

            .tree-node {
              padding: 0px 4px;
              border-radius: 4px;
              cursor: grab;
              white-space: normal; /* 允许节点容器换行 */
              display: block; /* 确保节点是块级元素 */

              &.dragging {
                background-color: rgba(84, 111, 255,  0.1);
                color: rgba(84, 111, 255, 1);
                cursor: grabbing;
              }
            }

            .tree-node-title {
              color: rgba(55, 55, 55, 1);
              font-size: 1.6rem;
              white-space: normal; /* 允许文本自动换行 */
              word-break: break-all; /* 长单词也会换行 */
              min-width: 0; /* 确保在flex容器中正常工作 */

              &.leaf-node {
                color: rgba(55, 55, 55, 0.7);
                font-size: 1.4rem;
                white-space: normal; /* 允许文本自动换行 */
                word-break: break-all; /* 长单词也会换行 */
              }
            }
          }
        }
      }

      .column {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 10px;

        .main-title-box {
          display: flex;
          justify-content: space-between;
          align-items: end;
          padding-right: 14px;
          height: 26 px;
          color: rgba(113, 113, 113, 1);
          font-size: 1.6rem;
        }

        .column-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-right: 14px;
          height: 100%;

          .main,
          .side {
            .content-box {
              flex: 1;
              display: flex;
              flex-direction: column;
              padding: 20px 16px;
              width: 100%;
              height: 100%;
              border: 1px dashed rgba(84, 111, 255, 1);
              border-radius: 10px;
              box-sizing: border-box;
              font-size: 1.6rem;
              overflow-y: scroll;

              &.drag-over {
                border-color: rgba(84, 111, 255, 0.8);
                box-shadow: 0 0 8px rgba(84, 111, 255, 0.3);
              }

              .chekbox-item-box {
                display: flex;
                align-items: center;
                justify-content: space-between;

                :deep(.ant-checkbox .ant-checkbox-inner) {
                  width: 16px;
                }
              }

              .item-box {
                display: flex;
                justify-content: space-between;
                width: 100%;
                min-width: 0; /* 确保flex容器内的元素不会溢出 */

                .label {
                  width: 60%;
                  min-width: 0; /* 确保label元素不会溢出 */
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .setting-box {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  gap: 10px;

                  :deep(.ant-select ) {
                    width: 75px !important;

                    .ant-select-selector {
                      display: flex;
                      align-items: center;
                      height: 25px;

                      .ant-select-selection-item {
                        color: rgba(186, 186, 186, 1);
                        font-size: 1.2rem !important;
                        line-height: 18px;
                      }
                    }

                    .ant-select-arrow {
                      top: 55%;
                    }
                  }

                  :deep(.ant-checkbox-wrapper) {
                    margin: 0 !important;
                  }
                }
              }
            }
          }

          .main {
            height: 35%;

            .refresh-btn {
              scale: 0.8;
            }

            .content-box {
              gap: 6px;

              .total-box {
                font-weight: bold;
              }
            }
          }

          .main {
            .content-box {
              .item-box {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 0;
                //min-height: 32px;
                min-width: 0; /* 确保flex容器内的元素不会溢出 */

                .label {
                  flex: 1;
                  min-width: 0;
                  font-size: 1.6rem;
                  color: rgba(55, 55, 55, 0.8);
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  max-width: 120px;
                }

                .setting-box {
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  flex-shrink: 0;

                  // 下拉框和输入框的样式
                  :deep(.ant-select),
                  :deep(.ant-input) {
                    font-size: 1.2rem;
                  }

                  :deep(.ant-select) {
                    width: 75px !important;

                    .ant-select-selector {
                      height: 25px;
                      display: flex;
                      align-items: center;
                      padding: 0 6px;

                      .ant-select-selection-item {
                        font-size: 1.2rem;
                        line-height: 20px;
                      }
                    }

                    .ant-select-arrow {
                      font-size: 1rem;
                    }
                  }

                  :deep(.ant-input) {
                    height: 25px;
                    padding: 0 4px;
                    font-size: 1.2rem;

                    &[type="number"] {
                      -moz-appearance: textfield;

                      &::-webkit-outer-spin-button,
                      &::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                      }
                    }
                  }

                  .btn {
                    font-size: 1.2rem;
                    //padding: 2px;
                  }
                }
              }
            }
          }

          .side {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 10px;

            .title-box {
              font-size: 1.6rem;
              color: rgba(113, 113, 113, 1);
            }

            .content-box {
              gap: 10px;

              .chekbox-item-box {
                color: rgba(55, 55, 55, 1);
              }

              .item-box {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                min-width: 0; /* 确保flex容器内的元素不会溢出 */

                &.system-item {
                  font-size: 1.4rem;
                }

                &.normal-item {
                  color: rgba(113, 113, 113, 1);
                  font-size: 1.4rem;
                }

                .label {
                  flex: 1;
                  min-width: 0;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                  max-width: 180px;
                }

                &.normal-item .label {
                  &::before {
                    content: '';
                    display: inline-block;
                    margin-right: 8px;
                    width: 6px;
                    height: 6px;
                    background: rgba(84, 111, 255, 1);
                    border-radius: 50%;
                  }
                }

                .btns {
                  display:  flex;
                  justify-content: space-between;
                  align-items: center;
                  gap: 10px;
                }
              }
            }
          }
        }
      }
    }

    .table-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 55%; // 调整宽度分配
      border-left: 1px solid rgba(229, 229, 229, 1);
      padding: 14px 14px 17px 14px;
      box-sizing: border-box;

      :deep(.ant-table-wrapper .ant-table-thead > tr > th) {
        background-color: rgba(245, 245, 247, 1);
        color: rgba(166, 166, 166, 1);
        font-weight: normal;
        text-align: center;
      }

      :deep(.hover-row) {
        cursor: pointer;

        &:hover {
          background-color: transparent;
        }
      }

      :deep(.ant-table) {
        // 表格外框边框
        border: 1px solid rgba(229, 229, 229, 0.6) !important;

        // 表头边框
        thead {
          tr {
            th {
              border-right: 1px solid rgba(229, 229, 229, 0.6);
              border-bottom: 1px solid rgba(229, 229, 229, 0.6);

              &:last-child {
                border-right: none;
              }
            }
          }
        }

        // 表体边框
        tbody {
          tr {
            border-bottom: 1px solid rgba(229, 229, 229, 0.6);

            &:last-child {
              border-bottom: none;
            }

            td {
              border-right: 1px solid rgba(229, 229, 229, 0.6);

              &:last-child {
                border-right: none;
              }
            }
          }
        }
      }
    }
  }
}

:global(.ant-select-item-option-content) {
  font-size: 1.6rem !important;
}

.btn {
  cursor: pointer;

  &:hover {
    color: rgba(84, 111, 255, 1);
  }

  &.delete-btn:hover {
    color: #d43030;
  }
}

.statistical-definition-container {
  width: 100%;
  height: 2000px;
  background: white;
  overflow: auto;
}

.no-chart-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  width: 100%;
  text-align: center;
  color: #999;
  font-size: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.chart-container {
  padding: 10px 0;
}

.single-chart-wrapper {
  margin-bottom: 30px;
  padding: 15px;
  background-color: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chart-title {
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  text-align: center;
}
</style>