<template>
  <div class="left">
    <div class="item-box">
      <div class="head">
        <span>法人单位数量</span>
        <span class="total-badge">{{ totalCorporateCount }} 家</span>
      </div>
      <div class="content">
        <div class="unit-tip vertical">单位：家</div>
        <div ref="corporateChartRef" class="chart-container"></div>
      </div>
    </div>

    <div class="item-box">
      <div class="head">
        <span>从业人员期末人数</span>
        <span class="total-badge">{{ (totalPersonnel / 10000).toFixed(2) }} 万人</span>
      </div>
      <div class="content">
        <div class="unit-tip horizontal">单位：人</div>
        <div ref="personnelChartRef" class="chart-container"></div>
      </div>
    </div>

    <div class="item-box">
      <div class="head">
        <span>营业收入</span>
        <span class="total-badge">{{ (totalEconomic / 10000).toFixed(2) }} 万元</span>
      </div>
      <div class="content">
        <div class="unit-tip vertical">单位：万元</div>
        <div ref="revenueChartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import type { EChartsOption } from 'echarts';

const props = defineProps({
  summaryData: { type: Object, default: () => ({}) }
});

const corporateChartRef = ref<HTMLElement | null>(null);
const personnelChartRef = ref<HTMLElement | null>(null);
const revenueChartRef = ref<HTMLElement | null>(null);

let chart1: echarts.ECharts | null = null;
let chart2: echarts.ECharts | null = null;
let chart3: echarts.ECharts | null = null;

const totalCorporateCount = ref(0);
const totalPersonnel = ref(0);
const totalEconomic = ref(0);

const colorPalette = [
  ['#ffb570', '#ff8800'], 
  ['#85e1ff', '#009dff'], 
  ['#50e3c2', '#11a382'], 
  ['#b6a2de', '#675bba']  
];

const prepareChartData = (rawData: any, dataKey: string, isHorizontal: boolean) => {
  const regions = Object.keys(rawData);
  const categorySet = new Set<string>();

  regions.forEach(reg => {
    rawData[reg][dataKey]?.forEach((item: any) => categorySet.add(item.name));
  });
  const categories = Array.from(categorySet);

  let totalSum = 0;
  const series = regions.map((reg, index) => {
    const regionMap = new Map();
    rawData[reg][dataKey]?.forEach((item: any) => {
      const val = Number(item.value) || 0;
      regionMap.set(item.name, val);
      totalSum += val;
    });

    const colors = colorPalette[index % colorPalette.length];
    return {
      name: reg,
      type: 'bar',
      barMaxWidth: isHorizontal ? 14 : 16,
      data: categories.map(cat => regionMap.get(cat) || 0),
      itemStyle: {
        borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, isHorizontal ? 1 : 0, isHorizontal ? 0 : 1, [
          { offset: 0, color: colors[0] },
          { offset: 1, color: colors[1] }
        ])
      }
    };
  });

  return { categories, series, totalSum };
};

const getOption = (categories: string[], seriesData: any[], isHorizontal: boolean): EChartsOption => {
  const commonAxisLabel = { fontSize: 14, color: '#666' };
  
  return {
    grid: { 
      top: isHorizontal ? '20%' : '22%', 
      left: '3%', 
      right: isHorizontal ? '8%' : '5%', 
      bottom: isHorizontal ? '5%' : '12%', 
      containLabel: true 
    },
    legend: { show: true, top: '2%', icon: 'roundRect', textStyle: { fontSize: 14 } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: isHorizontal ? {
      type: 'value',
      axisLabel: commonAxisLabel,
      splitLine: { lineStyle: { type: 'dashed', color: '#f5f5f5' } }
    } : {
      type: 'category',
      data: categories,
      axisLabel: commonAxisLabel,
      axisLine: { lineStyle: { color: '#eee' } }
    },
    yAxis: isHorizontal ? {
      type: 'category',
      data: categories,
      inverse: true,
      axisLabel: commonAxisLabel,
      axisLine: { lineStyle: { color: '#eee' } }
    } : {
      type: 'value',
      axisLabel: commonAxisLabel,
      splitLine: { lineStyle: { type: 'dashed', color: '#f5f5f5' } }
    },
    series: seriesData
  };
};

const processData = () => {
  const data = props.summaryData;
  if (!data || Object.keys(data).length === 0) return;

  nextTick(() => {
    const corp = prepareChartData(data, 'legalPersonNumList', false);
    totalCorporateCount.value = Object.values(data).reduce((acc: any, cur: any) => acc + (cur.legalPersonNum || 0), 0);
    chart1?.setOption(getOption(corp.categories, corp.series, false), true);

    const pers = prepareChartData(data, 'employmentPersonnel', true);
    totalPersonnel.value = pers.totalSum;
    chart2?.setOption(getOption(pers.categories, pers.series, true), true);

    const rev = prepareChartData(data, 'operatingIncome', false);
    totalEconomic.value = rev.totalSum;
    chart3?.setOption(getOption(rev.categories, rev.series, false), true);
  });
};

onMounted(() => {
  if (corporateChartRef.value) chart1 = echarts.init(corporateChartRef.value);
  if (personnelChartRef.value) chart2 = echarts.init(personnelChartRef.value);
  if (revenueChartRef.value) chart3 = echarts.init(revenueChartRef.value);
  processData();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  [chart1, chart2, chart3].forEach(c => c?.dispose());
});

const handleResize = () => [chart1, chart2, chart3].forEach(c => c?.resize());
watch(() => props.summaryData, processData, { deep: true });
</script>

<style scoped>
.left {
  width: 480px;
  height: 100%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  box-sizing: border-box;
}
.item-box {
  flex: 1;
  background-color: #fff;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  font-size: 18px;
  font-weight: bold;
}
.total-badge {
  font-size: 16px;
  background-color: #f5f5f5;
  color: #666;
  padding: 4px 12px;
  border-radius: 20px;
}
.content {
  flex: 1;
  position: relative;
  padding: 5px 10px;
}
.unit-tip {
  position: absolute;
  font-size: 14px;
  color: #bbb;
  z-index: 10;
}
.unit-tip.horizontal {
  top: 0px;
  right: 16px;
}
.unit-tip.vertical {
  top: 0px;
  left: 16px;
}
.chart-container {
  width: 100%;
  height: 100%;
}
</style>