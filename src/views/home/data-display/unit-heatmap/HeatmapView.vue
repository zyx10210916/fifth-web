<template>
  <div v-if="visible" class="heatmap-field-selector">
    <div class="selector-content">
      <span class="label">热力权重：</span>
      <el-radio-group v-model="selectedField" size="small">
        <el-radio-button label="">按点密度</el-radio-button>
        <el-radio-button label="ZCZJ">资产总计</el-radio-button>
        <el-radio-button label="QMRS">期末人数</el-radio-button>
        <el-radio-button label="YYLR">营业利润</el-radio-button>
        <el-radio-button label="YYSR">营业收入</el-radio-button>
      </el-radio-group>
    </div>
  </div>
</template>

<script>
import { ref, watch, onUnmounted, shallowRef } from 'vue';

export default {
  name: 'HeatmapLayerManager',
  props: {
    view: Object,      // ArcGIS View 实例
    modules: Array,    // ArcGIS 模块数组
    points: Array,     // WFS 请求回来的当前视图点数据
    visible: Boolean   // 目录树控制的显隐
  },
  setup(props) {
    const heatmapLayer = shallowRef(null);
    const selectedField = ref("");

    //-- 移除图层--//
    const removeLayer = () => {
      if (heatmapLayer.value && props.view) {
        props.view.map.remove(heatmapLayer.value);
        heatmapLayer.value = null;
      }
    };

    //-- 根据字段获取热力图渲染器--//
    const getRenderer = (field) => {
      let maxIntensity = 100;
      if (field === 'QMRS') {
        maxIntensity = 1000;
      } else if (field) {
        maxIntensity = 500000;
      }

      return {
        type: "heatmap",
        field: field || null,
        colorStops: [
          { color: "rgba(0, 255, 255, 0)", ratio: 0 },
          { color: "rgba(0, 255, 255, 0.7)", ratio: 0.2 },
          { color: "rgb(0, 255, 0)", ratio: 0.4 },
          { color: "rgb(255, 255, 0)", ratio: 0.6 },
          { color: "rgb(255, 0, 0)", ratio: 0.9 }
        ],
        radius: 14,
        maxPixelIntensity: maxIntensity,
        minPixelIntensity: 0
      };
    };

    //-- 执行创建或刷新--//
    const refreshHeatmap = async () => {
      if (!props.visible || !props.points || props.points.length === 0) {
        removeLayer();
        return;
      }

      const [, , FeatureLayer, Graphic] = props.modules;

      // 转换数据为 ArcGIS Graphics
      const graphics = props.points.map((f, idx) => {
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
            ZCZJ: parseFloat(p.ZCZJ || 0),
            YYLR: parseFloat(p.YYLR || 0),
            QMRS: parseFloat(p.QMRS || 0),
            YYSR: parseFloat(p.YYSR || 0)
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
          { name: "ZCZJ", type: "double" },
          { name: "YYLR", type: "double" },
          { name: "QMRS", type: "double" },
          { name: "YYSR", type: "double" }
        ],
        renderer: getRenderer(selectedField.value)
      });

      props.view.map.add(heatmapLayer.value);
    };

    watch(
      [() => props.points, () => selectedField.value, () => props.visible],
      () => {
        refreshHeatmap();
      },
      { deep: true, immediate: true }
    );

    onUnmounted(removeLayer);

    return { selectedField };
  }
};
</script>

<style scoped>
.heatmap-field-selector {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  background: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
}

.label {
  font-size: 13px;
  font-weight: bold;
  color: #666;
  margin-right: 8px;
}
</style>