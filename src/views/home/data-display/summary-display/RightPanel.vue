<template>
  <aside class="right">
    <div class="item-box">
      <div class="head">
        <span class="title">资产情况</span>
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
        <span class="title">营业利润</span>
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

const getBarOption = (data: any[], use3D: boolean): any => {
  const names = data.map(item => item.name);
  const values = data.map(item => item.value);
  const colors = ['#85e1ff', '#009dff'];

  if (!use3D) {
    // 2D 
    return {
      grid: { top: '15%', left: '3%', right: '3%', bottom: '5%', containLabel: true },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: names, axisLabel: { interval: 0, rotate: 35 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
      series: [{
        type: 'bar', barWidth: '40%', data: values,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: colors[0] }, 
            { offset: 1, color: colors[1] }  
          ])
        }
      }]
    };
  }

  // ---  3D 部分 ---
  return {
    tooltip: { 
      trigger: 'item',
      formatter: (params: any) => {
        const index = params.data[0];
        const name = names[index];
        const value = params.data[2];
        return `${name} : ${value} 万元`;
      }
    },
    xAxis3D: { 
      type: 'category', 
      data: names, 
      name: '',
      axisLabel: { 
        show: true,
        margin: 25, 
        rotate: 45,
        textStyle: { color: '#333', fontSize: 12, backgroundColor: 'transparent' },
        interval: 0 ,
        align:'left'
      },
      axisLine: { lineStyle: { color: '#666' } }
    },
    yAxis3D: { 
      type: 'category', 
      data: [''], 
      name: '',
      axisLine: { lineStyle: { color: 'transparent' } } 
    },
    zAxis3D: { 
      type: 'value', 
      name: '',
      axisLabel: { margin: 40 },
      splitLine: { show: true } 
    },
    grid3D: {
      boxWidth: 160,
      boxHeight: 90,
      boxDepth: 20,
      viewControl: { 
        alpha: 10, 
        beta: 35, 
        distance: 180,
        center: [0,0,0],
        projection: 'perspective' 
      },
      bottom: '5%',
      top:'-10%'
    },
    series: [{
      type: 'bar3D',
      data: values.map((val, idx) => [idx, 0, val]),
      shading: 'lambert',
      label: { show: false },
      itemStyle: { 
        color: colors[1], 
        opacity: 0.95 
      },
    }]
  };
};

const processData = () => {
  const res = props.summaryData;
  if (!res || !Object.keys(res).length) return;

  nextTick(() => {
    if (res.totalAssets) {
      const assetsData = res.totalAssets.map((item: any) => ({
        name: item.name, value: (Number(item.value) / 10000).toFixed(2)
      }));
      totalAssetsSum.value = res.totalAssets.reduce((acc: number, cur: any) => acc + Number(cur.value), 0);
      assetChart?.setOption(getBarOption(assetsData, is3D.asset), true);
    }

    if (res.operatingProfit) {
      const profitData = res.operatingProfit.map((item: any) => ({
        name: item.name, value: (Number(item.value) / 10000).toFixed(2)
      }));
      totalProfitSum.value = res.operatingProfit.reduce((acc: number, cur: any) => acc + Number(cur.value), 0);
      profitChart?.setOption(getBarOption(profitData, is3D.profit), true);
    }
  });
};

const handleResize = () => { assetChart?.resize(); profitChart?.resize(); };

onMounted(() => {
  nextTick(() => {
    if (assetChartRef.value) assetChart = echarts.init(assetChartRef.value);
    if (profitChartRef.value) profitChart = echarts.init(profitChartRef.value);
    processData();
  });
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
  border-radius: 6px;
  box-sizing: border-box;
  background-color: white;
  gap:0;
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
  box-sizing: border-box;
}

.head-right {
  display: flex;
  align-items: center;
  gap: 5px;
}

.view-switch {
  display: flex;
  align-items: center;
}

.view-switch :deep(.el-radio-button__inner) {
  padding: 5px 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  height: 28px;
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
  line-height: 1;
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
  min-height: 250px;
}
</style>