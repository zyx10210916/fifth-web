<template>
  <div class="main-content-layout">
    <LeftPanel />
    <MiddleMap />
    <RightPanel />
  </div>
</template>

<script setup lang="ts">
import LeftPanel from './left-stats/index.vue';
import MiddleMap from './middle-map/index.vue';
import RightPanel from './right-stats/index.vue';

// 未来：这里是放置主要数据获取 (API Calls) 和全局筛选状态管理的地方
// 获取到的数据将通过 props 传递给 LeftPanel 和 RightPanel
</script>

<style scoped>
/* --- 主内容布局样式：三栏 Flexbox --- */
.main-content-layout {
  display: flex;
  height: 100%; 
  gap: 10px;
  padding: 0;
  overflow: hidden; 
}
</style>