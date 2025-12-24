<template>
  <div ref="chartContainer" class="industry-bar-chart"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, Ref } from 'vue';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';

// 定义数据项类型
interface ChartDataItem {
  region: string;
  value: number;
  color?: string;
}

// 定义props类型
interface Props {
  chartData: ChartDataItem[];
}

const props = defineProps<Props>();

const chartContainer: Ref<HTMLElement | null> = ref(null);
let chart: ECharts | null = null;

onMounted(() => {
  nextTick(() => {
    initChart();
  });
});

watch(() => props.chartData, () => {
  updateChart();
}, { deep: true });

const initChart = () => {
  if (!chartContainer.value) return;

  chart = echarts.init(chartContainer.value);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999',
          type: 'dashed'
        },
        shadowStyle: {
          type: 'dashed'
        }
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: props.chartData.map(item => item.region),
      axisLabel: {
        rotate: 45
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      name: '单位: 个'
    },
    series: [
      {
        name: '基本单位数',
        type: 'bar',
        barWidth: '30%',
        barBorderRadius: [15, 15, 0, 0],
        data: props.chartData.map(item => ({
          value: item.value,
          itemStyle: {
            color: item.color || '#ff85c0', // 粉色
            borderRadius: [15, 15, 0, 0]
          }
        } satisfies echarts.BarSeriesOption['data'])),
        emphasis: {
          focus: 'series'
        }
      }
    ]
};

  chart.setOption(option);
};

const updateChart = () => {
  if (!chart) return;

  chart.setOption({
    xAxis: {
      data: props.chartData.map(item => item.region)
    },
    series: [{
      data: props.chartData.map(item => ({
        value: item.value,
        itemStyle: {
          color: item.color || '#ff85c0',
          borderRadius: [100, 0, 100, 0]
        }
      }))
    } as echarts.BarSeriesOption]
  });
};
</script>

<style scoped>
.industry-bar-chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
}
</style>
