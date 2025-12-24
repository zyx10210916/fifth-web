// src/main.ts
import App from './App.vue';
import { createApp } from 'vue';
import type { App as AppType } from 'vue';
import router from './router';
import piniaStore from './store';

import '@/styles/reset.less';
import '@/styles/index.less';
import 'virtual:uno.css';
import '@arco-design/web-vue/dist/arco.css';
import 'vue-devui/style.css';
import '@devui-design/icons/icomoon/devui-icon.css';
import 'virtual:svg-icons-register';
import { ThemeServiceInit, devuiDarkTheme } from 'devui-theme';

// ========== 常量 & 类型 ==========
const CACHE_ISSUE_KEY = 'cache_issue_detected';
const PROBLEMATIC_KEYS = ['vuex', 'pinia', 'router', 'theme', 'user_cache', 'app_cache', 'layout_cache'] as const;
const STORAGE_PREFIXES = ['temp_', 'cache_'] as const;
const CACHE_PATTERNS = ['dev', 'temp', 'old'] as const;
interface CacheData { expiry?: number; }

// ========== 工具类 ==========
class AppOptimizer {
  // 获取导航类型
  private static getNavigationType(): 'reload' | 'navigation' | 'back_forward' | undefined {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return entry?.type;
  }

  // 安全执行
  private static safeExecute<T>(fn: () => T, fallback: T, errorMsg?: string): T {
    try { return fn(); } catch (e) { console.warn(errorMsg || '执行失败:', e); return fallback; }
  }

  // 清理问题键值
  private static clearSpecificCache(): void {
    PROBLEMATIC_KEYS.forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
    Object.keys(localStorage).forEach(k => {
      if (k.includes('style') || k.includes('theme') || k.includes('css')) localStorage.removeItem(k);
    });
  }

  // 清理过期存储
  private static clearExpiredStorage(): void {
    const now = Date.now();
    Object.keys(localStorage).forEach(k => {
      if (STORAGE_PREFIXES.some(p => k.startsWith(p))) {
        try {
          const data: CacheData = JSON.parse(localStorage.getItem(k) || '{}');
          if (data.expiry && data.expiry < now) localStorage.removeItem(k);
        } catch {}
      }
    });
  }

  // 清理 SW 缓存
  private static async clearServiceWorkerCache(): Promise<void> {
    if (!('caches' in window)) return;
    const keys = await caches.keys();
    await Promise.allSettled(keys.filter(k => CACHE_PATTERNS.some(p => k.includes(p))).map(k => caches.delete(k)));
  }

  // 确保容器
  private static ensureAppContainer(): HTMLDivElement {
    return this.safeExecute(() => {
      let el = document.getElementById('app') as HTMLDivElement;
      if (!el) { el = document.createElement('div'); el.id = 'app'; document.body.appendChild(el); }
      return el;
    }, document.body.appendChild(document.createElement('div')));
  }

  // 主修复函数
  static async autoFixBlankPage(): Promise<void> {
    await Promise.allSettled([
      this.clearServiceWorkerCache(),
      this.safeExecute(async () => {
        if (this.getNavigationType() === 'reload') this.clearSpecificCache();
        if (sessionStorage.getItem(CACHE_ISSUE_KEY) === 'true') {
          this.clearSpecificCache(); sessionStorage.removeItem(CACHE_ISSUE_KEY);
        }
        this.ensureAppContainer(); this.clearExpiredStorage();
      }, undefined, '自动修复失败')
    ]);
  }
}

// ========== 错误处理 ==========
class ErrorHandler {
  private static retry = 0;
  private static readonly MAX = 3;
  static setupGlobalErrorHandling(): void {
    window.addEventListener('error', e => {
      if (e.target instanceof HTMLLinkElement) sessionStorage.setItem(CACHE_ISSUE_KEY, 'true');
    }, true);
    window.addEventListener('unhandledrejection', e => {
      if (e.reason?.name === 'ChunkLoadError' && this.retry < this.MAX) {
        this.retry++; setTimeout(() => location.reload(), 1000 * this.retry);
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const el = document.getElementById('app');
        if (el && el.children.length === 0) { sessionStorage.setItem(CACHE_ISSUE_KEY, 'true'); location.reload(); }
      }
    });
  }
  static createVueErrorHandler() {
    return (err: unknown, instance: unknown, info: string) => {
      console.error('Vue:', err, info);
      if (err instanceof Error && err.message.includes('chunk')) sessionStorage.setItem(CACHE_ISSUE_KEY, 'true');
    };
  }
}

// ========== 初始化 ==========
class AppInitializer {
  private static initTheme() {
    try { ThemeServiceInit({ devuiDarkTheme }, 'infinityTheme')?.applyTheme(devuiDarkTheme); } catch {}
  }
  private static safeMount(app: AppType) {
    const doMount = () => {
      try { AppOptimizer.ensureAppContainer(); app.mount('#app'); } catch (e) {
        console.error('挂载失败', e);
        setTimeout(() => { app.mount('#app'); }, 100);
      }
    };
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', doMount) : doMount();
  }
  private static createApp() {
    const app = createApp(App);
    app.config.errorHandler = ErrorHandler.createVueErrorHandler();
    app.use(router).use(piniaStore);
    return app;
  }
  static async initialize(): Promise<AppType> {
    await AppOptimizer.autoFixBlankPage();
    ErrorHandler.setupGlobalErrorHandling();
    this.initTheme();
    const app = this.createApp();
    this.safeMount(app);
    return app;
  }
}

// ========== 启动 ==========
AppInitializer.initialize().catch(e => {
  console.error('初始化严重错误', e);
  createApp({ template: '<div>加载失败，请刷新</div>' }).mount('#app');
});