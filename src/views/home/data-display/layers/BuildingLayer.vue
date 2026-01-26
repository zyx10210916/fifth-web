<script>
import { ref, watch, onUnmounted, markRaw, shallowRef, onMounted } from 'vue';
import { MAP_CONFIG } from '@/config/mapConfig';

export default {
  name: 'BuildingLayer',
  props: {
    view: { type: Object, required: true },
    modules: { type: Array, required: true },
    visible: { type: Boolean, default: true }
  },
  emits: ['loaded', 'loading-status'],
  setup(props, { emit, expose }) {
    const layerInstance = shallowRef(null);
    const isLoading = ref(false);
    const hasLoaded = ref(false); // 状态锁：确保只请求一次

    const bldCfg = MAP_CONFIG.economic.building;

    const initFullMode = async () => {
      // 如果已经加载过或正在加载，直接退出，防止重复请求
      if (hasLoaded.value || isLoading.value) return;

      try {
        isLoading.value = true;
        emit('loading-status', true);

        // 1. 请求数据
        const response = await fetch(bldCfg.url);
        const geojson = await response.json();
        const features = geojson.features || [];

        const { FeatureLayer, Graphic } = props.modules;

        // 2. 初始化图层
        layerInstance.value = markRaw(new FeatureLayer({
          id: bldCfg.id,
          source: [], // 初始为空
          objectIdField: "ObjectId",
          geometryType: "point",
          fields: [
            { name: "ObjectId", type: "oid" },
            { name: "坐标", type: "string" }
          ],
          renderer: {
            type: "simple",
            symbol: MAP_CONFIG.styles.building
          },
          spatialReference: { wkid: 4526 },
          visible: props.visible
        }));

        props.view.map.add(layerInstance.value);

        // 3. 分批注入数据（解决卡顿）
        const chunkSize = 5000;
        for (let i = 0; i < features.length; i += chunkSize) {
          const chunk = features.slice(i, i + chunkSize);
          const graphics = chunk.map((f, index) => {
            const coords = f.geometry.coordinates;
            const x = parseFloat(coords[0]);
            const y = parseFloat(coords[1]);

            if (isNaN(x) || isNaN(y)) return null;

            const attributes = { ObjectId: i + index + 1 };
            // 动态对应配置中的字段名
            attributes[bldCfg.coordField] = f.properties[bldCfg.coordField] || "";

            return new Graphic({
              geometry: { type: "point", x, y, spatialReference: { wkid: 4526 } },
              attributes: attributes
            });
          }).filter(g => g !== null);

          // 批量更新，不等待 LayerView 也可以执行
          await layerInstance.value.applyEdits({ addFeatures: graphics });
        }

        hasLoaded.value = true; // 标记已加载
        emit('loaded', geojson);
      } catch (err) {
        console.error("企业建筑点加载失败:", err);
      } finally {
        isLoading.value = false;
        emit('loading-status', false);
      }
    };

    onMounted(() => {
      props.view.when(() => {
        // 挂载即静默请求一次
        initFullMode();
      });
    });

    // 仅控制显示隐藏，不涉及数据请求
    watch(() => props.visible, (val) => {
      if (layerInstance.value) {
        layerInstance.value.visible = val;
      }
    });

    onUnmounted(() => {
      if (layerInstance.value) {
        props.view.map.remove(layerInstance.value);
      }
    });

    // 暴露接口
    expose({
      triggerFullLoad: initFullMode,
      // 保留原有逻辑，兼容未修改的 MapTools
      queryBuildingPoints: async (q) => {
        if (!layerInstance.value) return [];
        const query = layerInstance.value.createQuery();
        // 兼容字符串 where 子句或 geometry 空间查询
        if (typeof q === 'string') query.where = q; 
        else query.geometry = q;
        const result = await layerInstance.value.queryFeatures(query);
        return result.features;
      }
    });

    return () => null;
  }
};
</script>