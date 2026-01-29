import { defineStore } from 'pinia';
import { 
  login as userLogin, 
  logout as userLogout, 
  getUserProfile, 
  getToken as refreshTokenApi,
  LoginData 
} from '@/api/user/index';
import { setToken, setRefreshToken, getRefreshToken, clearToken } from '@/utils/auth';
import { UserState } from './types';

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
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
    userProfile(state: UserState): UserState {
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
    // 设置用户的信息
    setInfo(partial: Partial<UserState>) {
      this.$patch(partial);
    },
    // 重置用户信息
    resetInfo() {
      this.$reset();
    },
    // 获取用户信息
    async info() {
      const result = await getUserProfile();
      this.setInfo({
        user_name: result.user.fullName,
        role: result.user.admin ? 'admin' : 'user'
      });
    },

    // 登录
    async login(loginForm: LoginData) {
      const result: any = await refreshTokenApi({
        username: loginForm.username,
        password: loginForm.password,
        grant_type: 'password'
      } as any);

      const data = result?.data || result;
      if (data && data.access_token) {
        setToken(`Bearer ${data.access_token}`); // 存 access
        if (data.refresh_token) {
          setRefreshToken(data.refresh_token); // 存 refresh
        }
        return data;
      }
      throw new Error('登录失败');
    },

    // 刷新 Token
    async refreshTokenAction() {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error('Refresh token missing');

      const result: any = await refreshTokenApi({
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope:'all'
      } as any);

      const data = result?.data || result;
      if (data.access_token) setToken(`Bearer ${data.access_token}`);
      if (data.refresh_token) setRefreshToken(data.refresh_token);
    },

    // 登出
    async logout() {
        try {
          await userLogout();
        } finally {
          this.resetInfo();
          clearToken();
        }
      },
    },
  });