import { post } from '@/utils/http/axios';
import { ref } from 'vue';
import { FILTER_MAP } from '@/views/home/data-display/filter-config';

// --- 【模式控制】 ---
// true: 高性能模式 
// false: 普通模式 
export const IS_HIGH_PERFORMANCE = ref(true);
const HIGH_PERFORMANCE_BASE = 'http://192.168.3.90:8899';// 高性能接口地址

// 定义接口地址
enum URL {
 // 原有接口 (普通模式)
  getGsSumDataDisplay = '/api/api-form/form/fifth/gs/getGsSumDataDisplay',
  getDataComparison = '/api/api-form/form/fifth/gs/getDataComparison',
  getBulletinList = '/api/api-form/form/fifth/gs/getBulletinList',
  getUnitHeatMap = '/api/api-form/form/fifth/gs/getUnitHeatMap',
  getUniqueCodeList = '/api/api-form/form/fifth/gs/getUniqueCodeList',
  
  // 高性能接口 (高性能模式)
  getWjpRecords = `${HIGH_PERFORMANCE_BASE}/gisngx/v1/wjp/gbk/recordsV2`,
  getWjpStatistics = `${HIGH_PERFORMANCE_BASE}/gisngx/v1/wjp/gbk/statisticV2`
}

// --- 基础请求封装 ---
export const getGsSumDataDisplay = (data: any) => post<any>({ url: URL.getGsSumDataDisplay, data, headers: { 'needToken_': 'true' } });
export const getDataComparison = (data: any) => post<any>({ url: URL.getDataComparison, data, headers: { 'needToken_': 'true' } });
export const getBulletinList = (data: any) => post<any>({ url: URL.getBulletinList, data, headers: { 'needToken_': 'true' } });
export const getUnitHeatMap = (data: any) => post<any>({ url: URL.getUnitHeatMap, data, headers: { 'needToken_': 'true' } });
export const getUniqueCodeList = (data: any) =>post<any>({ url: URL.getUniqueCodeList, data, headers: { 'needToken_': 'true' } });

// --- 高性能请求封装 ---
export const getWjpRecords = (data: any) => post<any>({ url: URL.getWjpRecords, data });
export const getWjpStatistics = (data: any) => post<any>({ url: URL.getWjpStatistics, data });

/**
 * 业务请求分发：根据模式选择接口和参数
 * @param wktParams 高性能模式参数
 * @param oldParams 普通模式参数
 * @param type 业务类型
 */
export const fetchBusinessData = async (wktParams: any, oldParams: any, type: 'sum' | 'list' | 'comparison') => {
  const hasWkt = wktParams && wktParams.wkt && wktParams.wkt !== "";

  if (IS_HIGH_PERFORMANCE.value && hasWkt) {
    const url = (type === 'sum' || type === 'comparison') ? URL.getWjpStatistics : URL.getWjpRecords;
    
    // 处理 industryDept 的单引号包裹问题 (如 B -> 'B')
    const deptValue = wktParams.industryDept || "";
    const formattedDept = deptValue 
      ? deptValue.split(',').map(v => `'${v.trim().replace(/'/g, "")}'`).join(',') 
      : "";

    // 处理 industryCategory 格式化 (如 F -> F 批发和零售业)
    const categoryValue = wktParams.industryCategory || "";
    let formattedCategory = "";
    if (categoryValue) {
      formattedCategory = categoryValue.split(',').map(val => {
        const code = val.trim();
        // 从 FILTER_MAP 中查找对应的中文名称
        const entry = Object.entries(FILTER_MAP.industryCategory).find(([_, c]) => c === code);
        return entry ? `'${entry[1]} ${entry[0]}'` : `'${code}'`;
      }).join(',');
    }

    const finalParams: any = {
      wkt: wktParams.wkt,
      area: "",
      industryCategory: formattedCategory, // 使用格式化后的 "F 批发和零售业"
      businessOperationType: wktParams.businessOperationType || "",
      holdingSituation: wktParams.holdingSituation || "",
      industryDept: formattedDept, // 使用包裹单引号后的 "'B'"
      registerType: wktParams.registerType || "",
      unitScale: wktParams.unitScale || "",
    };

    // 热力图清单分页参数
    if (type === 'list') {
      finalParams.page = wktParams.page || 1;
      finalParams.offset = wktParams.offset || 20;
    }

    const res = await post<any>({ url, data: finalParams });

    // 处理热力图高性能接口返回结构映射 (recordsV2)
    if (type === 'list' && res?.features) {
      const { features } = res;
      return {
        success: true,
        data: {
          total: features.total_count || 0,
          // 将 records 映射为 list，并处理字段名大小写转换以适配原有清单
          list: (features.records || []).map((item: any) => {
            const normalizedItem: any = {};
            for (const key in item) {
              normalizedItem[key.toUpperCase()] = item[key];
              normalizedItem[key.toLowerCase()] = item[key];
            }
            return normalizedItem;
          })
        }
      };
    }

    if (res && !res.hasOwnProperty('data')) {
      const formattedData: any = { ...res };

      const deptCodeToName: Record<string, string> = {};
      Object.entries(FILTER_MAP.industryDept).forEach(([name, code]) => {
        deptCodeToName[code] = name;
      });

      const arrayFields = [
        'legalPersonNumList', 
        'employmentPersonnel', 
        'operatingIncome', 
        'operatingProfit', 
        'totalAssets'
      ];

      arrayFields.forEach(field => {
        if (formattedData[field] && Array.isArray(formattedData[field])) {
          formattedData[field] = formattedData[field]
            .filter((item: any) => item.name !== 'total')
            .map((item: any) => {
              let finalName = item.name;
              if (field === 'operatingProfit' || field === 'totalAssets') {
                finalName = deptCodeToName[item.name] || item.name;
              }
              return {
                name: finalName,
                value: item.value
              };
            });
        }
      });

      return {
        success: true,
        data: formattedData
      };
    }
    return res;
  } else {
    let url = URL.getGsSumDataDisplay;
    if (type === 'comparison') url = URL.getDataComparison;
    if (type === 'list') url = URL.getUnitHeatMap;
    
    return post<any>({ url, data: oldParams, headers: { 'needToken_': 'true' } });
  }
};