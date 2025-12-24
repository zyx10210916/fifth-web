/**
 * 浏览器缓存控制工具类
 * 用于管理浏览器缓存、内存清理和性能优化
 */

export interface CacheStats {
  memoryUsed: number; // MB
  localStorageSize: number; // KB
  sessionStorageSize: number; // KB
  indexedDBSize: number; // KB
  cacheCount: number;
  lastCleanup: Date;
}

export interface CacheConfig {
  maxMemoryMB: number; // 最大内存限制
  maxLocalStorageKB: number; // 最大本地存储
  cleanupInterval: number; // 清理间隔(ms)
  enableMonitoring: boolean; // 是否启用监控
}

class BrowserCacheControl {
  private config: CacheConfig = {
    maxMemoryMB: 2000, 
    maxLocalStorageKB: 1024,
    cleanupInterval: 1 * 60 , // 5分钟清理一次
    enableMonitoring: true
  };
  
  private cleanupTimer: number | null = null;
  private isMonitoring = false;

  // 定义需要保留的关键键名（包括token）
  private readonly PRESERVE_KEYS = [
    'Authorization',           // token
    'user-token',             // 备用token键
    'user-info', 
    'app-settings',
    'language',
    'theme',
    'token',                  
    'access_token',           // OAuth token
    'refresh_token'           // 刷新token
  ];

  // 分步清理配置
  private readonly STEPPED_CLEANUP_CONFIG = {
    BATCH_SIZE: 50,           // 每批处理50个键
    DELAY_BETWEEN_BATCHES: 50, // 批次间延迟50ms
    GC_TRIGGER_INTERVAL: 5,   // 每5批触发一次轻度GC
    MAX_MEMORY_THRESHOLD: 1
  };

  // 页面状态管理
  private readonly PAGE_STATE_KEYS = {
    REFRESHING: 'page-refreshing',
    LOADED: 'page-loaded',
    HIDDEN_START: 'page-hidden-start',
    CLEANUP_SCHEDULED: 'cleanup-scheduled'
  };

  // 页面隐藏清理定时器
  private hiddenCleanupTimer: number | null = null;

