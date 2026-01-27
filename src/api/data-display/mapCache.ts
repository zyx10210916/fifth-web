import { MAP_CONFIG } from '@/config/mapConfig';
/**
 * 缓存加载函数
 * @param key 缓存键名
 * @param url 请求地址
 */
const cache: Record<string, any> = {};
const load = async (key: string, url: string) => {
    if (cache[key]) return cache[key];
    
    const res = await fetch(url);
    const data = await res.json();
    cache[key] = data; // 将请求结果存入内存
    return data;
};

/**
 * 导出获取方法，供各图层组件调用
 */
// 获取建筑点数据
export const getBuilding = () => load('building', MAP_CONFIG.economic.building.url);

// 获取房屋面数据
export const getHouse = () => load('house', MAP_CONFIG.economic.house.url);

// 获取热力图数据
export const getHeatmap = () => load('heatmap', MAP_CONFIG.economic.heatmap.url);