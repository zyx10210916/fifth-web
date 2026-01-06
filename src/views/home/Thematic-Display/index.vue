<template>
  <div class="data-display-container">

    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="header-actions">
        <a-menu
            v-model:selectedKeys="selectedAnalysis"
            mode="horizontal"
            theme="light"
            @click="handleAnalysisChange"
        >
          <!-- 经济普查专题分析 -->
          <a-sub-menu key="economic-census" :popup-match-selector="'.horizontal-menu-container'">
            <template #title>
              <span>专题选择</span>
            </template>
            <a-sub-menu key="industrial-enterprise" :popup-match-selector="'.horizontal-menu-container'">
              <template #title>
                <span>工业企业法人单位分析</span>
              </template>
              <a-menu-item key="industrial-enterprise-overall">工业企业法人单位总体分析</a-menu-item>
              <a-menu-item key="industrial-enterprise-above-scale">规模以上工业企业法人单位分析</a-menu-item>
              <a-menu-item key="industrial-enterprise-high-tech">规模以上高技术制造业分析</a-menu-item>
            </a-sub-menu>
            <a-menu-item key="construction-enterprise">建筑业企业法人单位分析</a-menu-item>
            <a-menu-item key="wholesale-enterprise">批发业企业法人单位分析</a-menu-item>
            <a-menu-item key="retail-enterprise">零售业企业法人单位分析</a-menu-item>
            <a-menu-item key="accommodation-enterprise">住宿业企业法人单位分析</a-menu-item>
            <a-menu-item key="catering-enterprise">餐饮业企业法人单位分析</a-menu-item>
            <a-menu-item key="real-estate-enterprise">房地产业企业法人单位分析</a-menu-item>
            <a-menu-item key="financial-enterprise">金融业企业法人单位分析</a-menu-item>
            <a-menu-item key="service-enterprise">服务业企业法人单位分析</a-menu-item>
            <a-menu-item key="new-economy">新经济单位分析</a-menu-item>
          </a-sub-menu>
        </a-menu>
        <a-space :size="20">
          <span>版本号：</span>
          <a-select
              v-model:value="selectedVersion"
              style="width: 300px"
              placeholder="选择版本"
              size="large"
          >
            <a-select-option value="v1">第五次全国经济普查（2025年）</a-select-option>
            <a-select-option value="v2">V2.0</a-select-option>
            <a-select-option value="v3">V3.0</a-select-option>
          </a-select>

          <span>指标名：</span>
          <a-select
              v-model:value="selectedIndicator"
              style="width: 230px"
              placeholder="选择指标"
              size="large"
          >
            <a-select-option value="total">基本单位数</a-select-option>
            <a-select-option value="growth">增长率</a-select-option>
            <a-select-option value="density">密度</a-select-option>
            <a-select-option value="proportion">占比</a-select-option>
          </a-select>
        </a-space>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 右侧内容区域 -->
      <div class="content-wrapper">
        <!-- 动态布局组件 -->
        <component
            :is="selectedLayout"
            :map-data="mapData"
            :selected-region="selectedRegion"
            :bar-chart-data="barChartData"
            :industry-chart-data="industryChartData"
            :pie-chart-data="pieChartData"
            :current-analysis="currentAnalysis"
            :pie-chart-data1="pieChartData1"
            :pie-chart-data2="pieChartData2"
            :pie-chart-data3="pieChartData3"
            :pie-chart-data4="pieChartData4"
            :bar-chart-data1="barChartData1"
            :bar-chart-data2="barChartData2"
            :bar-chart-data3="barChartData3"
            :bar-chart-data4="barChartData4"
            :layout4-pie-data="layout4PieData"
            :layout4-bar-data1="layout4BarData1"
            :layout4-bar-data2="layout4BarData2"
            :bar-chart-title="barChartTitle"
            :pie-chart-title1="pieChartTitle1"
            :pie-chart-title2="pieChartTitle2"
            :pie-chart-title3="pieChartTitle3"
            :chart-title1="'区域企业数量分布'"
            :chart-title2="'行业企业数量分布'"
            :chart-title3="'企业发展趋势'"
            :chart-title4="'企业类型分布'"
            @region-click="handleRegionClick"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { message, List } from 'ant-design-vue';
