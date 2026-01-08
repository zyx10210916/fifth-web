<template>
  <div :class="['map-container', { 'full-size': isFullSize }]">
    <div id="viewDiv" style="width: 100%; height: 100vh; position: relative;">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-content">
          <div class="spinner"></div>
          <div class="loading-text">{{ loadingText }}</div>
        </div>
      </div>

      <ul class="mapType">
        <li v-for="item in mapList" :key="item.id" @click="handleBasemapChange(item.id)"
          :class="['item', item.className, { actived: activeBasemapId === item.id }]"
          :style="{ backgroundImage: `url(${activeBasemapId === item.id ? item.imgActive : item.imgNormal})` }">
          <span class="map-label">{{ item.name }}</span>
        </li>
      </ul>

      <MapTools :view="view" @select-complete="handleMapSelection" />

      <div class="layer-tree-panel">
        <div class="panel-header">
          <h3>目录树</h3>
          <button @click="togglePanel" class="toggle-btn">{{ panelVisible ? '隐藏' : '显示' }}</button>
        </div>
        <div v-if="panelVisible" class="tree-content">
          <div class="tree-node tree-group"><label>经济普查数据</label></div>
          <div class="tree-node">
            <input type="checkbox" id="building" v-model="buildingLayer.visible"
              @change="updateLayerVisibility(buildingLayer)" class="tree-checkbox">
            <label for="building" class="tree-label">企业建筑点</label>
          </div>
          <div class="tree-node">
            <input type="checkbox" id="house" v-model="houseLayer.visible" @change="updateLayerVisibility(houseLayer)"
              class="tree-checkbox">
            <label for="house" class="tree-label">企业房屋面</label>
          </div>

          <div class="tree-node tree-group"><label>基础地理数据</label></div>
          <div class="tree-node">
            <input type="checkbox" id="basemap" v-model="basemapVisible" @change="updateBasemapVisibility"
              class="tree-checkbox">
            <label for="basemap" class="tree-label">底图</label>
          </div>
          <div v-for="layer in boundaryLayers" :key="layer.id" class="tree-node">
            <input type="checkbox" :id="layer.id" v-model="layer.visible" @change="updateLayerVisibility(layer)"
              class="tree-checkbox">
            <label :for="layer.id" class="tree-label">{{ layer.title }}</label>
          </div>

          <!-- <div class="tree-node tree-group"><label>文本标注</label></div>
          <div class="tree-node">
            <input type="checkbox" id="labelDistrict" v-model="labelVisibility.district" @change="updateLabelVisibility"
              class="tree-checkbox">
            <label for="labelDistrict" class="tree-label">区县名称</label>
          </div>
          <div class="tree-node">
            <input type="checkbox" id="labelTown" v-model="labelVisibility.town" @change="updateLabelVisibility"
              class="tree-checkbox">
            <label for="labelTown" class="tree-label">街镇名称</label>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, shallowRef, onMounted, onUnmounted, computed, watch } from 'vue';
import { loadModules } from 'esri-loader';
import MapTools from './MapTools.vue';
import { getBulletinList } from '@/api/data-display';
import dtNormal from "@/assets/images/dt-1.png";
import dtActive from "@/assets/images/dt-2.png";
import yxtNormal from "@/assets/images/yxt-1.png";
import yxtActive from "@/assets/images/yxt-2.png";

