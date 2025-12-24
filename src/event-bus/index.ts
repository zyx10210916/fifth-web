import mitt, { type Emitter } from 'mitt';

type Events = {
  selectedMetrics: any; // 数据查询-设置显示指标-要显示的指标
};

const emitter: Emitter<Events> = mitt<Events>();

export default emitter;
