/*
 * @文件路径: \fifth-web\src\views\home\data-processing\quick-summary\hooks\useTreeHooks.ts
 * @作者名称: shenjiamin
 * @创建日期: 2025-09-02 10:25:26
 * @简要说明: 树hooks
 * @编辑时间: 2025-09-04 09:19:53
 * Copyright (c) 2025 by shenjiamin, All Rights Reserved.
 */
import { getTableColumnsApi } from '@/api/data-processing/index';

export const useTree = () => {
  /**
   * @desc: 加载树数据
   * @param listKey 列表key
   * @return {*}
   */
  const loadTreeData = async (listKey: string) => {
    try {
      const params = {
        pk: listKey,
        action: 'detail',
      };
      const res = await getTableColumnsApi(params);
      const listNum = res.data.table_num;
      const tableCode = res.data.table_code; // 获取表代码

      const indexs: any = res.data.sub__table_columns.map((item: any) => ({
        title: item.column_name,
        key: item.column_code,
        listNum: listNum,
        tablecode: tableCode, // 添加tablecode信息
        originalData: item // 保留原始数据以备其他用途
      }));

      const newData = [
        {
          title: `${listNum} ${res.data.table_name}`,
          key: '0-0',
          tablecode: tableCode, // 父节点也添加tablecode
          children: indexs,
        },
      ];
      return newData;
    } catch (error) {
      console.log(error);
    }
  };

  return {
    loadTreeData,
  };
};