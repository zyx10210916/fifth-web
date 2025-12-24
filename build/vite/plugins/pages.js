import VueRouter from 'unplugin-vue-router/vite';
export const ConfigPagesPlugin = () => {
    return VueRouter({
        routesFolder: ['src/views'],
        dts: 'types/typed-router.d.ts',
        extensions: ['.page.vue', '.vue', '.md'],
    });
};
//# sourceMappingURL=pages.js.map