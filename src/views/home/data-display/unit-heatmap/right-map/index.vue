<template>
  <div class="map-container">
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

      <div class="layer-control-panel">
        <div class="panel-header">
          <h3>热力图分析</h3>
          <button @click="panelVisible = !panelVisible" class="toggle-btn">
            {{ panelVisible ? '隐藏' : '显示' }}
          </button>
        </div>
        <div v-if="panelVisible" class="panel-content">
          <div class="control-section">
            <h4 class="section-title">热力图设置</h4>
            <div class="field-selector">
              <label class="selector-label">权重字段：</label>
              <select v-model="selectedHeatmapField" @change="handleFieldChange" class="field-select">
                <option value="">-- 仅按分布密度 --</option>
                <option v-for="field in fieldOptions" :key="field.value" :value="field.value">
                  {{ field.label }}
                </option>
              </select>
              <div class="current-field">当前字段: {{ currentFieldLabel }}</div>
            </div>
          </div>

          <div class="control-section">
            <h4 class="section-title">图层控制</h4>
            <div class="layer-list">
              <div v-for="layer in layers" :key="layer.id" class="layer-item">
                <input type="checkbox" :id="layer.id" v-model="layer.visible" @change="updateLayerVisibility(layer)"
                  class="layer-checkbox">
                <label :for="layer.id" class="layer-label">{{ layer.title }}</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, shallowRef, onMounted, onUnmounted, computed, markRaw, watch } from 'vue';
import { loadModules } from 'esri-loader';
import dtNormal from "@/assets/images/dt-1.png";
import dtActive from "@/assets/images/dt-2.png";
import yxtNormal from "@/assets/images/yxt-1.png";
import yxtActive from "@/assets/images/yxt-2.png";

