import { viteMockServe } from 'vite-plugin-mock';
export const ConfigMockPlugin = (isBuild) => {
    return viteMockServe({
        ignore: /^\/_/,
        mockPath: 'mock',
        enable: !isBuild,
    });
};
//# sourceMappingURL=mock.js.map