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
    
    // 构造高性能接口参数
    const finalParams: any = {
      wkt: wktParams.wkt,
      area: "",
      indestryCategory: wktParams.industryCategory || "", 
      businessOperationType: wktParams.businessOperationType || "",
      holdingSituation: wktParams.holdingSituation || "",
      industryDept: wktParams.industryDept || "",
      registerType: wktParams.registerType || "",
      unitScale: wktParams.unitScale || "",
    };

    const res = await post<any>({ url, data: finalParams });

    // --- 数据归一化与清洗逻辑 ---
    if (res && !res.hasOwnProperty('data')) {
      const formattedData: any = { ...res };

      // 处理 employmentPersomel 字段命名不一致问题
      if (res.employmentPersomel) {
        formattedData.employmentPersonnel = res.employmentPersomel;
      }

      // 行业部门的反向映射表 (Code -> Name)
      const deptCodeToName: Record<string, string> = {};
      Object.entries(FILTER_MAP.industryDept).forEach(([name, code]) => {
        deptCodeToName[code] = name;
      });

      // 统一处理所有字段
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
            .filter((item: any) => item.name !== 'total') // 忽略 total 统计项
            .map((item: any) => {
              let finalName = item.name;

              // 针对利润和资产情况，将代码(Code)转换为中文名称
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
    // 旧接口逻辑分支
    let url = URL.getGsSumDataDisplay;
    if (type === 'comparison') url = URL.getDataComparison;
    if (type === 'list') url = URL.getUnitHeatMap;
    
    return post<any>({ url, data: oldParams, headers: { 'needToken_': 'true' } });
  }
};