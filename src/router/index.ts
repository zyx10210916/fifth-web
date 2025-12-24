import { createRouter, createWebHashHistory } from 'vue-router';
// import { routes } from 'vue-router/auto-routes';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { isLogin } from '@/utils/auth'; // 导入登录检查函数
import CustomRoute from './root';

const baseURL = import.meta.env.VITE_BASE_URL ?? '';
console.log(baseURL);
//导入生成的路由数据
const router = createRouter({
  history: createWebHashHistory(baseURL),
  routes: [...CustomRoute],
});

router.beforeEach(async (to, _from, next) => {
NProgress.start();

// 检查用户是否已登录
const loggedIn = isLogin();

// 如果用户未登录，且访问的不是登录页面，则重定向到登录页面
if (!loggedIn && to.path !== '/login') {
  next('/login');
}
// 如果用户已登录，且访问的是登录页面，则重定向到首页
else if (loggedIn && to.path === '/login') {
  next('/');
}
// 其他情况允许访问
else {
next();
}
});

router.afterEach((_to) => {
  NProgress.done();
});

export default router;
