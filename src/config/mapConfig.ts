/**
 * 地图服务配置文件
 */
import dtNormal from "@/assets/images/dt-1.png";
import dtActive from "@/assets/images/dt-2.png";
import yxtNormal from "@/assets/images/yxt-1.png";
import yxtActive from "@/assets/images/yxt-2.png";

const GEOSERVER_BASE = "http://10.44.58.28:8089/geoserver/workspace";
const LAYER_BUILDING = "dataCenterWorkspace:juheshujupc38";

export const MAP_CONFIG = {
  // ArcGIS API 基础配置
  arcgis: {
    js: "http://10.44.58.28:8000/4.19/init.js",
    css: "http://10.44.58.28:8000/4.19/esri/themes/light/main.css"
  },

  // 默认地图范围
  initialExtent: {
    xmin: 38392997.07,
    ymin: 2495903.35,
    xmax: 38505644.28,
    ymax: 2648163.20,
    spatialReference: { wkid: 4526 }
  },

  // 经济数据配置 
   economic: {
    building: {
      id: "building", 
      maxScale: 500000,
      layerName: LAYER_BUILDING,
      wmsUrl: `${GEOSERVER_BASE}/wms`,
      getWfsUrl: (bbox: string) => {
        const params = new URLSearchParams({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: LAYER_BUILDING,
          outputFormat: "application/json",
          srsname: "EPSG:4526",
          bbox: bbox
        });
        return `${GEOSERVER_BASE}/ows?${params.toString()}`;
      },
      // 点默认样式
      symbol: {
        type: "simple-marker",
        style: "circle",
        size: 3.571,
        color: [125, 94, 178, 1],
        outline: { color: [35, 35, 35], width: 0 }
      }
    },
    // 房屋面 URL
    houseUrl: "http://10.44.58.28:8089/geoserver/workspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=workspace%3AWJPFWMpc38&maxFeatures=500&outputFormat=application%2Fjson"
  },

  // 底图服务 URL
  basemaps: {
    street: "https://ypt.gzlpc.gov.cn/apiway/api-service/encrypt/rest/services/0dd2d428919f40818617fdf05492aaff/DataServer",
    satellite: "https://ypt.gzlpc.gov.cn/apiway/api-service/encrypt/rest/services/1e8f0689c7f84b3581bf98449ed8e700/DataServer"
  },

  // 底图切换控件UI
  basemapUI: [
    { id: 'street', name: '地图', className: 'mapType-normal', imgNormal: dtNormal, imgActive: dtActive },
    { id: 'satellite', name: '影像图', className: 'mapType-image', imgNormal: yxtNormal, imgActive: yxtActive }
  ],
  
  boundary: {
    baseUrl: "https://ypt.gzlpc.gov.cn/apiway/api-service/encrypt/rest/services/2baabbc53f404e7a96f9f9da3ec0ec68/DataServer",
    layers: {
      district: { layerId: 2, title: "区县行政边界", defaultVisible: true, outlineColor: [70, 130, 180, 0.8] as any, minScale: 100000 },
      town: { layerId: 3, title: "街镇行政边界", defaultVisible: false, outlineColor: [210, 105, 30, 0.8] as any, minScale: 50000 }
    }
  },

  styles: {
    // 区域面高亮样式
    highlight: {
      type: "simple-fill",
      color: [0, 255, 255, 0.25],
      outline: { color: [0, 255, 255, 1], width: 2.5 }
    },
    // 点高亮样式
    highlightPoint: {
      type: "simple-marker",
      style: "circle",
      color: [255, 68, 0, 0.9], // 橙红色
      size: 3.571, 
      xoffset: 0,
      yoffset: 0,
      outline: { color: [255, 255, 255], width: 1 } 
    },
    // 拉框时的多边形样式
    selectionRect: {
      type: "simple-fill",
      color: [0, 145, 255, 0.15],
      outline: {
        color: [0, 145, 255],
        width: 2,
        style: "dash"
      }
    }
  }
};