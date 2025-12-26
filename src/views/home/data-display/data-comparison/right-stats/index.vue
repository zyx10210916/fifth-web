<template>
    <aside class="right">
        <div class="item-box">
            <div class="head">
                <span>资产情况</span>
                <span class="total-badge">{{ (totalAssetsSum / 10000).toFixed(2) }} 万元</span>
            </div>
            <div class="content">
                <div class="unit-tip">单位：万元</div>
                <div ref="assetChartRef" class="chart-container"></div>
            </div>
        </div>

        <div class="item-box">
            <div class="head">
                <span>营业利润</span>
                <span class="total-badge">{{ (totalProfitSum / 10000).toFixed(2) }} 万元</span>
            </div>
            <div class="content">
                <div class="unit-tip">单位：万元</div>
                <div ref="profitChartRef" class="chart-container"></div>
            </div>
        </div>
    </aside>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import type { EChartsOption } from 'echarts';

const props = defineProps({
    summaryData: { type: Object, default: () => ({}) }
});

const assetChartRef = ref<HTMLElement | null>(null);
const profitChartRef = ref<HTMLElement | null>(null);
let assetChart: echarts.ECharts | null = null;
let profitChart: echarts.ECharts | null = null;

const totalAssetsSum = ref(0);
const totalProfitSum = ref(0);

// --- 动态配色池：支持多组区域动态分配 ---
const colorPalette = [
    ['#ffb570', '#ff8800'], // 橘色系
    ['#85e1ff', '#009dff'], // 蓝色系
    ['#50e3c2', '#11a382'], // 绿色系
    ['#b6a2de', '#675bba'], // 紫色系
    ['#ff9db5', '#e03e52']  // 红色系
];

/**
 * 核心逻辑：提取并集并对齐数据
 * @param rawData 接口返回的 data 对象
 * @param dataKey 对应的字段名，如 'totalAssets'
 */
const prepareChartData = (rawData: any, dataKey: string) => {
    const regions = Object.keys(rawData); // 动态获取 ["越秀区", "荔湾区", ...]

    // 1. 【取行业并集】：确保 X 轴包含所有区域出现的行业
    const categorySet = new Set<string>();
    regions.forEach(reg => {
        rawData[reg][dataKey]?.forEach((item: any) => {
            if (item.name) categorySet.add(item.name);
        });
    });
    const categories = Array.from(categorySet);

    let totalSum = 0;

    // 2. 【构造 Series】：为每个区域准备一套数据
    const series = regions.map((reg, index) => {
        const regionMap = new Map();
        rawData[reg][dataKey]?.forEach((item: any) => {
            const val = Number(item.value) || 0;
            regionMap.set(item.name, val);
            totalSum += val; // 累计总数
        });

        // 分配渐变色（超出池大小时循环使用）
        const colors = colorPalette[index % colorPalette.length];

        return {
            name: reg,
            type: 'bar',
            barMaxWidth: 16,
            // 按并集后的 categories 顺序填充，没有则补 0
            data: categories.map(cat => (regionMap.get(cat) / 10000 || 0).toFixed(2)),
            itemStyle: {
                borderRadius: [4, 4, 0, 0],
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: colors[0] },
                    { offset: 1, color: colors[1] }
                ])
            }
        };
    });

    return { categories, series, totalSum };
};

/**
 * 通用 ECharts 配置
 */
const getOption = (xAxisData: string[], seriesData: any[]): EChartsOption => ({
    grid: {
        top: '22%',
        left: '3%',
        right: '5%',
        bottom: '18%',
        containLabel: true
    },
    legend: {
        show: true,
        top: '5%',
        icon: 'roundRect',
        textStyle: { color: '#666', fontSize: 13 }
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderWidth: 1,
        borderColor: '#eee',
        textStyle: { color: '#333' },
        formatter: (params: any) => {
            let html = `<div style="font-weight:bold;margin-bottom:8px;color:#000">${params[0].name}</div>`;
            params.forEach((item: any) => {
                html += `
          <div style="display:flex;align-items:center;justify-content:space-between;min-width:140px;margin-bottom:4px;">
            <span>${item.marker} ${item.seriesName}</span>
            <span style="font-weight:bold;margin-left:15px;">${item.value} <span style="font-size:10px;font-weight:normal">万元</span></span>
          </div>`;
            });
            return html;
        }
    },
    xAxis: {
        type: 'category',
        data: xAxisData,
        axisLine: { lineStyle: { color: '#eee' } },
        axisLabel: {
            fontSize: 11,
            color: '#777',
            rotate: 35,
            interval: 0,
            formatter: (val: string) => val.length > 10 ? val.slice(0, 10) + '...' : val
        }
    },
    yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#f5f5f5' } },
        axisLabel: { color: '#999' }
    },
    series: seriesData
});

const processData = () => {
    const data = props.summaryData;
    if (!data || Object.keys(data).length === 0) return;

    nextTick(() => {
        // 处理资产图表
        const assetObj = prepareChartData(data, 'totalAssets');
        totalAssetsSum.value = assetObj.totalSum;
        assetChart?.setOption(getOption(assetObj.categories, assetObj.series), true);

        // 处理利润图表
        const profitObj = prepareChartData(data, 'operatingProfit');
        totalProfitSum.value = profitObj.totalSum;
        profitChart?.setOption(getOption(profitObj.categories, profitObj.series), true);
    });
};

// --- 生命周期与监听 ---
onMounted(() => {
    if (assetChartRef.value) assetChart = echarts.init(assetChartRef.value);
    if (profitChartRef.value) profitChart = echarts.init(profitChartRef.value);
    processData();
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    assetChart?.dispose();
    profitChart?.dispose();
});

const handleResize = () => {
    assetChart?.resize();
    profitChart?.resize();
};

watch(() => props.summaryData, processData, { deep: true });
</script>

<style scoped>
.right {
    width: 480px;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #fff;
    border-left: 1px solid #f0f0f0;
}

.item-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    font-size: 18px;
    font-weight: bold;
    color: #333;
}

.total-badge {
    font-size: 14px;
    font-weight: normal;
    background-color: #f0f7ff;
    color: #007aff;
    padding: 4px 12px;
    border-radius: 20px;
}

.content {
    flex: 1;
    position: relative;
    padding: 0 10px 10px 10px;
}

.unit-tip {
    position: absolute;
    top: 0px;
    left: 15px;
    font-size: 11px;
    color: #bbb;
    z-index: 10;
}

.chart-container {
    width: 100%;
    height: 100%;
}
</style>