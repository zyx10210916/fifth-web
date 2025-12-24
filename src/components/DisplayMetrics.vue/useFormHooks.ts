/*
 * @文件路径: \fifth-web\src\views\home\data-processing\quick-summary\head-form\useFormHooks.ts
 * @作者名称: shenjiamin
 * @创建日期: 2025-08-27 17:53:32
 * @简要说明:
 * @编辑时间: 2025-09-02 10:14:05
 * Copyright (c) 2025 by shenjiamin, All Rights Reserved.
 */
import { buniscGetData } from '@/api/data-processing/index';

interface YearOption {
  label: string;
  value: string;
  code: string;
}

export const useForm= () => {
  const reportOptions: YearOption[] = [];

  const getReportOptions = async () => {
    try {
      const getDataData = {
        pageNo: 1,
        pageSize: 100,
      };

      const res: any = await buniscGetData(getDataData);
      // console.log(res,'res')
      const resData = res.data;
      if (resData && resData.length) {
        // console.log(resData,'resData')
        const seen = new Set();
        resData.forEach((item: any) => {
          const tableName = item.TABLE_NAME;
          const tableNum = item.TABLE_NUM;
          if (!seen.has(tableName)) {
            seen.add(tableName);
            reportOptions.push({ label: `${tableNum} ${tableName}`, value:item.ID_,code:  item.TABLE_CODE });
          }
        });
        return reportOptions;
      }
    } catch (error) {
      console.log(error);
    }
  };

  return {
    getReportOptions
  };
};
