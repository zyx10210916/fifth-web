<template>
  <div class="left">
    <div class="item-box">
      <div class="head">
        <span>法人单位数量</span>
        <div class="head-right">
          <el-radio-group v-model="is3D.corporate" size="small" @change="processData" class="view-switch">
            <el-radio-button :label="false">2D</el-radio-button>
            <el-radio-button :label="true">3D</el-radio-button>
          </el-radio-group>
          <span class="total-badge">{{ totalCorporateCount }} 家</span>
        </div>
      </div>
      <div class="content">
        <div class="unit-tip">单位：家</div>
        <div ref="corporateChartRef" class="chart-container"></div>
      </div>
    </div>

    <div class="item-box">
      <div class="head">
        <span>从业人员期末人数</span>
        <div class="head-right">
          <el-radio-group v-model="is3D.personnel" size="small" @change="processData" class="view-switch">
            <el-radio-button :label="false">2D</el-radio-button>
            <el-radio-button :label="true">3D</el-radio-button>
          </el-radio-group>
          <span class="total-badge">{{ (totalPersonnel / 10000).toFixed(2) }} 万人</span>
        </div>
      </div>
      <div class="content">
        <div class="unit-tip">单位：人</div>
        <div ref="personnelChartRef" class="chart-container"></div>
      </div>
    </div>

    <div class="item-box">
      <div class="head">
        <span>营业收入</span>
        <div class="head-right">
          <el-radio-group v-model="is3D.revenue" size="small" @change="processData" class="view-switch">
            <el-radio-button :label="false">2D</el-radio-button>
            <el-radio-button :label="true">3D</el-radio-button>
          </el-radio-group>
          <span class="total-badge">{{ (totalEconomic / 10000).toFixed(2) }} 万元</span>
        </div>
      </div>
      <div class="content">
        <div class="unit-tip">单位：万元</div>
        <div ref="revenueChartRef" class="chart-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import 'echarts-gl';
import { ref, watch, onMounted, onUnmounted, reactive, nextTick } from 'vue';

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

const is3D = reactive({ corporate: false, personnel: false, revenue: false });

// 配色
const colorPalette = [
  ['#ffb570', '#ff8800'], // 橙色
  ['#85e1ff', '#009dff'], // 蓝色
  ['#50e3c2', '#11a382'], // 绿色
  ['#b6a2de', '#675bba']  // 紫色
];

const getBarOption = (rawData: any, dataKey: string, use3D: boolean): any => {
  const regions = Object.keys(rawData);
  const categorySet = new Set<string>();
  regions.forEach(reg => {
    rawData[reg][dataKey]?.forEach((item: any) => categorySet.add(item.name));
  });
  const categories = Array.from(categorySet);

  if (!use3D) {
    // --- 2D 部分---
    const series = regions.map((reg, index) => {
      const regionMap = new Map();
      rawData[reg][dataKey]?.forEach((item: any) => {
        let val = Number(item.value) || 0;
        if (dataKey === 'operatingIncome') {
          val = val / 10000;
        }
        regionMap.set(item.name, val);
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
      xAxis: { type: 'category', data: categories, axisLabel: { interval: 0 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color:'#fafafa' } } },
      series: series
    };
  }

  // --- 3D 部分 ---
  const series3D = regions.map((reg, regIdx) => {
    const regionMap = new Map();
    rawData[reg][dataKey]?.forEach((item: any) => {
      let val = Number(item.value) || 0;
      if (dataKey === 'operatingIncome') {
        val = val / 10000;
      }
      regionMap.set(item.name, val);
    });
    const mainColor = colorPalette[regIdx % colorPalette.length][1];

    return {
      type: 'bar3D',
      name: reg,
      data: categories.map((cat, catIdx) => [catIdx, regIdx, regionMap.get(cat) || 0]),
      shading: 'lambert',
      label: { show: false },
      itemStyle: { 
        color: mainColor, 
        opacity: 0.95 
      },
      barSize: 12 
    };
  });

  return {
    tooltip: {
      formatter: (params: any) => {
        const catName = categories[params.data[0]];
        return `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${params.color};"></span>${params.seriesName}<br/>${catName}: ${params.data[2]}`;
      }
    },
    legend: { show: true, top: '2%' },
    xAxis3D: { 
      type: 'category', 
      data: categories, 
      name: '',
      axisLabel: { margin: 30, rotate: 45, interval: 0, textStyle: { color: '#333' } }
    },
    yAxis3D: { type: 'category', data: regions, name: '', axisLabel: { show: false } },
    zAxis3D: { type: 'value', name: '', axisLabel: { margin: 40 }, splitLine:{ show: true, lineStyle:{ type: 'dashed', color: 'rgba(0, 0, 0, 0.1)', width: 1}} },
    grid3D: {
      boxWidth: 160,
      boxHeight: 90,
      boxDepth: 60, 
      viewControl: { 
        alpha: 5, 
        beta: 15, 
        distance: 180,
        center: [0, -10, 0], 
        projection: 'perspective' 
      },
      splitLine:{
        lineStyle:{ color: '#eee', opacity: 0.3}
      },
      top: '5%',
      bottom: '18%' 
    },
    series: series3D
  };
};

const processData = () => {
  const data = props.summaryData;
  if (!data || Object.keys(data).length === 0) return;

  nextTick(() => {
    // 法人单位数量
    totalCorporateCount.value = Object.values(data).reduce((acc: any, cur: any) => acc + (cur.legalPersonNum || 0), 0);
    chart1?.setOption(getBarOption(data, 'legalPersonNumList', is3D.corporate), true);

    // 从业人员期末人数统计
    totalPersonnel.value = Object.values(data).reduce((acc: any, cur: any) => {
      const sum = cur.employmentPersonnel?.reduce((a: any, b: any) => a + (Number(b.value) || 0), 0) || 0;
      return acc + sum;
    }, 0);
    chart2?.setOption(getBarOption(data, 'employmentPersonnel', is3D.personnel), true);

    // 营业收入统计
    totalEconomic.value = Object.values(data).reduce((acc: any, cur: any) => {
      const sum = cur.operatingIncome?.reduce((a: any, _b: any) => a + (Number(_b.value) || 0), 0) || 0;
      return acc + sum;
    }, 0);
    chart3?.setOption(getBarOption(data, 'operatingIncome', is3D.revenue), true);
  });
};

const handleResize = () => { [chart1, chart2, chart3].forEach(c => c?.resize()); };

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

watch(() => props.summaryData, processData, { deep: true });
</script>

<style scoped>
.left {
  width: 100%;
  height: 100%;
  background-color: white;
  padding: 10px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
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