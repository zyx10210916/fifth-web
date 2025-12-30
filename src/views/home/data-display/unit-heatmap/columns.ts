export interface FieldColumn {
  label: string;
  prop: string;
  fixed?: boolean;
}

export const UNIT_COLUMNS: FieldColumn[] = [
  // 默认展示的核心字段
  { label: '单位名称', prop: 'B102', fixed: true },
  { label: '统一社会信用代码', prop: 'B109', fixed: true },
  
  // 基础身份信息
  { label: '唯一码', prop: 'WYM'},
  { label: '顺序号', prop: 'rowid' },
  { label: '所属套表', prop: 'tb' },
  { label: '数据来源', prop: 'sjly' },
  { label: '处理地', prop: 'cld' },
  { label: '单位类型', prop: 'b110' },
  { label: '法定代表人', prop: 'b201' },
  
  // 地址与联系方式
  { label: '街（路）门牌号', prop: 'b1056' },
  { label: '区划代码', prop: 'b1057' },
  { label: '联系电话', prop: 'a0003' },
  
  // 经营状态与行业
  { label: '运营状态', prop: 'b208' },
  { label: '主要业务活动', prop: 'b1031' },
  { label: '行业代码', prop: 'b1034' },
  { label: '机构类型', prop: 'b211' },
  { label: '登记注册类别', prop: 'b205' },
  { label: '企业控股情况', prop: 'b206' },
  { label: '单位规模', prop: 'b191' },
  
  // 财务/经济指标
  { label: '主营收入', prop: 'zysr' },
  { label: '资产总计', prop: 'zczj' },
  { label: '营业利润', prop: 'yylr' },
  { label: '负债合计', prop: 'fzhj' },
  { label: '营业收入', prop: 'yysr' },
  { label: '期末人数', prop: 'qmrs' },
  { label: '从业人数', prop: 'cyrs' },
  { label: '应付职工薪酬', prop: 'yfzgxc' },
  { label: '应交增值税', prop: 'yjzzs' }
];