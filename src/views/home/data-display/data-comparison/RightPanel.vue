<template>
  <aside class="right">
    <div class="item-box">
      <div class="head">
        <span>资产情况</span>
        <div class="head-right">
          <el-radio-group v-model="is3D.asset" size="small" @change="processData" class="view-switch">
            <el-radio-button :label="false">2D</el-radio-button>
            <el-radio-button :label="true">3D</el-radio-button>
          </el-radio-group>
          <span class="total-badge">{{ (totalAssetsSum / 10000).toFixed(2) }} 万元</span>
        </div>
      </div>
      <div class="content">
        <div class="unit-tip">单位：万元</div>
        <div ref="assetChartRef" class="chart-container"></div>
      </div>
    </div>

    <div class="item-box">
      <div class="head">
        <span>营业利润</span>
        <div class="head-right">
          <el-radio-group v-model="is3D.profit" size="small" @change="processData" class="view-switch">
            <el-radio-button :label="false">2D</el-radio-button>
            <el-radio-button :label="true">3D</el-radio-button>
          </el-radio-group>
          <span class="total-badge">{{ (totalProfitSum / 10000).toFixed(2) }} 万元</span>
        </div>
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
import 'echarts-gl';
import { ref, watch, onMounted, onUnmounted, nextTick, reactive } from 'vue';

const props = defineProps({
  summaryData: { type: Object, default: () => ({}) }
});

const assetChartRef = ref<HTMLElement | null>(null);
const profitChartRef = ref<HTMLElement | null>(null);
let assetChart: echarts.ECharts | null = null;
let profitChart: echarts.ECharts | null = null;

const totalAssetsSum = ref(0);
const totalProfitSum = ref(0);
const is3D = reactive({ asset: false, profit: false });

const colorPalette = [
  ['#ffb570', '#ff8800'], ['#85e1ff', '#009dff'], ['#50e3c2', '#11a382'],
  ['#b6a2de', '#675bba'], ['#ff9db5', '#e03e52']
];

const getBarOption = (rawData: any, dataKey: string, use3D: boolean): any => {
  const regions = Object.keys(rawData);
  const categorySet = new Set<string>();
  regions.forEach(reg => {
    rawData[reg][dataKey]?.forEach((item: any) => categorySet.add(item.name));
  });
  const categories = Array.from(categorySet);

  if (!use3D) {
    // --- 2D 部分 ---
    const series = regions.map((reg, index) => {
      const regionMap = new Map();
      rawData[reg][dataKey]?.forEach((item: any) => {
        regionMap.set(item.name, (Number(item.value) / 10000)); // 转换万元
      });
      const colors = colorPalette[index % colorPalette.length];
      return {
        name: reg,
        type: 'bar',
        barMaxWidth: 16,
        data: categories.map(cat => regionMap.get(cat) || 0),
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors[0] },
            { offset: 1, color: colors[1] }
          ])
        }
      };
    });

    return {
      grid: { top: '20%', left: '3%', right: '3%', bottom: '10%', containLabel: true },
      legend: { show: true, top: '0%', icon: 'roundRect' },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'category', data: categories, axisLabel: { interval: 0, rotate: 30 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } } },
      series: series
    };
  }

  // --- 3D 部分 ---
  const series3D = regions.map((reg, regIdx) => {
    const regionMap = new Map();
    rawData[reg][dataKey]?.forEach((item: any) => {
      regionMap.set(item.name, (Number(item.value) / 10000)); // 转换万元
    });
    const mainColor = colorPalette[regIdx % colorPalette.length][1];

    return {
      type: 'bar3D',
      name: reg,
      data: categories.map((cat, catIdx) => [catIdx, regIdx, regionMap.get(cat) || 0]),
      shading: 'lambert',
      itemStyle: { color: mainColor, opacity: 0.95 },
      barSize: 12
    };
  });

  return {
    tooltip: {
      formatter: (params: any) => {
        const catName = categories[params.data[0]];
        return `${params.seriesName}<br/>${catName}: ${params.data[2].toFixed(2)} 万元`;
      }
    },
    legend: { show: true, top: '2%' },
    xAxis3D: { 
      type: 'category', data: categories, name: '', 
      axisLabel: { margin: 20,  interval: 0, textStyle: { color: '#333' } } 
    },
    yAxis3D: { type: 'category', data: regions, name: '', axisLabel: { show: false } },
    zAxis3D: { 
      type: 'value', name: '', 
      axisLabel: { margin: 25, textStyle: { color: '#999' } },
      splitLine: { show: true, lineStyle: { type: 'dashed', color: 'rgba(0, 0, 0, 0.05)', width: 1 } }
    },
    grid3D: {
      boxWidth: 160, boxHeight: 80, boxDepth: 60,
      viewControl: { alpha: 13, beta: 25, distance: 180, center: [15, 10, 15,10], projection: 'perspective' },
      top: '-15%', bottom: '22%'
    },
    series: series3D
  };
};

const processData = () => {
  const data = props.summaryData;
  if (!data || Object.keys(data).length === 0) return;

  nextTick(() => {
    // 资产统计与绘图
    totalAssetsSum.value = Object.values(data).reduce((acc: any, cur: any) => {
      const sum = cur.totalAssets?.reduce((a: any, b: any) => a + (Number(b.value) || 0), 0) || 0;
      return acc + sum;
    }, 0);
    assetChart?.setOption(getBarOption(data, 'totalAssets', is3D.asset), true);

    // 利润统计与绘图
    totalProfitSum.value = Object.values(data).reduce((acc: any, cur: any) => {
      const sum = cur.operatingProfit?.reduce((a: any, b: any) => a + (Number(b.value) || 0), 0) || 0;
      return acc + sum;
    }, 0);
    profitChart?.setOption(getBarOption(data, 'operatingProfit', is3D.profit), true);
  });
};

const handleResize = () => { assetChart?.resize(); profitChart?.resize(); };

onMounted(() => {
  if (assetChartRef.value) assetChart = echarts.init(assetChartRef.value);
  if (profitChartRef.value) profitChart = echarts.init(profitChartRef.value);
  processData();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  assetChart?.dispose(); profitChart?.dispose();
});

watch(() => props.summaryData, processData, { deep: true });
</script>

<style scoped>
.right {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: white;
  padding: 10px;
  border-radius: 6px;
  gap: 10px;
  box-sizing: border-box;
}

.item-box {
  flex: 1;
  background-color: white;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  padding: 12px 16px;
  height: 54px;
}

.head-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.total-badge {
  font-size: 16px;
  font-weight: normal;
  background-color: #f5f5f5;
  color: #666;
  padding: 0 12px;
  border-radius: 20px;
  height: 28px;
  display: flex;
  align-items: center;
}

.content {
  flex: 1;
  position: relative;
  padding: 5px;
}

.unit-tip {
  position: absolute;
  top: 0;
  left: 15px;
  font-size: 14px;
  color: #999;
  z-index: 10;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.view-switch :deep(.el-radio-button__inner) {
  padding: 5px 10px;
  font-size: 12px;
}
</style>