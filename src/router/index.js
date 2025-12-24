import { createRouter, createWebHashHistory } from 'vue-router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { isLogin } from '@/utils/auth';
import CustomRoute from './root';
const baseURL = import.meta.env.VITE_BASE_URL ?? '';
console.log(baseURL);
const router = createRouter({
    history: createWebHashHistory(baseURL),
    routes: [...CustomRoute],
});
router.beforeEach(async (to, _from, next) => {
    NProgress.start();
    const loggedIn = isLogin();
    if (!loggedIn && to.path !== '/login') {
        next('/login');
    }
    else if (loggedIn && to.path === '/login') {
        next('/');
    }
    else {
        next();
    }
});
router.afterEach((_to) => {
    NProgress.done();
});
export default router;
//# sourceMappingURL=index.js.map