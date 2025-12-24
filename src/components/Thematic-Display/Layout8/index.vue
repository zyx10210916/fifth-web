<template>
  <div class="content-main">
    <!-- 上方：地图和图表区域 -->
    <div class="charts-map-row">
      <!-- 左侧地图区域（与Layout1相同） -->
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
        <!-- 第一排：一个竖直柱状图 -->
        <div class="chart-row">
          <div class="chart-container full-width">
            <div class="chart-header">
              <h4 class="chart-title">{{ barChartTitle || '区域基本单位数' }}</h4>
            </div>
            <div class="chart-content">
              <RegionBarChart
                  :chartData="barChartData"
                  :selectedRegion="selectedRegion"
              />
            </div>
          </div>
        </div>

        <!-- 第二排：三个饼状图 -->
        <div class="chart-row">
          <!-- 第一个饼状图 -->
          <div class="chart-container">
            <div class="chart-header">
              <h4 class="chart-title">{{ pieChartTitle1 || '饼状图1' }}</h4>
            </div>
            <div class="chart-content">
              <RegistrationPieChart
                  :chartData="pieChartData1"
              />
            </div>
          </div>

          <!-- 第二个饼状图 -->
          <div class="chart-container">
            <div class="chart-header">
              <h4 class="chart-title">{{ pieChartTitle2 || '饼状图2' }}</h4>
            </div>
            <div class="chart-content">
              <RegistrationPieChart
                  :chartData="pieChartData2"
              />
            </div>
          </div>

          <!-- 第三个饼状图 -->
          <div class="chart-container">
            <div class="chart-header">
              <h4 class="chart-title">{{ pieChartTitle3 || '饼状图3' }}</h4>
            </div>
            <div class="chart-content">
              <RegistrationPieChart
                  :chartData="pieChartData3"
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
    required: true
  },
  barChartData: {
    type: Object,
    required: true
  },
  barChartTitle: {
    type: String,
    default: ''
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
  pieChartTitle1: {
    type: String,
    default: ''
  },
  pieChartTitle2: {
    type: String,
    default: ''
  },
  pieChartTitle3: {
    type: String,
    default: ''
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

<style scoped lang="less">
/* 复用Layout1的样式 */
.content-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}

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

  .section-header {
    padding: 16px 24px;
    flex-shrink: 0;

    .section-title {
      font-size: 20px;
      font-weight: 500;
      color: #262626;
      margin: 0;
    }
  }

  .map-container {
    flex: 1;
    padding: 16px;
    min-height: 0;
  }
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
  flex: 1;

  &.full-width {
    width: 100%;
  }

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
  .charts-map-row {
    flex-direction: column;

    .map-section {
      height: 50vh;
      min-height: 400px;
    }

    .charts-section {
      height: auto;
      min-height: 600px;

      .chart-row {
        &:first-child {
          height: 300px;
        }

        &:last-child {
          flex-direction: column;

          .chart-container {
            height: 250px;
          }
        }
      }
    }
  }
}
</style>