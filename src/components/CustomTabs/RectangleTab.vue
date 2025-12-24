<!--
 * @文件路径: \fifth-web\src\components\CustomTabs\RectangleTab.vue
 * @作者名称: shenjiamin
 * @创建日期: 2025-08-31 22:53:11
 * @简要说明: 
 * @编辑时间: 2025-09-01 01:01:00
 * Copyright (c) 2025 by shenjiamin, All Rights Reserved.
-->
<template>
  <div class="data-list">
    <div
      :class="['item', className, { clickable: clickable ? 'clickable' : '', clicked: clickedItem?.key === item.key }]"
      v-for="(item, index) in list"
      :key="item.key"
      @click="handleItemClick(item, index)"
    >
      <div class="info-box">
        <component :is="item.icon" :style="{ fontSize: item.iconFont + 'rem' }" />
        {{ item.title }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="DataOverview">
  import { ref } from 'vue';

  interface ListItem {
    title: string;
    icon: string;
    iconFont: number;
    key?: string;
  }

  interface Props {
    list: ListItem[];
    className?: string;
    clickable?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    list: () => [] as ListItem[],
    clickable: false,
  });

  const emit = defineEmits(['click:item', 'reset:items']);

  const clickedItem = ref<any>(null);

  /**
   * @desc: item点击处理
   * @param item
   * @param index
   * @return {*}
   */
  const handleItemClick = async (item: any, index: number) => {
    if (!props.clickable) return;
    // clickedItem.value = clickedItem.value === item ? null : item
    // emit('click:item', item, index)

    // 仅当点击不同项时才更新状态
    if (clickedItem.value?.key !== item.key) {
      clickedItem.value = item;
    }
    emit('click:item', item, index);
  };

  /**
   * @desc: 重置
   * @return {*}
   */
  const resetItems = () => {
    clickedItem.value = null;
  };
  defineExpose({ resetItems });
</script>

<style scoped lang="scss">
  .data-list {
    display: flex;
    gap: 10px;

    /* 单个数据项 */
    .item {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 15px 10px;
      box-sizing: border-box;
      height: 24px;
      background: rgba(55, 55, 55, 1);
      color: white;
      font-size: 1.6rem;
      border-radius: 4px;
      // transition: background-color 0.3s;

      .info-box {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        color: white;
        z-index: 3;
      }

      &.clickable:hover {
        cursor: pointer;

        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 24px;
          border-radius: 4px;
          background: rgba(84, 111, 255, 1);
          border-radius: 4px;
        }
      }

      // &.clicked {
      //   &::after {
      //     content: '';
      //     position: absolute;
      //     top: 50%;
      //     left: 50%;
      //     transform: translate(-50%, -50%);
      //     width: 100%;
      //     height: 24px;
      //     background: rgba(84, 111, 255, 1);
      //     border-radius: 4px;
      //     transition: background-color 0.3s;
      //     z-index: 2;
      //   }

      //   &:hover {
      //     cursor: pointer;

      //     &::after {
      //       content: '';
      //       position: absolute;
      //       top: 50%;
      //       left: 50%;
      //       transform: translate(-50%, -50%);
      //       width: 100%;
      //       height: 24px;
      //       background: rgba(84, 111, 255, 1);
      //       border-radius: 4px;
      //       transition: background-color 0.3s;
      //       z-index: 2;
      //     }
      //   }
      // }
    }
  }
</style>
