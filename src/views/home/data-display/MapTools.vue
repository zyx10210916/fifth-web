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
import { MAP_CONFIG } from '@/config/mapConfig';

export default {
  name: 'MapTools',
  props: {
    view: { type: Object, required: true },
    appendMode: { type: Boolean, default: false }
  },
  setup(props, { emit, expose }) {
    const activeTool = ref(null);
    const draw = shallowRef(null);
    const measureLayer = shallowRef(null);
    const modules = shallowRef({});
    const currentSketchVM = shallowRef(null);
    const SketchVMClass = shallowRef(null);

    const initModules = async () => {
      const [
        Draw,
        GraphicsLayer,
        Graphic,
        geometryEngine,
        SketchViewModel,
        Point
      ] = await loadModules([
        'esri/views/draw/Draw',
        'esri/layers/GraphicsLayer',
        'esri/Graphic',
        'esri/geometry/geometryEngine',
        'esri/widgets/Sketch/SketchViewModel',
        'esri/geometry/Point'
      ]);

      modules.value = { Draw, GraphicsLayer, Graphic, geometryEngine, Point };
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

    // 停止当前活动工具
    const destroyActiveTools = () => {
      if (draw.value) {
        draw.value.reset();
      }
      if (currentSketchVM.value) {
        currentSketchVM.value.destroy();
        currentSketchVM.value = null;
      }
    };

    const clearAll = (shouldNotify = true) => {
      measureLayer.value?.removeAll();
      destroyActiveTools();
      activeTool.value = null;
      if (shouldNotify) {
        emit('select-complete', '');
      }
    };

    // --- 测量功能 ---
    const startMeasure = async (type) => {
      await initModules();
      clearAll(false);
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
            color: [255, 68, 0, isLine ? 0.8 : 0.3],
            width: isLine ? "4px" : null,
            outline: {
              color: [255, 68, 0],
              width: isLine ? 0 : 4,
              style: "solid"
            }
          }
        });
        measureLayer.value.add(graphic);

        if (isLine && evt.vertices.length >= 2) {
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
              size: "12px",
              outline: {
                color: [255, 255, 255],
                width: 1
              }
            }
          });

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
              size: "12px",
              outline: {
                color: [255, 255, 255],
                width: 1
              }
            }
          });

          measureLayer.value.addMany([startPoint, endPoint]);
        }

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

        const label = new Graphic({
          geometry: { type: "point", x: evt.vertices.at(-1)[0], y: evt.vertices.at(-1)[1], spatialReference: props.view.spatialReference },
          symbol: {
            type: "text",
            color: "white",
            haloColor: "#ff4400",
            haloSize: "2px",
            text: text,
            font: {
              size: 14,
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
    //拉框逻辑
    const startRectSelect = async () => {
      await initModules();
      destroyActiveTools();

      if (currentSketchVM.value) {
        currentSketchVM.value.destroy();
      }

      if (!props.appendMode) {
        clearAll();
      }
      activeTool.value = 'rect';

      const sketchVM = new SketchVMClass.value({
        view: props.view,
        layer: measureLayer.value,
        updateOnGraphicClick: false,
        polygonSymbol: MAP_CONFIG.styles.selectionRect,
        defaultCreateOptions: {
          mode: "click",
          toggleToolOnClick: true
        }
      });
      currentSketchVM.value = sketchVM;
      sketchVM.create("polygon");
      sketchVM.on("create", (event) => {
        if (event.state === "complete") {
          querySelectedPoints(event.graphic.geometry);
          activeTool.value = null;
        }
      });

      props.view.on("double-click", () => {
        sketchVM.complete();
      });
    };

    // 高亮选中及发送查询逻辑
    const querySelectedPoints = async (geometry) => {
      const bldCfg = MAP_CONFIG.economic.building;
      const buildingLayer = props.view.map.findLayerById(bldCfg.id); 
      const highlightStyle = MAP_CONFIG.styles.highlightPoint;

      if (!buildingLayer) return;

      try {
        if (!modules.value.Point) await initModules();
        const { Graphic, geometryEngine, Point } = modules.value;
        const layerView = await props.view.whenLayerView(buildingLayer);
        const viewSR = props.view.spatialReference;

        // --- 获取数据 ---
        const ext = geometry.extent;
        const bbox = `${ext.xmin},${ext.ymin},${ext.xmax},${ext.ymax}`;
        const response = await fetch(bldCfg.getWfsUrl(bbox));
        const geojson = await response.json();
        const candidates = geojson.features || [];

        // --- 过滤逻辑 ---
        const featuresInPoly = candidates.filter(f => {
          const pt = new Point({
            x: Number(f.geometry.coordinates[0]),
            y: Number(f.geometry.coordinates[1]),
            spatialReference: viewSR
          });
          return geometryEngine.contains(geometry, pt);
        });

        // --- 清理逻辑 ---
        if (!props.appendMode) {
          measureLayer.value.removeAll();
          const rectGraphic = new Graphic({
            geometry: geometry,
            symbol: MAP_CONFIG.styles.selectionRect 
          });
          measureLayer.value.add(rectGraphic);
        } else {
        }

        // ---  渲染高亮点 ---
        const coordinateMap = new Map();
        const allSelectedWyms = [];

        featuresInPoly.forEach(f => {
          const wym = f.properties.WYM;
          if (!wym) return;
          allSelectedWyms.push(wym);

          const x = Number(f.geometry.coordinates[0]);
          const y = Number(f.geometry.coordinates[1]);
          const geoKey = `${x.toFixed(6)},${y.toFixed(6)}`;

          if (!coordinateMap.has(geoKey)) {
            coordinateMap.set(geoKey, {
              geometry: new Point({ x, y, spatialReference: viewSR }),
              wyms: [wym]
            });
          } else {
            coordinateMap.get(geoKey).wyms.push(wym);
          }
        });

        // 发送代码
        emit('select-complete', [...new Set(allSelectedWyms)].join(','));

        // 绘制高亮点
        coordinateMap.forEach((data) => {
          measureLayer.value.add(new Graphic({
            geometry: data.geometry,
            symbol: highlightStyle,
            attributes: { wyms: data.wyms }
          }));
        });

        console.log(`[统一查询模式] 选中记录: ${allSelectedWyms.length}, 渲染坐标点: ${coordinateMap.size}`);
      } catch (err) {
        console.error("MapTools 查询失败:", err);
      }
    };
    onUnmounted(() => {
      if (measureLayer.value) props.view.map.remove(measureLayer.value);
    });

    expose({
      clearAll,
      startRectSelect,
      startMeasure
    });

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