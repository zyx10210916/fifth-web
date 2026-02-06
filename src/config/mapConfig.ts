/**
 * 地图服务配置文件
 */
import dtNormal from "@/assets/images/dt-1.png";
import dtActive from "@/assets/images/dt-2.png";
import yxtNormal from "@/assets/images/yxt-1.png";
import yxtActive from "@/assets/images/yxt-2.png";

//从环境变量读取值
const GEOSERVER_BASE = import.meta.env.VITE_GEOSERVER_BASE;
const MAP_WS = import.meta.env.VITE_MAP_WORKSPACE;
const ARCGIS_BASE = import.meta.env.VITE_ARCGIS_BASE;

//图层名
const BuildingLayer_Name = `${MAP_WS}:juheshujupc38`;
const HouseLayer_Name = `${MAP_WS}:WJPFWMpc38`;
const HeatMapLayer_Name = `${MAP_WS}:yuwangshuju`;


/**
 * WFS URL 构造
 * @param typeName 图层名
 * @param options 可选参数：bbox(空间过滤), propertyName(属性过滤)
 */
const createWfsUrl = (typeName: string, options: { bbox?: string, propertyName?: string } = {}) => {
  const params: Record<string, string> = {
    service: "WFS",
    version: "1.0.0",
    request: "GetFeature",
    typeName: typeName,
    outputFormat: "application/json",
    srsname: "EPSG:4526",
  };
  if (options.bbox) params.bbox = options.bbox;
  if (options.propertyName) params.propertyName = options.propertyName;
  
  const query = new URLSearchParams(params).toString();
  return `${GEOSERVER_BASE}/ows?${query}`;
};

export const MAP_CONFIG = {
  // ArcGIS API 基础配置
  arcgis: {
    js: `${ARCGIS_BASE}/init.js`,
    css: `${ARCGIS_BASE}/esri/themes/light/main.css`

  },

  // 需要加载的 ArcGIS 模块
  modules: {
    'esri/Map': 'Map',
    'esri/views/MapView': 'MapView',
    'esri/layers/FeatureLayer': 'FeatureLayer',
    'esri/Graphic': 'Graphic',
    'esri/geometry/SpatialReference': 'SpatialReference',
    'esri/Basemap': 'Basemap',
    'esri/layers/TileLayer': 'TileLayer',
    'esri/layers/WMSLayer': 'WMSLayer',
    'esri/geometry/geometryEngine': 'geometryEngine',
    'esri/geometry/Point': 'Point',
    'esri/geometry/Extent': 'Extent',
    'esri/views/draw/Draw': 'Draw',
    'esri/widgets/Sketch/SketchViewModel': 'SketchViewModel',
    'esri/layers/GraphicsLayer': 'GraphicsLayer',
    'esri/symbols/TextSymbol': 'TextSymbol'
  },

  // 默认地图范围
  initialExtent: {
    xmin: 38392997.07,
    ymin: 2495903.35,
    xmax: 38505644.28,
    ymax: 2648163.20,
    spatialReference: { wkid: 4526 }
  },

  // 经济数据接口配置
  economic: {
    building: {
      id: "building",
      layerName: BuildingLayer_Name,
      //  BBOX 请求（拉框和面点选查询）
      bboxUrl: (bbox: string) => createWfsUrl(BuildingLayer_Name, { bbox }),
      // wfs请求
      url: createWfsUrl(BuildingLayer_Name, { propertyName: "the_geom,坐标" }),
      // wms请求
      wmsUrl: `${GEOSERVER_BASE}/wms`,
      wmsVersion: "1.1.0"
    },
    house: {
      id: "house",
      url: createWfsUrl(HouseLayer_Name, { propertyName: "the_geom" })
    },
    heatmap: {
      id: "heatmap",
      url: createWfsUrl(HeatMapLayer_Name)
    }
  },

  // 统一样式管理
  styles: {
    // 企业建筑点样式
    building: {
      type: "simple-marker",
      style: "circle",
      size: 3.571,
      color: [125, 94, 178, 1],
      outline: { color: [35, 35, 35], width: 0 }
    },
    // 企业房屋面样式
    house: {
      type: "simple",
      symbol: {
        type: "simple-fill",
        color: [0, 121, 193, 0.2],
        outline: { color: [0, 121, 193, 0.8], width: 1.5 }
      }
    },
    // 区域面高亮样式
    highlightPolygon: {
      type: "simple-fill",
      color: [0, 255, 255, 0.25],
      outline: { color: [0, 255, 255, 1], width: 2.5 }
    },
    // 点高亮样式
    highlightPoint: {
      type: "simple-marker",
      style: "circle",
      color: [255, 68, 0, 0.9],
      size: 5,
      outline: { color: [255, 255, 255], width: 1 }
    },
    // 拉框工具的矩形样式
    selectionRect: {
      type: "simple-fill",
      color: [0, 145, 255, 0.15],
      outline: {
        color: [0, 145, 255],
        width: 2,
        style: "dash"
      }
    }
  },

  // 底图服务配置
  basemaps: {
    street: import.meta.env.VITE_MAP_BASEMAP_STREET,
    satellite: import.meta.env.VITE_MAP_BASEMAP_SATELLITE,
  },

  // 底图切换 UI 配置
  basemapUI: [
    { id: 'street', name: '地图', className: 'mapType-normal', imgNormal: dtNormal, imgActive: dtActive },
    { id: 'satellite', name: '影像图', className: 'mapType-image', imgNormal: yxtNormal, imgActive: yxtActive }
  ],
  
  // 行政边界图层配置
  boundary: {
    baseUrl: import.meta.env.VITE_BOUNDARY_BASE_URL, 
    layers: {
      district: { 
        layerId: 2, 
        title: "区县行政边界", 
        defaultVisible: true, 
        outlineColor: [70, 130, 180, 0.8] 
      },
      town: { 
        layerId: 3, 
        title: "街镇行政边界", 
        defaultVisible: false, 
        outlineColor: [210, 105, 30, 0.8] 
      }
    }
  }
};