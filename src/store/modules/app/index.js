import { defineStore } from 'pinia';
import piniaStore from '@/store/index';
export const useAppStore = defineStore('app', {
    state: () => ({
        title: 'FastVue3, 一个快速开箱即用的Vue3+Vite模板',
        h1: 'Vue3 + Vite3.x + TypeScript + Pinia大厂开发必备',
        theme: '',
    }),
    getters: {},
    actions: {
        updateSettings(partial) {
            this.$patch(partial);
        },
        toggleTheme(dark) {
            if (dark) {
                this.theme = 'dark';
                document.documentElement.classList.add('dark');
            }
            else {
                this.theme = 'light';
                document.documentElement.classList.remove('dark');
            }
        },
    },
    persist: {
        storage: localStorage,
        pick: ['theme'],
    },
});
export function useAppOutsideStore() {
    return useAppStore(piniaStore);
}
//# sourceMappingURL=index.js.map