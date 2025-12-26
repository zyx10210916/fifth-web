<template>
    <div class="left">
        <div class="item-box">
            <div class="head">
                <span>法人单位数量</span>
                <span class="total-badge">{{ totalCorporateCount }} 家</span>
            </div>
            <div class="content">
                <div class="unit-tip">单位：家</div>
                <div ref="corporateChartRef" class="chart-container"></div>
            </div>
        </div>

        <div class="item-box">
            <div class="head">
                <span>从业人员期末人数</span>
                <span class="total-badge">{{ (totalPersonnel / 10000).toFixed(2) }} 万人</span>
            </div>
            <div class="content">
                <div class="unit-tip">单位：人</div>
                <div ref="personnelChartRef" class="chart-container"></div>
            </div>
        </div>

        <div class="item-box">
            <div class="head">
                <span>营业收入</span>
                <span class="total-badge">{{ (totalEconomic / 10000).toFixed(2) }} 万元</span>
            </div>
            <div class="content">
                <div class="unit-tip">单位：万元</div>
                <div ref="revenueChartRef" class="chart-container"></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import type { EChartsOption } from 'echarts';

const props = defineProps({
    summaryData: { type: Object, default: () => ({}) }
});

const corporateChartRef = ref<HTMLElement | null>(null);
const personnelChartRef = ref<HTMLElement | null>(null);
const revenueChartRef = ref<HTMLElement | null>(null);

let chart1: echarts.ECharts | null = null;
let chart2: echarts.ECharts | null = null;
let chart3: echarts.ECharts | null = null;

const totalCorporateCount = ref(0);
const totalPersonnel = ref(0);
const totalEconomic = ref(0);

// 动态颜色池
const colorPalette = [
    ['#ffb570', '#ff8800'], // 橘色系
    ['#85e1ff', '#009dff'], // 蓝色系
    ['#50e3c2', '#11a382'], // 绿色系
    ['#b6a2de', '#675bba']  // 紫色系
];

/**
 * 通用数据对齐逻辑（并集处理）
 */
const prepareChartData = (rawData: any, dataKey: string) => {
    const regions = Object.keys(rawData);
    const categorySet = new Set<string>();

    // 提取所有规模/类别并集 (如：大型、中型、小型...)
    regions.forEach(reg => {
        rawData[reg][dataKey]?.forEach((item: any) => categorySet.add(item.name));
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
            barMaxWidth: 16,
            data: categories.map(cat => regionMap.get(cat) || 0),
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
 * 通用柱状图配置
 */
const getOption = (xAxisData: string[], seriesData: any[]): EChartsOption => ({
    grid: { top: '22%', left: '3%', right: '5%', bottom: '12%', containLabel: true },
    legend: { show: true, top: '5%', icon: 'roundRect', textStyle: { fontSize: 12 } },
    tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
            let res = `<div style="margin-bottom:5px;font-weight:bold">${params[0].name}</div>`;
            params.forEach((item: any) => {
                res += `<div style="display:flex;justify-content:space-between;min-width:120px;">
                  <span>${item.marker}${item.seriesName}</span>
                  <span style="font-weight:bold;margin-left:20px;">${item.value}</span>
                </div>`;
            });
            return res;
        }
    },
    xAxis: {
        type: 'category',
        data: xAxisData,
        axisLabel: { interval: 0, fontSize: 11, color: '#666' },
        axisLine: { lineStyle: { color: '#eee' } }
    },
    yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#f5f5f5' } }
    },
    series: seriesData
});

const processData = () => {
    const data = props.summaryData;
    if (!data || Object.keys(data).length === 0) return;

    nextTick(() => {
        // 1. 处理法人单位数量 (legalPersonNumList)
        const corp = prepareChartData(data, 'legalPersonNumList');
        totalCorporateCount.value = Object.values(data).reduce((acc: any, cur: any) => acc + (cur.legalPersonNum || 0), 0);
        chart1?.setOption(getOption(corp.categories, corp.series), true);

        // 2. 处理从业人员 (employmentPersonnel)
        const pers = prepareChartData(data, 'employmentPersonnel');
        totalPersonnel.value = pers.totalSum;
        chart2?.setOption(getOption(pers.categories, pers.series), true);

        // 3. 处理营业收入 (operatingIncome)
        const rev = prepareChartData(data, 'operatingIncome');
        totalEconomic.value = rev.totalSum;
        chart3?.setOption(getOption(rev.categories, rev.series), true);
    });
};

onMounted(() => {
    if (corporateChartRef.value) chart1 = echarts.init(corporateChartRef.value);
    if (personnelChartRef.value) chart2 = echarts.init(personnelChartRef.value);
    if (revenueChartRef.value) chart3 = echarts.init(revenueChartRef.value);

    processData();
    window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
    window.removeEventListener('resize', handleResize);
    [chart1, chart2, chart3].forEach(c => c?.dispose());
});

const handleResize = () => [chart1, chart2, chart3].forEach(c => c?.resize());

watch(() => props.summaryData, processData, { deep: true });
</script>

<style scoped>
.left {
    width: 480px;
    height: 100%;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px;
    box-sizing: border-box;
}

.item-box {
    flex: 1;
    background-color: #fff;
    border-radius: 6px;
    border: 1px solid #f0f0f0;
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
    color: #333;
}

.total-badge {
    font-size: 14px;
    font-weight: normal;
    background-color: #f5f5f5;
    color: #666;
    padding: 4px 12px;
    border-radius: 20px;
}

.content {
    flex: 1;
    position: relative;
    padding: 5px 10px;
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
    min-height: 150px;
}
</style>