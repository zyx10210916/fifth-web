/*
 * @文件路径: \fifth-web\src\views\home\data-processing\quick-summary\content-module\useFilterHooks.ts
 * @作者名称: shenjiamin
 * @创建日期: 2025-08-29 23:47:21
 * @简要说明: 搜索树
 * @编辑时间: 2025-08-29 23:57:34
 * Copyright (c) 2025 by shenjiamin, All Rights Reserved.
 */
import { ref, computed } from 'vue';
import type { TreeProps } from 'ant-design-vue';
import type { Ref } from 'vue';

interface LayerTree {
  title: string;
  key: string;
  children?: LayerTree[];
}
export const useFilterHooks = (treeData: Ref<LayerTree[]>) => {
  const searchValue = ref<string>('');

  const processedSearchValue = computed(() => {
    return searchValue.value.replace(/\s/g, '');
  });

  const filteredTreeData = computed(() => {
    return treeData.value.map((group) => {
      return {
        ...group,
        children: filterTreeData(group.children, processedSearchValue.value),
      };
    });
  });

  const filterTreeData = (data: TreeProps['treeData'], value: string): TreeProps['treeData'] => {
    if (!data) return;

    return data
      .map((node) => {
        if (node.title?.includes(value)) {
          return {
            ...node,
          };
        }

        if (node.children) {
          const filteredChildren = filterTreeData(node.children, value);
          if (filteredChildren && filteredChildren.length > 0) {
            return {
              ...node,
              children: filteredChildren,
            };
          }
        }

        return undefined;
      })
      .filter(Boolean) as TreeProps['treeData'];
  };

  return { searchValue, processedSearchValue, filteredTreeData };
};
