/**
 * @name createVitePlugins
 * @description 封装plugins数组统一调用
 */
import { PluginOption } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import vueSetupExtend from 'vite-plugin-vue-setup-extend';
import { VitePWA } from 'vite-plugin-pwa';   // ① 引入
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

export function createVitePlugins(viteEnv: ViteEnv, isBuild: boolean) {
  const { VITE_USE_MOCK, VITE_USE_COMPRESS } = viteEnv;

  const vitePlugins: (PluginOption | PluginOption[])[] = [
    ConfigPagesPlugin(),
    vue(),
    vueJsx(),
    vueSetupExtend(),
  ];

  vitePlugins.push(
      AutoRegistryComponents(),
      AutoImportDeps(),
      ConfigRestartPlugin(),
      ConfigProgressPlugin(),
      ConfigUnocssPlugin(),
      ConfigSvgIconsPlugin(isBuild),
      ConfigVisualizerConfig(),
      // ② PWA 插件：放在这即可
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          navigateFallback: 'index.html',
          navigateFallbackDenylist: [/^\/api/],
        },
        manifest: {
          name: 'Your App',
          short_name: 'App',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#000000',
          icons: []
        }
      })
  );

  VITE_USE_MOCK && vitePlugins.push(ConfigMockPlugin(isBuild));

  if (isBuild) {
    vitePlugins.push(ConfigImageminPlugin());
    VITE_USE_COMPRESS && vitePlugins.push(ConfigCompressPlugin());
  }

  return vitePlugins;
}