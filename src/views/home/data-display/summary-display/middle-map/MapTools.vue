<template>
  <div class="map-toolbar">
    <!-- 测距 -->
    <div :class="['btn', { active: activeTool === 'distance' }]" 
         @click="startMeasure('distance')" 
         title="测距">
      <img src="@/assets/images/tool-cj.svg" alt="测距">
    </div>
 
    <!-- 测面 -->
    <div :class="['btn', { active: activeTool === 'area' }]" 
         @click="startMeasure('area')" 
         title="测面">
      <img src="@/assets/images/tool-cm.svg" alt="测面">
    </div>
 
    <!-- 拉框选择 -->
    <div :class="['btn', { active: activeTool === 'rect' }]" 
         @click="startRectSelect" 
         title="拉框选择">
      <img src="@/assets/images/tool-hz.svg" alt="拉框">
    </div>
 
    <!-- 清除 -->
    <div class="btn" @click="clearAll" title="清除">
      <img src="@/assets/images/tool-qc.svg" alt="清除">
    </div>
  </div>
</template>
 
<script>
import { ref, shallowRef, onUnmounted } from 'vue';
import { loadModules } from 'esri-loader';
 
export default {
  name: 'MapTools',
  props: {
    view: {
      type: Object,
      required: true 
    }
  },
  setup(props, { emit }) {
    // 状态管理 
    const activeTool = ref(null);
    const draw = shallowRef(null);
    const measureLayer = shallowRef(null);
    const sketchVM = shallowRef(null);
    const vertexGraphics = shallowRef([]);
 
    // 初始化图形图层
    const initGraphicsLayer = async () => {
      const [GraphicsLayer] = await loadModules(['esri/layers/GraphicsLayer']);
      measureLayer.value = new GraphicsLayer({ id: "custom_tools_layer" });
      props.view.map.add(measureLayer.value);
    };
 
    // 核心功能模块 ==============================================
 
    // 1. 测量功能（测距/测面）
    const startMeasure = async (type) => {
      await initModules();
      clearAll();
      activeTool.value = type;
 
      const action = type === 'distance' 
        ? draw.value.create("polyline", { mode: "click" }) 
        : draw.value.create("polygon", { mode: "click" });
 
      action.on(["vertex-add", "draw-complete"], async (evt) => {
        if (evt.type === "vertex-add") await drawVertex(evt.vertices.at(-1));
        if (evt.type === "draw-complete") await finishMeasurement(evt.vertices, type);
      });
    };
 
    // 2. 拉框选择功能 
    const startRectSelect = async () => {
      await initModules();
      clearAll();
      activeTool.value = 'rect';
 
      const [SketchViewModel] = await loadModules(['esri/widgets/Sketch/SketchViewModel']);
      sketchVM.value = new SketchViewModel({
        view: props.view,
        layer: measureLayer.value,
        updateOnGraphicClick: false 
      });
 
      sketchVM.value.create("rectangle");
      sketchVM.value.on("create", handleRectSelectComplete);
    };
 
    // 3. 清除功能 
    const clearAll = () => {
      measureLayer.value?.removeAll();
      vertexGraphics.value = [];
      activeTool.value = null;
      sketchVM.value?.cancel();
      resetLayerHighlights();
    };
 
    // 辅助方法 ==================================================
 
    // 初始化ArcGIS模块 
    const initModules = async () => {
      if (draw.value) return;
      
      const [Draw, GraphicsLayer] = await loadModules([
        'esri/views/draw/Draw',
        'esri/layers/GraphicsLayer'
      ]);
 
      draw.value = new Draw({ view: props.view });
      await initGraphicsLayer();
    };
 
    // 绘制顶点标记 
    const drawVertex = async (point) => {
      const [Graphic] = await loadModules(['esri/Graphic']);
      vertexGraphics.value.forEach(g => measureLayer.value.remove(g));
      
      const vertexGraphic = new Graphic({
        geometry: { type: "point", x: point[0], y: point[1] },
        symbol: {
          type: "simple-marker",
          color: [255, 255, 255],
          size: "10px",
          outline: { color: [0, 145, 255], width: 2 }
        }
      });
 
      measureLayer.value.add(vertexGraphic);
      vertexGraphics.value.push(vertexGraphic);
    };
 
    // 完成测量绘制 
    const finishMeasurement = async (vertices, type) => {
      const [Graphic, geometryEngine] = await loadModules([
        'esri/Graphic', 
        'esri/geometry/geometryEngine'
      ]);
 
      const geometry = {
        type: type === 'distance' ? "polyline" : "polygon",
        paths: type === 'distance' ? [vertices] : undefined,
        rings: type === 'area' ? [vertices] : undefined,
        spatialReference: props.view.spatialReference
      };
 
      measureLayer.value.add(new Graphic({
        geometry,
        symbol: {
          type: `simple-${type === 'distance' ? 'line' : 'fill'}`,
          color: [0, 145, 255, 0.7],
          outline: { color: [0, 145, 255], width: 1.5 }
        }
      }));
 
      activeTool.value = null;
    };
 
    // 处理拉框选择完成
    const handleRectSelectComplete = async (event) => {
      if (event.state !== "complete") return;
 
      const [FeatureFilter, Graphic] = await loadModules([
        'esri/layers/support/FeatureFilter',
        'esri/Graphic'
      ]);
 
      // 高亮选中的建筑和房屋 
      ['building', 'house'].forEach(layerId => {
        const layer = props.view.map.findLayerById(layerId);
        if (layer) {
          layer.featureEffect = {
            filter: new FeatureFilter({
              geometry: event.graphic.geometry,
              spatialRelationship: "intersects"
            }),
            includedEffect: "brightness(150%)",
            excludedEffect: "grayscale(50%) opacity(30%)"
          };
        }
      });
 
      // 打印选中的OBJECTID
      const queryResults = await Promise.all(
        ['building', 'house'].map(layerId => 
          props.view.map.findLayerById(layerId)?.queryFeatures({
            geometry: event.graphic.geometry,
            outFields: ["OBJECTID"],
            returnGeometry: false 
          }) || { features: [] }
        )
      );
 
      const objectIds = queryResults.flatMap(r => 
        r.features.map(f => f.attributes.OBJECTID)
      );
      console.log("选中要素的OBJECTID:", objectIds);
 
      activeTool.value = null;
    };
 
    // 重置图层高亮 
    const resetLayerHighlights = () => {
      ['building', 'house'].forEach(layerId => {
        const layer = props.view.map.findLayerById(layerId);
        if (layer) layer.featureEffect = null;
      });
    };
 
    onUnmounted(() => {
      clearAll();
      props.view.map.remove(measureLayer.value);
    });
 
    return {
      activeTool,
      startMeasure,
      startRectSelect,
      clearAll 
    };
  }
};
</script>
 
<style scoped>
/* 保持原有样式不变 */
.map-toolbar {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: row;
  gap: 10px;
  z-index: 100;
}
 
.btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(40, 44, 52, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}
 
.btn:hover {
  background: rgba(60, 64, 72, 0.9);
}
 
.btn.active {
  background: rgba(24, 144, 255, 0.8);
}
 
.btn img {
  width: 30px;
  height: 30px;
  filter: brightness(0) invert(1);
}
</style>