export default {
  name: 'ArcGISHeatmapPro',
  props: {
    selectedUnit: {
      type: Object,
      default: null
    }
  },
  setup(props, { expose }) {
    const view = shallowRef(null);
    const mapModules = shallowRef(null);
    const panelVisible = ref(true);
    const loading = ref(true);
    const loadingText = ref('正在初始化地图...');
    const layers = ref([]);
    const selectedHeatmapField = ref("qmrs");
    const activeBasemapId = ref('street');
    const highlightGraphic = shallowRef(null);

    const fieldOptions = ref([
      { value: "qmrs", label: "期末人数", type: "Long" },
      { value: "zczj", label: "资产总计", type: "Double" },
      { value: "zysr", label: "主营收入", type: "Integer" },
      { value: "cyrs", label: "从业人数", type: "Integer" }
    ]);

    const currentFieldLabel = computed(() => {
      if (!selectedHeatmapField.value) return "仅按分布密度";
      const field = fieldOptions.value.find(f => f.value === selectedHeatmapField.value);
      return field ? field.label : "未知字段";
    });

    const mapList = [
      { id: 'street', name: '地图', className: 'mapType-normal', imgNormal: dtNormal, imgActive: dtActive },
      { id: 'satellite', name: '影像图', className: 'mapType-image', imgNormal: yxtNormal, imgActive: yxtActive }
    ];

    const layerConfigs = [
      {
        id: "building_points",
        title: "企业建筑点",
        url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows",
        typeName: "dataCenterWorkspace:gongbaokuqiyedianpc38_1",
        pageSize: 20000,  // 每页加载20000条
        rendererType: "simple"
      },
      {
        id: "heatmap_layer",
        title: "热力图",
        url: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows",
        typeName: "dataCenterWorkspace:gongbaokuqiyedianpc38_1",
        pageSize: 20000,  // 每页加载20000条 
        rendererType: "heatmap"
      }
    ];

    // 渲染器创建函数
    const createHeatmapRenderer = (fieldName) => {
      const isMoneyField = ["zczj", "zysr"].includes(fieldName);
      return {
        type: "heatmap",
        field: fieldName || null,
        colorStops: [
          { color: "rgba(0, 255, 255, 0)", ratio: 0 },
          { color: "rgba(0, 255, 255, 0.7)", ratio: 0.2 },
          { color: "rgb(0, 255, 0)", ratio: 0.4 },
          { color: "rgb(255, 255, 0)", ratio: 0.6 },
          { color: "rgb(255, 0, 0)", ratio: 0.9 }
        ],
        radius: 18,
        maxPixelIntensity: isMoneyField ? 100000 : 100,
        minPixelIntensity: 0
      };
    };

    const createSimpleRenderer = () => {
      return {
        type: "simple",
        symbol: {
          type: "simple-marker",
          color: [226, 119, 40],  // 橙色
          outline: {
            color: [255, 255, 255],
            width: 1
          },
          size: 6
        }
      };
    };

    // 加载GeoJSON图层
    const loadGeoJsonLayer = async (config, map) => {
      try {
        loadingText.value = `正在加载 ${config.title} 数据...`;
        loading.value = true;

        const [FeatureLayer, Graphic] = mapModules.value;
        let allGraphics = [];
        let currentMinId = 0;
        const pageSize = 20000; // 每次加载20000条 
        let hasMoreData = true;
        let lastCount = 0;

        // 分页加载所有数据 
        while (hasMoreData) {
          loadingText.value = `正在加载 ${config.title} 数据 (已加载 ${currentMinId} 条)...`;

          // 使用CQL_FILTER基于OBJECTID分页 
          const pageUrl = `${config.url}?service=WFS&version=1.0.0&request=GetFeature` +
            `&typeName=${config.typeName}&outputFormat=application/json` +
            `&cql_filter=OBJECTID>=${currentMinId} AND OBJECTID<${currentMinId + pageSize}`;

          const response = await fetch(pageUrl);
          const data = await response.json();

          if (!data.features || data.features.length === 0) {
            // 如果连续5次获取到空数据，则认为已经加载完毕 
            if (lastCount >= 5) {
              hasMoreData = false;
            } else {
              lastCount++;
              currentMinId += pageSize;
            }
          } else {
            lastCount = 0;
            const pageGraphics = data.features.map((f, index) => {
              const coords = f.geometry.coordinates;
              const attributes = {
                ...f.properties,
                custom_oid: currentMinId + index,
                // 确保数值字段是数字类型 
                ...Object.fromEntries(
                  fieldOptions.value.map(field => [
                    field.value,
                    Number(f.properties[field.value]) || 0
                  ])
                )
              };

              return new Graphic({
                geometry: {
                  type: "point",
                  x: coords[0],
                  y: coords[1],
                  spatialReference: { wkid: 4526 }
                },
                attributes: attributes
              });
            });

            allGraphics = [...allGraphics, ...pageGraphics];
            currentMinId += pageSize;
          }

          // 热力图优化：每加载10万条就更新一次热力图
          if (allGraphics.length > 0 && allGraphics.length % 100000 === 0) {
            await updatePartialHeatmap(allGraphics.slice(-100000));
          }
        }

        // 优化热力图更新的辅助函数
        const updatePartialHeatmap = async (graphics) => {
          if (!view.value || !graphics.length) return;

          const [FeatureLayer] = mapModules.value;
          const tempLayer = new FeatureLayer({
            source: graphics,
            renderer: createHeatmapRenderer(selectedHeatmapField.value)
          });

          // 先移除旧的热力图图层 
          const oldLayer = view.value.map.findLayerById("heatmap_temp");
          if (oldLayer) view.value.map.remove(oldLayer);

          // 添加临时热力图图层 
          tempLayer.id = "heatmap_temp";
          view.value.map.add(tempLayer);
        };
        // 最终创建完整图层
        const layer = new FeatureLayer({
          id: config.id,
          title: config.title,
          source: allGraphics,
          fields: [
            { name: "custom_oid", type: "oid" },
            ...fieldOptions.value.map(field => ({
              name: field.value,
              type: field.type.toLowerCase()
            })),
            { name: "B109", type: "string" },
            { name: "b109_2", type: "string" }
          ],
          objectIdField: "custom_oid",
          renderer: config.rendererType === "heatmap"
            ? createHeatmapRenderer(selectedHeatmapField.value)
            : createSimpleRenderer(),
          spatialReference: { wkid: 4526 }
        });

        map.add(layer);
        layers.value = [...layers.value.filter(l => l.id !== config.id), {
          id: config.id,
          title: config.title,
          visible: true,
          instance: markRaw(layer)
        }];

      } catch (err) {
        console.error("加载图层出错:", err);
      } finally {
        loading.value = false;
      }
    };

    const removeLayer = (layerId) => {
      if (!view.value) return;

      const map = view.value.map;
      const layer = map.findLayerById(layerId);
      if (layer) {
        map.remove(layer);
      }

      layers.value = layers.value.filter(l => l.id !== layerId);
    };

    const handleFieldChange = async () => {
      if (!view.value) return;

      // 移除旧热力图图层
      removeLayer("heatmap_layer");

      // 重新创建热力图图层
      await loadGeoJsonLayer(
        layerConfigs.find(l => l.id === "heatmap_layer"),
        view.value.map
      );
    };

    // 高亮并定位到选中单位
    const highlightAndLocateUnit = async (unit) => {
      if (!unit || !view.value) return;

      try {
        const [Graphic, FeatureLayer] = mapModules.value;

        // 清除之前的高亮
        if (highlightGraphic.value) {
          view.value.graphics.remove(highlightGraphic.value);
        }

        // 获取建筑点图层
        const buildingLayer = view.value.map.findLayerById("building_points");
        if (!buildingLayer) return;

        // 查询匹配的点
        const query = buildingLayer.createQuery();
        query.where = `B109 = '${unit.B109}' OR b109_2 = '${unit.B109}'`;
        const { features } = await buildingLayer.queryFeatures(query);

        if (features.length > 0) {
          // 创建高亮点图形
          const highlightSymbol = {
            type: "simple-marker",
            color: [255, 0, 0],  // 红色
            outline: {
              color: [255, 255, 255],
              width: 2
            },
            size: 12
          };

          highlightGraphic.value = new Graphic({
            geometry: features[0].geometry,
            symbol: highlightSymbol
          });

          // 添加到视图
          view.value.graphics.add(highlightGraphic.value);

          // 定位到该点
          await view.value.goTo({
            target: features[0].geometry,
            zoom: 32
          });

          // 显示单位名称弹窗
          view.value.popup.open({
            title: unit.B102 || '单位名称',
            content: `统一社会信用代码: ${unit.B109}`,
            location: features[0].geometry,
            actions: []
          });
        }
      } catch (error) {
        console.error("定位单位失败:", error);
      }
    };

    // 暴露给父组件的方法
    const locateEnterprise = (unit) => {
      highlightAndLocateUnit(unit);
    };

    // 监听选中单位变化
    watch(() => props.selectedUnit, (newUnit) => {
      highlightAndLocateUnit(newUnit);
    });

    onMounted(async () => {
      try {
        const modules = await loadModules([
          'esri/layers/FeatureLayer',
          'esri/Graphic',
          'esri/Map',
          'esri/views/MapView',
          'esri/geometry/SpatialReference',
          'esri/Basemap',
          'esri/layers/TileLayer',
          'esri/widgets/Popup'
        ], {
          url: 'http://192.168.94.114/4.19/init.js',
          css: 'http://192.168.94.114/4.19/esri/themes/light/main.css'
        });

        mapModules.value = modules;
        const [FeatureLayer, Graphic, Map, MapView, SpatialReference, Basemap, TileLayer, Popup] = modules;

        // 初始化地图
        const map = new Map({
          basemap: new Basemap({
            baseLayers: [new TileLayer({
              url: "http://192.168.3.140:6080/arcgis/rest/services/fw_dt/MapServer"
            })]
          })
        });

        view.value = new MapView({
          container: "viewDiv",
          map: map,
          spatialReference: new SpatialReference({ wkid: 4526 }),
          extent: {
            xmin: 38392997.07, ymin: 2495903.35,
            xmax: 38505644.28, ymax: 2648163.20,
            spatialReference: { wkid: 4526 }
          },
          popup: {
            dockEnabled: true,
            dockOptions: {
              position: "top-left",
              breakpoint: false
            }
          }
        });

        // 加载企业建筑点（简单点图层）
        await loadGeoJsonLayer(
          layerConfigs.find(l => l.id === "building_points"),
          map
        );

        // 加载热力图图层
        await loadGeoJsonLayer(
          layerConfigs.find(l => l.id === "heatmap_layer"),
          map
        );

      } catch (error) {
        console.error("初始化失败", error);
        loading.value = false;
      }
    });

    const updateLayerVisibility = (layer) => {
      if (layer.instance) {
        layer.instance.visible = layer.visible;
      }
    };

    const handleBasemapChange = (id) => {
      if (!view.value) return;
      const url = id === 'street'
        ? "http://192.168.3.140:6080/arcgis/rest/services/fw_dt/MapServer"
        : "http://192.168.94.114/arcgis/rest/services/GZ2000_ZW_YXDT_2019/MapServer";

      loadModules(['esri/Basemap', 'esri/layers/TileLayer']).then(([Basemap, TileLayer]) => {
        view.value.map.basemap = new Basemap({
          baseLayers: [new TileLayer({ url })]
        });
        activeBasemapId.value = id;
      });
    };

    onUnmounted(() => {
      if (view.value) {
        view.value.destroy();
      }
    });

    // 暴露方法给父组件
    expose({
      locateEnterprise
    });

    return {
      view,
      panelVisible,
      loading,
      loadingText,
      layers,
      selectedHeatmapField,
      fieldOptions,
      currentFieldLabel,
      mapList,
      activeBasemapId,
      updateLayerVisibility,
      handleBasemapChange,
      handleFieldChange
    };
  }
};
</script>

