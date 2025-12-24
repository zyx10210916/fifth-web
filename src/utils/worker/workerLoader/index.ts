/**
 * Worker 加载工具类
 * 用于正确处理 TypeScript Worker 模块
 */

export class WorkerLoader {
  /**
   * 创建 Worker 实例 - 简化版，直接使用正确的路径处理
   * @param workerPath Worker 文件路径
   * @param options Worker 选项
   */
  static createWorker(workerPath: string, options?: WorkerOptions): Worker {
    try {
      // 直接使用Vite的URL构造函数，它能正确处理模块路径
      const workerUrl = new URL(workerPath, import.meta.url);

      // 不强制使用module类型，让浏览器自动处理
      return new Worker(workerUrl, options);
    } catch (error) {
      console.error('创建Worker失败:', error);
      // 降级方案：使用最简单的相对路径
      try {
        // 直接返回一个基础的Worker，避免复杂的路径转换
        return new Worker('/src/workers/tableDataProcessor.ts', options);
      } catch (fallbackError) {
        console.error('降级方案也失败:', fallbackError);
        throw new Error('Worker创建失败，请检查文件路径');
      }
    }
  }

  /**
   * 检查浏览器是否支持Worker
   */
  static isSupported(): boolean {
    return typeof Worker !== 'undefined';
  }

  /**
   * 检查浏览器是否支持模块Worker
   */
  static isModuleSupported(): boolean {
    try {
      const options = { type: 'module' as const };
      const worker = new Worker('data:,', options);
      worker.terminate();
      return true;
    } catch {
      return false;
    }
  }
}