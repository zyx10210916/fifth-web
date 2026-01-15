<template>
  <div class="comparison-map-wrapper">
    <MapView 
      ref="mapView" 
      @map-select="handleBoxSelect" 
    />
    
    <div class="comparison-toolbar">
      <div class="info">
        已选区域：<span class="count">{{ selectedGroups.length }}</span> 个
      </div>
      <div class="btns">
        <el-button size="small" @click="clearGroups">清空重选</el-button>
        <el-button 
          type="primary" 
          size="small" 
          :disabled="selectedGroups.length < 2"
          @click="startComparison"
        >
          开始比对
        </el-button>
      </div>
      <div class="tip">提示：使用地图工具拉框选择两个及以上区域</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import MapView from '../MapView.vue';
import { message } from 'ant-design-vue';

// 定义事件
const emit = defineEmits(['map-select']);
const mapView = ref<InstanceType<typeof MapView> | null>(null);
const selectedGroups = ref<string[]>([]);
const handleBoxSelect = (codes: string) => {
  if (!codes || codes === 'warn' || codes === 'none') return;
  
  selectedGroups.value.push(codes);
  message.success(`区域 ${selectedGroups.value.length} 选取成功`);
};

const clearGroups = () => {
  selectedGroups.value = [];
  
  const view = mapView.value?.getMapView() as any; 
  
  if (view && view.graphics) {
    view.graphics.removeAll();
  }
};

const startComparison = () => {
  if (selectedGroups.value.length < 2) {
    message.warning('请至少选取两个区域进行比对');
    return;
  }
  emit('map-select', [...selectedGroups.value]);
};
</script>

<style scoped>
.comparison-map-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
}

.comparison-toolbar {
  position: absolute;
  top: 10%;
  right: 2%;
  z-index: 500;
  background: white;
  padding: 12px 25px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 320px;
}

.info {
  font-size: 16px;
  color: #333;
}

.count {
  color: #409eff;
  font-weight: bold;
  font-size: 20px;
  margin: 0 4px;
}

.btns {
  display: flex;
  gap: 15px;
}

.tip {
  font-size: 12px;
  color: #999;
}
</style>