import { MenuFoldOutlined as MenuFold, MenuUnfoldOutlined as MenuUnfold } from '@ant-design/icons-vue';

// TypeScript接口定义
interface ChartDataItem {
  name?: string;
  value: number;
  color?: string;
  region?: string;
  industry?: string;
  year?: string;
}

interface AnalysisItem {
  key: string;
  title: string;
  region: string;
  date: string;
  type: 'primary' | 'success' | 'warning' | 'info';
  typeText: string;
}

interface RegionMap {
  [key: string]: string;
}

interface AnalysisMap {
  [key: string]: string;
}

interface LayoutMap {
  [key: string]: any;
}

// 导入布局组件
import Layout1 from '@/components/Thematic-Display/Layout1/index.vue';
import Layout5 from '@/components/Thematic-Display/Layout5/index.vue';
import Layout6 from '@/components/Thematic-Display/Layout6/index.vue';
import Layout7 from '@/components/Thematic-Display/Layout7/index.vue';
import Layout8 from '@/components/Thematic-Display/Layout8/index.vue';
import Layout2 from '@/components/Thematic-Display/Layout2/index.vue';
import Layout3 from '@/components/Thematic-Display/Layout3/index.vue';
import Layout4 from '@/components/Thematic-Display/Layout4/index.vue';

// 导入图表组件（用于数据传递）
import GuangzhouMap from '@/components/Thematic-Display/GuangzhouMap/index.vue';
import RegionBarChart from '@/components/Thematic-Display/RegionBarChart/index.vue';
import IndustryBarChart from '@/components/Thematic-Display/IndustryBarChart/index.vue';
import RegistrationPieChart from '@/components/Thematic-Display/RegistrationPieChart/index.vue';

// 选中的版本号
const selectedVersion = ref<string>('v1');

// 选中的指标名
const selectedIndicator = ref<string>('total');

// 选中的区域
const selectedRegion = ref<string>('all');

// 侧边栏折叠状态已移除，改用横板菜单

// 选中的专题分析
const selectedAnalysis = ref<string[]>(['industrial-enterprise']);

// 当前活跃的分析项
const activeAnalysisItem = ref<string>('analysis-1');

// 是否显示分析列表
const showAnalysisList = ref<boolean>(true);

// 当前选中的分析类型
const currentAnalysis = computed<string>(() => {
  const analysisMap: AnalysisMap = {
    'industrial-enterprise': '工业企业法人单位分析',
    'industrial-enterprise-overall': '工业企业法人单位总体分析',
    'industrial-enterprise-above-scale': '规模以上工业企业法人单位总体分析',
    'industrial-enterprise-high-tech': '规模以上高技术制造业分析总体分析',
    'construction-enterprise': '建筑业企业法人单位分析',
    'wholesale-enterprise': '批发业企业法人单位分析',
    'retail-enterprise': '零售业企业法人单位分析',
    'accommodation-enterprise': '住宿业企业法人单位分析',
    'catering-enterprise': '餐饮业企业法人单位分析',
    'real-estate-enterprise': '房地产企业法人单位总体分析',
    'financial-enterprise': '金融业企业法人单位总体分析',
    'service-enterprise': '服务业企业法人单位分析',
    'new-economy': '新经济单位分析',
  };
  return analysisMap[selectedAnalysis.value[0]] || '工业企业法人单位分析';
});

// 根据分析类型选择布局
const selectedLayout = computed<any>(() => {
  const layoutMap: LayoutMap = {
    'industrial-enterprise-overall': Layout1,    // 工业企业总体分析：地图+图表
    'industrial-enterprise-above-scale': Layout1, // 规模以上工业企业：地图+图表
    'industrial-enterprise-high-tech': Layout1,   // 高技术制造业：地图+图表
    'construction-enterprise': Layout2,     // 建筑业：多个饼状图
    'wholesale-enterprise': Layout3,        // 批发业：多个柱状图
    'retail-enterprise': Layout4,           // 零售业：混合布局
    'accommodation-enterprise': Layout2,    // 住宿业：多个饼状图
    'catering-enterprise': Layout3,         // 餐饮业：多个柱状图
    'real-estate-enterprise': Layout5,      // 房地产：地图+图表
    'financial-enterprise': Layout6,        // 金融业：多个饼状图
    'service-enterprise': Layout7,          // 服务业：多个柱状图
    'new-economy': Layout8,                 // 新经济：混合布局
  };
  return layoutMap[selectedAnalysis.value[0]] || Layout1;
});

