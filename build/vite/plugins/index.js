import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import vueSetupExtend from 'vite-plugin-vue-setup-extend';
import { ConfigSvgIconsPlugin } from './svgIcons';
import { AutoRegistryComponents } from './component';
import { AutoImportDeps } from './autoImport';
import { ConfigMockPlugin } from './mock';
import { ConfigVisualizerConfig } from './visualizer';
import { ConfigCompressPlugin } from './compress';
import { ConfigPagesPlugin } from './pages';
import { ConfigRestartPlugin } from './restart';
import { ConfigProgressPlugin } from './progress';
import { ConfigImageminPlugin } from './imagemin';
import { ConfigUnocssPlugin } from './unocss';
export function createVitePlugins(viteEnv, isBuild) {
    const { VITE_USE_MOCK, VITE_USE_COMPRESS } = viteEnv;
    const vitePlugins = [
        ConfigPagesPlugin(),
        vue(),
        vueJsx(),
        vueSetupExtend(),
    ];
    vitePlugins.push(AutoRegistryComponents());
    vitePlugins.push(AutoImportDeps());
    vitePlugins.push(ConfigRestartPlugin());
    vitePlugins.push(ConfigProgressPlugin());
    vitePlugins.push(ConfigUnocssPlugin());
    vitePlugins.push(ConfigSvgIconsPlugin(isBuild));
    VITE_USE_MOCK && vitePlugins.push(ConfigMockPlugin(isBuild));
    vitePlugins.push(ConfigVisualizerConfig());
    if (isBuild) {
        vitePlugins.push(ConfigImageminPlugin());
        VITE_USE_COMPRESS && vitePlugins.push(ConfigCompressPlugin());
    }
    return vitePlugins;
}
//# sourceMappingURL=index.js.map