<template>
  <div class="left-list-container">
    <div class="panel-header">
      <span class="title">单位清单</span>
      <el-popover placement="bottom-end" :width="320" trigger="click">
        <template #reference>
          <el-button type="primary" plain size="small" class="field-toggle-btn">
            字段显隐
          </el-button>
        </template>
        
        <div class="field-selection-panel">
          <div class="search-box">
            <el-input v-model="fieldSearchText" placeholder="搜索字段名称" size="small" clearable />
          </div>
          <el-divider />
          <div class="checkbox-list">
            <el-checkbox-group v-model="visibleFieldProps">
              <div v-for="field in filteredFields" :key="field.prop" class="field-item">
                <el-checkbox :label="field.prop" :disabled="field.fixed">
                  {{ field.label }}
                </el-checkbox>
              </div>
            </el-checkbox-group>
          </div>
        </div>
      </el-popover>
    </div>

    <div class="table-content" v-loading="loading">
       <el-table 
        :data="listData.list" 
        stripe 
        style="width: 100%" 
        height="100%"
        :header-cell-style="{ background: '#f5f7fa', color: '#606266' }"
        @row-click="handleRowClick"
       >
        <el-table-column type="index" label="序号" width="65" align="center" fixed="left" />
        
        <template v-for="col in activeColumns" :key="col.prop">
          <el-table-column 
            :prop="col.prop" 
            :label="col.label" 
            min-width="160"
            show-overflow-tooltip
          >
            <template #default="scope">
              {{ scope.row[col.prop] ?? '-' }}
            </template>
          </el-table-column>
        </template>
      </el-table>
    </div>

    <div class="pagination-footer">
      <el-pagination
        v-model:current-page="listData.pageNum" 
        :page-size="listData.pageSize"
        :total="listData.total"
        :paper-count="5"
        layout="prev, pager, next, total"
        small
        background
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { UNIT_COLUMNS } from '../columns';

const props = defineProps<{
  listData: {
    list: any[];
    total: number;
    pageNum: number;
    pageSize: number;
  };
  loading: boolean;
}>();

const emit = defineEmits(['change-page', 'row-click']);

// 行点击处理
const handleRowClick = (row: any) => {
  emit('row-click', row);
};

// --- 字段显隐逻辑 ---
const fieldSearchText = ref('');

const visibleFieldProps = ref<string[]>(
  UNIT_COLUMNS.filter(f => f.fixed).map(f => f.prop)
);

const filteredFields = computed(() => {
  if (!fieldSearchText.value) return UNIT_COLUMNS;
  return UNIT_COLUMNS.filter(f => f.label.includes(fieldSearchText.value));
});

const activeColumns = computed(() => {
  return UNIT_COLUMNS.filter(col => visibleFieldProps.value.includes(col.prop));
});

// --- 分页逻辑 ---
// const currentPage = ref(1);

// // 同步 props 的页码
// watch(() => props.listData.pageNum, (newVal) => {
//   currentPage.value = newVal;
// });

const handlePageChange = (page: number) => {
  emit('change-page', page);
};
</script>

<style scoped lang="scss">
.left-list-container {
  width: 560px;
  height: 100%;
  background: #ffffff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;

  .panel-header {
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ebeef5;

    .title {
      font-size: 16px; 
      font-weight: 600;
      color: #303133;
      position: relative;
      padding-left: 12px;
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 20px;
        background: #409eff;
        border-radius: 2px;
      }
    }

    .field-toggle-btn {
      font-size: 14px;
      padding: 8px 15px;
    }
  }

  .table-content {
    flex: 1;
    padding: 12px;
    overflow: hidden;

    :deep(.el-table) {
      font-size: 14px; 
      color: #333;

      .el-table__header {
        th {
          background-color: #f8f9fa !important;
          color: #333;
          font-weight: bold;
          font-size: 15px; 
          height: 54px;  
        }
      }

      .el-table__row {
        height: 60px; 
      }

      .el-table__empty-text {
        font-size: 14px;
      }

      .el-table-column--selection, .is-center {
        font-weight: 500;
      }
    }
  }

  .pagination-footer {
    padding: 16px 12px;
    display: flex;
    justify-content: center;
    border-top: 1px solid #ebeef5;
    background: #fafafa;

    :deep(.el-pagination) {
      .el-pagination__total {
        font-size: 14px;     
        color: #409eff;    
        margin-right: 20px;
      }

      .el-pager li {
        font-size: 14px;
        min-width: 36px;
        height: 36px;
        line-height: 36px;
      }

      .btn-prev, .btn-next {
        width: 36px;
        height: 36px;
        .el-icon {
          font-size: 14px;
        }
      }

      .el-pagination__jump {
        font-size: 14px;
        margin-left: 15px;
        .el-input {
          width: 60px;
          margin: 0 5px;
          .el-input__inner {
            height: 32px;
            font-size: 14px;
          }
        }
      }
    }
  }
}

.field-selection-panel {
  padding: 8px;
  .search-box {
    margin-bottom: 10px;
  }
  .checkbox-list {
    max-height: 400px;
    overflow-y: auto;
    :deep(.el-checkbox) {
      margin-bottom: 10px;
      .el-checkbox__label {
        font-size: 14px;
      }
    }
  }
  .el-divider--horizontal {
    margin: 12px 0;
  }
}
</style>