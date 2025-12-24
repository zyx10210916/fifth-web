import viteCompression from 'vite-plugin-compression';
export const ConfigCompressPlugin = () => {
    return viteCompression({
        verbose: true,
        disable: false,
        deleteOriginFile: false,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz',
    });
};
//# sourceMappingURL=compress.js.map