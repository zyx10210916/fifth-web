
/*
 * @文件路径: \fifth-web\src\api\data-processing\index.ts
 * @作者名称: shenjiamin
 * @创建日期: 2025-08-28 18:08:46
 * @简要说明:
 * @编辑时间: 2025-09-03 10:17:08
 * Copyright (c) 2025 by shenjiamin, All Rights Reserved.
 */
/*
 * @文件路径: \fifth-web\src\api\data-processing\index.ts
 * @作者名称: shenjiamin
 * @创建日期: 2025-09-01 15:34:32
 * @简要说明:
 * @编辑时间: 2025-09-01 16:49:22
 * Copyright (c) 2025 by shenjiamin, All Rights Reserved.
 */

import { post, get } from '@/utils/http/axios';

export interface FindQuickSumaryParams {
  summaryQueries: Array<{
    tableName: string; // 表名（需从顶部表单或配置中获取）
    groupFields: string[]; // 主栏字段（分组字段）
    sumFields: string[]; // 宾栏字段（统计字段，含统计方法，如 "count(\"同期\")"）
  }>;
}

// 快速汇总列表配置
export const listConfig = {
  legalList: 'company_legal_main_economy_indicator_list', // 公司法人主要经济指标
  employeesSituationList: 'unit_employees_base_case_list', // 单位从业人员情况
  unitSituationList: 'unit_base_situation_list', // 单位基本情况
  employeesWagesList: 'employees_and_total_wages_list', // 从业人员及工资总额
  inquiryUnitSituationList: 'inquiry_unit_base_cases_list', // 调查单位基本情况
} as const;

enum URL {
  baseFormBoList = '/api/api-form/form/core/formBoList',

  // 查询数据处理列表
  getData = 'api/api-form/form/core/formBoList/data_template_list/getData?single=false',
  // 业务数据列表
  buniscGetData = 'api/api-form/form/core/formBoList/bunisc_data_table_list/getData?single=false',
  //指标查询
  indexGetData = 'api/api-form/form/core/formBoList/bunisc_tables_columns_list/getData?single=false',
  //数据查询
  findDataQueryPage = 'api/api-form/form/fifth/dataquery/findDataQueryPage',
  //数据导出
  dynamicExportExcel = 'api/api-form/form/fifth/dataquery/exportExcel',
  //CSV数据导出
  dynamicExportCsv = 'api/api-form/form/fifth/dataquery/exportCsv',
  //专业列表
  professionalList = 'api/api-form/form/core/formBoList/professional_list/getData?single=false',
  //地区列表
  areaList = 'api/api-form/form/core/formBoList/area_list/getData?single=false',
  //数据查询列表
  dataQueryTableList = '/api/api-form/form/core/formBoList/data_query_table_list/getData?single=false',
  //汇总模板列表
  sumTemplateList = '/api/api-form/form/core/formBoList/sum_template_list/getData',

  /* 二. 快速汇总接口 */
  ListCol = '/api/api-form/form/core/formSolution/getByAlias?alias=bunisc_data_table',

  // 衍生指标列表
  derivativeIndicatorsList = '/api/api-form/form/core/formBoList/derivative_indicators_list/getData?single=false',

  // 衍生指标保存
  saveDerivativeIndicator = '/api/api-form/form/core/formSolution/saveForm',
  // 查询标签
  getTags = '/api/api-form/form/fifth/queryTags/getTags',
  // 保存标签
  saveTag = '/api/api-form/form/core/formSolution/saveForm',
  // 删除标签
  removeTag = '/api/api-form/form/core/formSolution/removeById',
  // 模板查询
  dataQueryTemplateList = '/api/api-form/form/core/formBoList/data_query_template_list/getData',
  // 条件查询模板列表
  dataConditionQueryTemplateList = '/api/api-form/form/core/formBoList/data_condition_query_template_list/getData',

}

export interface getDataData {
  username: string;
  password: string;
}

export interface DerivativeIndicator {
  ID_?: string;
  NAME: string;
  CODE: string;
  MEASURE_UNIT: string;
  DECIMAL_PLACES: number;
  FORMULA_EDIT: string;
  DIFFERENT_FORMULA: string;
  BELONGING_REPORT: string;
  TAG_LABEL: string;
  [key: string]: any; // 其他可能的字段
}

