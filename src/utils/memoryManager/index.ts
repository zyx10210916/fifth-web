// src/utils/memoryManager.ts
class MemoryManager {
  private static instance: MemoryManager;
  private dataCache: Map<string, { data: any; timestamp: number; size: number }> = new Map();
  private readonly MAX_CACHE_SIZE = 50; // 最大缓存条目
  private readonly MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB 总内存限制
  private currentTotalSize = 0;
  private readonly CACHE_TIMEOUT = 1 * 60 * 1000; // 1分钟缓存时间

  private constructor() {
    this.startCleanupInterval();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // 估算对象大小
  private estimateSize(obj: any): number {
    const jsonString = JSON.stringify(obj);
    return new Blob([jsonString]).size;
  }

  // 设置缓存
  setCache(key: string, data: any): void {
    const size = this.estimateSize(data);
    
    // 清理过期缓存
    this.cleanupExpired();
    
    // 如果超过总大小限制，清理最旧的缓存
    while (this.currentTotalSize + size > this.MAX_TOTAL_SIZE && this.dataCache.size > 0) {
      this.removeOldest();
    }
    
    // 如果超过最大缓存条目数，清理最旧的
    while (this.dataCache.size >= this.MAX_CACHE_SIZE) {
      this.removeOldest();
    }
    
    this.dataCache.set(key, {
      data: this.deepFreeze(data), // 冻结对象防止修改
      timestamp: Date.now(),
      size
    });
    
    this.currentTotalSize += size;
  }

  // 获取缓存
  getCache(key: string): any {
    const item = this.dataCache.get(key);
    if (!item) return null;
    
    // 检查是否过期
    if (Date.now() - item.timestamp > this.CACHE_TIMEOUT) {
      this.dataCache.delete(key);
      this.currentTotalSize -= item.size;
      return null;
    }
    
    return item.data;
  }

  // 深度冻结对象
  private deepFreeze(obj: any): any {
    if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
      Object.freeze(obj);
      Object.getOwnPropertyNames(obj).forEach(prop => {
        this.deepFreeze(obj[prop]);
      });
    }
    return obj;
  }

  // 清理过期缓存
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.dataCache.entries()) {
      if (now - item.timestamp > this.CACHE_TIMEOUT) {
        this.dataCache.delete(key);
        this.currentTotalSize -= item.size;
      }
    }
  }

  // 移除最旧的缓存
  private removeOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, item] of this.dataCache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      const item = this.dataCache.get(oldestKey)!;
      this.dataCache.delete(oldestKey);
      this.currentTotalSize -= item.size;
    }
  }

  // 手动清理缓存
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.dataCache.keys()) {
        if (key.includes(pattern)) {
          const item = this.dataCache.get(key)!;
          this.dataCache.delete(key);
          this.currentTotalSize -= item.size;
        }
      }
    } else {
      this.dataCache.clear();
      this.currentTotalSize = 0;
    }
  }

  // 获取缓存状态
  getCacheStatus() {
    return {
      totalEntries: this.dataCache.size,
      totalSize: this.currentTotalSize,
      maxSize: this.MAX_TOTAL_SIZE
    };
  }

  // 定期清理
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // 每分钟清理一次
  }
}

export const memoryManager = MemoryManager.getInstance();