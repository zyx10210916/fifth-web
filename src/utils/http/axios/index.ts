import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { showMessage } from './status';
import { IResponse } from './type';
import { getToken } from '@/utils/auth';

const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASEURL,
  timeout: 10000,
});

// axios实例拦截请求
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// axios实例拦截响应
service.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.status === 200) {
      return response;
    }
    showMessage(response.status);
    return response;
  },
  // 请求失败
  (error: any) => {
    const { response } = error;
    if (response) {
        if (response.status === 401) {
            localStorage.removeItem('Authorization');
            window.location.href = '/#/login';
            return Promise.reject(response.data);
        }
      // 请求已发出，但是不在2xx的范围
      showMessage(response.status);
      return Promise.reject(response.data);
    }
    showMessage('网络连接异常,请稍后再试!');
  },
);

const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
  const conf = config;
  return new Promise((resolve, reject) => {
    service.request<any, AxiosResponse<IResponse>>(conf)
      .then((res: AxiosResponse<IResponse>) => {
        // 安全的可选链访问
        const result = res?.data?.result;
        const responseData = res?.data;
        
        if (!res || !responseData) {
          reject(new Error('接口响应数据异常'));
          console.log('error:', res.data)
          return;
        }
        
        resolve(result ? result : (responseData as T));
      })
      .catch((error) => {
        console.error('API请求失败:', error);
        reject(error);
      });
  });
};
export function get<T = any>(config: AxiosRequestConfig): Promise<T> {
  return request({ ...config, method: 'GET' });
}

export function post<T = any>(config: AxiosRequestConfig): Promise<T> {
  return request({ ...config, method: 'POST' });
}

export function put<T = any>(config: AxiosRequestConfig): Promise<T> {
  return request({ ...config, method: 'PUT' });
}

export function del<T = any>(config: AxiosRequestConfig): Promise<T> {
  return request({ ...config, method: 'DELETE' });
}

export default request;
