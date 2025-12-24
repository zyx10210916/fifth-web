// Worker 消息类型定义
export interface ProcessTableDataMessage {
  type: 'PROCESS_TABLE_DATA';
  data: any[];
  params?: {
    chunkSize?: number;
  };
}

export interface ProcessProgressMessage {
  type: 'PROCESS_PROGRESS';
  progress: number;
  current: number;
  total: number;
}

export interface DataProcessedMessage {
  type: 'DATA_PROCESSED';
  data: any[];
  success: boolean;
  error?: string;
}

export interface WorkerErrorMessage {
  type: 'WORKER_ERROR';
  error: string;
}

export type WorkerMessage = ProcessProgressMessage | DataProcessedMessage | WorkerErrorMessage;
export type MainThreadMessage = ProcessTableDataMessage;

// 表格数据结构类型
export interface TableColumn {
  key: string;
  title: string;
  dataIndex?: string;
}

export interface TableRow {
  key: string;
  data: Record<string, any>;
}

export interface TableData {
  columns: TableColumn[];
  rows: TableRow[];
}

export interface ProcessedTableRow {
  key: string;
  isHeader?: boolean;
  isTotalRow?: boolean;
  isNormalRow?: boolean;
  isSeparator?: boolean;
  isEmpty?: boolean;
  [key: string]: any;
}