// 模板查询参数接口
export interface DataQueryTemplateParams extends PageParams {
  params?: Record<string, any>;
}

// 模板数据接口
export interface DataQueryTemplate {
  id?: string;
  template_name: string;
  template_desc: string;
  creator: string;
  is_set_public: boolean;
  query_condition: any;
  tag_big_classify: string;
  tag_middle_classify: string;
  [key: string]: any;
}

// 条件查询模板数据接口
export interface DataConditionQueryTemplate {
  id?: string;
  template_name: string;
  template_desc: string;
  cjr: string; // 创建人
  is_share: string; // 是否共享
  is_used: string; // 是否常用
  query_conditions: any; // 查询条件
  [key: string]: any;
}

// 汇总模板参数接口
export interface SumTemplateParams {
  template_name: string;
  sum_op: string;
  sfzmb: string;
  cjr: string;
  template_desc: string;
  type: string;
  [key: string]: any;
}

export interface PageParams {
  pageNo: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: string;
  params?: Record<string, any>;
}

// 新增标签参数接口
export interface SaveTagParams {
  category_id: string;
  query_criteria: string;
  tag_name: string;
}

// 删除标签参数接口
export interface RemoveTagParams {
  id: string; // 标签ID
}

const getData = async (data: getDataData) => post<any>({ url: URL.getData, data });
const buniscGetData = async (data: getDataData) => post<any>({ url: URL.buniscGetData, data });
const indexGetData = async (data: getDataData) => post<any>({ url: URL.indexGetData, data });
const findDataQueryPage = async (data: getDataData) => post<any>({ url: URL.findDataQueryPage, data });
const professionalList = async (data: getDataData) => post<any>({ url: URL.professionalList, data });
const areaList = async (data: getDataData) => post<any>({ url: URL.areaList, data });
const dataQueryTableList = async (data: getDataData) => post<any>({ url: URL.dataQueryTableList, data });
const dynamicExportExcel = async (data: getDataData) => post<any>({ url: URL.dynamicExportExcel, data, responseType: 'blob' });
const dynamicExportCsv = async (data: getDataData) => post<any>({ url: URL.dynamicExportCsv, data, responseType: 'blob' });

/* 二. 快速汇总接口 */
// 每个列表的表头
const getTableColumnsApi = async (params: Record<string, any>) => {
  const path = `${URL.ListCol}&${new URLSearchParams(params).toString()}`;
  return post<any>({ url: path });
};

// 执行汇总
const quickSummaryApi = async (data: FindQuickSumaryParams) => {
  return post<any>({
    url: '/api/api-form/form/fifth/quick_summary/findQuickSumary',
    data,
  });
};
// 交叉汇总
const crossSummaryApi = async (data: FindQuickSumaryParams) => {
  return post<any>({
    url: '/api/api-form/form/fifth/cross_summary/findCrossSumary',
    data,
  });
};
// 衍生指标相关API
// 获取衍生指标列表
const getDerivativeIndicatorsList = async (params: PageParams) => {
  return post<any>({
    url: URL.derivativeIndicatorsList,
    data: params
  });
};

// 保存衍生指标
const saveDerivativeIndicator = async (data: Partial<DerivativeIndicator>) => {
  // 构造完整的请求数据结构
  const requestData = {
    setting: {
      action: "save",
      alias: "derivative_indicators"
    },
    data: data
  };

  return post<any>({
    url: URL.saveDerivativeIndicator,
    data: requestData
  });
};

// 保存汇总模板
const saveSumTemplate = async (data: SumTemplateParams) => {
  // 构造完整的请求数据结构
  const requestData = {
    setting: {
      action: "save",
      alias: "sum_template"
    },
    data: data
  };

  return post<any>({
    url: URL.saveDerivativeIndicator,
    data: requestData
  });
};

// 获取模板列表
const getDataQueryTemplateList = async (params: DataQueryTemplateParams) => {
  return post<any>({
    url: URL.dataQueryTemplateList,
    data: params
  });
};

// 获取汇总模板列表
const getSumTemplateList = async (params: PageParams) => {
  return post<any>({
    url: URL.sumTemplateList,
    data: params
  });
};