<style lang="scss" scoped>
/* 样式保持不变 */
.map-container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: white;
  overflow: hidden;

  #viewDiv {
    width: 100%;
    height: 100%;
  }
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;

  .loading-content {
    text-align: center;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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

  .loading-text {
    color: #333;
    font-size: 14px;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.layer-control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 50;
  width: 260px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  overflow: hidden;

  .panel-header {
    padding: 12px 16px;
    background: #f8f9fa;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 16px;
      color: #333;
      font-weight: 600;
    }

    .toggle-btn {
      background: #0091ff;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background: #0077cc;
      }
    }
  }

  .panel-content {
    padding: 16px;
  }

  .control-section {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    color: #333;
    font-weight: 500;
    border-left: 3px solid #0091ff;
    padding-left: 8px;
  }

  .field-selector {
    .selector-label {
      display: block;
      font-size: 12px;
      color: #666;
      margin-bottom: 6px;
    }

    .field-select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 13px;
      background: white;
      margin-bottom: 6px;

      &:focus {
        outline: none;
        border-color: #0091ff;
      }
    }

    .current-field {
      font-size: 11px;
      color: #666;
      text-align: right;
    }
  }

  .layer-list {
    .layer-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .layer-checkbox {
      margin-right: 8px;
      cursor: pointer;
    }

    .layer-label {
      font-size: 13px;
      color: #333;
      cursor: pointer;
    }
  }
}

.mapType {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  gap: 10px;
  list-style: none;
  margin: 0;
  padding: 0;

  .item {
    width: 60px;
    height: 60px;
    border-radius: 6px;
    border: 2px solid white;
    cursor: pointer;
    background-size: cover;
    position: relative;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-2px);
    }

    &.actived {
      border-color: #0091ff;
    }

    .map-label {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 2px 0;
      text-align: center;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      font-size: 11px;
    }
  }
}
</style>