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
        <!-- 上方：区域基本单位数柱状图 -->
        <div class="chart-row">
          <div class="chart-container full-width">
            <div class="chart-header">
              <h4 class="chart-title">区域基本单位数</h4>
            </div>
            <div class="chart-content">
              <RegionBarChart
                  :chartData="barChartData"
                  :selectedRegion="selectedRegion"
              />
            </div>
          </div>
        </div>

        <!-- 下方：两个图表并排 -->
        <div class="chart-row">
          <!-- 左侧：TOP10行业条形图 -->
          <div class="chart-container half-width">
            <div class="chart-header">
              <h4 class="chart-title">基本单位数TOP10行业</h4>
            </div>
            <div class="chart-content">
              <IndustryBarChart
                  :chartData="industryChartData"
              />
            </div>
          </div>

          <!-- 右侧：注册类型构成环形图 -->
          <div class="chart-container half-width">
            <div class="chart-header">
              <h4 class="chart-title">广州市基本单位注册类型构成分析</h4>
            </div>
            <div class="chart-content">
              <RegistrationPieChart
                  :chartData="pieChartData"
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
import IndustryBarChart from '../IndustryBarChart/index.vue';
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
  industryChartData: {
    type: Object,
    required: true
  },
  pieChartData: {
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
const onRegionClick = (region) => {
  emit('region-click', region);
};
</script>

<style scoped lang="less">
.data-display-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;

  .horizontal-menu-container {
    //background: white;
    border-radius: 16px;
    margin: 13px;
    margin-bottom: 0;
    height: 48px;
    display: flex;
    align-items: center;
    padding: 0 24px;
    //box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    :deep(.ant-menu) {
      border-bottom: none;
      height: 100%;
      line-height: 48px;
      border-radius: 10px;
      background-color: #f0f0f0;

      .ant-menu-submenu {
        margin: 0;

        .ant-menu-submenu-title {
          padding: 0 16px;
          font-weight: 500;
          color: #262626;
          border-radius: 6px;
          transition: all 0.3s ease;

          &:hover {
            background-color: #f5f5f5;
          }
        }

        .ant-menu-submenu-arrow {
          color: #8c8c8c;
        }

        .ant-menu {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          border-radius: 8px;
          padding: 4px 0;

          .ant-menu-item {
            padding: 8px 16px;
            margin: 2px 0;
            border-radius: 4px;

            &:hover {
              background-color: #f5f5f5;
            }

            &.ant-menu-item-selected {
              background-color: #e6f7ff;
              color: #1890ff;
            }
          }
        }
      }
    }
  }

  .page-header {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 16px 24px;
    border-radius: 16px;
    background: white;
    margin: 13px;
    margin-top: 0;
    height: 80px;

    .header-actions {
      display: flex;
      align-items: center;

      :deep(.ant-select) {
        .ant-select-selector {
          border-radius: 30px;
          background: rgba(245, 245, 247, 1);
          border: 1px solid rgba(245, 245, 247, 1);
        }
      }
    }
  }

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

            .chart-row {
              display: flex;
              gap: 16px;
              min-height: 0;
              flex: 1;

              &:first-child {
                flex: 1;
              }

              &:last-child {
                flex: 1;
              }

              .chart-container {
                background: white;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                min-height: 0;

                &.full-width {
                  width: 100%;
                }

                &.half-width {
                  flex: 1;
                  min-width: 0;
                }

                .chart-header {
                  padding: 16px 24px;
                  flex-shrink: 0;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;

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

        .analysis-list-section {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
          max-height: 300px;

          .section-header {
            padding: 16px 24px;
            border-bottom: 1px solid #f0f0f0;

            .section-title {
              font-size: 20px;
              font-weight: 500;
              color: #262626;
              margin: 0;
            }
          }

          .analysis-list {
            overflow-y: auto;
            max-height: 220px;

            .analysis-list-item {
              padding: 12px 24px;
              cursor: pointer;
              transition: all 0.3s ease;
              border-bottom: 1px solid #f5f5f5;

              &:hover {
                background-color: #fafafa;
              }

              &.active {
                background-color: #e6f7ff;
                border-left: 3px solid #1890ff;
              }

              .analysis-title {
                font-weight: 500;
                color: #262626;
              }

              .analysis-info {
                display: flex;
                gap: 12px;
                font-size: 12px;
                color: #8c8c8c;

                .analysis-region {
                  background: #f5f5f5;
                  padding: 2px 8px;
                  border-radius: 10px;
                }
              }

              .analysis-tag {
                font-size: 12px;
                padding: 2px 8px;
                border-radius: 10px;
                color: white;

                &.primary {
                  background-color: #1890ff;
                }

                &.success {
                  background-color: #52c41a;
                }

                &.warning {
                  background-color: #faad14;
                }

                &.info {
                  background-color: #13c2c2;
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

    .horizontal-menu-container {
      height: auto;
      padding: 8px 16px;

      :deep(.ant-menu) {
        height: auto;
        line-height: normal;

        .ant-menu-submenu {
          margin: 4px 0;
        }
      }
    }

    .charts-map-row {
      flex-direction: column;

      .map-section {
        height: 50vh;
        min-height: 400px;
      }

      .charts-section {
        height: 50vh;
        min-height: 400px;
      }
    }
  }
}
</style>