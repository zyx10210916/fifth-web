import { defineStore } from 'pinia';
import { login as userLogin, logout as userLogout, getUserProfile } from '@/api/user/index';
import { setToken, clearToken } from '@/utils/auth';
export const useUserStore = defineStore('user', {
    state: () => ({
        user_name: undefined,
        avatar: undefined,
        organization: undefined,
        location: undefined,
        email: undefined,
        blogJuejin: undefined,
        blogZhihu: undefined,
        blogGithub: undefined,
        profileBio: undefined,
        devLanguages: undefined,
        role: '',
    }),
    getters: {
        userProfile(state) {
            return { ...state };
        },
    },
    actions: {
        switchRoles() {
            return new Promise((resolve) => {
                this.role = this.role === 'user' ? 'user' : 'admin';
                resolve(this.role);
            });
        },
        setInfo(partial) {
            this.$patch(partial);
        },
        resetInfo() {
            this.$reset();
        },
        async info() {
            const result = await getUserProfile();
            this.setInfo(result);
        },
        async login(loginForm) {
            const result = await userLogin(loginForm);
            const token = result?.token;
            if (token) {
                setToken(token);
            }
            return result;
        },
        async logout() {
            await userLogout();
            this.resetInfo();
            clearToken();
        },
    },
});
//# sourceMappingURL=index.js.map