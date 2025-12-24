<template>
  <header class="header-container">
    <div class="transparent-header">
      <div class="header-wrapper">
        <div class="px-4 py-4 border-b border-slate-900/10 lg:px-8 lg:border-0">
          <div class="relative flex items-center text-2xl sm:text-2xl font-blimone">
            <router-link to="/" style="color:rgba(84, 111, 255, 1);font-size: 30px">首页·</router-link>
            <div class="relative items-center hidden ml-auto lg:flex">
              <nav class="text-sm font-semibold leading-6 text-slate-700 dark:text-slate-200">
                <ul class="flex space-x-8 tag">
                  <li class="flex items-center justify-center">
                    <a href="/" class="block hover:text-sky-500 dark:hover:text-sky-400">
                      <img src="@/assets/images/sousuo.png" alt="搜索" class="h-8 w-auto" style="width: 42px;height: 42px"/>
                    </a>
                  </li>

                  <li class="flex items-center justify-center">
                    <a href="/" class="block hover:text-sky-500 dark:hover:text-sky-400">
                      <img src="@/assets/images/tiaozhuan.png" alt="数据跳转" class="h-8 w-auto" style="width: 42px;height: 42px"/>
                    </a>
                  </li>

                  <li class="flex items-center justify-center">
                    <a href="/" class="block hover:text-sky-500 dark:hover:text-sky-400">
                      <img src="@/assets/images/huiz.png" alt="数据汇总" class="h-8 w-auto" style="width: 42px;height: 42px"/>
                    </a>
                  </li>
                  <li>
                    <a-space :size="16">

                      <a-dropdown>
                <span class="user-info">
                  <UserOutlined style="font-size: 1.4rem; color: white" />
                  <span style="margin: 10px; font-size: 14px; color: white"
                  >未登录</span
                  >
                </span>
                      </a-dropdown>
                    </a-space>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import SvgIcon from '../SvgIcon/index.vue';
// import { ref } from 'vue'
import { useDark, useToggle } from '@vueuse/core';
import { useAppStore } from '@/store';
import { Sunny, Moon } from '@element-plus/icons-vue';

const appStore = useAppStore();
// const useStore = useUserStore()
const theme = computed(() => {
  return appStore.theme;
});
const isDark = useDark({
  selector: 'body',
  onChanged(dark: boolean) {
    appStore.toggleTheme(dark);
  },
});
const toggleTheme = useToggle(isDark);
</script>

<style lang="less" scoped>
/* 透明背景相关样式 */
.header-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
}

.transparent-header {
  width: 100%;
  background-color: transparent !important;
  backdrop-filter: none;
  border-bottom: none;
  transition: all 0.3s ease;
}
.header-wrapper {
  width: 100%;
  padding: 0;
}


.tag {
  margin-bottom: 0;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.user-info {
  border-radius: 2rem;
  padding: 1rem;
  cursor: pointer;
  height: 3.2rem;
  width: auto;
  display: flex;
  align-items: center;
  background-color: #546fff;

  .anticon {
    font-size: 2rem;
  }

  span {
    margin-left: 0.8rem;
    font-size: 1.4rem;

    span {
      margin-left: 0.8rem;
      font-size: 1.4rem;
      font-weight: normal;
    }
  }

  &:hover {
    opacity: 0.8;
  }
}
</style>
