import { API_BASE_URL, API_TARGET_URL, MOCK_API_BASE_URL, MOCK_API_TARGET_URL } from '../constant';
import { ProxyOptions } from 'vite';

type ProxyTargetList = Record<string, ProxyOptions>;

const init: ProxyTargetList = {
  // test
  [API_BASE_URL]: {
    target: API_TARGET_URL,
    changeOrigin: true,
    rewrite: (path) => path.replace(new RegExp(`^${API_BASE_URL}`), ''),
  },
  // mock
  [MOCK_API_BASE_URL]: {
    target: MOCK_API_TARGET_URL,
    changeOrigin: true,
    rewrite: (path) => path.replace(new RegExp(`^${MOCK_API_BASE_URL}`), '/api'),
  },

  // 开发环境 Geoserver 
  '/geoserver-proxy': {
    target: 'http://192.168.10.123:8089', 
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/geoserver-proxy/, '/geoserver'),
  },
  // 开发环境高性能接口地址
  '/hp-proxy': {
    target: 'http://192.168.3.90:8899',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/hp-proxy/, ''),
  },
};

export default init;
