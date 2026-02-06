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
import { MAP_CONFIG } from '@/config/mapConfig';
import { mapQuery } from '@/utils/mapQuery';
import { toMultiPolygonWKT } from '@/utils/mapUtils';
import { IS_HIGH_PERFORMANCE } from '@/api/data-display';

export default {
  name: 'MapTools',
  props: {
    view: { type: Object, required: true },
    modules: { type: Object, required: true },
    appendMode: { type: Boolean, default: false },
  },
  setup(props, { emit, expose }) {
    const activeTool = ref(null);
    const draw = shallowRef(null);
    const measureLayer = shallowRef(null);
    const currentSketchVM = shallowRef(null);
    const isWorking = ref(false) //标记工具是否正在运行中

    // 初始化内部图层
    const initToolResources = () => {
      const { Draw, GraphicsLayer } = props.modules;
      if (!draw.value) draw.value = new Draw({ view: props.view });
      if (!measureLayer.value) {
        measureLayer.value = new GraphicsLayer({ id: "custom_tools_layer" });
        props.view.map.add(measureLayer.value);
      }
    };

    // 停止当前活动工具
    const destroyActiveTools = () => {
      draw.value?.reset();
      currentSketchVM.value?.destroy();
      currentSketchVM.value = null;
    };

    // --- 清除功能 ---
    const clearAll = (shouldNotify = true) => {
      measureLayer.value?.removeAll();
      destroyActiveTools();
      activeTool.value = null;
      isWorking.value = false;
      if (shouldNotify) emit('map-select', { zxAxis: "", yxAxis: "" });
    };

    // --- 测量功能 ---
    const startMeasure = async (type) => {
      initToolResources();
      clearAll(false);
      activeTool.value = type;
      isWorking.value = true;

      const isLine = type === 'distance';
      const action = draw.value.create(isLine ? "polyline" : "polygon");

      // 定义处理函数
      const handleUpdate = (evt) => {
        measureLayer.value.removeAll();
        const { Graphic, geometryEngine } = props.modules;

        const geometry = {
          type: isLine ? "polyline" : "polygon",
          [isLine ? "paths" : "rings"]: [evt.vertices],
          spatialReference: props.view.spatialReference
        };

        // 绘制测量的线或面
        measureLayer.value.add(new Graphic({
          geometry,
          symbol: {
            type: isLine ? "simple-line" : "simple-fill",
            color: [255, 68, 0, isLine ? 0.8 : 0.3],
            width: isLine ? "4px" : null,
            outline: { color: [255, 68, 0], width: isLine ? 0 : 4, style: "solid" }
          }
        }));

        // 如果是测距，添加起止点标记
        if (isLine && evt.vertices.length >= 2) {
          const pointSymbol = {
            type: "simple-marker",
            color: [255, 68, 0],
            size: "12px",
            outline: { color: [255, 255, 255], width: 1 }
          };

          const startPoint = new Graphic({
            geometry: { type: "point", x: evt.vertices[0][0], y: evt.vertices[0][1], spatialReference: props.view.spatialReference },
            symbol: pointSymbol
          });

          const endPoint = new Graphic({
            geometry: { type: "point", x: evt.vertices.at(-1)[0], y: evt.vertices.at(-1)[1], spatialReference: props.view.spatialReference },
            symbol: pointSymbol
          });

          measureLayer.value.addMany([startPoint, endPoint]);
        }

        // 计算长度或面积
        let text = "";
        try {
          if (isLine) {
            const length = geometryEngine.planarLength(geometry, "meters");
            text = length > 1000 ? (length / 1000).toFixed(2) + " km" : Math.round(length) + " m";
          } else {
            const area = geometryEngine.planarArea(geometry, "square-meters");
            text = area > 1000000 ? (area / 1000000).toFixed(2) + " km²" : Math.round(area) + " m²";
          }
        } catch (e) {
          console.error("空间计算失败", e);
        }

        // 添加测量数值标签
        const label = new Graphic({
          geometry: {
            type: "point",
            x: evt.vertices.at(-1)[0],
            y: evt.vertices.at(-1)[1],
            spatialReference: props.view.spatialReference
          },
          symbol: {
            type: "text",
            color: "white",
            haloColor: "#ff4400",
            haloSize: "2px",
            text: text,
            font: { size: 14, weight: "bold", family: "Arial" },
            verticalAlignment: "bottom"
          }
        });
        measureLayer.value.add(label);

        // 完成后重置状态
        if (evt.type === "draw-complete") {
          activeTool.value = null;
          isWorking.value = false;
        }
      };

      // 统一监听事件
      action.on(["cursor-update", "vertex-add", "draw-complete"], handleUpdate);
    };

    // --- 拉框选择功能 ---
    const startRectSelect = () => {
      initToolResources();
      destroyActiveTools();
      if (!props.appendMode) clearAll();
      activeTool.value = 'rect';
      isWorking.value = true;

      const { SketchViewModel } = props.modules;
      const sketchVM = new SketchViewModel({
        view: props.view,
        layer: measureLayer.value,
        updateOnGraphicClick: false,
        polygonSymbol: MAP_CONFIG.styles.selectionRect
      });

      currentSketchVM.value = sketchVM;
      sketchVM.create("polygon");
      sketchVM.on("create", (event) => {
        if (event.state === "complete") {
          querySelectedPoints(event.graphic.geometry);
          activeTool.value = null;
          isWorking.value = false;
        }
      });
    };

    // 高亮选中及发送查询逻辑
    const querySelectedPoints = async (geometry) => {
      const wktStr = toMultiPolygonWKT(geometry, props.modules);

      if (IS_HIGH_PERFORMANCE.value) {
        emit('map-select', { 
          wkt: wktStr 
        });

        mapQuery(geometry, props.modules).then(result => {
          // 视觉响应：添加红点高亮
          if (result.graphics) {
            // if (!props.appendMode) measureLayer.value.removeAll();
            measureLayer.value.addMany(result.graphics); 
          }

          emit('map-select', { 
            wkt: wktStr,
            zxAxis: result.zxAxis, 
            yxAxis: result.yxAxis,
            _isUpdate: true 
          });
        });

      } else {
        const result = await mapQuery(geometry, props.modules);
        
        if (result.graphics) {
          // if (!props.appendMode) measureLayer.value.removeAll();
          measureLayer.value.addMany(result.graphics); 
        }

        // 同时发出所有参数
        emit('map-select', { 
          zxAxis: result.zxAxis, 
          yxAxis: result.yxAxis, 
          wkt: wktStr 
        });
      }
    };

    onUnmounted(() => { if (measureLayer.value) props.view.map.remove(measureLayer.value); });

    expose({ clearAll, startRectSelect, startMeasure, isWorking });
    return { activeTool, startMeasure, startRectSelect, clearAll };
  }
};
</script>

<style scoped>
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