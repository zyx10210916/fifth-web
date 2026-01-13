export default [
  {
    path: '/',
    redirect: '/home',
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
      {
        path: 'data-display',
        name: 'DataDisplayPage',
        meta: { title: '数据展示' },
        component: () => import('@/views/home/data-display/index.vue'),
      },
      {
        path: 'thematic-display',
        name: 'ThematicDisplayPage',
        meta: { title: '专题展示' },
        component: () => import('@/views/home/Thematic-Display/index.vue'),
      },
    ],
  },
    {
    path: '/heatmap-view',
    name: 'HeatmapViewPage',
    meta: { 
      title: '热力图展示',
      fullScreen: true 
    },
    component: () => import('@/views/home/data-display/unit-heatmap/HeatmapView.vue'),
  }
];