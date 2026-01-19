/**
 * 地图服务配置文件
 */
import dtNormal from "@/assets/images/dt-1.png";
import dtActive from "@/assets/images/dt-2.png";
import yxtNormal from "@/assets/images/yxt-1.png";
import yxtActive from "@/assets/images/yxt-2.png";

const GEOSERVER_BASE = "http://192.168.10.123:8089/geoserver/dataCenterWorkspace";
const LAYER_BUILDING = "dataCenterWorkspace:gongbaokupc38";

export const MAP_CONFIG = {
  // ArcGIS API 基础配置
  arcgis: {
    js: "http://192.168.94.114/4.19/init.js",
    css: "http://192.168.94.114/4.19/esri/themes/light/main.css"
  },

  // 默认地图范围
  initialExtent: {
    xmin: 38392997.07,
    ymin: 2495903.35,
    xmax: 38505644.28,
    ymax: 2648163.20,
    spatialReference: { wkid: 4526 }
  },

  // 经济数据专题配置 (包含建筑点和房屋面)
  economic: {
    building: {
      maxScale: 30000,
      layerName: LAYER_BUILDING,
      wmsUrl: `${GEOSERVER_BASE}/wms`,
      // 封装 WFS URL 生成逻辑，组件内只需传入 bbox
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
      symbol: {
        type: "simple-marker",
        size: 3.571,
        color: [125, 94, 178, 1],
        outline: { color: [35, 35, 35], width: 0 }
      }
    },
    // 房屋面 URL
    houseUrl: "http://192.168.10.123:8089/geoserver/dataCenterWorkspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=dataCenterWorkspace%3AWJPFWMpc38&maxFeatures=500&outputFormat=application%2Fjson"
  },

  // 底图服务 URL
  basemaps: {
    street: "https://ypt.gzlpc.gov.cn/apiway/api-service/encrypt/rest/services/0dd2d428919f40818617fdf05492aaff/DataServer",
    satellite: "https://ypt.gzlpc.gov.cn/apiway/api-service/encrypt/rest/services/1e8f0689c7f84b3581bf98449ed8e700/DataServer"
  },

  // 其他配置保持不变...
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
    highlight: {
      color: [0, 255, 255, 0.25],
      outline: { color: [0, 255, 255, 1], width: 2.5 }
    }
  }
};