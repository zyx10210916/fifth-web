import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver, VueUseComponentsResolver, AntDesignVueResolver, TDesignResolver, NaiveUiResolver, DevUiResolver, IduxResolver, } from 'unplugin-vue-components/resolvers';
export const AutoRegistryComponents = () => {
    return Components({
        dirs: ['src/components'],
        extensions: ['vue', 'md'],
        deep: true,
        dts: 'types/components.d.ts',
        directoryAsNamespace: false,
        globalNamespaces: [],
        directives: true,
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        exclude: [/[\\/]node_modules[\\/]/, /[\\/]\.git[\\/]/, /[\\/]\.nuxt[\\/]/],
        resolvers: [
            ElementPlusResolver(),
            VueUseComponentsResolver(),
            AntDesignVueResolver({ resolveIcons: true, importStyle: false }),
            TDesignResolver({
                library: 'vue-next',
            }),
            NaiveUiResolver(),
            DevUiResolver({ importStyle: true }),
            IduxResolver({ importStyle: 'css', importStyleTheme: 'default' }),
        ],
    });
};
//# sourceMappingURL=component.js.map