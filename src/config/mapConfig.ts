/**
 * 地图服务配置文件
 */
// 底图切换图片
import dtNormal from "@/assets/images/dt-1.png";
import dtActive from "@/assets/images/dt-2.png";
import yxtNormal from "@/assets/images/yxt-1.png";
import yxtActive from "@/assets/images/yxt-2.png";

export const MAP_CONFIG = {
  // ArcGIS API 
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

  // 底图服务 URL
  basemaps: {
    street: "https://ypt.gzlpc.gov.cn/apiway/api-service/encrypt/rest/services/0dd2d428919f40818617fdf05492aaff/DataServer",
    satellite: "https://ypt.gzlpc.gov.cn/apiway/api-service/encrypt/rest/services/1e8f0689c7f84b3581bf98449ed8e700/DataServer"
  },

  // 底图切换器 UI 配置
  basemapUI: [
    { id: 'street', name: '地图', className: 'mapType-normal', imgNormal: dtNormal, imgActive: dtActive },
    { id: 'satellite', name: '影像图', className: 'mapType-image', imgNormal: yxtNormal, imgActive: yxtActive }
  ],

  // 行政区划配置
  boundary: {
    baseUrl: "https://ypt.gzlpc.gov.cn/apiway/api-service/encrypt/rest/services/2baabbc53f404e7a96f9f9da3ec0ec68/DataServer",
    layers: {
      district: {
        layerId: 2,
        title: "区县行政边界",
        defaultVisible: true,
        labelSize: "14px",
        labelColor: "#222",
        outlineColor: [70, 130, 180, 0.8] as any,
        minScale: 100000
      },
      town: {
        layerId: 3,
        title: "街镇行政边界",
        defaultVisible: false,
        labelSize: "12px",
        labelColor: "#444",
        outlineColor: [210, 105, 30, 0.8] as any,
        minScale: 50000
      }
    }
  },

  // GeoJSON/WFS 服务配置
  economic: {
    houseUrl: "http://10.44.58.28:8089/geoserver/workspace/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=workspace%3AWJPFWMpc38&maxFeatures=50&outputFormat=application%2Fjson"
  },

  // 图层样式配置
  styles: {
    highlight: {
      color: [0, 255, 255, 0.25],
      outline: { color: [0, 255, 255, 1], width: 2.5 }
    },
    buildingMarker: {
      color: [156, 120, 0, 0.8],
      size: "8px",
      outlineColor: [255, 255, 255]
    }
  }
};