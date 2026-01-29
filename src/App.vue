<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Modal } from 'ant-design-vue';
import { useUserStore } from '@/store/modules/user';
import { getToken } from '@/utils/auth';

const userStore = useUserStore();
const router = useRouter();

// 计时器变量
let warnTimer: any = null;
let logoutTimer: any = null;

// 时间配置
const WAIT_TIME = 29 * 60 * 1000;
const COUNTDOWN_TIME = 1 * 60 * 1000;


const handleFinalLogout = async () => {
  if (!getToken()) return;

  try {
    Modal.destroyAll();
    await userStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('登出失败:', error);
    router.push('/login');
  }
};


const handleContinue = () => {
  if (logoutTimer) {
    clearTimeout(logoutTimer);
    logoutTimer = null;
  }
  // 销毁弹窗并重新开始计时
  Modal.destroyAll();
  resetTimer();
};


const showConfirmModal = () => {
  Modal.destroyAll();
  Modal.confirm({
    title: '系统提示',
    content: '您长时间未操作，将在1分钟后退出登录，是否继续？',
    okText: '继续使用',
    cancelText: '退出登录',
    onOk: () => {
      handleContinue();
    },
    onCancel: () => {
      handleFinalLogout();
    }
  });

  logoutTimer = setTimeout(handleFinalLogout, COUNTDOWN_TIME);
};


const resetTimer = () => {
  if (warnTimer) clearTimeout(warnTimer);
  if (logoutTimer) clearTimeout(logoutTimer);

  if (getToken()) {
    warnTimer = setTimeout(showConfirmModal, WAIT_TIME);
  }
};

const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

onMounted(() => {
  events.forEach(ev => window.addEventListener(ev, resetTimer));
  resetTimer();
});

onUnmounted(() => {
  if (warnTimer) clearTimeout(warnTimer);
  if (logoutTimer) clearTimeout(logoutTimer);
  Modal.destroyAll();
  events.forEach(ev => window.removeEventListener(ev, resetTimer));
});
</script>

<style>
html,
body {
  height: 100%;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: var(--color-bg-1);
  height: 100%;
}
</style>