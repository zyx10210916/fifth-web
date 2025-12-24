// Web Worker 类型定义
interface WorkerGlobalScope {
  addEventListener: (type: string, listener: (event: any) => void) => void;
  postMessage: (message: any) => void;
}

declare const self: WorkerGlobalScope;

// 导入消息类型
import type {
  ProcessTableDataMessage,
  ProcessProgressMessage,
  DataProcessedMessage,
  WorkerErrorMessage,
  TableData,
  ProcessedTableRow
} from './types';

// 确保Worker可以正常运行，捕获所有可能的错误
self.addEventListener('error', (error) => {
  console.error('Worker错误:', error);
  const errorMessage: WorkerErrorMessage = {
    type: 'WORKER_ERROR',
    error: error.message || 'Worker运行时错误'
  };
  self.postMessage(errorMessage);
});

// Worker消息处理
self.addEventListener('message', function(e: MessageEvent<ProcessTableDataMessage>) {
  try {
    const { type, data, params } = e.data;

    if (type === 'PROCESS_TABLE_DATA') {
      // 安全检查数据格式
      if (!Array.isArray(data)) {
        throw new Error('无效的数据格式，期望数组');
      }

      // 增量处理表格数据
      processTableDataIncrementally(data, params || {});
    }
  } catch (error: any) {
    console.error('Worker消息处理失败:', error);
    const message: DataProcessedMessage = {
      type: 'DATA_PROCESSED',
      data: [],
      success: false,
      error: error.message || '未知错误'
    };
    self.postMessage(message);
  }
});

// 增量处理表格数据的核心逻辑
function processTableDataIncrementally(resDataList: any[], options: {
  chunkSize?: number,
  batchSize?: number
} = {}): void {
  // 更保守的默认参数
  const {
    chunkSize = 100,  // 更小的块大小
    batchSize = 25    // 更小的批次
  } = options;

  const processedTables: any[][] = [];
  let currentTableIndex = 0;
  let currentRowIndex = 0;
  let totalProcessedRows = 0;
  let totalRowsToProcess = 0;

  // 计算总数据量，并设置上限
  resDataList.forEach(table => {
    totalRowsToProcess += Math.min(table.rows?.length || 0, 10000); // 限制单表最大行数
  });

  // 开始增量处理
  function processNextBatch() {
    try {
      // 如果所有表都处理完了，发送完成消息
      if (currentTableIndex >= resDataList.length) {
        const completeMessage: DataProcessedMessage = {
          type: 'DATA_PROCESSED',
          data: processedTables,
          success: true,
          complete: true
        };
        self.postMessage(completeMessage);
        return;
      }

      const resData = resDataList[currentTableIndex];

      // 初始化当前表的处理数组
      if (!processedTables[currentTableIndex]) {
        processedTables[currentTableIndex] = [];

        // 先处理表头行并立即返回
        if (resData.columns && resData.columns.length) {
          const headerRow: ProcessedTableRow = {
            isHeader: true,
            key: `header-${currentTableIndex}`
          };

          // 限制处理的列数
          resData.columns.slice(0, 15).forEach((col: any) => {
            headerRow[col.key] = col.title;
          });
          processedTables[currentTableIndex].push(headerRow);

          // 立即发送表头数据
          sendPartialDataUpdate();
        }
      }

      // 处理数据行
      if (resData.rows && resData.rows.length > currentRowIndex) {
        // 安全处理：限制最大处理行数
        const safeRows = resData.rows.slice(0, 10000);

        // 计算当前批次的结束索引
        const endIndex = Math.min(currentRowIndex + batchSize, safeRows.length);

        // 处理当前批次
        for (let i = currentRowIndex; i < endIndex; i++) {
          const row = safeRows[i];
          const newObj: ProcessedTableRow = { key: row.key || `row-${currentTableIndex}-${i}` };

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
            newObj.isSeparator = false;
            newObj.key = `total-${currentTableIndex}-${i}`;
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

          processedTables[currentTableIndex].push(newObj);
          totalProcessedRows++;
        }

        // 更新当前行索引
        currentRowIndex = endIndex;

        // 发送部分数据更新
        sendPartialDataUpdate();

        // 发送进度更新
        sendProgressUpdate();

        // 使用setTimeout确保不会阻塞
        setTimeout(processNextBatch, 5); // 稍长的延迟，减少消息频率
      } else {
        // 当前表处理完成，移动到下一个表
        currentTableIndex++;
        currentRowIndex = 0;
        setTimeout(processNextBatch, 5);
      }
    } catch (error) {
      console.error('批次处理失败:', error);
      const errorMessage: DataProcessedMessage = {
        type: 'DATA_PROCESSED',
        data: processedTables, // 发送已处理的数据
        success: false,
        error: (error as Error).message || '处理批次时发生错误'
      };
      self.postMessage(errorMessage);
    }
  }

  // 发送部分数据更新
  function sendPartialDataUpdate() {
    try {
      // 优化数据克隆方式，避免深拷贝的性能开销
      const partialUpdateMessage: DataProcessedMessage = {
        type: 'DATA_PROCESSED',
        data: processedTables.map(table => table.slice()), // 使用slice创建浅拷贝
        success: true,
        complete: false,
        partial: true
      };
      self.postMessage(partialUpdateMessage);
    } catch (error) {
      console.error('发送部分更新失败:', error);
    }
  }

  // 发送进度更新
  function sendProgressUpdate() {
    try {
      const progress = totalRowsToProcess > 0 ?
          Math.round((totalProcessedRows / totalRowsToProcess) * 100) : 0;

      const progressMessage: ProcessProgressMessage = {
        type: 'PROCESS_PROGRESS',
        progress: progress,
        current: totalProcessedRows,
        total: totalRowsToProcess
      };
      self.postMessage(progressMessage);
    } catch (error) {
      console.error('发送进度更新失败:', error);
    }
  }

  // 启动处理
  processNextBatch();
}