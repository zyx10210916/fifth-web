import { loadEnv } from 'vite';
import { createVitePlugins } from './build/vite/plugins';
import { fileURLToPath, URL } from 'node:url';
import proxy from './build/vite/proxy';
import { wrapperEnv } from './build/utils';
export default ({ command, mode }) => {
    const isBuild = command === 'build';
    const root = process.cwd();
    const env = loadEnv(mode, root);
    const viteEnv = wrapperEnv(env);
    return {
        base: process.env.VITE_BASE_URL,
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
                '#': fileURLToPath(new URL('./types', import.meta.url)),
            },
            extensions: ['.ts', '.js', '.mjs', '.mts'],
        },
        plugins: createVitePlugins(viteEnv, isBuild),
        css: {},
        server: {
            hmr: { overlay: false },
            port: 3000,
            open: false,
            cors: false,
            host: '127.0.0.1',
            proxy,
        },

    };
};
//# sourceMappingURL=vite.config.mjs.map
