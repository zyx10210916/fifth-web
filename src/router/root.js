export default [
    {
        path: '/',
        redirect: '/login',
    },
    {
        path: '/login',
        name: 'login',
        meta: {
            title: '登录',
        },
        component: () => import('@/views/login/index.vue'),
    },
    {
        path: '/home',
        name: 'HomePage',
        meta: {
            title: '主页面',
        },
        redirect: '/home/data-processing',
        component: () => import('@/views/home/index.vue'),
        children: [
            {
                path: 'data-processing',
                name: 'DataProcessingPage',
                meta: { title: '数据处理' },
                component: () => import('@/views/home/data-processing/index.vue'),
            },
        ],
    },
];
//# sourceMappingURL=root.js.map