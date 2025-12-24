<template>
  <aside class="right-charts-panel">
    <div class="item-box">
      <div class="head">
        资产情况，总计：12345万元 
        <div class="right"></div>
      </div>
      <div class="content">
        <div ref="assetChartRef" class="chart-container"></div>
      </div>
    </div>
    
    <div class="item-box">
      <div class="head">
        营业利润，总计：12345万元 
        <div class="right"></div>
      </div>
      <div class="content">
        <div ref="profitChartRef" class="chart-container"></div>
      </div>
    </div>
  </aside>
</template>
 
<script setup lang="ts">
import * as echarts from 'echarts';
import { ref, onMounted } from 'vue';
import type { EChartsOption } from 'echarts'; 
 
const assetChartRef = ref<HTMLElement | null>(null);
const profitChartRef = ref<HTMLElement | null>(null);
 
const initChart = (ref: HTMLElement | null, option: EChartsOption) => {
  if (ref) {
    const chart = echarts.init(ref);  
    chart.setOption(option);  
    window.addEventListener('resize',  () => {
      chart.resize();  
    });
  }
};
 
onMounted(() => {
  // 资产情况 - 分组柱状图 
  const rightChartData = {
    labels: ['制造业', '商业', '服务业', '贸易业'], 
    materials: [45, 30, 50, 35],
    exam: [30, 25, 40, 48],
  };
 
  const createGroupedBarOption = (data: typeof rightChartData): EChartsOption => ({
    color: ['#1890ff', '#ff0099'], 
    legend: { 
      show: true, 
      data: ['Materials', 'Exam'], 
      bottom: 0, 
      right: 'center',
      textStyle: { fontSize: 10, color: '#666' },
      itemGap: 10, 
      icon: 'rect', 
      itemWidth: 10,
      itemHeight: 10,
    },
    grid: { left: '3%', right: '3%', bottom: '20%', top: '15%', containLabel: true }, 
    xAxis: { 
      type: 'category', 
      data: data.labels,  
      axisLine: { show: false }, 
      axisTick: { show: false }, 
      axisLabel: { fontSize: 10, color: '#666' } 
    },
    yAxis: { 
      type: 'value', 
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }, 
      axisLabel: { fontSize: 10, color: '#666' },
      max: 60,
      interval: 20 
    },
    series: [
      { 
        name: 'Materials', 
        type: 'bar', 
        data: data.materials,  
        barGap: '20%', 
        barCategoryGap: '35%', 
        itemStyle: { borderRadius: [5, 5, 0, 0] } 
      },
      { 
        name: 'Exam', 
        type: 'bar', 
        data: data.exam,  
        itemStyle: { borderRadius: [5, 5, 0, 0] } 
      },
    ],
  });
 
  initChart(assetChartRef.value,  createGroupedBarOption(rightChartData));
 
  // 营业利润 - 折线图 
  const profitOption: EChartsOption = {
    color: ['#409EFF', '#ff0099'],
    legend: { 
      show: true, 
      data: ['Materials', 'Exam'], 
      bottom: 0, 
      right: 'center', 
      textStyle: { fontSize: 10, color: '#666' },
      itemGap: 10, 
      icon: 'rect', 
      itemWidth: 10,
      itemHeight: 10,
    },
    grid: { left: '3%', right: '3%', bottom: '20%', top: '15%', containLabel: true }, 
    xAxis: { 
      type: 'category', 
      data: ['Q1', 'Q2', 'Q3', 'Q4', 'Q1', 'Q2', 'Q3', 'Q4'], 
      axisLine: { show: true, lineStyle: { color: '#ccc' } }, 
      axisTick: { show: false },
      axisLabel: { fontSize: 10, color: '#666' } 
    },
    yAxis: { 
      type: 'value', 
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
      axisLabel: { fontSize: 10, color: '#666' },
      max: 100 
    },
    series: [
      {
        name: 'Materials', 
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: [70, 60, 45, 50, 65, 75, 80, 70],
        lineStyle: { color: '#409EFF', width: 2 },
      },
      {
        name: 'Exam', 
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: [50, 40, 35, 40, 50, 60, 55, 45],
        lineStyle: { color: '#ff0099', width: 2 },
      },
    ],
  };
  initChart(profitChartRef.value,  profitOption);
});
</script>
 
<style scoped>
.right-charts-panel {
  width: 380px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
  background-color: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
 
.item-box {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(253, 249, 249, 1);
  flex: 1;
  min-height: 0; /* 确保flex item可以收缩 */
  height: 700px;
}
 
.item-box .head {
  padding: 12px 12px;
  font-size: 14px;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
 
.item-box .content {
  height: calc(100% - 45px); /* 减去head的高度 */
}
 
.chart-container {
  width: 100%;
  height: 100%;
}
</style>