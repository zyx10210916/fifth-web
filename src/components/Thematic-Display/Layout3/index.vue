<template>
  <div class="content-main">
    <!-- 上方：地图和图表区域 -->
    <div class="charts-map-row">
      <!-- 左侧地图区域 -->
      <div class="map-section">
        <div class="section-header">
          <h3 class="section-title">广州市基本单位区域分布</h3>
        </div>
        <div class="map-container">
          <GuangzhouMap
              :regionData="mapData"
              :selectedRegion="selectedRegion"
              @region-click="handleRegionClick"
          />
        </div>
      </div>

      <!-- 右侧图表区域 -->
      <div class="charts-section">
        <!-- 第一行：占比2/3的柱状图和一个饼状图 -->
        <div class="chart-row">
          <div class="chart-container two-thirds-width">
            <div class="chart-header">
              <h4 class="chart-title">区域基本单位数对比</h4>
            </div>
            <div class="chart-content">
              <RegionBarChart
                  :chartData="barChartData1"
                  :selectedRegion="selectedRegion"
              />
            </div>
          </div>

          <div class="chart-container one-third-width">
            <div class="chart-header">
              <h4 class="chart-title">注册类型构成</h4>
            </div>
            <div class="chart-content">
              <RegistrationPieChart
                  :chartData="pieChartData1"
              />
            </div>
          </div>
        </div>

        <!-- 第二行：三个饼状图 -->
        <div class="chart-row">
          <div class="chart-container one-third-width">
            <div class="chart-header">
              <h4 class="chart-title">行业分布</h4>
            </div>
            <div class="chart-content">
              <RegistrationPieChart
                  :chartData="pieChartData2"
              />
            </div>
          </div>

          <div class="chart-container one-third-width">
            <div class="chart-header">
              <h4 class="chart-title">规模分布</h4>
            </div>
            <div class="chart-content">
              <RegistrationPieChart
                  :chartData="pieChartData3"
              />
            </div>
          </div>

          <div class="chart-container one-third-width">
            <div class="chart-header">
              <h4 class="chart-title">经济类型</h4>
            </div>
            <div class="chart-content">
              <RegistrationPieChart
                  :chartData="pieChartData4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import GuangzhouMap from '../GuangzhouMap/index.vue';
import RegionBarChart from '../RegionBarChart/index.vue';
import RegistrationPieChart from '../RegistrationPieChart/index.vue';

// 定义组件属性
const props = defineProps({
  mapData: {
    type: Object,
    required: true
  },
  selectedRegion: {
    type: String,
    default: 'all'
  },
  barChartData1: {
    type: Object,
    required: true
  },
  pieChartData1: {
    type: Object,
    required: true
  },
  pieChartData2: {
    type: Object,
    required: true
  },
  pieChartData3: {
    type: Object,
    required: true
  },
  pieChartData4: {
    type: Object,
    required: true
  },
  currentAnalysis: {
    type: String,
    default: ''
  }
});

// 定义事件
const emit = defineEmits(['region-click']);

// 区域点击事件处理
const handleRegionClick = (region) => {
  emit('region-click', region);
};
</script>

<style scoped>
/* 复用Layout1的样式，保持一致 */
.charts-map-row {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.map-section {
  flex: 1;
  background: white;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.section-header {
  padding: 16px 24px;
  flex-shrink: 0;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  color: #262626;
  margin: 0;
}

.map-container {
  flex: 1;
  padding: 16px;
  min-height: 0;
}

.charts-section {
  flex: 2;
  background-color: white;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  min-width: 0;
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
}

.chart-container.two-thirds-width {
  flex: 2;
  min-width: 0;
}

.chart-container.one-third-width {
  flex: 1;
  min-width: 0;
}

.chart-header {
  padding: 16px 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chart-title {
  font-size: 20px;
  font-weight: 500;
  color: #262626;
  margin: 0;
}

.chart-subtitle {
  font-size: 14px;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 12px;
}

.chart-content {
  flex: 1;
  padding: 16px;
  min-height: 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .charts-map-row {
    flex-direction: column;
  }

  .map-section {
    height: 50vh;
    min-height: 400px;
  }

  .charts-section {
    height: auto;
    min-height: 400px;
  }

  .chart-row {
    flex-direction: column;
  }

  .chart-container.two-thirds-width,
  .chart-container.one-third-width {
    flex: none;
    height: 300px;
  }
}
</style>