// 布局2需要的数据
const pieChartData1 = ref<ChartDataItem[]>([
  { name: '内资企业', value: 85600, color: '#1890ff' },
  { name: '港澳台商投资企业', value: 12400, color: '#ff85c0' },
  { name: '外商投资企业', value: 6800, color: '#ffd666' }
]);
const pieChartData2 = ref<ChartDataItem[]>([
  { name: '国有企业', value: 12000, color: '#1890ff' },
  { name: '集体企业', value: 5000, color: '#ff85c0' },
  { name: '私营企业', value: 68600, color: '#ffd666' },
  { name: '股份合作企业', value: 4000, color: '#95de64' }
]);
const pieChartData3 = ref<ChartDataItem[]>([
  { name: '大型企业', value: 15000, color: '#1890ff' },
  { name: '中型企业', value: 35000, color: '#ff85c0' },
  { name: '小型企业', value: 52000, color: '#ffd666' },
  { name: '微型企业', value: 88000, color: '#95de64' }
]);
const pieChartData4 = ref<ChartDataItem[]>([
  { name: '制造业', value: 45000, color: '#1890ff' },
  { name: '批发和零售业', value: 35000, color: '#ff85c0' },
  { name: '服务业', value: 25000, color: '#ffd666' },
  { name: '建筑业', value: 15000, color: '#95de64' }
]);

// 布局3需要的数据
const barChartData1 = ref<ChartDataItem[]>([
  { region: '天河区', value: 12560, color: '#ff85c0' },
  { region: '越秀区', value: 9870, color: '#ff85c0' },
  { region: '荔湾区', value: 7560, color: '#ff85c0' },
  { region: '海珠区', value: 8430, color: '#ff85c0' },
  { region: '白云区', value: 11200, color: '#ff85c0' },
  { region: '黄埔区', value: 6890, color: '#ff85c0' }
]);
const barChartData2 = ref<ChartDataItem[]>([
  { industry: '批发和零售业', value: 15600, color: '#ffd666' },
  { industry: '制造业', value: 12300, color: '#ffd666' },
  { industry: '租赁和商务服务业', value: 9800, color: '#ffd666' },
  { industry: '建筑业', value: 8700, color: '#ffd666' },
  { industry: '信息传输、软件和信息技术服务业', value: 7600, color: '#ffd666' },
  { industry: '房地产业', value: 6500, color: '#ffd666' }
]);
const barChartData3 = ref<ChartDataItem[]>([
  { year: '2021', value: 85600, color: '#1890ff' },
  { year: '2022', value: 92400, color: '#1890ff' },
  { year: '2023', value: 104800, color: '#1890ff' },
  { year: '2024', value: 115800, color: '#1890ff' },
  { year: '2025', value: 128000, color: '#1890ff' }
]);

// 布局4需要的数据
const layout4PieData = ref<ChartDataItem[]>([
  { name: '内资企业', value: 85600, color: '#1890ff' },
  { name: '港澳台商投资企业', value: 12400, color: '#ff85c0' },
  { name: '外商投资企业', value: 6800, color: '#ffd666' }
]);
const layout4BarData1 = ref<ChartDataItem[]>([
  { region: '天河区', value: 12560, color: '#ff85c0' },
  { region: '越秀区', value: 9870, color: '#ff85c0' },
  { region: '荔湾区', value: 7560, color: '#ff85c0' },
  { region: '海珠区', value: 8430, color: '#ff85c0' },
  { region: '白云区', value: 11200, color: '#ff85c0' },
  { region: '黄埔区', value: 6890, color: '#ff85c0' }
]);
const layout4BarData2 = ref<ChartDataItem[]>([
  { industry: '批发和零售业', value: 15600, color: '#ffd666' },
  { industry: '制造业', value: 12300, color: '#ffd666' },
  { industry: '租赁和商务服务业', value: 9800, color: '#ffd666' },
  { industry: '建筑业', value: 8700, color: '#ffd666' },
  { industry: '信息传输、软件和信息技术服务业', value: 7600, color: '#ffd666' },
  { industry: '房地产业', value: 6500, color: '#ffd666' }
]);

