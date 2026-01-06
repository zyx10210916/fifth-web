export interface FieldColumn {
  label: string;
  prop: string;
  fixed?: boolean;
}

export const UNIT_COLUMNS: FieldColumn[] = [
  // 默认展示的字段
  { label: '单位名称', prop: 'B102', fixed: true },
  { label: '统一社会信用代码', prop: 'B109', fixed: true },
  
  // 基础信息
  { label: '唯一码', prop: 'WYM'},
  { label: '数据来源', prop: 'SJLY' },
  { label: '处理地', prop: 'CLD' },
  { label: '单位类型', prop: 'B110' },
  { label: '法定代表人', prop: 'B201' },
  
  // 地址与联系方式
  { label: '街（路）门牌号', prop: 'B1056' },
  { label: '区划代码', prop: 'B1057' },
  { label: '联系电话', prop: 'A0003' },
  
  // 经营状态与行业
  { label: '运营状态', prop: 'B208' },
  { label: '主要业务活动', prop: 'B1031' },
  { label: '行业代码', prop: 'B1034' },
  { label: '机构类型', prop: 'B211' },
  { label: '登记注册类别', prop: 'B205' },
  { label: '企业控股情况', prop: 'B206' },
  { label: '单位规模', prop: 'B191' },
  
  // 财务/经济指标
  { label: '主营收入', prop: 'ZYSR' },
  { label: '资产总计', prop: 'ZCZJ' },
  { label: '营业利润', prop: 'YYLR' },
  { label: '负债合计', prop: 'FZHJ' },
  { label: '营业收入', prop: 'YYSR' },
  { label: '期末人数', prop: 'QMRS' },
  { label: '从业人数', prop: 'CYRS' },
  { label: '应付职工薪酬', prop: 'YFZGXC' },
  { label: '应交增值税', prop: 'YJZZS' }
];