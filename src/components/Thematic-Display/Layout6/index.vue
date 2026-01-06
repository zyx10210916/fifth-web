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

      <!-- 右侧图表区域（新布局：两排） -->
      <div class="charts-section">
        <!-- 第一排：两个容器，都为竖直柱状图 -->
        <div class="chart-row row-1">
          <!-- 第一个容器：竖直柱状图 -->
          <div class="chart-container container-1">
            <div class="chart-header">
              <h4 class="chart-title">区域基本单位数</h4>
            </div>
            <div class="chart-content">
              <RegionBarChart
                  :chartData="barChartData1"
                  :selectedRegion="selectedRegion"
              />
            </div>
          </div>

          <!-- 第二个容器：竖直柱状图 -->
          <div class="chart-container container-2">
            <div class="chart-header">
              <h4 class="chart-title">行业基本单位数</h4>
            </div>
            <div class="chart-content">
              <RegionBarChart
                  :chartData="barChartData2"
                  :selectedRegion="selectedRegion"
              />
            </div>
          </div>
        </div>

        <!-- 第二排：三个容器，都为饼状图 -->
        <div class="chart-row row-2">
          <!-- 第一个容器：饼状图 -->
          <div class="chart-container container-3">
            <div class="chart-header">
              <h4 class="chart-title">注册类型构成</h4>
            </div>
            <div class="chart-content">
              <RegistrationPieChart
                  :chartData="pieChartData1"
              />
            </div>
          </div>

          <!-- 第二个容器：饼状图 -->
          <div class="chart-container container-4">
            <div class="chart-header">
              <h4 class="chart-title">经济类型分布</h4>
            </div>
            <div class="chart-content">
              <RegistrationPieChart
                  :chartData="pieChartData2"
              />
            </div>
          </div>

          <!-- 第三个容器：饼状图 -->
          <div class="chart-container container-5">
            <div class="chart-header">
              <h4 class="chart-title">规模类型构成</h4>
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
  barChartData1: {
    type: Object,
    required: true
  },
  barChartData2: {
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
.data-display-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;

  .main-content {
    flex: 1;
    display: flex;
    gap: 16px;
    padding: 16px;
    background: #f5f5f5;
    min-height: 0;
    overflow: hidden;
    height: calc(100% - 141px);

    .content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      min-width: 0;
      overflow: hidden;

      .content-main {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;
        overflow: hidden;

        .charts-map-row {
          flex: 1;
          display: flex;
          gap: 16px;
          min-height: 0;
          overflow: hidden;

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

            .chart-row {
              display: flex;
              gap: 16px;
              min-height: 0;

              &.row-1 {
                flex: 1;
              }

              &.row-2 {
                flex: 1;
              }

              .chart-container {
                background: white;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                min-height: 0;
                //border: 1px solid #f0f0f0;

                &.container-1,
                &.container-2 {
                  flex: 1;
                }

                &.container-3,
                &.container-4,
                &.container-5 {
                  flex: 1;
                }

                .chart-header {
                  padding: 16px 24px;
                  flex-shrink: 0;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  //border-bottom: 1px solid #f0f0f0;

                  .chart-title {
                    font-size: 20px;
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
            }
          }
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;

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
          flex-direction: column;

          .chart-container {
            height: 300px;
          }
        }
      }
    }
  }
}
</style>