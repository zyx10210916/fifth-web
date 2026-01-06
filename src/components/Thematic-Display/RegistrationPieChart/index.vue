<template>
  <div ref="chartContainer" className="registration-pie-chart"></div>
</template>

<script setup lang="ts">
import {ref, onMounted, watch, nextTick, Ref} from 'vue';
import * as echarts from 'echarts';
import type {ECharts} from 'echarts';

// 定义数据项类型
interface ChartDataItem {
  name: string;
  value: number;
  color: string;
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
}, {deep: true});

const initChart = () => {
  if (!chartContainer.value) return;

  chart = echarts.init(chartContainer.value);

  const total: number = props.chartData.reduce((sum, item) => sum + item.value, 0);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: '60%',
      top: 'center',
      width: '50%',
      formatter: function (name) {
        const item = props.chartData.find(d => d.name === name);
        const value = item ? item.value : 0;
        return name + ':    ' + value + '个      ';
      },
      data: props.chartData.map(item => item.name),
      icon: 'circle'
    },
    series: [
      {
        name: '注册类型构成',
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['30%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        },
        backgroundStyle:{
          color: '#f1f2f4'
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold',
            formatter: '{b}\n{c} ({d}%)'
          }
        },
        labelLine: {
          show: false
        },
        data: props.chartData.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: item.color
          }
        } satisfies echarts.PieSeriesOption['data']))
}
]
}
  ;

  chart.setOption(option);
};

const updateChart = () => {
  if (!chart) return;

  chart.setOption({
    legend: {
      formatter: function (name) {
        const item = props.chartData.find(d => d.name === name);
        const value = item ? item.value : 0;
        const color = item ? item.color : '#333';
        return name + ':  ' + value + '个                ';
      },
      data: props.chartData.map(item => item.name)
    },
    series: [{
      data: props.chartData.map(item => ({
        name: item.name,
        value: item.value,
        itemStyle: {
          color: item.color
        }
      })),
      backgroundStyle:{
        color: '#f1f2f4'
      },
    } as echarts.PieSeriesOption]
  });
};
</script>

<style scoped>
.registration-pie-chart {
  width: 100%;
  height: 100%;
  min-height: 200px;
}
</style>
