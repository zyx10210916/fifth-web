<template>
  <div class="map-toolbar">
    <div :class="['btn', { active: activeTool === 'distance' }]" @click="startMeasure('distance')" title="测距">
      <img src="@/assets/images/tool-cj.svg" alt="测距">
    </div>

    <div :class="['btn', { active: activeTool === 'area' }]" @click="startMeasure('area')" title="测面">
      <img src="@/assets/images/tool-cm.svg" alt="测面">
    </div>

    <div :class="['btn', { active: activeTool === 'rect' }]" @click="startRectSelect" title="拉框选择">
      <img src="@/assets/images/tool-hz.svg" alt="拉框">
    </div>

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
    const activeTool = ref(null);
    const draw = shallowRef(null);
    const measureLayer = shallowRef(null);

    // 缓存加载的模块
    const modules = shallowRef({});

    // 1. 在 setup 中定义一个变量保存 SketchViewModel 类
    const SketchVMClass = shallowRef(null);

    const initModules = async () => {
      // 这里的数组顺序必须和下面解构的顺序完全一致！
      const [
        Draw,
        GraphicsLayer,
        Graphic,
        geometryEngine,
        SketchViewModel
      ] = await loadModules([
        'esri/views/draw/Draw',
        'esri/layers/GraphicsLayer',
        'esri/Graphic',
        'esri/geometry/geometryEngine',
        'esri/widgets/Sketch/SketchViewModel'
      ]);

      // 存储到 modules 缓存中
      modules.value = { Draw, GraphicsLayer, Graphic, geometryEngine };
      // 特别存储类定义
      SketchVMClass.value = SketchViewModel;

      draw.value = new Draw({ view: props.view });

      // 初始化图层
      if (!measureLayer.value) {
        measureLayer.value = new GraphicsLayer({
          id: "custom_tools_layer",
          spatialReference: props.view.spatialReference
        });
        props.view.map.add(measureLayer.value);
      }
    };

    const clearAll = () => {
      measureLayer.value?.removeAll();
      activeTool.value = null;
      // 通知后端重置 uniqueCode 为空（可选）
      // emit('select-complete', '');
    };

    // --- 测量功能 ---
   const startMeasure = async (type) => {
  await initModules();
  clearAll();
  activeTool.value = type;
 
  const isLine = type === 'distance';
  const action = draw.value.create(isLine ? "polyline" : "polygon");
 
  const handleUpdate = (evt) => {
    measureLayer.value.removeAll();
    const { Graphic, geometryEngine } = modules.value;
 
    const geometry = {
      type: isLine ? "polyline" : "polygon",
      [isLine ? "paths" : "rings"]: [evt.vertices],
      spatialReference: props.view.spatialReference 
    };
 
   const graphic = new Graphic({
    geometry,
    symbol: {
      type: isLine ? "simple-line" : "simple-fill",
      color: [255, 68, 0, isLine ? 0.8 : 0.3], // 线不透明度更高
      width: isLine ? "4px" : null, // 仅对线生效 
      outline: { 
        color: [255, 68, 0], 
        width: isLine ? 0 : 4, // 面边框保持4px 
        style: "solid"
      }
    }
  });
    measureLayer.value.add(graphic);
 
    // 如果是测距，增加端点的大点 
    if (isLine && evt.vertices.length >= 2) {
      // 起点 
      const startPoint = new Graphic({
        geometry: {
          type: "point",
          x: evt.vertices[0][0],
          y: evt.vertices[0][1],
          spatialReference: props.view.spatialReference
        },
        symbol: {
          type: "simple-marker",
          color: [255, 68, 0],
          size: "12px", // 增大点大小 
          outline: {
            color: [255, 255, 255],
            width: 1
          }
        }
      });
      
      // 终点
      const endPoint = new Graphic({
        geometry: {
          type: "point",
          x: evt.vertices.at(-1)[0],
          y: evt.vertices.at(-1)[1],
          spatialReference: props.view.spatialReference
        },
        symbol: {
          type: "simple-marker",
          color: [255, 68, 0],
          size: "12px", // 增大点大小 
          outline: {
            color: [255, 255, 255],
            width: 1 
          }
        }
      });
      
      measureLayer.value.addMany([startPoint, endPoint]);
    }
 
    // 计算数值
    let text = "";
    try {
      if (isLine) {
        const length = geometryEngine.planarLength(geometry, "meters");
        text = length > 1000 ? (length / 1000).toFixed(2) + " km" : Math.round(length) + " m";
      } else {
        const area = geometryEngine.planarArea(geometry, "square-meters");
        text = area > 1000000 ? (area / 1000000).toFixed(2) + " km²" : Math.round(area) + " m²";
      }
    } catch (e) { console.error("计算失败", e); }
 
    // 显示文字标签 - 调大字体 
    const label = new Graphic({
      geometry: { type: "point", x: evt.vertices.at(-1)[0], y: evt.vertices.at(-1)[1], spatialReference: props.view.spatialReference },
      symbol: {
        type: "text",
        color: "white",
        haloColor: "#ff4400",
        haloSize: "2px", // 增大光晕 
        text: text,
        font: { 
          size: 14, // 增大字体大小 (原来是12)
          weight: "bold",
          family: "Arial" 
        },
        verticalAlignment: "bottom"
      }
    });
    measureLayer.value.add(label);
 
    if (evt.type === "draw-complete") activeTool.value = null;
  };
 
  action.on(["cursor-update", "vertex-add", "draw-complete"], handleUpdate);
};
    // --- 拉框选择功能 ---
   // --- 拉框选择功能（改为多边形选择） --- 
