import { post } from '@/utils/http/axios';
import { ref } from 'vue';
import { FILTER_MAP } from '@/views/home/data-display/filter-config';

// --- 【模式控制】 ---
// true: 高性能模式 
// false: 普通模式 
export const IS_HIGH_PERFORMANCE = ref(true);
const HIGH_PERFORMANCE_BASE = import.meta.env.VITE_HIGH_PERFORMANCE_BASE;

// 定义接口地址
const URL = {
  // 原有接口 (普通模式)
  getGsSumDataDisplay: '/api/api-form/form/fifth/gs/getGsSumDataDisplay',
  getDataComparison: '/api/api-form/form/fifth/gs/getDataComparison',
  getUnitHeatMap: '/api/api-form/form/fifth/gs/getUnitHeatMap',
  getUniqueCodeList: '/api/api-form/form/fifth/gs/getUniqueCodeList',
  
  // 高性能接口 (高性能模式) - 现在支持变量拼接了
  getWjpRecords: `${HIGH_PERFORMANCE_BASE}/gisngx/v1/wjp/gbk/recordsV2`,
  getWjpStatistics: `${HIGH_PERFORMANCE_BASE}/gisngx/v1/wjp/gbk/statisticV2`
} as const;

// --- 基础请求封装 ---
export const getGsSumDataDisplay = (data: any) => post<any>({ url: URL.getGsSumDataDisplay, data, headers: { 'needToken_': 'true' } });
export const getDataComparison = (data: any) => post<any>({ url: URL.getDataComparison, data, headers: { 'needToken_': 'true' } });
export const getUnitHeatMap = (data: any) => post<any>({ url: URL.getUnitHeatMap, data, headers: { 'needToken_': 'true' } });
export const getUniqueCodeList = (data: any) =>post<any>({ url: URL.getUniqueCodeList, data, headers: { 'needToken_': 'true' } });

// --- 高性能请求封装 ---
export const getWjpRecords = (data: any) => post<any>({ url: URL.getWjpRecords, data });
export const getWjpStatistics = (data: any) => post<any>({ url: URL.getWjpStatistics, data });

/**
 * 高性能接口处理器 (WjpProcessor)
 * 统一处理高性能接口的请求参数转换与响应数据归一化
 */
const WjpProcessor = {
  // 请求适配：将前端通用参数转换为高性能接口要求的格式
  req: (params: any) => {
    // 处理 industryDept 的单引号包裹问题 (如 B -> 'B'，支持多值 A,B -> 'A','B')
    const dept = params.industryDept || "";
    const fmtDept = dept 
      ? dept.split(',').map((v: any) => `'${v.trim().replace(/'/g, "")}'`).join(',') 
      : "";

    // 处理 industryCategory 格式化 (将代码映射为字母+中文名格式，如 F -> 'F 批发和零售业')
    const cat = params.industryCategory || "";
    const fmtCat = cat ? cat.split(',').map((val: any) => {
      const code = val.trim();
      // 从 FILTER_MAP 中查找对应的中文名称
      const entry = Object.entries(FILTER_MAP.industryCategory).find(([_, c]) => c === code);
      // 拼接成 '代码 中文名' 格式并包裹单引号
      return entry ? `'${entry[1]} ${entry[0]}'` : `'${code}'`;
    }).join(',') : "";

    return {
      wkt: params.wkt,
      area: "", // 高性能接口通常通过 WKT 定位，区域传空
      industryCategory: fmtCat,
      industryDept: fmtDept,
      businessOperationType: params.businessOperationType || "",
      holdingSituation: params.holdingSituation || "",
      registerType: params.registerType || "",
      unitScale: params.unitScale || "",
      page: params.page || 1,
      offset: params.offset || 20 // 高性能接口的分页长度字段
    };
  },

  // 响应适配：将高性能接口返回的结构转换为前端组件可识别的格式
  res: (res: any, type: string) => {
    // 增加 _isHP 标记表示这是高性能接口返回的数据

    // 处理热力图高性能清单接口返回结构映射 (recordsV2 模式)
    if (type === 'list' && res?.features) {
      const { features } = res;
      return {
        success: true,
        _isHP: true, 
        data: {
          total: features.total_count || 0,
          // 将 records 映射为 list，并处理字段名大小写转换以适配原有清单组件
          list: (features.records || []).map((item: any) => {
            const newItem: any = {};
            for (const key in item) {
              // 同时保留大小写，确保 columns.ts 定义的 dataIndex 都能匹配
              newItem[key.toUpperCase()] = newItem[key.toLowerCase()] = item[key];
            }
            return newItem;
          })
        }
      };
    }

    // 处理统计汇总/对比接口返回结构归一化
    if (res && !res.hasOwnProperty('data')) {
      const fmtData: any = { ...res };
      
      // 构造行业部门的代码到名称的映射表 (用于转换 operatingProfit 和 totalAssets 中的 name)
      const deptMap: Record<string, string> = {};
      Object.entries(FILTER_MAP.industryDept).forEach(([n, c]) => { deptMap[c] = n; });

      // 统一处理需要进行内容清洗和名称转换的数组字段
      const arrayFields = ['legalPersonNumList', 'employmentPersonnel', 'operatingIncome', 'operatingProfit', 'totalAssets'];
      
      arrayFields.forEach(f => {
        if (fmtData[f] && Array.isArray(fmtData[f])) {
          fmtData[f] = fmtData[f]
            .filter((i: any) => i.name !== 'total') // 过滤掉后端返回的合计项
            .map((i: any) => ({
              // 针对利润和资产，将代码转换为中文部门名称
              name: (f === 'operatingProfit' || f === 'totalAssets') ? (deptMap[i.name] || i.name) : i.name,
              value: i.value
            }));
        }
      });
      return { success: true, data: fmtData, _isHP: true };
    }

    // 如果不符合上述高性能结构，则标记为普通数据返回
    return { ...res, _isHP: false };
  }
};

// 主分发函数
export const fetchBusinessData = async (wktParams: any, oldParams: any, type: 'sum' | 'list' | 'comparison') => {
  const hasWkt = wktParams?.wkt && wktParams.wkt !== "";

  // 高性能开关开启且有WKT时尝试 WJP
  if (IS_HIGH_PERFORMANCE.value && hasWkt) {
    try {
      const url = (type === 'list' ? URL.getWjpRecords : URL.getWjpStatistics);
      const data = WjpProcessor.req(wktParams);
      const res = await post<any>({ url, data });

      // 业务报错或接口异常触发 throw 进入 catch
      if (!res || res.status === '0' || res.success === false) {
        throw new Error('WJP_ERROR');
      }

      return WjpProcessor.res(res, type);
    } catch (e: any) {
      console.warn('高性能接口不可用(404/500/业务错)，回退旧接口:', e.message);
    }
  }

  // 普通接口兜底逻辑
  let url: string = URL.getGsSumDataDisplay;
  if (type === 'comparison') {
    url = oldParams.axisDtos ? URL.getUniqueCodeList : URL.getDataComparison;
  } else if (type === 'list') {
    url = URL.getUnitHeatMap;
  }
  
  const res = await post<any>({ url, data: oldParams, headers: { 'needToken_': 'true' } });
  // 普通接口返回的数据标记为 _isHP: false
  return { ...res, _isHP: false };
};