<template>
  <div ref="chartContainer" class="region-bar-chart"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, Ref } from 'vue';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';

// 定义数据项类型
interface ChartDataItem {
  industry: string;
  value: number;
  color?: string;
}

// 定义props类型
interface Props {
  chartData: ChartDataItem[];
  selectedRegion: string;
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

  // 对数据进行排序（从大到小）
  const sortedData: ChartDataItem[] = [...props.chartData].sort((a, b) => b.value - a.value);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        show: false
      }
    },
    grid: {
      left: '10%',
      right: '5%',
      bottom: '5%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      show: false
    },
    yAxis: {
      type: 'category',
      data: sortedData.map(item => item.industry),
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        formatter: function(value) {
          // 行业名称过长时截断
          return value.length > 8 ? value.substring(0, 8) + '...' : value;
        }
      }
    },
    series: [
      {
        name: '基本单位数',
        type: 'bar',
        barWidth: '40%',
        barBorderRadius: [0, 8, 8, 0],
        data: sortedData.map(item => ({
          value: item.value,
          itemStyle: {
            color: item.color || '#ffd666', // 黄色
            borderRadius: [0, 8, 8, 0]
          }
        } satisfies echarts.BarSeriesOption['data'])),
          emphasis: {
            focus: 'series'
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}'
          }
        }
      ]
    };
  chart.setOption(option);
};

const updateChart = () => {
  if (!chart) return;

  const sortedData: ChartDataItem[] = [...props.chartData].sort((a, b) => b.value - a.value);

  chart.setOption({
    yAxis: {
      data: sortedData.map(item => item.industry)
    },
    series: [{
      data: sortedData.map(item => ({
        value: item.value,
        itemStyle: {
          color: item.color || '#ffd666',
          borderRadius: [0, 8, 8, 0]
        }
      }))
    } as echarts.BarSeriesOption]
  });
};
</script>

<style scoped>
.region-bar-chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
}
</style>

