import { MAP_CONFIG } from '@/config/mapConfig';

/**
 * 区域选点核心逻辑
 * @param geometry 空间几何体 (Polygon/Extent)
 * @param modules MapView 提供的语义化模块对象
 */
export async function query(geometry: any, modules: any) {
  const { Graphic, geometryEngine, Point } = modules;
  const bldCfg = MAP_CONFIG.economic.building;

  // 1. 获取 BBOX 范围内的候选点
  const ext = geometry.extent;
  const bbox = `${ext.xmin},${ext.ymin},${ext.xmax},${ext.ymax}`;
  const response = await fetch(bldCfg.bboxUrl(bbox));
  const geojson = await response.json();
  const candidates = geojson.features || [];

  const xAxisList: string[] = [];
  const yAxisList: string[] = [];
  const graphics: any[] = [];

  // 2. 精确包含判定
  candidates.forEach((f: any) => {
    const pt = new Point({
      x: f.geometry.coordinates[0],
      y: f.geometry.coordinates[1],
      spatialReference: { wkid: 4526 }
    });

    if (geometryEngine.contains(geometry, pt)) {
      const coordStr = f.properties["坐标"] || "";
      if (coordStr?.includes(',')) {
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
}