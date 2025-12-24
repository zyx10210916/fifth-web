// 权限问题后期添加
import { get, post } from '@/utils/http/axios';
import { UserState } from '@/store/modules/user/types';
// import axios from 'axios';
enum URL {
  login = '/user/login',
  logout = '/user/logout',
  profile = '/api/api-user/user/org/osUser/getLoginUserAndMenu',
  token = '/api/api-uaa/oauth/user/token',
}
interface LoginRes {
  token: string;
}

export interface LoginData {
  username: string;
  password: string;
}
// 用户信息响应接口
export interface UserProfileRes {
  user: {
    userId: string;
    account: string;
    fullName: string;
    admin: boolean;
  };
  menus: any[];
  allMenuButtons: any;
}

const getUserProfile = async () => get<UserProfileRes>({
  url: URL.profile,
  headers: {
    'needToken_': 'true'
  }
} as any);


const login = async (data: LoginData) => post<any>({ url: URL.login, data });
const logout = async () => post<LoginRes>({ url: URL.logout });
const getToken = async (data: { username: string; password: string;  }) => {
  return post<{ token: string }>({
    url: URL.token,
    data,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'needToken_': 'false'
    }
  });
};
export { getUserProfile, logout, login, getToken };
