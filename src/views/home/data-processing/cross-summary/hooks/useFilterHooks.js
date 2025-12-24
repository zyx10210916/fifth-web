import { ref, computed } from 'vue';
export const useFilterHooks = (treeData) => {
    const searchValue = ref('');
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
    const filterTreeData = (data, value) => {
        if (!data)
            return;
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
            .filter(Boolean);
    };
    return { searchValue, processedSearchValue, filteredTreeData };
};
//# sourceMappingURL=useFilterHooks.js.map