  // 存储配额配置
  private readonly STORAGE_QUOTA_CONFIG = {
    MAX_LOCAL_STORAGE: 5 * 1024 * 1024, // 5MB默认配额
    WARNING_THRESHOLD: 0.8, // 80%使用率警告
    EMERGENCY_THRESHOLD: 0.9, // 90%使用率紧急清理
  };

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.init();
  }

  /**
   * 初始化缓存控制
   */
  private init(): void {
    // 设置页面刷新检测
    this.setupPageRefreshDetection();
    
    if (this.config.enableMonitoring) {
      this.startMonitoring();
    }
    
    // 页面可见性变化时清理缓存
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });

    // 页面卸载前清理
    window.addEventListener('beforeunload', () => {
      this.cleanupBeforeUnload();
    });
  }

  /**
   * 设置页面刷新检测机制
   */
  private setupPageRefreshDetection(): void {
    // 页面即将刷新/关闭
    window.addEventListener('beforeunload', () => {
      sessionStorage.setItem(this.PAGE_STATE_KEYS.REFRESHING, 'true');
      // console.log('检测到页面刷新/关闭，设置刷新标记');
      
      // 清除待执行的清理任务
      if (this.hiddenCleanupTimer) {
        clearTimeout(this.hiddenCleanupTimer);
        this.hiddenCleanupTimer = null;
      }
    });
    
    // 页面加载完成
    window.addEventListener('load', () => {
      // 清除刷新标记，设置加载完成标记
      sessionStorage.removeItem(this.PAGE_STATE_KEYS.REFRESHING);
      sessionStorage.setItem(this.PAGE_STATE_KEYS.LOADED, 'true');
      // console.log('页面加载完成，清除刷新标记');
      
      // 设置过期时间（5秒后清除加载标记）
      setTimeout(() => {
        sessionStorage.removeItem(this.PAGE_STATE_KEYS.LOADED);
      }, 5000);
    });
  }

  /**
   * 检查页面是否正在刷新
   */
  private isPageRefreshing(): boolean {
    return sessionStorage.getItem(this.PAGE_STATE_KEYS.REFRESHING) === 'true';
  }

  /**
   * 检查页面是否已完全加载
   */
  private isPageFullyLoaded(): boolean {
    return sessionStorage.getItem(this.PAGE_STATE_KEYS.LOADED) === 'true';
  }

  /**
   * 检查是否应该执行清理（排除刷新情况）
   */
  private shouldPerformCleanup(): boolean {
    // 如果页面正在刷新，不执行清理
    if (this.isPageRefreshing()) {
      // console.log('🚫 页面刷新中，跳过缓存清理');
      return false;
    }
    
    // 如果页面未完全加载，不执行清理
    if (!this.isPageFullyLoaded()) {
      // console.log('🚫 页面未完全加载，跳过缓存清理');
      return false;
    }
    
    return true;
  }

  /**
   * 处理页面可见性变化
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.handlePageHidden();
    } else {
      this.handlePageVisible();
    }
  }

  /**
   * 页面隐藏处理
   */
  private handlePageHidden(): void {
    // 记录页面隐藏开始时间
    sessionStorage.setItem(this.PAGE_STATE_KEYS.HIDDEN_START, Date.now().toString());
    
    // console.log('页面隐藏，启动延迟清理检查');
    
    // 清除现有定时器
    if (this.hiddenCleanupTimer) {
      clearTimeout(this.hiddenCleanupTimer);
    }
    
    // 延迟检查是否需要清理（给页面刷新留出时间）
    this.hiddenCleanupTimer = window.setTimeout(() => {
      this.checkAndCleanupOnHidden();
    }, 5000); // 3秒后检查
  }

  /**
   * 页面显示处理
   */
  private handlePageVisible(): void {
    const hiddenStart = sessionStorage.getItem(this.PAGE_STATE_KEYS.HIDDEN_START);
    const hiddenDuration = hiddenStart ? (Date.now() - parseInt(hiddenStart)) : 0;
    
    // console.log('页面显示，隐藏时长:', `${hiddenDuration}ms`);
    
    // 清除隐藏开始时间和清理定时器
    sessionStorage.removeItem(this.PAGE_STATE_KEYS.HIDDEN_START);
    
    if (this.hiddenCleanupTimer) {
      clearTimeout(this.hiddenCleanupTimer);
      this.hiddenCleanupTimer = null;
    }
    
    // 短暂离开不清理
    if (hiddenDuration < 30000) { // 30秒内
      // console.log('短暂离开，跳过缓存清理');
    }
  }

  /**
   * 检查并执行隐藏时的清理
   */
  private checkAndCleanupOnHidden(): void {
    // 如果页面已经显示，跳过清理
    if (!document.hidden) {
      // console.log('页面已重新显示，取消隐藏清理');
      return;
    }
    
    // 检查是否是页面刷新
    if (this.isPageRefreshing()) {
      // console.log('页面刷新中，跳过隐藏清理');
      return;
    }
    
    // 检查隐藏时间，只有长时间隐藏才清理
    const hiddenStart = sessionStorage.getItem(this.PAGE_STATE_KEYS.HIDDEN_START);
    if (hiddenStart) {
      const hiddenTime = Date.now() - parseInt(hiddenStart);
      
      // 只有隐藏超过5秒才清理（避免刷新时的短暂隐藏）
      if (hiddenTime > 5000) {
        // console.log(`页面隐藏超过${Math.round(hiddenTime/1000)}秒，执行安全清理`);
        this.safeCleanup().catch(console.error);
      } else {
        // console.log('页面短暂隐藏，跳过清理');
      }
    }
  }

  // ==================== 新增：内存监控方法 ====================

  /**
   * 开始内存监控
   */
  private startMemoryMonitoring(): void {
    if (!('memory' in performance)) {
      // console.log('当前浏览器不支持内存监控');
      return;
    }
    
    // 每10秒检查一次内存使用情况
    setInterval(() => {
      this.checkMemoryUsage();
    }, 20000);
    
    // console.log('内存监控已启动');
  }

  /**
   * 检查内存使用情况
   */
  private checkMemoryUsage(): void {
    try {
      const memory = (performance as any).memory;
      if (!memory) return;
      
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
      const usageRatio = usedMB / limitMB;
      
      // console.log(`内存使用: ${usedMB}MB/${limitMB}MB (${Math.round(usageRatio * 100)}%)`);
      
      // 内存使用超过阈值时触发清理
      if (usageRatio > this.STEPPED_CLEANUP_CONFIG.MAX_MEMORY_THRESHOLD) {
        console.warn(`内存使用过高: ${usedMB}MB/${limitMB}MB，触发紧急清理`);
        this.safeCleanup().catch(console.error);
      }
    } catch (error) {
      // console.warn('内存检查失败:', error);
    }
  }

  /**
   * 开始存储配额监控
   */
  private startStorageQuotaMonitoring(): void {
    // 每30秒检查一次存储使用情况
    setInterval(() => {
      this.checkStorageQuota().catch(console.error);
    }, 30000);
    
    // console.log('存储配额监控已启动');
  }

  /**
   * 检查存储配额
   */
  private async checkStorageQuota(): Promise<void> {
    try {
      const usage = this.getStorageUsage();
      const quota = this.STORAGE_QUOTA_CONFIG.MAX_LOCAL_STORAGE;
      const usageRatio = usage / quota;
      
      if (usageRatio > this.STORAGE_QUOTA_CONFIG.EMERGENCY_THRESHOLD) {
        console.warn(` 存储使用率过高: ${Math.round(usageRatio * 100)}%，执行紧急清理`);
        await this.emergencyStorageCleanup();
      } else if (usageRatio > this.STORAGE_QUOTA_CONFIG.WARNING_THRESHOLD) {
        console.warn(` 存储使用率较高: ${Math.round(usageRatio * 100)}%，建议清理`);
      }
    } catch (error) {
      console.warn('存储配额检查失败:', error);
    }
  }

  /**
   * 获取当前存储使用量
   */
  private getStorageUsage(): number {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
    }
    return totalSize;
  }

  /**
   * 紧急存储清理
   */
  private async emergencyStorageCleanup(): Promise<void> {
    // console.log('执行紧急存储清理');
    
    try {
      // 1. 清理过期数据
      const expiredFreed = this.cleanupExpiredDataImmediate();
      
      // 2. 清理最大的缓存项
      // const largeFreed = this.cleanupLargestItems();
      
      // 3. 清理临时数据
      const tempFreed = this.cleanupTemporaryDataImmediate();
      
      // console.log(`紧急存储清理完成，释放空间: ${Math.round((expiredFreed + largeFreed + tempFreed) / 1024)}KB`);
    } catch (error) {
      console.error('紧急存储清理失败:', error);
    }
  }

  /**
   * 立即清理过期数据
   */
  private cleanupExpiredDataImmediate(): number {
    let freedSpace = 0;
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache-') && this.isCacheExpired(key)) {
        const value = localStorage.getItem(key);
        if (value) {
          freedSpace += new Blob([value]).size;
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    return freedSpace;
  }

  /**
   * 清理最大的缓存项
   */
  private cleanupLargestItems(): number {
    const items: Array<{key: string, size: number}> = [];
    
    // 收集所有缓存项的大小
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cache-') && !this.PRESERVE_KEYS.includes(key)) {
        const value = localStorage.getItem(key);
        if (value) {
          items.push({
            key,
            size: new Blob([value]).size
          });
        }
      }
    }
    
    // 按大小降序排序
    items.sort((a, b) => b.size - a.size);
    
    // 清理最大的10个项
    const keysToRemove = items.slice(0, 10).map(item => item.key);
    let freedSpace = 0;
    
    keysToRemove.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        freedSpace += new Blob([value]).size;
        localStorage.removeItem(key);
      }
    });
    
    return freedSpace;
  }

  /**
   * 立即清理临时数据
   */
  private cleanupTemporaryDataImmediate(): number {
    let freedSpace = 0;
    const patterns = ['temp-', 'drag-', 'tmp-'];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && patterns.some(pattern => key.startsWith(pattern))) {
        const value = localStorage.getItem(key);
        if (value) {
          freedSpace += new Blob([value]).size;
          localStorage.removeItem(key);
        }
      }
    }
    
    return freedSpace;
  }

  // ==================== 原有方法保持不变 ====================

  /**
   * 开始缓存监控
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // 定期清理
    this.cleanupTimer = window.setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);

    // 内存监控
    this.startMemoryMonitoring();
    
    // 存储配额监控
    this.startStorageQuotaMonitoring();
    
    // console.log('缓存监控已启动');
  }

  /**
   * 停止缓存监控
   */
  stopMonitoring(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    if (this.hiddenCleanupTimer) {
      clearTimeout(this.hiddenCleanupTimer);
      this.hiddenCleanupTimer = null;
    }

    this.isMonitoring = false;
    // console.log('缓存监控已停止');
  }

  /**
   * 执行缓存清理（安全版本，不清理token）- 使用分步清理
   */
  async performCleanup(): Promise<void> {
    // 检查是否应该执行清理
    if (!this.shouldPerformCleanup()) {
      // console.log(' 当前状态不适合清理，跳过');
      return;
    }

    // console.log('开始安全缓存清理（保护token）...');
    
    const statsBefore = await this.getCacheStats();
    
    try {
      // 1. 备份token
      const tokenBackup = this.backupTokens();
      
      // 2. 执行分步清理操作
      await this.steppedCleanup();
      
      // 3. 恢复token
      this.restoreTokens(tokenBackup);
      
      const statsAfter = await this.getCacheStats();
      
      console.log('安全缓存清理完成', {
        内存释放: `${statsBefore.memoryUsed - statsAfter.memoryUsed}MB`,
        本地存储释放: `${statsBefore.localStorageSize - statsAfter.localStorageSize}KB`,
        缓存数量减少: statsBefore.cacheCount - statsAfter.cacheCount,
        token保护: '已启用'
      });
    } catch (error) {
      console.error('缓存清理失败:', error);
      // 确保token被恢复
      this.emergencyTokenRecovery();
    }
  }

  /**
   * 分步清理 - 减少内存峰值
   */
  private async steppedCleanup(): Promise<void> {
    // console.log('开始分步清理...');
    
    // 分阶段执行清理
    await this.cleanupLargeItemsFirst();
    await this.cleanupTemporaryData();
    await this.cleanupExpiredData();
    await this.cleanupSessionStorage();
    await this.cleanupMemoryCache();
    await this.cleanupIndexedDB();
    await this.cleanupServiceWorkerCache();
    
    // 温和的垃圾回收
    await this.gentleGarbageCollection();
  }

  /**
   * 分批清理大文件项
   */
  private async cleanupLargeItemsFirst(): Promise<void> {
    // console.log('第一步：清理大文件项');
    
    // 找出大文件（大于100KB）
    const largeItems = this.findLargeItems(1024 * 100);
    // console.log(`发现 ${largeItems.length} 个大文件需要清理`);
    
    if (largeItems.length === 0) return;
    
    // 分批处理
    const batches = this.createBatches(largeItems, this.STEPPED_CLEANUP_CONFIG.BATCH_SIZE);
    
    for (let i = 0; i < batches.length; i++) {
      await this.processBatch(batches[i], '大文件', i + 1, batches.length);
      
      // 定期触发轻度GC
      if ((i + 1) % this.STEPPED_CLEANUP_CONFIG.GC_TRIGGER_INTERVAL === 0) {
        await this.lightGarbageCollection();
      }
    }
  }

  /**
   * 分批清理临时数据
   */
  private async cleanupTemporaryData(): Promise<void> {
    // console.log(' 第二步：清理临时数据');
    
    const tempKeys = Object.keys(localStorage).filter(key => 
      (key.startsWith('temp-') || key.startsWith('cache-') || key.startsWith('drag-')) &&
      !this.PRESERVE_KEYS.includes(key)
    );
    
    // console.log(`发现 ${tempKeys.length} 个临时数据需要清理`);
    
    if (tempKeys.length === 0) return;
    
    const batches = this.createBatches(tempKeys, this.STEPPED_CLEANUP_CONFIG.BATCH_SIZE);
    
    for (let i = 0; i < batches.length; i++) {
      await this.processBatch(batches[i], '临时数据', i + 1, batches.length);
      
      if ((i + 1) % this.STEPPED_CLEANUP_CONFIG.GC_TRIGGER_INTERVAL === 0) {
        await this.lightGarbageCollection();
      }
    }
  }

  /**
   * 清理过期数据
   */
  private async cleanupExpiredData(): Promise<void> {
    // console.log('第三步：清理过期数据');
    
    const expiredKeys = Object.keys(localStorage).filter(key => 
      !this.PRESERVE_KEYS.includes(key) && this.isCacheExpired(key)
    );
    
    // console.log(`发现 ${expiredKeys.length} 个过期数据需要清理`);
    
    if (expiredKeys.length === 0) return;
    
    const batches = this.createBatches(expiredKeys, this.STEPPED_CLEANUP_CONFIG.BATCH_SIZE);
    
    for (let i = 0; i < batches.length; i++) {
      await this.processBatch(batches[i], '过期数据', i + 1, batches.length);
      
      if ((i + 1) % this.STEPPED_CLEANUP_CONFIG.GC_TRIGGER_INTERVAL === 0) {
        await this.lightGarbageCollection();
      }
    }
  }

  /**
   * 处理单个批次
   */
  private async processBatch(
    batch: string[], 
    type: string, 
    current: number, 
    total: number
  ): Promise<void> {
    return new Promise(resolve => {
      // 使用setTimeout避免阻塞主线程
      setTimeout(() => {
        batch.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            // 忽略错误继续处理
          }
        });
        
        // console.log(` ${type}清理进度: ${current}/${total}`);
        resolve();
      }, 0);
    });
  }

  /**
   * 创建批次
   */
  private createBatches(items: string[], batchSize: number): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 查找大文件项
   */
  private findLargeItems(sizeThreshold: number): string[] {
    const largeItems: string[] = [];
    
    Object.keys(localStorage).forEach(key => {
      // 跳过受保护的键
      if (this.PRESERVE_KEYS.includes(key)) return;
      
      try {
        const data = localStorage.getItem(key);
        if (data && data.length > sizeThreshold) {
          largeItems.push(key);
        }
      } catch (error) {
        // 忽略无法读取的项目
      }
    });
    
    return largeItems;
  }

  /**
   * 轻度垃圾回收
   */
  private async lightGarbageCollection(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        // 创建一些提示GC的轻量操作
        try {
          const hint = new Array(1000).fill(null);
          setTimeout(() => {
            hint.length = 0;
            resolve();
          }, 10);
        } catch (error) {
          resolve();
        }
      }, this.STEPPED_CLEANUP_CONFIG.DELAY_BETWEEN_BATCHES);
    });
  }

  /**
   * 温和的垃圾回收
   */
  private async gentleGarbageCollection(): Promise<void> {
    // console.log(' 执行温和垃圾回收');
    
    return new Promise(resolve => {
      setTimeout(() => {
        if (window.gc) {
          // 延迟执行GC，避免阻塞
          setTimeout(() => {
            window.gc();
            resolve();
          }, 100);
        } else {
          // 温和的GC提示
          try {
            const arr = [];
            for (let i = 0; i < 100000; i++) {
              arr.push(new Array(10));
            }
            setTimeout(() => {
              arr.length = 0;
              resolve();
            }, 50);
          } catch (error) {
            resolve();
          }
        }
      }, 200);
    });
  }

  /**
   * 备份所有token和关键认证信息
   */
  private backupTokens(): Record<string, string> {
    const backup: Record<string, string> = {};
    
    this.PRESERVE_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        backup[key] = value;
        // console.log(`备份token: ${key}`);
      }
    });
    
    // 同时备份sessionStorage中的认证信息
    this.PRESERVE_KEYS.forEach(key => {
      const value = sessionStorage.getItem(key);
      if (value) {
        backup[`session_${key}`] = value;
      }
    });
    
    return backup;
  }

  /**
   * 恢复token和关键认证信息
   */
  private restoreTokens(backup: Record<string, string>): void {
    Object.keys(backup).forEach(key => {
      if (key.startsWith('session_')) {
        // 恢复sessionStorage
        const originalKey = key.replace('session_', '');
        sessionStorage.setItem(originalKey, backup[key]);
      } else {
        // 恢复localStorage
        localStorage.setItem(key, backup[key]);
      }
    });
    
    // console.log(' token恢复完成');
  }

  /**
   * 紧急token恢复（当清理过程出现错误时）
   */
  private emergencyTokenRecovery(): void {
    // console.warn('执行紧急token恢复');
    // 这里可以添加从备份或其他安全位置恢复token的逻辑
  }

  /**
   * 安全清理方法 - 专门用于清理非认证数据（使用分步清理）
   */
  async safeCleanup(): Promise<void> {
    // 检查是否应该执行清理
    if (!this.shouldPerformCleanup()) {
      // console.log('当前状态不适合安全清理，跳过');
      return;
    }

    // console.log('执行安全清理（保护认证信息）');
    
    try {
      // 使用分步清理替代原有逻辑
      await this.steppedCleanup();
      // console.log('安全清理完成');
    } catch (error) {
      console.error('安全清理失败:', error);
      // 降级到简化清理
      await this.fallbackCleanup();
    }
  }

  /**
   * 降级清理方法（当分步清理失败时使用）
   */
  private async fallbackCleanup(): Promise<void> {
    // console.log('使用降级清理方法');
    
    // 只清理明确标记为临时或缓存的数据
    const tempKeys = Object.keys(localStorage).filter(key => 
      (key.startsWith('temp-') || key.startsWith('cache-') || key.startsWith('drag-')) &&
      !this.PRESERVE_KEYS.includes(key)
    );
    
    // 简化处理：一次性清理，但限制数量
    const keysToClean = tempKeys.slice(0, 100); // 限制每次最多清理100个
    
    keysToClean.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        // 忽略错误
      }
    });
    
    // console.log(`降级清理完成，清理了 ${keysToClean.length} 个键`);
  }

  // 其他方法保持不变...
  private cleanupMemoryCache(): void {
    this.clearImageCache();
    this.clearFontCache();
    this.clearScriptCache();
    this.clearCSSCache();
  }

  private clearImageCache(): void {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!this.isElementInViewport(img)) {
        img.src = '';
        img.removeAttribute('src');
      }
    });
    
    const canvases = document.querySelectorAll('canvas');
    canvases.forEach(canvas => {
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    });
  }

  private clearFontCache(): void {
    try {
      if ('fonts' in document) {
        (document as any).fonts.clear();
      }
    } catch (error) {
      console.warn('字体缓存清理失败:', error);
    }
  }

  private clearScriptCache(): void {
    const scripts = document.querySelectorAll('script[data-temp="true"]');
    scripts.forEach(script => script.remove());
  }

  private clearCSSCache(): void {
    const styles = document.querySelectorAll('style[data-temp="true"]');
    styles.forEach(style => style.remove());
  }

  private cleanupSessionStorage(): void {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('temp-') || key.startsWith('page-')) {
        sessionStorage.removeItem(key);
      }
    });
  }

  private async cleanupIndexedDB(): Promise<void> {
    if (!window.indexedDB) return;
    
    try {
      const databases = await (window as any).indexedDB.databases();
      for (const db of databases) {
        if (db.name.includes('temp-') || db.name.includes('cache-')) {
          await this.deleteDatabase(db.name);
        }
      }
    } catch (error) {
      console.warn('IndexedDB清理失败:', error);
    }
  }

  private deleteDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async cleanupServiceWorkerCache(): Promise<void> {
    if (!navigator.serviceWorker) return;
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        if (registration.active) {
          const keys = await caches.keys();
          for (const key of keys) {
            if (key.includes('temp-') || key.includes('cache-')) {
              await caches.delete(key);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Service Worker缓存清理失败:', error);
    }
  }

  forceGarbageCollection(): void {
    if (window.gc) {
      window.gc();
    } else {
      try {
        const arr = [];
        for (let i = 0; i < 1000000; i++) {
          arr.push(new Array(1000));
        }
        arr.length = 0;
      } catch (error) {
        // 忽略错误
      }
    }
  }

  private isCacheExpired(key: string): boolean {
    try {
      const data = localStorage.getItem(key);
      if (!data) return true;
      
      const parsed = JSON.parse(data);
      if (parsed && parsed.expireTime) {
        return Date.now() > parsed.expireTime;
      }
    } catch (error) {
      return true;
    }
    return false;
  }

  private isElementInViewport(el: Element): boolean {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  private cleanupBeforeUnload(): void {
    // 检查是否是页面刷新
    if (this.isPageRefreshing()) {
      // console.log('页面刷新中，跳过卸载前清理');
      return;
    }

    // console.log('页面关闭，清理临时数据');
    this.cleanupSessionStorage();
    
    Object.keys(localStorage)
      .filter(key => key.startsWith('temp-') || key.startsWith('drag-'))
      .forEach(key => localStorage.removeItem(key));
  }

  async getCacheStats(): Promise<CacheStats> {
    let memoryUsed = 0;
    if ('memory' in performance) {
      memoryUsed = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
    }
    
    let localStorageSize = 0;
    Object.keys(localStorage).forEach(key => {
      const data = localStorage.getItem(key);
      if (data) localStorageSize += new Blob([data]).size;
    });
    localStorageSize = Math.round(localStorageSize / 1024);
    
    let sessionStorageSize = 0;
    Object.keys(sessionStorage).forEach(key => {
      const data = sessionStorage.getItem(key);
      if (data) sessionStorageSize += new Blob([data]).size;
    });
    sessionStorageSize = Math.round(sessionStorageSize / 1024);
    
    return {
      memoryUsed,
      localStorageSize,
      sessionStorageSize,
      indexedDBSize: 0,
      cacheCount: Object.keys(localStorage).length + Object.keys(sessionStorage).length,
      lastCleanup: new Date()
    };
  }

  setCache(key: string, data: any, expireMinutes: number = 60): void {
    const cacheData = {
      data,
      expireTime: Date.now() + expireMinutes * 60 * 1000,
      created: Date.now()
    };
    
    try {
      // localStorage.setItem(`cache-${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('缓存设置失败，可能已满:', error);
      this.safeCleanup();
      // localStorage.setItem(`cache-${key}`, JSON.stringify(cacheData));
    }
  }

  getCache<T = any>(key: string): T | null {
    try {
      const data = localStorage.getItem(`cache-${key}`);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      if (parsed.expireTime && Date.now() > parsed.expireTime) {
        localStorage.removeItem(`cache-${key}`);
        return null;
      }
      
      return parsed.data;
    } catch (error) {
      return null;
    }
  }

  removeCache(key: string): void {
    localStorage.removeItem(`cache-${key}`);
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.stopMonitoring();
    if (this.config.enableMonitoring) {
      this.startMonitoring();
    }
  }

  destroy(): void {
    this.stopMonitoring();
  }
}

// 创建全局实例
export const cacheControl = new BrowserCacheControl();

export default BrowserCacheControl;