// --- 拉框选择功能（改为点击创建顶点的多边形选择） ---
const startRectSelect = async () => {
  await initModules();
  clearAll();
  activeTool.value = 'rect';
 
  const sketchVM = new SketchVMClass.value({
    view: props.view,
    layer: measureLayer.value,
    updateOnGraphicClick: false,
    // 设置多边形样式 
    polygonSymbol: {
      type: "simple-fill",
      color: [0, 145, 255, 0.15],
      outline: {
        color: [0, 145, 255],
        width: 2,
        style: "dash"
      }
    },
    // 配置为点击创建顶点 
    defaultCreateOptions: {
      mode: "click",  // 使用点击创建顶点模式 
      toggleToolOnClick: true  // 允许通过再次点击完成绘制 
    }
  });
 
  // 创建多边形
  sketchVM.create("polygon");
 
  // 监听创建完成 
  sketchVM.on("create", (event) => {
    if (event.state === "complete") {
      querySelectedPoints(event.graphic.geometry);
      activeTool.value = null;
      
      // 可以选择保留绘制图形或移除
      // measureLayer.value.remove(event.graphic); 
      
      sketchVM.destroy();
    }
  });
 
  // 添加双击完成绘制的事件监听 
  props.view.on("double-click", () => {
    sketchVM.complete();
  });
};

    // 查询逻辑
  const querySelectedPoints = async (geometry) => {
  const buildingLayer = props.view.map.findLayerById('building');
  if (!buildingLayer) return;
 
  try {
    const results = await buildingLayer.queryFeatures({
      geometry: geometry,
      outFields: ["b109_2"],
      returnGeometry: true // 确保返回几何图形 
    });
 
    // 1. 发送数据给后端
    const codes = [...new Set(
      results.features 
        .map(f => f.attributes.b109_2)
        .filter(code => code && String(code).trim() !== "")
    )].join(',');
 
    emit('select-complete', codes);
 
    // 2. 视觉反馈：在地图上高亮选中的点 
    if (results.features.length > 0) {
      console.log(`成功选中 ${results.features.length} 个建筑点`);
      
      // 清除之前的高亮点 
      measureLayer.value.removeAll();
      
      // 添加高亮点图形 
      const { Graphic } = modules.value;
      results.features.forEach(feature => {
        const highlightGraphic = new Graphic({
          geometry: feature.geometry,
          symbol: {
            type: "simple-marker",
            color: [255, 0, 0, 0.8], // 修改为红色，透明度0.8 
            size: "12px",
            outline: {
              color: [255, 255, 255],
              width: 2
            }
          }
        });
        measureLayer.value.add(highlightGraphic);
      });
    } else {
      console.warn("当前框选范围内没有建筑点");
      measureLayer.value.removeAll();
    }
 
  } catch (err) {
    console.error("查询建筑点失败:", err);
  }
};

    onUnmounted(() => {
      if (measureLayer.value) props.view.map.remove(measureLayer.value);
    });

    return { activeTool, startMeasure, startRectSelect, clearAll };
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