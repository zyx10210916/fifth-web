<template>
  <div class="content-main">
    <!-- 四个均分的竖直柱状图 -->
    <div class="charts-section">
      <!-- 第一行：两个柱状图 -->
      <div class="chart-row">
        <!-- 第一个柱状图 -->
        <div class="chart-container">
          <div class="chart-header">
            <h4 class="chart-title">{{ chartTitle1 || '柱状图1' }}</h4>
          </div>
          <div class="chart-content">
            <RegionBarChart
                :chartData="barChartData1"
                :selectedRegion="selectedRegion"
            />
          </div>
        </div>

        <!-- 第二个柱状图 -->
        <div class="chart-container">
          <div class="chart-header">
            <h4 class="chart-title">{{ chartTitle2 || '柱状图2' }}</h4>
          </div>
          <div class="chart-content">
            <RegionBarChart
                :chartData="barChartData2"
                :selectedRegion="selectedRegion"
            />
          </div>
        </div>
      </div>

      <!-- 第二行：两个柱状图 -->
      <div class="chart-row">
        <!-- 第三个柱状图 -->
        <div class="chart-container">
          <div class="chart-header">
            <h4 class="chart-title">{{ chartTitle3 || '柱状图3' }}</h4>
          </div>
          <div class="chart-content">
            <RegionBarChart
                :chartData="barChartData3"
                :selectedRegion="selectedRegion"
            />
          </div>
        </div>

        <!-- 第四个柱状图 -->
        <div class="chart-container">
          <div class="chart-header">
            <h4 class="chart-title">{{ chartTitle4 || '柱状图4' }}</h4>
          </div>
          <div class="chart-content">
            <RegionBarChart
                :chartData="barChartData4"
                :selectedRegion="selectedRegion"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import RegionBarChart from '../RegionBarChart/index.vue';

// 定义组件属性
const props = defineProps({
  barChartData1: {
    type: Object,
    required: true
  },
  barChartData2: {
    type: Object,
    required: true
  },
  barChartData3: {
    type: Object,
    required: true
  },
  barChartData4: {
    type: Object,
    required: true
  },
  selectedRegion: {
    type: String,
    default: ''
  },
  chartTitle1: {
    type: String,
    default: ''
  },
  chartTitle2: {
    type: String,
    default: ''
  },
  chartTitle3: {
    type: String,
    default: ''
  },
  chartTitle4: {
    type: String,
    default: ''
  },
  currentAnalysis: {
    type: String,
    default: ''
  }
});
</script>

<style scoped lang="less">
/* 复用Layout1的基础样式 */
.content-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

.charts-section {
  flex: 1;
  background-color: white;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  min-width: 0;
  padding: 16px;
}

.chart-row {
  display: flex;
  gap: 16px;
  min-height: 0;
  flex: 1;
}

.chart-container {
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  border: 1px solid #f0f0f0;
  flex: 1; /* 四个容器均分宽度 */

  .chart-header {
    padding: 16px 24px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #f0f0f0;

    .chart-title {
      font-size: 16px;
      font-weight: 500;
      color: #262626;
      margin: 0;
    }
  }

  .chart-content {
    flex: 1;
    padding: 16px;
    min-height: 0;
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .chart-row {
    flex-direction: column;

    .chart-container {
      height: 300px;
    }
  }
}
</style>