import { MAP_CONFIG } from '@/config/mapConfig';

/**
 * 空间查询逻辑
 * @param geometry 空间几何体 
 * @param modules 语义化模块对象
 */
export async function mapQuery(geometry: any, modules: any) {
  const { Graphic, Point, geometryEngine } = modules;
  const bldCfg = MAP_CONFIG.economic.building;

  // 统一获取查询范围的 BBox
  const ext = geometry.type === "point" ? geometry.extent : geometry.extent;
  if (!ext) return { zxAxis: "", yxAxis: "", graphics: [] };

  const bbox = `${ext.xmin},${ext.ymin},${ext.xmax},${ext.ymax}`;
  
  try {
    // 请求 WFS/BBOX 接口获取最新点数据
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

      // 判定点是否在传入的几何范围内
      if (geometryEngine.contains(geometry, pt)) {
        const coordStr = f.properties["坐标"] || "";
        if (coordStr.includes(',')) {
          const [zx, yx] = coordStr.split(',').map((s: string) => s.trim());
          xAxisList.push(zx);
          yAxisList.push(yx);

          // 将 properties 赋值给 attributes
          graphics.push(new Graphic({
            geometry: pt,
            symbol: MAP_CONFIG.styles.highlightPoint,
            attributes: {
              ...f.properties,
              // 坐标字段统一存储格式
              "坐标": `${zx},${yx}` 
            }
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