// 获取条件查询模板列表
const getDataConditionQueryTemplateList = async (params: PageParams) => {
  return post<any>({
    url: URL.dataConditionQueryTemplateList,
    data: params
  });
};

// 保存条件查询模板
const saveDataConditionQueryTemplate = async (data: Partial<DataConditionQueryTemplate>) => {
  // 构造完整的请求数据结构
  const requestData = {
    setting: {
      action: "save",
      alias: "data_condition_query_template"
    },
    data: data
  };

  return post<any>({
    url: URL.saveTag,
    data: requestData
  });
};

export const removeDataConditioonTemplate = async (id: string) => {
  const requestData = {
    alias: 'data_condition_query_template',
    id: id
  };

  return post<any>({
    url: URL.removeTag,
    data: requestData
  });
};


// 保存模板
const saveDataQueryTemplate = async (data: Partial<DataQueryTemplate>) => {
  const requestData = {
    setting: {
      action: 'save',
      alias: 'data_query_template'
    },
    data: data
  };

  return post<any>({
    url: URL.saveTag, // 复用saveTag接口
    data: requestData
  });
};

// 删除数据查询模板
export const removeDataQueryTemplate = async (id: string) => {
  // 构造请求数据，参考removeDerivativeIndicator的实现
  const requestData = {
    alias: 'data_query_template',
    id: id
  };

  return post<any>({
    url: URL.removeTag,
    data: requestData
  });
};



// 查询标签
const getTags = async (params?: Record<string, any>) => {
  return get<any>({
    url: URL.getTags,
    params
  });
}

// 保存标签
interface SaveTagOptions {
  alias?: string;
}

// 分类参数接口
interface CategoryParams {
  category_name: string;
  isPrivate: string;
  parent_category_id: string;
  sort: number;
}
const saveTag = async (data: SaveTagParams | CategoryParams, options?: SaveTagOptions) => {
  // 确定使用的alias
  const alias = options?.alias || "query_tags";

  // 根据alias确定如何处理数据
  let requestData;

  // 当alias为'query_tag_categories'时，确保数据是CategoryParams格式
  if (alias === 'query_tag_categories' && 'category_name' in data) {
    requestData = {
      setting: {
        action: "save",
        alias: 'query_tag_categories'
      },
      data: {
        category_name: data.category_name,
        is_private: data.is_private,
        parent_category_id: data.parent_category_id,
        sort: data.sort
      }
    };
  } else {
    requestData = {
      setting: {
        action: "save",
        alias: alias
      },
      data: data
    };
  }

  return post<any>({
    url: URL.saveTag,
    data: requestData
  });
};
// 删除标签
const removeTag = async (data: RemoveTagParams) => {
  // 构造请求数据
  const requestData = {
    alias: "query_tags",
    id: data.id
  };

  return post<any>({
    url: URL.removeTag,
    data: requestData
  });
};

// 删除衍生指标
const removeDerivativeIndicator = async (data: RemoveTagParams) => {
  // 构造请求数据
  const requestData = {
    alias: "derivative_indicators",
    id: data.id
  };

  return post<any>({
    url: URL.removeTag,
    data: requestData
  });
};

// 删除汇总模板
const removeSumTemplate = async (id: string) => {
  // 构造请求数据
  const requestData = {
    alias: "sum_template",
    id: id
  };

  return post<any>({
    url: URL.removeTag,
    data: requestData
  });
};

export {
  getData,
  buniscGetData,
  indexGetData,
  findDataQueryPage,
  professionalList,
  areaList,
  dataQueryTableList,
  /* 二. 快速汇总接口 */
  getTableColumnsApi,
  quickSummaryApi,
  crossSummaryApi,
  // 衍生指标相关API
  getDerivativeIndicatorsList,
  saveDerivativeIndicator,
  // 标签相关API
  getTags,
  saveTag,
  removeTag,
  // 衍生指标删除API
  removeDerivativeIndicator,
  // 模板相关API
  getDataQueryTemplateList,
  saveDataQueryTemplate,
  // 汇总模板相关API
  getSumTemplateList,
  saveSumTemplate,
  removeSumTemplate,
  // 条件查询模板相关API
  getDataConditionQueryTemplateList,
  saveDataConditionQueryTemplate,
  dynamicExportExcel,
  dynamicExportCsv,
};