// 集中管理所有服务URL 
const SERVICE_URLS = {
  // 底图服务 
  basemaps: {
    street: "https://ypt.gzlpc.gov.cn/apiway/api-service/encrypt/rest/services/0dd2d428919f40818617fdf05492aaff/DataServer",
    satellite: "https://ypt.gzlpc.gov.cn/apiway/api-service/encrypt/rest/services/1e8f0689c7f84b3581bf98449ed8e700/DataServer"
  },

  // 行政区划矢量数据服务
  boundary: {
    vector: "https://ypt.gzlpc.gov.cn/apiway/api-service/encrypt/rest/services/2baabbc53f404e7a96f9f9da3ec0ec68/DataServer",
    layers: {
      district: {
        layerId: 2,
        title: "区县行政边界",
        defaultVisible: true,
        labelSize: "14px",
        labelColor: "#222",
        outlineColor: [70, 130, 180, 0.8]
      },
      town: {
        layerId: 3,
        title: "街镇行政边界",
        defaultVisible: false,
        labelSize: "12px",
        labelColor: "#444",
        outlineColor: [210, 105, 30, 0.8]
      }
    }
  },

  // 经济普查数据服务 
  economic: {
    house: "http://10.44.58.28:8089/geoserver/workspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=workspace%3AWJPFWMpc38&maxFeatures=5000&outputFormat=application%2Fjson"
  },

  // ArcGIS API配置 
  arcgisApi: {
    js: "http://10.44.58.28:8000/4.19/init.js",
    css: "http://10.44.58.28:8000/4.19/esri/themes/light/main.css"
  }
};

