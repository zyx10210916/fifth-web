import { post } from '@/utils/http/axios';

// 定义接口地址
enum URL {
  getGsSumDataDisplay = '/api/api-form/form/fifth/gs/getGsSumDataDisplay',
  getDataComparison = '/api/api-form/form/fifth/gs/getDataComparison',
  getUnitHeatMap = '/api/api-form/form/fifth/gs/getUnitHeatMap'
}

// 封装请求方法
export const getGsSumDataDisplay = (data: any) => {
  return post<any>({
    url: URL.getGsSumDataDisplay,
    data,
    headers: {
      'needToken_': 'true' 
    }
  });
};

export const getDataComparison = (data: any) => {
  return post<any>({
    url: URL.getDataComparison,
    data,
    headers: {
      'needToken_': 'true' 
    }
  });
};

export const getUnitHeatMap = (data: any) => {
  return post<any>({
    url: URL.getUnitHeatMap,
    data,
    headers: {
      'needToken_': 'true' 
    }
  });
};