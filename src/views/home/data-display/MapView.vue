<template>
  <div :class="['map-container']">
    <div id="viewDiv" style="width: 100%; height: 100%; position: relative;">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <div class="loading-text">{{ loadingText }}</div>
        </div>
      </div>

      <slot name="map-overlay"></slot>

      <template v-if="mapIsReady">
        <BuildingLayer :view="view" :modules="mapModules" :visible="layersState.building.visible"
          @loading-status="s => updateLayerLoading('building', s)" />

        <HouseLayer :view="view" :modules="mapModules" :visible="layersState.house.visible"
          @loading-status="s => updateLayerLoading('house', s)" />

        <HeatmapLayer v-if="showHeatmapOption" :view="view" :modules="mapModules" :visible="layersState.heatmap.visible"
          @loading-status="s => updateLayerLoading('heatmap', s)" />
      </template>

      <ul class="mapType">
        <li v-for="item in mapList" :key="item.id" @click="handleBasemapChange(item.id)"
          :class="['item', item.className, { actived: activeBasemapId === item.id }]"
          :style="{ backgroundImage: `url(${activeBasemapId === item.id ? item.imgActive : item.imgNormal})` }">
          <span class="map-label">{{ item.name }}</span>
        </li>
      </ul>

      <MapTools ref="mapToolsRef" :view="view" :modules="mapModules" :appendMode="appendMode"
        @map-select="handleMapSelect" />

      <div class="layer-tree-panel">
        <div class="panel-header">
          <h3>目录树</h3>
          <button @click="panelVisible = !panelVisible" class="toggle-btn">{{ panelVisible ? '隐藏' : '显示' }}</button>
        </div>

        <div v-show="panelVisible" class="tree-content">
          <div class="tree-node tree-group"><label>经济普查数据</label></div>

          <div class="tree-node">
            <input type="checkbox" id="building" v-model="layersState.building.visible" class="tree-checkbox">
            <label for="building" class="tree-label">
              企业建筑点
              <span v-if="layersState.building.isFetching" style="color: #999; margin-left: 4px;">(加载中...)</span>
            </label>
          </div>

          <div v-if="showHeatmapOption" class="tree-node">
            <input type="checkbox" id="heatmap" v-model="layersState.heatmap.visible" class="tree-checkbox">
            <label for="heatmap" class="tree-label">
              企业热力图
              <span v-if="layersState.heatmap.isFetching" style="color: #999; margin-left: 4px;">(加载中...)</span>
            </label>
          </div>

          <div class="tree-node">
            <input type="checkbox" id="house" v-model="layersState.house.visible" class="tree-checkbox">
            <label for="house" class="tree-label">
              企业房屋面
              <span v-if="layersState.house.isFetching" style="color: #999; margin-left: 4px;">(加载中...)</span>
            </label>
          </div>

          <div class="tree-node tree-group"><label>基础地理数据</label></div>

          <div class="tree-node">
            <input type="checkbox" id="basemap-toggle" v-model="basemapVisible" @change="updateBasemapVisibility"
              class="tree-checkbox">
            <label for="basemap-toggle" class="tree-label">底图</label>
          </div>

          <div v-for="layer in boundaryLayers" :key="layer.id" class="tree-node">
            <input type="checkbox" :id="layer.id" v-model="layer.visible" @change="updateLayerVisibility(layer)"
              class="tree-checkbox">
            <label :for="layer.id" class="tree-label">{{ layer.title }}</label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, shallowRef, onMounted, onUnmounted, computed, markRaw, nextTick, provide } from 'vue';
import { loadModules } from 'esri-loader';
import MapTools from './MapTools.vue';
import BuildingLayer from './layers/BuildingLayer.vue';
import HeatmapLayer from './layers/HeatmapLayer.vue';
import HouseLayer from './layers/HouseLayer.vue';
import { MAP_CONFIG } from '@/config/mapConfig';
import { mapPopup } from '@/hooks/mapPopup';
import { mapQuery } from '@/utils/mapQuery';