// 布局5需要的数据
const barChartData4 = ref<ChartDataItem[]>([
  { year: '2021', value: 25600, color: '#95de64' },
  { year: '2022', value: 32400, color: '#95de64' },
  { year: '2023', value: 44800, color: '#95de64' },
  { year: '2024', value: 55800, color: '#95de64' },
  { year: '2025', value: 68000, color: '#95de64' }
]);

// 布局8需要的数据标题
const pieChartTitle1 = ref<string>('企业类型分布');
const pieChartTitle2 = ref<string>('企业规模分布');
const pieChartTitle3 = ref<string>('行业分布');
const barChartTitle = ref<string>('区域企业数量分布');

// 分析列表数据
const analysisList = ref<AnalysisItem[]>([
  {
    key: 'analysis-1',
    title: '规模以上工业企业法人单位总体分析',
    region: '广州市全域',
    date: '2025-01-15',
    type: 'primary',
    typeText: '综合分析'
  },
  {
    key: 'analysis-2',
    title: '规模以上高技术制造业分析',
    region: '天河区、黄埔区',
    date: '2025-01-10',
    type: 'success',
    typeText: '专题分析'
  },
  {
    key: 'analysis-3',
    title: '工业企业数字化转型情况分析',
    region: '全市各区',
    date: '2025-01-05',
    type: 'warning',
    typeText: '趋势分析'
  },
  {
    key: 'analysis-4',
    title: '新经济单位发展态势分析',
    region: '南沙区、番禺区',
    date: '2024-12-28',
    type: 'info',
    typeText: '专项分析'
  }
]);

// 地图数据
const mapData = ref<ChartDataItem[]>([
  { name: '天河区', value: 12560 },
  { name: '越秀区', value: 9870 },
  { name: '荔湾区', value: 7560 },
  { name: '海珠区', value: 8430 },
  { name: '白云区', value: 11200 },
  { name: '黄埔区', value: 6890 },
  { name: '番禺区', value: 9340 },
  { name: '南沙区', value: 4560 },
  { name: '从化区', value: 3210 },
  { name: '增城区', value: 5430 },
  { name: '花都区', value: 6780 }
]);

// 柱状图数据
const barChartData = ref<ChartDataItem[]>([
  { region: '天河区', value: 12560, color: '#ff85c0' },
  { region: '越秀区', value: 9870, color: '#ff85c0' },
  { region: '荔湾区', value: 7560, color: '#ff85c0' },
  { region: '海珠区', value: 8430, color: '#ff85c0' },
  { region: '白云区', value: 11200, color: '#ff85c0' },
  { region: '黄埔区', value: 6890, color: '#ff85c0' },
  { region: '番禺区', value: 9340, color: '#ff85c0' },
  { region: '南沙区', value: 4560, color: '#ff85c0' },
  { region: '从化区', value: 3210, color: '#ff85c0' },
  { region: '增城区', value: 5430, color: '#ff85c0' },
  { region: '花都区', value: 6780, color: '#ff85c0' }
]);

// 行业图表数据
const industryChartData = ref<ChartDataItem[]>([
  { industry: '批发和零售业', value: 15600, color: '#ffd666' },
  { industry: '制造业', value: 12300, color: '#ffd666' },
  { industry: '租赁和商务服务业', value: 9800, color: '#ffd666' },
  { industry: '建筑业', value: 8700, color: '#ffd666' },
  { industry: '信息传输、软件和信息技术服务业', value: 7600, color: '#ffd666' },
  { industry: '房地产业', value: 6500, color: '#ffd666' },
  { industry: '交通运输、仓储和邮政业', value: 5400, color: '#ffd666' },
  { industry: '金融业', value: 4300, color: '#ffd666' },
  { industry: '科学研究和技术服务业', value: 3200, color: '#ffd666' },
  { industry: '住宿和餐饮业', value: 2100, color: '#ffd666' }
]);

