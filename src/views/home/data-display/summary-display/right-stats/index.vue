<template>
  <aside class="right-panel">
    <div class="item-box">
      <div class="head">
        <span>资产情况</span>
        <span class="total-badge">{{ (totalAssetsSum / 10000).toFixed(2) }} 万元</span>
      </div>
      <div class="content">
        <div class="unit-tip">单位：万元</div>
        <div ref="assetChartRef" class="chart-container"></div>
      </div>
    </div>
    
    <div class="item-box">
      <div class="head">
        <span>营业利润</span>
        <span class="total-badge">{{ (totalProfitSum / 10000).toFixed(2) }} 万元</span>
      </div>
      <div class="content">
        <div class="unit-tip">单位：万元</div>
        <div ref="profitChartRef" class="chart-container"></div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { ref, watch, onMounted } from 'vue';
import type { EChartsOption } from 'echarts'; 

const props = defineProps({
  summaryData: { type: Object, default: () => ({}) }
});

const assetChartRef = ref<HTMLElement | null>(null);
const profitChartRef = ref<HTMLElement | null>(null);
let assetChart: echarts.ECharts | null = null;
let profitChart: echarts.ECharts | null = null;

const totalAssetsSum = ref(0);
const totalProfitSum = ref(0);

// 通用柱状图配置生成函数
const getBarOption = (data: any[]): EChartsOption => ({
  grid: {
    top: '15%',
    left: '3%',
    right: '5%',
    bottom: '15%',
    containLabel: true
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: 'rgba(50, 50, 50, 0.7)',
    textStyle: { color: '#fff', fontSize: 16 },
    formatter: (params: any) => {
      const item = params[0];
      return `${item.name}<br/><span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${item.color.colorStops[0].color};"></span>数值: ${item.value}`;
    }
  },
  xAxis: {
    type: 'category',
    data: data.map(item => item.name),
    axisLine: { lineStyle: { color: '#eee' } },
    axisTick: { show: false },
    axisLabel: { 
      fontSize: 12, 
      color: '#666',
      interval: 0,
      rotate: 25, // 行业名称长，倾斜显示
      formatter: (val: string) => val.length > 5 ? val.slice(0, 5) + '...' : val
    }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } },
    axisLabel: { fontSize: 12, color: '#999' }
  },
  series: [{
    type: 'bar',
    barWidth: '40%',
    data: data.map(item => item.value),
    itemStyle: {
      // 这里的 offset 0 和 1 实现了从浅色到原本 Exam 颜色的渐变
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#ffb570' }, // 浅橘色（Exam 色系的浅色版）
        { offset: 1, color: '#ff8800' }  // 橘色
      ]),
      borderRadius: [4, 4, 0, 0]
    }
  }]
});

const processData = () => {
  const res = props.summaryData;
  if (!res || Object.keys(res).length === 0) return;

  // 1. 处理资产情况
  if (res.totalAssets && Array.isArray(res.totalAssets)) {
    const assetsData = res.totalAssets.map((item: any) => ({
      name: item.name,
      value: (Number(item.value) / 10000).toFixed(2)
    }));
    totalAssetsSum.value = res.totalAssets.reduce((acc: number, cur: any) => acc + Number(cur.value), 0);
    assetChart?.setOption(getBarOption(assetsData));
  }

  // 2. 处理营业利润
  if (res.operatingProfit && Array.isArray(res.operatingProfit)) {
    const profitData = res.operatingProfit.map((item: any) => ({
      name: item.name,
      value: (Number(item.value) / 10000).toFixed(2)
    }));
    totalProfitSum.value = res.operatingProfit.reduce((acc: number, cur: any) => acc + Number(cur.value), 0);
    profitChart?.setOption(getBarOption(profitData));
  }
};

onMounted(() => {
  if (assetChartRef.value) assetChart = echarts.init(assetChartRef.value);
  if (profitChartRef.value) profitChart = echarts.init(profitChartRef.value);
  
  processData();

  window.addEventListener('resize', () => {
    assetChart?.resize();
    profitChart?.resize();
  });
});

watch(() => props.summaryData, processData, { deep: true });
</script>

<style scoped>
.right-panel {
  width: 450px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  box-sizing: border-box;
}

.item-box {
  flex: 1;
  background-color: #fff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  padding: 12px 16px;
  border-bottom: 1px solid #f9f9f9;
}

.total-badge {
  font-size: 16px;
  font-weight: normal;
  background-color: #f5f5f5;
  color: #666;
  padding: 4px 12px;
  border-radius: 20px;
}

.content {
  flex: 1;
  position: relative;
  padding: 10px;
}

.unit-tip {
  position: absolute;
  top: 5px;
  left: 15px;
  font-size: 12px;
  color: #999;
  z-index: 10;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
}
</style>