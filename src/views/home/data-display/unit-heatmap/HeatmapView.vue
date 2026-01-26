<template>
  <div v-if="visible" class="heatmap-container">
    <div class="heatmap-panel">
      <div class="heatmap-field-selector">
        <span class="label">热力权重：</span>
        <el-radio-group v-model="selectedField" size="small">
          <el-radio-button label="total_coun">按企业密度</el-radio-button>
          <el-radio-button label="zczj_sum_s">资产总计</el-radio-button>
          <el-radio-button label="qmrs_sum_s">期末人数</el-radio-button>
          <el-radio-button label="yylr_sum_s">营业利润</el-radio-button>
          <el-radio-button label="yysr_sum_s">营业收入</el-radio-button>
        </el-radio-group>
      </div>

      <div class="heatmap-legend">
        <div class="legend-labels">
          <span class="legend-val">{{ formatVal(legendInfo.min) }}</span>
          <span class="legend-val">{{ formatVal(legendInfo.mid) }}</span>
          <span class="legend-val">{{ formatVal(legendInfo.max) }}</span>
        </div>
        <div class="legend-bar"></div>
        <div class="legend-title">数值范围 ({{ legendInfo.label }})</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onUnmounted, onMounted, shallowRef, computed } from 'vue';

const FIELD_CONFIG = {
  total_coun: { min: 1, max: 17656, label: '家' },
  zczj_sum_s: { min: 0, max: 2103452872, label: '元' },
  qmrs_sum_s: { min: 0, max: 91086, label: '人' },
  yylr_sum_s: { min: -12856095, max: 31060063, label: '元' },
  yysr_sum_s: { min: 0, max: 601751463, label: '元' }
};

export default {
  name: 'HeatmapLayerManager',
  props: {
    view: Object,
    modules: Object, // 建议统一为对象或数组
    visible: Boolean
  },
  setup(props) {
    const heatmapLayer = shallowRef(null);
    const selectedField = ref("total_coun"); 
    const heatmapData = ref([]); 

    const legendInfo = computed(() => {
      const config = FIELD_CONFIG[selectedField.value] || { min: 0, max: 100, label: '' };
      return {
        min: config.min,
        max: config.max,
        mid: (config.min + config.max) / 2,
        label: config.label
      };
    });

    const formatVal = (val) => Math.floor(val).toLocaleString();

    const removeLayer = () => {
      if (heatmapLayer.value && props.view) {
        props.view.map.remove(heatmapLayer.value);
        heatmapLayer.value = null;
      }
    };

    // 修改点 1：去掉 visible 判断，仅判断是否已有数据
    const fetchHeatmapData = async () => {
      if (heatmapData.value.length > 0) return;
      try {
        const typeName = "workspace:yuwangshuju";
        const url = `http://10.44.58.28:8089/geoserver/workspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${typeName}&outputFormat=application/json&srsName=EPSG:4526`;
        const response = await fetch(url);
        const geojson = await response.json();
        heatmapData.value = geojson.features || [];
        
        // 如果数据回来时用户已经开启了开关，则直接渲染
        if (props.visible) {
          refreshHeatmap();
        }
      } catch (e) {
        console.error("热力图全量数据请求失败:", e);
      }
    };

    const getRenderer = (field) => {
      const config = FIELD_CONFIG[field] || { min: 0, max: 100 };
      return {
        type: "heatmap",
        field: field,
        colorStops: [
          { color: "rgba(0, 255, 255, 0)", ratio: 0 },
          { color: "rgba(0, 255, 255, 0.7)", ratio: 0.2 },
          { color: "rgb(0, 255, 0)", ratio: 0.4 },
          { color: "rgb(255, 255, 0)", ratio: 0.6 },
          { color: "rgb(255, 0, 0)", ratio: 0.9 }
        ],
        radius: 14,
        maxPixelIntensity: config.max,
        minPixelIntensity: config.min > 0 ? config.min : 0
      };
    };

    const refreshHeatmap = () => {
      // 修改点 2：渲染时才检查 visible
      if (!props.visible || heatmapData.value.length === 0 || !props.view) {
        removeLayer();
        return;
      }

      const [, , FeatureLayer, Graphic] = props.modules;

      const graphics = heatmapData.value.map((f, idx) => {
        const p = f.properties || {};
        return new Graphic({
          geometry: {
            type: "point",
            x: f.geometry.coordinates[0],
            y: f.geometry.coordinates[1],
            spatialReference: { wkid: 4526 }
          },
          attributes: {
            ObjectId: idx,
            total_coun: parseFloat(p.total_coun || 0),
            zczj_sum_s: parseFloat(p.zczj_sum_s || 0),
            qmrs_sum_s: parseFloat(p.qmrs_sum_s || 0),
            yylr_sum_s: parseFloat(p.yylr_sum_s || 0),
            yysr_sum_s: parseFloat(p.yysr_sum_s || 0)
          }
        });
      });

      removeLayer();

      heatmapLayer.value = new FeatureLayer({
        id: "dynamic_heatmap_layer",
        source: graphics, 
        objectIdField: "ObjectId",
        fields: [
          { name: "ObjectId", type: "oid" },
          { name: "total_coun", type: "double" },
          { name: "zczj_sum_s", type: "double" },
          { name: "qmrs_sum_s", type: "double" },
          { name: "yylr_sum_s", type: "double" },
          { name: "yysr_sum_s", type: "double" }
        ],
        renderer: getRenderer(selectedField.value)
      });

      props.view.map.add(heatmapLayer.value);
    };

    // 修改点 3：挂载即请求数据
    onMounted(() => {
      fetchHeatmapData();
    });

    // 监听显隐，只负责渲染控制
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        refreshHeatmap();
      } else {
        removeLayer();
      }
    });

    watch(() => selectedField.value, refreshHeatmap);

    onUnmounted(removeLayer);

    return { selectedField, legendInfo, formatVal };
  }
};
</script>

<style scoped>
.heatmap-container {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  pointer-events: none; 
}

.heatmap-panel {
  pointer-events: auto;
  background: white;
  padding: 12px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.heatmap-field-selector {
  display: flex;
  align-items: center;
}

.label {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-right: 12px;
}

/* 图例增强样式 */
.heatmap-legend {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4px 10px;
}

.legend-labels {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.legend-val {
  font-size: 11px;
  color: #666;
  font-family: monospace;
}

.legend-bar {
  width: 100%;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(to right, 
    rgba(0, 255, 255, 0), 
    rgba(0, 255, 255, 0.7), 
    rgb(0, 255, 0), 
    rgb(255, 255, 0), 
    rgb(255, 0, 0)
  );
  border: 1px solid #eee;
}

.legend-title {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
  text-transform: uppercase;
}
</style>