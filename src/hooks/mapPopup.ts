import { getUnitHeatMap } from '@/api/data-display';

export function mapPopup(view: any, modules: any) {
  const showPopup = async (data: any, location: any, isCoords = true) => {
    const rawView = view.value || view;
    
    if (!rawView) return;
    const mapV = rawView.getMapView ? rawView.getMapView() : rawView;
    
    if (!mapV || !mapV.popup) {
      console.warn("地图视图尚未初始化完成，无法打开弹窗");
      return;
    }

    const mods = modules.value || modules;
    if (!mods) return;
    const { Graphic } = mods;

    // 准备数据
    let units: any[] = []; 
    if (isCoords && data && data.zxAxis) {
      try {
        const res = await getUnitHeatMap({ 
          zxAxis: data.zxAxis, 
          yxAxis: data.yxAxis, 
          pageNo: 1, 
          pageSize: 2500 
        });
        units = res?.data?.list || [];
      } catch (error) {
        console.error("接口查询失败:", error);
        return;
      }
    } else {
      units = Array.isArray(data) ? data : [data];
    }

    if (units.length === 0) {
      mapV.popup.close();
      return;
    }

    let popupLocation = location;
    if (location && !location.spatialReference) {
      popupLocation = {
        type: "point",
        x: location.x || location[0],
        y: location.y || location[1],
        spatialReference: mapV.spatialReference
      };
    }

    // 构造 Graphic 数组
    const features = units.map((unit: any) => {
      return new Graphic({
        geometry: popupLocation,
        attributes: unit,
        popupTemplate: {
          title: unit.B102 || "单位信息",
          content: `
            <div style="font-size:14px; line-height: 1.6; padding: 5px; min-width: 280px;">
              <p><b>统一社会信用代码:</b> ${unit.B109 || '-'}</p>
              <p><b>主要业务活动:</b> ${unit.B1031 || '-'}</p>
              <p><b>资产总计:</b> ${unit.ZCZJ || 0} 万元</p>
              <p><b>地址:</b> ${unit.B1056 || '-'}</p>
            </div>
          `
        }
      });
    });

    // 打开弹窗
    mapV.popup.open({
      features: features, 
      location: popupLocation,
      updateLocationEnabled: true
    });
  };

  return { showPopup };
}