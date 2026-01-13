<script>
import { ref, watch, onUnmounted, markRaw } from 'vue';
import { getBulletinList } from '@/api/data-display';

export default {
  name: 'BuildingLayer',
  props: {
    // 父组件传来的 MapView 实例
    view: { type: Object, required: true },
    // 父组件加载好的 ArcGIS 模块数组
    modules: { type: Array, required: true },
    // 图层可见性
    visible: { type: Boolean, default: true },
    // 配置项（保持原代码中的默认值）
    config: {
      type: Object,
      default: () => ({
        id: "building",
        title: "企业建筑点",
        fields: [
          { name: "ObjectId", type: "oid" },
          { name: "B109", type: "string" },
          { name: "ZYSR", type: "string" },
          { name: "ZCZJ", type: "string" },
          { name: "QMRS", type: "string" },
          { name: "CYRS", type: "string" }
        ],
        popupTemplate: {
          title: "{B109}",
          content: [{
            type: "fields",
            fieldInfos: [
              { fieldName: "ZYSR", label: "主营收入" },
              { fieldName: "ZCZJ", label: "资产总计" },
              { fieldName: "QMRS", label: "期末人数" },
              { fieldName: "CYRS", label: "专业人数" }
            ]
          }]
        },
        renderer: {
          type: "simple",
          symbol: {
            type: "simple-marker",
            color: [156, 120, 0, 0.8],
            size: "8px",
            outline: { color: [255, 255, 255], width: 1 }
          }
        }
      })
    }
  },
  emits: ['loaded'],
  setup(props, { emit, expose }) {
    const layerInstance = ref(null);

    // 内部方法：从模块数组中查找特定的 ArcGIS 类
    const getModule = (name) => {
      return props.modules.find(m => 
        (m.prototype?.declaredClass === `esri.${name}`) || 
        (m.name === name)
      );
    };

    // 初始化图层并添加到地图
    const initLayer = () => {
      const FeatureLayer = props.modules[2]; // 基于你原代码的 loadModules 顺序
      
      const layer = new FeatureLayer({
        id: props.config.id,
        title: props.config.title,
        objectIdField: "ObjectId",
        geometryType: "point",
        outFields: ["*"],
        source: [], 
        fields: props.config.fields,
        popupTemplate: props.config.popupTemplate,
        renderer: props.config.renderer,
        visible: props.visible,
        popupEnabled: true,
        spatialReference: { wkid: 4526 }
      });

      props.view.map.add(layer);
      layerInstance.value = markRaw(layer);
    };

    // 获取并加载企业点数据
    const fetchBuildingPoints = async (params = {}) => {
      try {
        const res = await getBulletinList({
          pageNo: 1,
          pageSize: 2000,
          ...params
        });
        if (res?.data?.list) {
          await loadBuildingPoints(res.data.list);
          return res.data.list;
        }
        return [];
      } catch (error) {
        console.error("获取企业点数据失败:", error);
        throw error;
      }
    };

    // 执行图层数据更新 (applyEdits)
    const loadBuildingPoints = async (pointsData) => {
      if (!layerInstance.value || !pointsData) return;

      const Graphic = getModule("Graphic");

      try {
        const existingFeatures = await layerInstance.value.queryFeatures();
        const edits = { deleteFeatures: existingFeatures.features };

        if (pointsData.length > 0) {
          const graphics = pointsData.map((item, index) => {
            const x = parseFloat(item.XZ_AXIS);
            const y = parseFloat(item.YZ_AXIS);
            if (isNaN(x) || isNaN(y)) return null;

            return new Graphic({
              geometry: { type: "point", x, y, spatialReference: { wkid: 4526 } },
              attributes: {
                ObjectId: index + 1,
                B109: item.B109 || "",
                ZYSR: item.ZYSR || "",
                ZCZJ: item.ZCZJ || "",
                QMRS: item.QMRS || "",
                CYRS: item.CYRS || ""
              }
            });
          }).filter(g => g !== null);
          
          if (graphics.length > 0) edits.addFeatures = graphics;
        }

        await layerInstance.value.applyEdits(edits);
        emit('loaded', pointsData);
      } catch (error) {
        console.error("加载企业点要素失败:", error);
      }
    };

    // 内部空间查询方法
    const queryBuildingPoints = async (condition) => {
      if (!layerInstance.value) return [];
      try {
        const query = layerInstance.value.createQuery();
        query.where = condition;
        query.returnGeometry = true;
        query.outFields = ["*"];
        const result = await layerInstance.value.queryFeatures(query);
        return result.features || [];
      } catch (error) {
        console.error("BuildingLayer 内部查询失败:", error);
        return [];
      }
    };

    // 监听外部可见性变化
    watch(() => props.visible, (newVal) => {
      if (layerInstance.value) layerInstance.value.visible = newVal;
    });

    // 生命周期处理
    initLayer();
    onMounted(() =>{
      if(props.visible)
{
  fetchBuildingPoints();
}    })
    onUnmounted(() => {
      if (layerInstance.value && props.view?.map) {
        props.view.map.remove(layerInstance.value);
      }
    });

    // 暴露方法给 MapView 使用
    expose({
      fetchBuildingPoints,
      loadBuildingPoints,
      queryBuildingPoints,
      instance: layerInstance
    });

    return () => null;
  }
};
</script>