// 环形图数据
const pieChartData = ref<ChartDataItem[]>([
  { name: '内资企业', value: 85600, color: '#1890ff' },
  { name: '港澳台商投资企业', value: 12400, color: '#ff85c0' },
  { name: '外商投资企业', value: 6800, color: '#ffd666' }
]);

// 获取当前分析标题
const getCurrentAnalysisTitle = (): string => {
  return currentAnalysis.value;
};

// 处理专题分析切换
const handleAnalysisChange = ({ key }: { key: string }) => {
  selectedAnalysis.value = [key];
  message.success(`已切换到：${getCurrentAnalysisTitle()}`);

  // 这里可以根据不同的分析类型加载不同的数据
  loadAnalysisData(key);
};

// 处理分析列表项点击
const handleAnalysisItemClick = (item: AnalysisItem) => {
  activeAnalysisItem.value = item.key;
  message.info(`查看分析报告：${item.title}`);
  // 这里可以加载具体的分析报告数据
};

// 切换侧边栏折叠状态函数已移除，改用横板菜单

// 加载分析数据
const loadAnalysisData = async (analysisKey: string): Promise<void> => {
  try {
    console.log(`加载分析数据：${analysisKey}`);
    // 模拟API调用
    // 这里可以根据不同的分析键值加载对应的数据
    // message.success(`已加载 ${getCurrentAnalysisTitle()} 数据`);
  } catch (error) {
    console.error('加载分析数据失败:', error);
    message.error('数据加载失败');
  }
};


// 处理区域点击
const handleRegionClick = (region: string) => {
  selectedRegion.value = region;
};

// 加载区域数据
const loadRegionData = async (region: string): Promise<void> => {
  try {
    console.log(`加载 ${region} 区域数据`);
    message.success(`已切换到${getRegionName(region)}数据`);
  } catch (error) {
    console.error('加载数据失败:', error);
    message.error('数据加载失败');
  }
};

// 获取区域名称
const getRegionName = (regionCode: string): string => {
  const regionMap: RegionMap = {
    'all': '广州市全域',
    'tianhe': '天河区',
    'yuexiu': '越秀区',
    'liwan': '荔湾区',
    'haizhu': '海珠区',
    'baiyun': '白云区',
    'huangpu': '黄埔区',
    'panyu': '番禺区',
    'nansha': '南沙区',
    'conghua': '从化区',
    'zengcheng': '增城区',
    'huadu': '花都区'
  };
  return regionMap[regionCode] || '未知区域';
};

// 监听版本号变化
watch(selectedVersion, (newVersion: string) => {
  console.log(`切换到版本 ${newVersion}`);
  message.success(`已切换到版本 ${newVersion}`);
});

// 监听指标名变化
watch(selectedIndicator, (newIndicator: string) => {
  console.log(`切换到指标 ${newIndicator}`);
  message.success(`已切换到指标 ${newIndicator}`);
});

// 监听区域选择变化
watch(selectedRegion, (newRegion: string) => {
  loadRegionData(newRegion);
});

// 组件挂载时加载数据
onMounted(async () => {
  await loadRegionData('all');
  await loadAnalysisData(selectedAnalysis.value[0]);
});
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
    background: white;
    border-radius: 16px;
    margin: 13px;
    margin-bottom: 10px;
    height: 48px;
    display: flex;
    align-items: center;
    padding: 0 24px;
    //box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    :deep(.ant-menu) {
      border-bottom: none;
      height: 100%;
      line-height: 45px;
      margin-bottom: 10px;
      background: transparent;

      .ant-menu-submenu {
        margin: 0;

        .ant-menu-submenu-title {
          //background-color: #fff;
          padding: 8px 16px;
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
          background-color: #fff;
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