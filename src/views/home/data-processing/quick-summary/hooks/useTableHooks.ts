/*
 * @文件路径: \fifth-web\src\views\home\data-processing\quick-summary\hooks\useTableHooks.ts
 * @作者名称: shenjiamin
 * @创建日期: 2025-08-29 23:47:21
 * @简要说明: 搜索树
 * @编辑时间: 2025-09-04 16:18:38
 * Copyright (c) 2025 by shenjiamin, All Rights Reserved.
 */
// import { ref, computed } from 'vue';

export const useTableHooks = () => {
  // 生成26个字母
  function generateLetters(count: number): string[] {
    const letters: string[] = [];
    for (let i = -1; i < count; i++) {
      const charCode = 65 + (i % 26);
      const repeats = Math.floor(i / 26);
      letters.push(String.fromCharCode(charCode).repeat(repeats + 1));
    }
    return letters;
  }

  /**
   * 生成表格列配置
   * @param totalCount 总列数
   * @param mainColumnCount 主栏列数量（决定需要特殊样式的列数）
   */
  function generateColumns(totalCount: number, mainColumnCount: number = 1) {
    const letters = generateLetters(totalCount);
    return letters.map((title, index) => {
      // 第一列：索引列（固定样式）
      if (index === 0) {
        return {
          title: '',
          dataIndex: 'index',
          key: 'index',
          width: 60,
          minWidth: 60,
          fixed: 'left',
          customCell: () => ({
            style: {
              background: 'rgba(245, 245, 247, 1)',
              color: 'rgba(166, 166, 166, 1)',
              textAlign: 'center',
              fontSize: '1.6rem',
            },
          }),
        };
      }

      // 主栏列：索引列之后的 mainColumnCount 列（应用主栏样式）
      const isMainColumn = index <= mainColumnCount;
      if (isMainColumn) {
        return {
          title,
          dataIndex: title,
          key: title,
          width: 120,
          minWidth: 120,
          customCell: (record: any, rowIndex: number) => {
            const cellValue = record[title];
            const hasData = cellValue !== undefined && cellValue !== null && cellValue !== '';
            const isHeaderRow = record.isHeader || rowIndex === 0;
            const isTotalRow = record.isTotalRow; // 检查是否为总计行

            if (hasData) {
              return {
                style: {
                  // 表头行样式
                  ...(isHeaderRow
                      ? {
                        background: 'linear-gradient(0deg, rgba(181, 255, 246, 0.6), rgba(181, 255, 246, 0.6)), rgba(84, 111, 255, 1)',
                        color: 'rgba(255, 255, 255, 1)',
                      }
                      : // 数据行样式
                      {
                        background: 'linear-gradient(0deg, rgba(181, 255, 246, 0.6), rgba(181, 255, 246, 0.6)),  rgba(230, 233, 247, 1)',
                        color: 'rgba(84,111,255,1)',
                      }),
                  fontSize: '1.6rem',
                  textAlign: 'left',
                },
              };
            }

            // 为空的单元格添加透明样式
            return {
              style: {
                background: 'transparent',
                color: 'transparent',
              },
              class: 'empty-cell'
            };
          },
        };
      }

      // 非主栏列：剩余列（应用普通样式）
      return {
        title,
        dataIndex: title,
        key: title,
        width: 100,
        minWidth: 100,
        customCell: (record: any, rowIndex: number) => {
          const cellValue = record[title];
          const hasData = cellValue !== undefined && cellValue !== null && cellValue !== '';
          const isHeaderRow = record.isHeader || rowIndex === 0;

          if (hasData) {
            return {
              style: {
                // 表头行样式
                ...(isHeaderRow
                    ? {
                      background: 'linear-gradient(0deg, rgba(181, 255, 246, 0.6), rgba(181, 255, 246, 0.6)), rgba(84, 111, 255, 1)',
                      color: 'rgba(255, 255, 255, 1)',
                      textAlign: 'center',
                    }
                    : // 数据行样式
                    {
                      background: 'rgb(255,255,255)',
                      textAlign: 'right'
                    }),
                fontSize: '1.6rem',
              },
            };
          }

          // 为空的单元格添加透明样式
          return {
            style: {
              background: 'transparent',
              color: 'transparent',
            },
            class: 'empty-cell'
          };
        },
      };
    });
  }

  return { generateColumns };
};

