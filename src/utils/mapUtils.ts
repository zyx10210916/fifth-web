/**
 * 将 ArcGIS Geometry 转换为标准的 MULTIPOLYGON (((...))) 格式
 * @param geometry ArcGIS 几何对象 (Point, Polygon, Extent)
 * @param modules ArcGIS 模块对象 (包含 Polygon 等)
 */
export const toMultiPolygonWKT = (geometry: any, modules?: any) => {
  if (!geometry) return "";
  
  let ringsWkt = "";

  // 1. 处理点 (Point)
  if (geometry.type === "point") {
    const d = 0.01; // 容差范围
    const { x, y } = geometry;
    ringsWkt = `((${x - d} ${y - d}, ${x + d} ${y - d}, ${x + d} ${y + d}, ${x - d} ${y + d}, ${x - d} ${y - d}))`;
  } 
  // 2. 处理面 (Polygon) 或 范围 (Extent)
  else if (geometry.type === "polygon" || geometry.type === "extent") {
    let poly = geometry;
    // 如果是 Extent，尝试转换为 Polygon 以获取 rings
    if (geometry.type === "extent" && modules?.Polygon) {
      poly = modules.Polygon.fromExtent(geometry);
    }

    if (poly.rings) {
      ringsWkt = poly.rings.map((ring: any[]) => {
        const pts = ring.map(p => `${p[0]} ${p[1]}`).join(", ");
        // 确保首尾闭合
        const first = ring[0];
        const last = ring[ring.length - 1];
        const isClosed = first[0] === last[0] && first[1] === last[1];
        const closeStr = isClosed ? "" : `, ${first[0]} ${first[1]}`;
        return `((${pts}${closeStr}))`;
      }).join(", ");
    }
  }

  return ringsWkt ? `MULTIPOLYGON (${ringsWkt})` : "";
};