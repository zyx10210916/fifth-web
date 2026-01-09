<template>
    <aside class="right">
        <div class="item-box">
            <div class="head">
                <span>资产情况</span>
                <span class="total-badge">{{ (totalAssetsSum / 10000).toFixed(2) }} 万元</span>
            </div>
            <div class="content">
                <div class="unit-tip vertical">单位：万元</div>
                <div ref="assetChartRef" class="chart-container"></div>
            </div>
        </div>

        <div class="item-box">
            <div class="head">
                <span>营业利润</span>
                <span class="total-badge">{{ (totalProfitSum / 10000).toFixed(2) }} 万元</span>
            </div>
            <div class="content">
                <div class="unit-tip horizontal">单位：万元</div>
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

const colorPalette = [
    ['#ffb570', '#ff8800'], ['#85e1ff', '#009dff'], ['#50e3c2', '#11a382'],
    ['#b6a2de', '#675bba'], ['#ff9db5', '#e03e52']
];

const prepareChartData = (rawData: any, dataKey: string, isHorizontal: boolean) => {
    const regions = Object.keys(rawData);
    const categorySet = new Set<string>();
    regions.forEach(reg => {
        rawData[reg][dataKey]?.forEach((item: any) => {
            if (item.name) categorySet.add(item.name);
        });
    });
    const categories = Array.from(categorySet);

    let totalSum = 0;
    const series = regions.map((reg, index) => {
        const regionMap = new Map();
        rawData[reg][dataKey]?.forEach((item: any) => {
            const val = Number(item.value) || 0;
            regionMap.set(item.name, val);
            totalSum += val;
        });

        const colors = colorPalette[index % colorPalette.length];
        return {
            name: reg,
            type: 'bar',
            barMaxWidth: isHorizontal ? 14 : 14,
            data: categories.map(cat => (regionMap.get(cat) / 10000 || 0).toFixed(2)),
            itemStyle: {
                borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
                color: new echarts.graphic.LinearGradient(0, 0, isHorizontal ? 1 : 0, isHorizontal ? 0 : 1, [
                    { offset: 0, color: colors[0] },
                    { offset: 1, color: colors[1] }
                ])
            }
        };
    });

    return { categories, series, totalSum };
};

const getOption = (categories: string[], seriesData: any[], isHorizontal: boolean): EChartsOption => ({
    grid: {
        top: '12%',
        left: isHorizontal ? '0%' : '2%',
        right: '5%',
        bottom: '0%',
        containLabel: true
    },
    legend: {
        show: true,
        top: '2%',
        icon: 'roundRect',
        textStyle: { color: '#666', fontSize: 14 }
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
    },
    xAxis: isHorizontal ? {
        type: 'value',
        axisLabel: {
            color: '#999',
            fontSize: 14,
            rotate: 45,      
            margin: 5,   
            align: 'center',  
            // verticalAlign: 'middle' 
        },
        splitLine: {
            lineStyle: {
                type: 'dashed',
                color: '#f5f5f5'
            }
        }
    } : {
        type: 'category',
        data: categories,
        axisLabel: {
            color: '#777',
            fontSize: 14,
            interval: 0,
            rotate: categories.length > 5 ? 50 : 0
        },
        axisLine: { lineStyle: { color: '#eee' } }
    },
    yAxis: isHorizontal ? {
        type: 'category',
        data: categories,
        inverse: true,
        axisLabel: { color: '#666', fontSize: 14 },
        axisLine: { lineStyle: { color: '#eee' } },
    } : {
        type: 'value',
        axisLabel: { color: '#999', fontSize: 14 },
        splitLine: { lineStyle: { type: 'dashed', color: '#f5f5f5' } }
    },
    series: seriesData
});

const processData = () => {
    const data = props.summaryData;
    if (!data || Object.keys(data).length === 0) return;

    nextTick(() => {
        const assetObj = prepareChartData(data, 'totalAssets', false);
        totalAssetsSum.value = assetObj.totalSum;
        assetChart?.setOption(getOption(assetObj.categories, assetObj.series, false), true);

        const profitObj = prepareChartData(data, 'operatingProfit', true);
        totalProfitSum.value = profitObj.totalSum;
        profitChart?.setOption(getOption(profitObj.categories, profitObj.series, true), true);
    });
};

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
    border-radius: 6px;
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
    padding: 12px 16px;
    font-size: 18px;
    font-weight: bold;
}

.total-badge {
    font-size: 16px;
    font-weight: normal;
    background-color: #f0f7ff;
    color: #007aff;
    padding: 2px 10px;
    border-radius: 10px;
}

.content {
    flex: 1;
    position: relative;
    padding: 0 10px 10px 10px;
}

.unit-tip {
    position: absolute;
    font-size: 14px;
    color: #bbb;
    z-index: 10;
}

.unit-tip.vertical {
    top: 5px;
    left: 15px;
}

.unit-tip.horizontal {
    top: 5px;
    right: 20px;
}

.chart-container {
    width: 100%;
    height: 100%;
}
</style>