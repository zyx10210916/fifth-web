
import { WorkerLoader } from '../workerLoader/index';
import type {
  MainThreadMessage,
  WorkerMessage,
  ProcessProgressMessage,
  DataProcessedMessage,
  WorkerErrorMessage
} from '@/workers/types';

/**
 * Worker 管理器类
 * 提供 Worker 的创建、通信和生命周期管理
 */
export class WorkerManager {
  private worker: Worker | null = null;
  private isTerminated: boolean = false;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private errorHandlers: ((error: Error) => void)[] = [];
  private retryCount: number = 0;
  private maxRetries: number = 2;

  /**
   * 创建 Worker 实例 - 增强版带重试机制
   */
  createWorker(): Worker {
    if (this.worker && !this.isTerminated) {
      this.terminate();
    }

    try {
      this.retryCount = 0;
      this.worker = this.createWorkerWithRetry();
      this.isTerminated = false;

      return this.worker;
    } catch (error) {
      console.error('创建Worker失败:', error);
      throw new Error('Worker创建失败，请检查浏览器兼容性');
    }
  }

  /**
   * 带重试机制的Worker创建
   */
  private createWorkerWithRetry(): Worker {
    try {
      // 尝试不同的Worker创建选项
      let workerOptions: WorkerOptions = {};

      // 根据浏览器支持情况动态选择Worker类型
      if (WorkerLoader.isModuleSupported() && import.meta.env.DEV) {
        // 仅在确认支持模块的环境使用模块类型
        workerOptions.type = 'module';
      }

      const worker = WorkerLoader.createWorker('@/workers/tableDataProcessor.ts', workerOptions);

      // 设置消息监听
      worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        this.handleWorkerMessage(event.data);
      };

      // 设置错误监听 - 增强版
      worker.onerror = (error: ErrorEvent) => {
        // 清除之前的错误信息，避免undefined显示
        const errorMessage = error.message || '未知错误';
        this.handleWorkerError(new Error(`Worker执行错误: ${errorMessage}`));
      };

      // 监听messageerror事件
      worker.onmessageerror = (event) => {
        this.handleWorkerError(new Error('Worker消息解析错误'));
      };

      return worker;
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.warn(`Worker创建失败，正在重试(${this.retryCount}/${this.maxRetries})...`);
        // 重试时使用不同的选项
        return this.createWorkerWithRetry();
      }
      throw error;
    }
  }

  /**
   * 发送消息给Worker
   */
  postMessage(message: MainThreadMessage): void {
    if (!this.worker || this.isTerminated) {
      throw new Error('Worker未初始化或已终止');
    }

    try {
      this.worker.postMessage(message);
    } catch (error) {
      console.error('发送消息失败:', error);
      this.handleWorkerError(new Error(`消息发送失败: ${error}`));
    }
  }

  /**
   * 监听Worker消息
   */
  onMessage<T extends WorkerMessage['type']>(
      type: T,
      handler: (data: Extract<WorkerMessage, { type: T }>) => void
  ): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler as any);
  }

  /**
   * 移除消息监听
   */
  offMessage(type: string, handler?: (data: any) => void): void {
    if (!this.messageHandlers.has(type)) return;

    if (handler) {
      const handlers = this.messageHandlers.get(type)!;
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.messageHandlers.delete(type);
    }
  }

  /**
   * 监听Worker错误
   */
  onError(handler: (error: Error) => void): void {
    this.errorHandlers.push(handler);
  }

  /**
   * 移除错误监听
   */
  offError(handler?: (error: Error) => void): void {
    if (handler) {
      const index = this.errorHandlers.indexOf(handler);
      if (index > -1) {
        this.errorHandlers.splice(index, 1);
      }
    } else {
      this.errorHandlers = [];
    }
  }

  /**
   * 终止Worker
   */
  terminate(): void {
    if (this.worker) {
      try {
        // 先移除所有监听器
        this.worker.onmessage = null;
        this.worker.onerror = null;
        this.worker.onmessageerror = null;
        // 再终止
        this.worker.terminate();
      } catch (error) {
        console.warn('终止Worker时出错:', error);
      }

      this.worker = null;
      this.isTerminated = true;
      this.clearHandlers();
    }
  }

  /**
   * 清理所有处理器
   */
  private clearHandlers(): void {
    this.messageHandlers.clear();
    this.errorHandlers = [];
  }

  /**
   * 获取Worker状态
   */
  getStatus(): { hasWorker: boolean; isTerminated: boolean } {
    return {
      hasWorker: !!this.worker,
      isTerminated: this.isTerminated
    };
  }

  /**
   * 检查浏览器是否支持Worker
   */
  static isSupported(): boolean {
    return WorkerLoader.isSupported();
  }

  /**
   * 处理Worker消息
   */
  private handleWorkerMessage(message: WorkerMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('处理Worker消息时出错:', error);
        }
      });
    }
  }

  /**
   * 处理Worker错误
   */
  private handleWorkerError(error: Error): void {
    console.error('Worker错误:', error);
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError) {
        console.error('处理错误处理器时出错:', handlerError);
      }
    });
  }

  /**
   * 销毁WorkerManager
   */
  destroy(): void {
    this.terminate();
    this.clearHandlers();
  }
}

export default WorkerManager;