/*
 * @文件路径: \fifth-web\src\views\home\data-processing\quick-summary\hooks\useTreeHooks.ts
 * @作者名称: shenjiamin
 * @创建日期: 2025-09-02 10:25:26
 * @简要说明: 树hooks
 * @编辑时间: 2025-09-04 09:19:53
 * Copyright (c) 2025 by shenjiamin, All Rights Reserved.
 */
import { getTableColumnsApi } from '@/api/data-processing/index';
// import { findDataQueryPage } from '@/api/data-processing/index';

export const useList= () => {
  /**
   * @desc: 加载列表数据
   * @param listKey 列表key
   * @return {*}
   */
  const loadListData = async (listKey: string) => {
    try {
      const params = {
        pk: listKey,
        action: 'detail',
      };
      const res = await getTableColumnsApi(params);
      const indexs: any = res.data.sub__table_columns.map((item: any) => ({
        id: item.column_code,
        name: item.column_name,
      }));
      return indexs;
    } catch (error) {
      console.log(error);
    }
  };

  return {
    loadListData,
  };
};
