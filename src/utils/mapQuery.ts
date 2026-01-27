import { MAP_CONFIG } from '@/config/mapConfig';

/**
 * 空间查询逻辑
 * @param geometry 空间几何体
 * @param modules 语义化模块对象
 * @param extraParams 额外参数。若包含 zxAxis/yxAxis 则直接作为结果返回，跳过网络请求。
 */
export async function mapQuery(geometry: any, modules: any, extraParams: any = {}) {
  const { Graphic, Point, geometryEngine } = modules;
  const bldCfg = MAP_CONFIG.economic.building;

  // --- 点选建筑点时，直接返回已有坐标 ---
  if (extraParams.zxAxis && extraParams.yxAxis) {
    return {
      zxAxis: extraParams.zxAxis,
      yxAxis: extraParams.yxAxis,
      graphics: [new Graphic({
        geometry: geometry, // 使用点击到的 Point 几何
        symbol: MAP_CONFIG.styles.highlightPoint
      })]
    };
  }

  // --- 面选（房屋面/行政区），执行 BBOX 初筛和精确包含判定 ---
  const ext = geometry.extent;
  const bbox = `${ext.xmin},${ext.ymin},${ext.xmax},${ext.ymax}`;
  
  try {
    const response = await fetch(bldCfg.bboxUrl(bbox));
    const geojson = await response.json();
    const candidates = geojson.features || [];

    const xAxisList: string[] = [];
    const yAxisList: string[] = [];
    const graphics: any[] = [];

    candidates.forEach((f: any) => {
      const pt = new Point({
        x: f.geometry.coordinates[0],
        y: f.geometry.coordinates[1],
        spatialReference: { wkid: 4526 }
      });

      // 判定点是否在面内
      if (geometryEngine.contains(geometry, pt)) {
        const coordStr = f.properties["坐标"] || "";
        if (coordStr.includes(',')) {
          const [zx, yx] = coordStr.split(',');
          xAxisList.push(zx.trim());
          yAxisList.push(yx.trim());

          graphics.push(new Graphic({
            geometry: pt,
            symbol: MAP_CONFIG.styles.highlightPoint
          }));
        }
      }
    });

    return {
      zxAxis: xAxisList.join(','),
      yxAxis: yAxisList.join(','),
      graphics
    };
  } catch (error) {
    console.error("空间查询失败:", error);
    return { zxAxis: "", yxAxis: "", graphics: [] };
  }
}