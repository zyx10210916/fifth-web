<template>
  <div class="statistical-chart-container">
    <div class="chart-content">
      <div ref="chartContainer" class="chart-wrapper"></div>
    </div>
    <div class="chart-actions">
      <a-button
          type="primary"
          class="download-btn"
          @click="handleDownload"
      >
        <template #icon>
          <DownloadOutlined />
        </template>
        下载
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { DownloadOutlined } from '@ant-design/icons-vue';

// 定义组件属性类型
interface ChartDataItem {
  name: string;
  data: number[];
}

interface Props {
  chartData?: ChartDataItem[];
  xAxisData?: string[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  chartData: () => [
    { name: 'Materials', data: [12, 18, 15, 22, 19, 25, 30] },
    { name: 'Exam', data: [8, 12, 10, 16, 14, 20, 18] }
  ],
  xAxisData: () => ['XXXXXX', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', 'XXXXXX', 'XXXXXX'],
  loading: false
});

// 定义事件
const emit = defineEmits<{
  export: [format: string]
}>();

// 图表相关引用
const chartContainer = ref<HTMLElement>();
let chartInstance: echarts.ECharts | null = null;

// 初始化图表
const initChart = () => {
  if (!chartContainer.value) return;

  // 销毁现有实例
  if (chartInstance) {
    chartInstance.dispose();
  }

  // 创建新实例
  chartInstance = echarts.init(chartContainer.value);

  // 设置图表选项
  const option = {
    backgroundColor: '#fafafa',
    grid: {
      left: '3%',
      right: '6%', // 增加右侧边距，确保x轴名称完全显示
      bottom: '10%', // 增加底部边距，为x轴名称留出空间
      top: '10%',
      containLabel: true
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#ddd',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#999',
          width: 1
        }
      }
    },
    legend: {
      data: props.chartData.map(item => item.name),
      right: 10,
      top: 10,
      textStyle: {
        color: '#666',
        fontSize: 12
      },
      itemWidth: 12,
      itemHeight: 8
    },
    xAxis: {
      type: 'category',
      data: props.xAxisData,
      name: '专业代码', // 添加x轴名称
      nameLocation: 'center', // 设置x轴名称居中显示
      nameGap: 30, // 增加名称与轴线的距离
      nameTextStyle: {
        color: '#666',
        fontSize: 12,
        padding: [10, 0, 0, 0]
      },
      axisLine: {
        lineStyle: {
          color: '#ccc'
        }
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#666',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      // 移除y轴单位
      axisLine: {
        show: true,
        lineStyle: {
          color: '#ccc'
        }
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#eee',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: '#666',
        fontSize: 11,
        formatter: (value: number) => {
          return value.toFixed(0);
        }
      }
    },
    series: props.chartData.map((item, index) => ({
      name: item.name,
      type: 'line',
      data: item.data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2,
        color: index === 0 ? '#1f77b4' : '#aec7e8' // 深蓝色和浅蓝色
      },
      itemStyle: {
        color: index === 0 ? '#1f77b4' : '#aec7e8'
      },
      areaStyle: index === 0 ? undefined : {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(174, 199, 232, 0.3)' },
          { offset: 1, color: 'rgba(174, 199, 232, 0.1)' }
        ])
      }
    }))
  };

  chartInstance.setOption(option);
};

// 处理下载
const handleDownload = () => {
  if (chartInstance) {
    const chartDataURL = chartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    });

    // 创建下载链接
    const link = document.createElement('a');
    link.href = chartDataURL;
    link.download = '统计图表.png';
    link.click();

    emit('export', 'png');
  }
};

// 响应窗口大小变化
const handleResize = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

// 监听数据变化
watch(() => props.chartData, () => {
  // 即使chartInstance不存在，也会在onMounted中初始化
  initChart();
}, { deep: true });

// 监听x轴数据变化
watch(() => props.xAxisData, () => {
  // 即使chartInstance不存在，也会在onMounted中初始化
  initChart();
}, { deep: true });

// 生命周期
onMounted(() => {
  nextTick(() => {
    initChart();
    window.addEventListener('resize', handleResize);
  });
});

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
  window.removeEventListener('resize', handleResize);
});
</script>

<style lang="scss" scoped>
.statistical-chart-container {
  width: 100%;
  height: 500px;
  display: flex;
  flex-direction: column;
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;

  .chart-header {
    padding: 16px 20px 0;
    border-bottom: 1px solid #f9f9f9;

    .chart-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
  }

  .chart-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;

    .chart-wrapper {
      flex: 1;
      width: 100%;
      min-height: 400px;
    }
  }

  .chart-actions {
    display: flex;
    justify-content: flex-end;
    padding: 0 24px 24px;
      background: #f9f9f9;

    .download-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 32px; /* 与原ok按钮高度一致 */
      padding: 0 16px; /* 增加左右内边距 */
      font-size: 14px;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); /* 添加阴影效果 */

      :deep(.anticon) {
        font-size: 14px;
      }

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); /* 悬停时增强阴影 */
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .statistical-chart-container {
    height: 400px;

    .chart-content {
      .chart-actions {
        right: 10px;
        bottom: 10px;
      }
    }
  }
}
</style>