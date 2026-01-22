import axios from 'axios';
import { showMessage } from './status';
import { getToken } from '@/utils/auth';
const service = axios.create({
    baseURL: import.meta.env.VITE_APP_API_BASEURL,
    timeout: 60000,
});
service.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});
service.interceptors.response.use((response) => {
    if (response.status === 200) {
        return response;
    }
    showMessage(response.status);
    return response;
}, (error) => {
    const { response } = error;
    if (response) {
        showMessage(response.status);
        return Promise.reject(response.data);
    }
    showMessage('网络连接异常,请稍后再试!');
});
const request = (config) => {
    const conf = config;
    return new Promise((resolve) => {
        service.request(conf).then((res) => {
            const { data: { result }, } = res;
            resolve(result ? result : res.data);
        });
    });
};
export function get(config) {
    return request({ ...config, method: 'GET' });
}
export function post(config) {
    return request({ ...config, method: 'POST' });
}
export function put(config) {
    return request({ ...config, method: 'put' });
}
export function del(config) {
    return request({ ...config, method: 'delete' });
}
export default request;
//# sourceMappingURL=index.js.map