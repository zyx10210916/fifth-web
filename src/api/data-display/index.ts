import { post } from '@/utils/http/axios';

// 定义接口地址
enum URL {
  getGsSumDataDisplay = '/api/api-form/form/fifth/gs/getGsSumDataDisplay',
}

// 封装请求方法
export const getGsSumDataDisplay = (data: any) => {
  return post<any>({
    url: URL.getGsSumDataDisplay,
    data,
    headers: {
      'needToken_': 'true' // 根据实际需求设置是否需要token
    }
  });
};