export default {
  name: 'ArcGISFeatureLayerJsonMix',
  components: { MapTools },
  props: {
    isFullSize: { type: Boolean, default: false },
    showPopup: { type: Boolean, default: false },
    filterParams: { type: Object, default: () => ({}) }
  },

  setup(props, { emit }) {
    // ========== 状态管理 ==========
    const view = shallowRef(null);
    const panelVisible = ref(true);
    const activeBasemapId = ref('street');
    const basemapVisible = ref(true);
    const mapModules = shallowRef(null);
    const loading = ref(true);
    const loadingText = ref('正在加载地图...');
    const labelLayers = shallowRef({});
    const layers = ref([]);
    const highlightRef = shallowRef(null);

    // 单独控制企业建筑点和房屋面 
    const buildingLayer = ref({
      id: "building",
      title: "企业建筑点",
      visible: true,
      type: "economic"
    });

    const houseLayer = ref({
      id: "house",
      title: "企业房屋面",
      visible: false,
      type: "economic",
      loaded: false
    });

    const labelVisibility = ref({
      district: false,
      town: false,
      village: false
    });

    // ========== 地图配置 ==========
    const mapList = [
      { id: 'street', name: '地图', className: 'mapType-normal', imgNormal: dtNormal, imgActive: dtActive },
      { id: 'satellite', name: '影像图', className: 'mapType-image', imgNormal: yxtNormal, imgActive: yxtActive }
    ];

    // ========== 计算属性 ==========
    const economicLayers = computed(() => layers.value.filter(l => l.type === "economic"));
    const boundaryLayers = computed(() => layers.value.filter(l => l.type === "boundary"));

    // ========== 地图操作函数 ==========
    const initializeMap = async () => {
      try {
        const modules = await loadModules([
          'esri/Map', 'esri/views/MapView', 'esri/layers/FeatureLayer',
          'esri/Graphic', 'esri/geometry/SpatialReference', 'esri/Basemap',
          'esri/layers/TileLayer', 'esri/symbols/TextSymbol', 'esri/layers/support/LabelClass',
          'esri/geometry/Point', 'esri/symbols/SimpleMarkerSymbol', 'esri/symbols/SimpleFillSymbol',
          'esri/tasks/support/Query',
        ], {
          url: SERVICE_URLS.arcgisApi.js,
          css: SERVICE_URLS.arcgisApi.css
        });

        mapModules.value = modules;
        const [Map, MapView, FeatureLayer, Graphic, SpatialReference, Basemap, TileLayer] = modules;

        // 创建默认底图 
        const defaultBasemap = new Basemap({
          baseLayers: [new TileLayer({ url: SERVICE_URLS.basemaps.street })],
          id: "street"
        });

        // 创建地图实例 
        const map = new Map({
          basemap: defaultBasemap,
          layers: []
        });

        // 设置空间参考
        const sr = new SpatialReference({ wkid: 4526 });

        // 创建视图 
        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: sr,
          extent: {
            xmin: 38392997.07,
            ymin: 2495903.35,
            xmax: 38505644.28,
            ymax: 2648163.20,
            spatialReference: sr
          },
          ui: { components: [] }
        });

        // 设置弹窗 
        view.value.when(() => {
          view.value.popup.autoOpenEnabled = props.showPopup;
        });

        // 加载所有图层
        await loadAllLayers(map);

      } catch (error) {
        console.error("地图初始化失败:", error);
        loading.value = false;
      }
    };

    // ========== 图层管理函数 ==========
    const loadAllLayers = async (map) => {
      try {
        // 1. 加载行政区划矢量图层 
        await loadBoundaryLayers(map);

        // 2. 加载经济普查数据图层 
        await loadEconomicLayers(map);

        loading.value = false;
      } catch (error) {
        console.error("图层加载失败:", error);
        loading.value = false;
      }
    };

    /**
     * 加载行政区划矢量图层
     */
    const loadBoundaryLayers = async (map) => {
      try {
        const [FeatureLayer, TextSymbol] = mapModules.value.slice(2, 4);

        // 加载所有行政区划图层
        for (const [key, config] of Object.entries(SERVICE_URLS.boundary.layers)) {
          const layer = new FeatureLayer({
            url: `${SERVICE_URLS.boundary.vector}/${config.layerId}`,
            id: key,
            title: config.title,
            outFields: ["*"],
            spatialReference: { wkid: 4526 },
            renderer: {
              type: "simple",
              symbol: {
                type: "simple-fill",
                color: [0, 0, 0, 0], // 透明填充
                outline: {
                  color: config.outlineColor,
                  width: 1.5
                }
              }
            },
            popupTemplate: {
              title: "{NAME}",
              content: config.title
            },
            labelingInfo: [{
              symbol: {
                type: "text",
                color: config.labelColor,
                haloColor: "white",
                haloSize: "1.5px",
                font: {
                  size: config.labelSize,
                  weight: "bold",
                  family: "Microsoft YaHei"
                }
              },
              labelExpressionInfo: { expression: "$feature.NAME" },
              labelPlacement: "center-center",
              minScale: key === 'district' ? 100000 : 50000,
              maxScale: 0
            }],
            labelsVisible: labelVisibility.value[key.replace('label', '').toLowerCase()] || false,
            visible: config.defaultVisible
          });

          layer.when(() => {
            console.log(`${config.title}图层加载完成`);
          }, (error) => {
            console.error(`${config.title}图层加载失败:`, error);
          });

          map.add(layer);
          layers.value.push({
            id: key,
            title: config.title,
            visible: config.defaultVisible,
            instance: layer,
            type: "boundary"
          });
        }
      } catch (error) {
        console.error("加载行政区划图层失败:", error);
        throw error;
      }
    };

    /**
     * 加载经济普查数据图层 
     */
    const loadEconomicLayers = async (map) => {
      try {
        // 只加载建筑点图层，房屋面不自动加载
        const buildingLayerInstance = await createBulletinListLayer(buildingLayer.value);
        if (buildingLayerInstance) {
          map.add(buildingLayerInstance);
        }

      } catch (error) {
        console.error("加载经济普查图层失败:", error);
        throw error;
      }
    };

    /**
     * 从getBulletinList接口创建企业点图层 
     */
    const createBulletinListLayer = async (config) => {
      try {
        loadingText.value = `正在加载${config.title}...`;
        const res = await getBulletinList({ pageNo: 1, pageSize: 5000, ...props.filterParams });

        if (!res?.data?.list) return null;

        const [Map, MapView, FeatureLayer, Graphic] = mapModules.value;

        const validGraphics = res.data.list
          .map((item, index) => {
            const x = parseFloat(item.XZ_AXIS);
            const y = parseFloat(item.YZ_AXIS);
            if (isNaN(x) || isNaN(y)) return null;

            return new Graphic({
              geometry: {
                type: "point",
                x: x,
                y: y,
                spatialReference: { wkid: 4526 }
              },
              attributes: {
                ObjectId: index,
                B109: item.B109,
                ZYSR: item.ZYSR,
                ZCZJ: item.ZCZJ,
                QMRS: item.QMRS,
                CYRS: item.CYRS
              }
            });
          })
          .filter(g => g !== null);

        const layer = new FeatureLayer({
          source: validGraphics,
          id: config.id,
          title: config.title,
          objectIdField: "ObjectId",
          fields: [
            { name: "ObjectId", type: "oid" },
            { name: "B109", type: "string" },
            { name: "ZYSR", type: "string" },
            { name: "ZCZJ", type: "string" },
            { name: "QMRS", type: "string" },
            { name: "CYRS", type: "string" }
          ],
          renderer: {
            type: "simple",
            symbol: {
              type: "simple-marker",
              color: [156, 120, 0, 0.8],
              size: "8px",
              outline: { color: [255, 255, 255], width: 1 }
            }
          },
          spatialReference: { wkid: 4526 },
          visible: config.visible,
          popupTemplate: createPopupTemplate(config)
        });
        return layer;
      } catch (e) {
        console.error("创建图层失败:", e);
        return null;
      }
    };

    /**
     * 创建JSON图层（用于企业房屋面数据）
     */
    const createJsonLayer = async (config) => {
      try {
        loadingText.value = `正在加载${config.title}...`;
        const res = await fetch(config.url);
        const data = await res.json();

        if (!data.features || data.features.length === 0) {
          console.warn(`${config.title} 接口返回数据为空`);
          return null;
        }

        const FeatureLayer = mapModules.value[2];
        const Graphic = mapModules.value[3];
        const SimpleFillSymbol = mapModules.value[11];

        const graphics = data.features.map((f, index) => {
          const { type, coordinates: coords } = f.geometry;
          let geometry = null;

          if (type === "MultiPolygon") {
            geometry = {
              type: "polygon",
              rings: coords.flat(1),
              spatialReference: { wkid: 4526 }
            };
          } else if (type === "Polygon") {
            geometry = {
              type: "polygon",
              rings: coords,
              spatialReference: { wkid: 4526 }
            };
          } else if (type === "Point") {
            geometry = {
              type: "point",
              x: coords[0],
              y: coords[1],
              spatialReference: { wkid: 4526 }
            };
          }

          if (!geometry) return null;

          return new Graphic({
            geometry: geometry,
            attributes: {
              ...f.properties,
              ObjectId: index
            }
          });
        }).filter(g => g !== null);

        const fillSymbol = new SimpleFillSymbol({
          color: [255, 215, 0, 0.3],
          outline: {
            color: [255, 140, 0, 1],
            width: 1.5
          }
        });

        const layer = new FeatureLayer({
          source: graphics,
          id: config.id,
          title: config.title,
          objectIdField: "ObjectId",
          fields: [
            { name: "ObjectId", type: "oid" },
            ...Object.keys(data.features[0].properties || {}).map(key => ({
              name: key,
              type: "string"
            }))
          ],
          renderer: {
            type: "simple",
            symbol: fillSymbol
          },
          popupTemplate: createPopupTemplate(config),
          spatialReference: { wkid: 4526 },
          visible: config.defaultVisible
        });

        const existingIdx = layers.value.findIndex(l => l.id === config.id);
        if (existingIdx > -1) {
          layers.value[existingIdx].instance = layer;
        } else {
          layers.value.push({
            id: config.id,
            title: config.title,
            visible: config.defaultVisible,
            instance: layer,
            type: config.type
          });
        }

        return layer;
      } catch (e) {
        console.error(`创建${config.title}图层具体错误:`, e);
        return null;
      }
    };

    // ========== 辅助函数 ==========
    const createGeometryFromFeature = (feature) => {
      const { type, coordinates: coords } = feature.geometry;

      if (type === "Point") {
        return { type: "point", x: coords[0], y: coords[1] };
      } else {
        const rings = type === "Polygon" ? coords : coords.flat(1);
        return { type: "polygon", rings };
      }
    };

    const createPopupTemplate = (config) => {
      if (!props.showPopup || config.id !== "building") return null;

      return {
        title: "{B109}",
        content: [{
          type: "fields",
          fieldInfos: [
            { fieldName: "ZYSR", label: "主营收入" },
            { fieldName: "ZCZJ", label: "资产总计" },
            { fieldName: "QMRs", label: "期末人数" },
            { fieldName: "CYRS", label: "专业人数" }
          ]
        }]
      };
    };

    const createRenderer = (config, geometryType) => {
      const [SimpleMarkerSymbol, SimpleFillSymbol] = mapModules.value.slice(7, 9);

      if (geometryType === "point") {
        return {
          type: "simple",
          symbol: new SimpleMarkerSymbol({
            color: [56, 168, 0, 0.8],
            size: "8px",
            outline: {
              color: [255, 255, 255],
              width: 1
            }
          })
        };
      } else {
        return {
          type: "simple",
          symbol: new SimpleFillSymbol({
            color: [56, 168, 0, 0.4],
            outline: {
              color: [255, 255, 255],
              width: 1
            }
          })
        };
      }
    };

    const getBoundaryColor = (layerId) => {
      const colors = [
        [34, 139, 34, 0.8],    // 市级 - 绿色
        [70, 130, 180, 0.8],   // 区级 - 蓝色 
        [210, 105, 30, 0.8]    // 镇街级 - 橙色
      ];
      return colors[layerId] || [0, 0, 0, 0.8];
    };

    const setupHouseClickHandler = (houseLayerInstance) => {
      if (!view.value || !mapModules.value) return;

      // 1. 统一获取模块，避免使用容易出错的 slice 索引
      const [
        Map, MapView, FeatureLayer, Graphic, SpatialReference,
        Basemap, TileLayer, TextSymbol, LabelClass, Point,
        SimpleMarkerSymbol, SimpleFillSymbol, Query
      ] = mapModules.value;

      // 清除之前高亮的辅助函数
      const clearHighlight = () => {
        if (highlightRef.value) {
          view.value.graphics.remove(highlightRef.value);
          highlightRef.value = null;
        }
      };

      // 2. 监听点击事件
      view.value.on("click", async (event) => {
        try {
          // 每次点击先清空旧的高亮
          clearHighlight();

          // 3. 射线检测：只关注房屋面图层
          const hitTestResult = await view.value.hitTest(event);
          const houseHit = hitTestResult.results.find(
            (result) => result.graphic?.layer?.id === "house"
          );

          if (!houseHit) return;

          const clickedGraphic = houseHit.graphic;

          // 4. 创建自定义高亮 Graphic（不再依赖系统默认的黑色框）
          const highlightGraphic = new Graphic({
            geometry: clickedGraphic.geometry,
            symbol: new SimpleFillSymbol({
              color: [0, 255, 255, 0.2], // 青色透明填充
              outline: {
                color: [0, 255, 255, 1], // 亮青色边框
                width: 2.5
              }
            })
          });

          view.value.graphics.add(highlightGraphic);
          highlightRef.value = highlightGraphic;

          // 5. 空间查询：查找该面内的企业点
          const buildingLayer = view.value.map.findLayerById("building");
          if (buildingLayer) {
            const query = new Query();
            query.geometry = clickedGraphic.geometry;
            query.spatialRelationship = "intersects"; // 相交查询
            query.outFields = ["B109"];
            query.returnGeometry = false;

            const result = await buildingLayer.queryFeatures(query);

            if (result.features.length > 0) {
              const codes = result.features
                .map(f => f.attributes.B109)
                .filter(Boolean);
              emit('map-select', codes.join(','));
            } else {
              // 提示无数据
              loadingText.value = "提示：该区域内未发现企业点";
              loading.value = true;
              setTimeout(() => (loading.value = false), 1500);
              emit('map-select', 'none');
            }
          }
        } catch (error) {
          console.error("房屋面点击处理异常:", error);
        }
      });
    };

    // ========== UI交互函数 ==========
    const handleBasemapChange = async (id) => {
      if (activeBasemapId.value === id || !view.value || !mapModules.value) return;

      const [Basemap, TileLayer] = mapModules.value.slice(5, 7);
      const url = SERVICE_URLS.basemaps[id];

      view.value.map.basemap = new Basemap({
        baseLayers: [new TileLayer({ url })],
        id
      });
      activeBasemapId.value = id;
    };

    const updateLayerVisibility = async (layer) => {
      try {
        loadingText.value = `正在加载${layer.title}...`;
        loading.value = true;

        const targetLayer = view.value?.map.findLayerById(layer.id);

        if (targetLayer) {
          targetLayer.visible = layer.visible;
        } else {
          if (layer.id === "house" && layer.visible) {
            const houseConfig = {
              id: "house",
              title: "企业房屋面",
              type: "economic",
              url: SERVICE_URLS.economic.house,
              defaultVisible: true
            };
            const newLayer = await createJsonLayer(houseConfig);
            if (newLayer && view.value?.map) {
              view.value.map.add(newLayer);
              layer.loaded = true;

              // 添加房屋面点击事件监听
              setupHouseClickHandler(newLayer);
            }
          } else if (layer.id === "building") {
            const newLayer = await createBulletinListLayer(layer);
            if (newLayer && view.value?.map) {
              view.value.map.add(newLayer);
            }
          }
        }
      } catch (error) {
        console.error(`更新图层 ${layer.id} 可见性失败:`, error);
        if (layer.id === "house") {
          layer.visible = false;
        }
      } finally {
        loading.value = false;
      }
    };

    const updateBasemapVisibility = () => {
      if (view.value?.map.basemap) {
        view.value.map.basemap.baseLayers.items[0].visible = basemapVisible.value;
      }
    };

    const updateLabelVisibility = () => {
      Object.entries(labelVisibility.value).forEach(([type, visible]) => {
        const layer = view.value?.map.findLayerById(type === 'district' ? 'district' : 'town');
        if (layer) {
          layer.labelsVisible = visible;
        }
      });
    };

    const handleMapSelection = (uniqueCodeStr) => {
      emit('map-select', uniqueCodeStr);
    };

    const togglePanel = () => {
      panelVisible.value = !panelVisible.value;
    };

    // ========== 生命周期钩子 ==========
    onMounted(initializeMap);
    onUnmounted(() => {
      if (highlightRef.value) {
        view.value?.graphics.remove(highlightRef.value);
      }
      view.value?.destroy();
    });

    // 监听filterParams变化，重新加载企业点数据
    watch(() => props.filterParams, () => {
      if (buildingLayer.value.visible) {
        updateLayerVisibility(buildingLayer.value);
      }
    }, { deep: true });

    // ========== 暴露给模板的属性和方法 ==========
    return {
      view,
      panelVisible,
      economicLayers,
      boundaryLayers,
      buildingLayer,
      houseLayer,
      mapList,
      activeBasemapId,
      basemapVisible,
      loading,
      loadingText,
      labelVisibility,
      handleBasemapChange,
      handleMapSelection,
      updateLayerVisibility,
      updateBasemapVisibility,
      updateLabelVisibility,
      togglePanel
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

  &.full-size {
    margin: 0 !important;
  }

  #viewDiv {
    height: 100%;
  }
}

.layer-tree-panel {
  position: absolute;
  top: 20px;
  left: 2%;
  z-index: 50;
  background: white;
  border-radius: 6px;
  width: 240px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
}

.panel-header {
  padding: 10px 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 15px;
    color: #333;
  }
}

.tree-content {
  padding: 15px;
}

.config-section {
  background: #f0f7ff;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;

  .label-text {
    font-size: 12px;
    color: #666;
    margin-bottom: 5px;
  }

  .tip-text {
    font-size: 11px;
    color: #999;
    margin-top: 5px;
  }
}

.custom-select {
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
  font-size: 13px;
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
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.mapType {
  position: absolute;
  bottom: 2%;
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