export default {
  name: 'MapView',
  components: { MapTools, BuildingLayer, HeatmapLayer, HouseLayer },
  props: {
    loading: { type: Boolean, default: false },
    loadingText: { type: String, default: '正在加载地图...' },
    initialExtent: { type: Object, default: () => MAP_CONFIG.initialExtent },
    boundaryLayersConfig: { type: Object, default: () => MAP_CONFIG.boundary.layers },
    boundaryBaseUrl: { type: String, default: MAP_CONFIG.boundary.baseUrl },
    appendMode: { type: Boolean, default: false },
    showHeatmapOption: { type: Boolean, default: false }
  },
  emits: ['map-select', 'map-loaded'],

  setup(props, { emit, expose }) {
    const view = shallowRef(null);
    const mapModules = shallowRef(null);
    const mapIsReady = ref(false);
    const panelVisible = ref(true);
    const basemapVisible = ref(true);
    const mapList = MAP_CONFIG.basemapUI;
    const activeBasemapId = ref('street');
    const mapToolsRef = ref(null);
    const layers = ref([]);
    const { showPopup } = mapPopup(view, mapModules);

    // 目录树用的计算属性
    const boundaryLayers = computed(() => layers.value.filter(l => l.type === 'boundary'));

    // --- 图层状态管理：统一 visible 与加载状态 ---
    const layersState = ref({
      building: { visible: false, isFetching: false },
      house: { visible: false, isFetching: false },
      heatmap: { visible: false, isFetching: false }
    });

    const updateLayerLoading = (layerKey, status) => {
      if (layersState.value[layerKey]) layersState.value[layerKey].isFetching = status;
    };

    // 加载边界图层
    const loadBoundaryLayers = async (map) => {
      const FeatureLayer = mapModules.value.FeatureLayer;
      for (const [key, config] of Object.entries(props.boundaryLayersConfig)) {
        const layer = new FeatureLayer({
          url: `${props.boundaryBaseUrl}/${config.layerId}`,
          id: key,
          title: config.title,
          renderer: {
            type: "simple",
            symbol: {
              type: "simple-fill",
              color: [0, 0, 0, 0],
              outline: { color: config.outlineColor, width: 1.5 }
            }
          },
          visible: config.defaultVisible || false
        });
        map.add(layer);
        // 同步到统一的 layers 列表供目录树展示
        layers.value.push({
          id: key,
          title: config.title,
          visible: config.defaultVisible || false,
          instance: markRaw(layer),
          type: "boundary"
        });
      }
    };

    //--- 初始化地图 ---//
    const initializeMap = async () => {
      try {
        const moduleEntries = Object.entries(MAP_CONFIG.modules);
        const paths = moduleEntries.map(([path]) => path);
        const names = moduleEntries.map(([, name]) => name);

        const loadedArr = await loadModules(paths, {
          url: MAP_CONFIG.arcgis.js,
          css: MAP_CONFIG.arcgis.css
        });

        const modulesObj = {};
        names.forEach((name, index) => {
          modulesObj[name] = loadedArr[index];
        });

        mapModules.value = markRaw(modulesObj);
        provide('arcgisModules', mapModules.value);

        const { Map, MapView, Basemap, TileLayer } = modulesObj;

        const map = new Map({
          basemap: new Basemap({
            // baseLayers: [new TileLayer({ url: MAP_CONFIG.basemaps.street })],
            baseLayers: null,
            id: "street"
          })
        });

        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: { wkid: 4526 },
          extent: props.initialExtent,
        });

        view.value.when(async () => {
          mapIsReady.value = true;
          await nextTick();

          // 边界加载
          // await loadBoundaryLayers(map);

          view.value.on("click", handleMapClick);
          emit('map-loaded', { view: view.value, map, modules: mapModules.value });
        });
      } catch (error) {
        console.error("地图初始化失败:", error);
      }
    };

    //--- 处理地图点击事件 ---//
    // const handleMapClick = async (event) => {
    //   if (mapToolsRef.value && mapToolsRef.value.isWorking) {
    //     return;
    //   }

    //   if (!view.value || !mapModules.value) return;
    //   const { Graphic } = mapModules.value;

    //   const hitTest = await view.value.hitTest(event);
    //   const priorityIds = ["building", "house", "town", "district"];
    //   let bestFit = null;

    //   for (const id of priorityIds) {
    //     const isVisible = layersState.value[id]?.visible ?? true;
    //     if (isVisible) {
    //       const hit = hitTest.results.find(r => r.graphic?.layer?.id === id);
    //       if (hit) {
    //         bestFit = hit.graphic;
    //         break;
    //       }
    //     }
    //   }

    //   if (bestFit) {
    //     if (!props.appendMode) view.value.graphics.removeAll();

    //     // 防御性处理：防止 attributes 为 null
    //     const attrs = bestFit.attributes || {};
    //     const layerId = bestFit.layer.id;
    //     let result;

    //     if (layerId === 'building') {
    //       // 提取“坐标”字段
    //       const coordStr = attrs["坐标"] || "";
    //       const [zx, yx] = coordStr.split(',').map(s => s.trim());

    //       // 点高亮
    //       view.value.graphics.add(new Graphic({
    //         geometry: bestFit.geometry,
    //         symbol: MAP_CONFIG.styles.highlightPoint
    //       }));

    //       // 调用弹窗方法
    //       if (zx && yx) {
    //         await showPopup({ zxAxis: zx, yxAxis: yx }, event.mapPoint, true);
    //       }

    //       // 点查询
    //       result = await mapQuery(bestFit.geometry, mapModules.value, { zxAxis: zx, yxAxis: yx });
    //     } else {
    //       // 面查询
    //       view.value.graphics.add(new Graphic({
    //         geometry: bestFit.geometry,
    //         symbol: MAP_CONFIG.styles.highlightPolygon
    //       }));
    //       result = await mapQuery(bestFit.geometry, mapModules.value);
    //     }

    //     if (result.graphics) view.value.graphics.addMany(result.graphics);
    //     emit('map-select', { zxAxis: result.zxAxis, yxAxis: result.yxAxis });
    //   } else {
    //     // 非追加模式，点击空白处清空
    //     if (!props.appendMode) {
    //       view.value.graphics.removeAll();
    //       view.value.popup.close();
    //       emit('map-select', { zxAxis: "", yxAxis: "" });
    //     }
    //   }
    // };

   const handleMapClick = async (event) => {
      if (mapToolsRef.value && mapToolsRef.value.isWorking) return;
      if (!view.value || !mapModules.value) return;

      const { Graphic, Extent, geometryEngine } = mapModules.value;

      // --- 阶段 1：点选探测 (优先判断) ---
      if (layersState.value.building.visible) {
        const tolerance = view.value.resolution * 5; 
        const searchExtent = new Extent({
          xmin: event.mapPoint.x - tolerance,
          ymin: event.mapPoint.y - tolerance,
          xmax: event.mapPoint.x + tolerance,
          ymax: event.mapPoint.y + tolerance,
          spatialReference: view.value.spatialReference
        });

        const pointResult = await mapQuery(searchExtent, mapModules.value);

        if (pointResult.graphics && pointResult.graphics.length > 0) {
          // 非追加模式下清空旧高亮
          if (!props.appendMode) view.value.graphics.removeAll();

          let targetGraphic = null;
          if (pointResult.graphics.length === 1) {
            targetGraphic = pointResult.graphics[0];
          } else {
            let minDistance = Infinity;
            pointResult.graphics.forEach((g) => {
              const dist = geometryEngine.distance(event.mapPoint, g.geometry);
              if (dist < minDistance) {
                minDistance = dist;
                targetGraphic = g;
              }
            });
          }

          // 【核心检查点】：从 attributes 提取坐标
          const attrs = targetGraphic.attributes || {};
          const coordStr = attrs["坐标"] || "";
          
          // 只有在确定拿到坐标字符串时才执行后续逻辑
          if (coordStr && coordStr.includes(',')) {
            const [zx, yx] = coordStr.split(',').map(s => s.trim());

            // 1. 视觉响应：高亮最近的点
            view.value.graphics.add(targetGraphic);

            // 2. 接口响应 A：弹出信息窗（内部通常会调用单位详情/热力图接口）
            await showPopup({ zxAxis: zx, yxAxis: yx }, event.mapPoint, true);
            
            // 3. 接口响应 B：向外通知坐标改变（由父组件触发 getsumdatadisplay 汇总接口）
            emit('map-select', { zxAxis: zx, yxAxis: yx });
            
            return; // 成功点中点，不再执行后续面选逻辑
          }
        }
      }

      // --- 阶段 2：面选探测 (若没点中点，则判断是否点中面) ---
      const hitTest = await view.value.hitTest(event);
      const polygonIds = ["house", "town", "district"];
      // 在命中的结果中寻找行政区或房屋面，且该图层必须是可见的
      const hitPolygon = hitTest.results.find(r => {
        const id = r.graphic?.layer?.id;
        return polygonIds.includes(id) && (layersState.value[id]?.visible ?? true);
      });

      if (hitPolygon) {
        const bestFit = hitPolygon.graphic;
        if (!props.appendMode) view.value.graphics.removeAll();

        // 高亮被选中的面边界
        view.value.graphics.add(new Graphic({
          geometry: bestFit.geometry,
          symbol: MAP_CONFIG.styles.highlightPolygon
        }));

        // 执行面查询：获取该面几何范围内所有的点
        const polyResult = await mapQuery(bestFit.geometry, mapModules.value);
        if (polyResult.graphics) view.value.graphics.addMany(polyResult.graphics);
        
        emit('map-select', { zxAxis: polyResult.zxAxis, yxAxis: polyResult.yxAxis });
      } else {
        // --- 阶段 3：空白区域 (清空) ---
        if (!props.appendMode) {
          view.value.graphics.removeAll();
          view.value.popup.close();
          emit('map-select', { zxAxis: "", yxAxis: "" });
        }
      }
    };

    const handleBasemapChange = (id) => {
      const { Basemap, TileLayer } = mapModules.value;
      view.value.map.basemap = new Basemap({
        baseLayers: [new TileLayer({ url: MAP_CONFIG.basemaps[id], visible: basemapVisible.value })],
        id: id
      });
      activeBasemapId.value = id;
    };

    const updateLayerVisibility = (layer) => {
      if (layer.instance) layer.instance.visible = layer.visible;
    };

    const updateBasemapVisibility = () => {
      if (view.value.map.basemap) {
        view.value.map.basemap.baseLayers.forEach(lyr => lyr.visible = basemapVisible.value);
      }
    };

    onMounted(initializeMap);
    onUnmounted(() => {
      if (view.value) {
        console.log('正在清理地图资源...');
        if (view.value.map) {
          view.value.map.layers?.removeAll();
        }
        if (view.value.graphic) {
          view.value.graphic.removeAll();
        }
        view.value.destroy();
        view.value.container = null;
        view.value = null;
      }
    });

    expose({
      getMapView: () => view.value,
      clearMapTools: () => mapToolsRef.value?.clearAll()
    });

    return {
      view, mapModules, mapIsReady, layersState,
      panelVisible, boundaryLayers, mapList, mapToolsRef,
      activeBasemapId, basemapVisible,
      togglePanel: () => panelVisible.value = !panelVisible.value,
      updateLayerLoading, updateLayerVisibility,
      handleBasemapChange, updateBasemapVisibility,
      handleMapSelect: (payload) => emit('map-select', payload),
      getMapView: () => view.value,
      clearMapTools: () => mapToolsRef.value?.clearAll()
    };
  }
};
</script>

<style lang="scss" scoped>
.map-container {
  flex: 1;
  background: white;
  height: 100%;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.layer-tree-panel {
  position: absolute;
  top: 1%;
  left: 6%;
  z-index: 50;
  background: white;
  border-radius: 6px;
  width: 260px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.panel-header {
  padding: 10px 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h3 {
    margin: 0;
    font-size: 15px;
    color: #333;
  }

  .toggle-btn {
    background: #0091ff;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
  }
}

.tree-content {
  padding: 15px;
}

.tree-node {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
}

.tree-group {
  font-weight: bold;
  border-left: 3px solid #0091ff;
  padding-left: 8px;
  margin-top: 15px;
}

.tree-checkbox {
  margin-right: 10px;
  cursor: pointer;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0091ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}

.mapType {
  position: absolute;
  top: 75%;
  right: 20px;
  z-index: 100;
  display: flex;
  gap: 10px;
  list-style: none;

  .item {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    border: 2px solid white;
    cursor: pointer;
    background-size: cover;
    position: relative;

    &.actived {
      border-color: #0091ff;
    }

    .map-label {
      position: absolute;
      bottom: 0;
      width: 100%;
      text-align: center;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      font-size: 11px;
    }
  }
}
</style>