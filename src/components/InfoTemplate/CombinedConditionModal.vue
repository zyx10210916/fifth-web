<!-- src/components/InfoTemplate/CombinedConditionModal.vue -->
<template>
  <a-modal :open="visible" @ok="handleOk" @cancel="handleCancel" title="组合条件" width="1146px" okText="确定" cancelText='取消' :mask-closable="true">
    <div class="condition-container">
      <!-- 顶部按钮区域 -->
      <div class="header-actions">
        <a-space>
          <a-button type="primary" class="dark-button" @click="add"> <PlusOutlined /> 插入 </a-button>
          <a-button class="dark-button" @click='getDelete'> <DeleteOutlined /> 删除 </a-button>
        </a-space>
      </div>

      <!-- 表格区域 -->
      <a-table :columns="columns"  :data-source="dataSource" size="middle" bordered :pagination="false" :row-selection="{ type: 'checkbox',onChange:onSelectChange}">
        <!-- 序号列 -->
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            {{ index + 1 }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-button type="link">...</a-button>
          </template>
          <template v-else-if="column.key === 'columnName'">
            <a-select v-model:value="record.columnName" style="width: 100%">
             <a-select-option v-for='obj in props.indexQueryDate' :value="obj.COLUMN_CODE">{{obj.COLUMN_NAME}}</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'queryMode'">
            <a-select v-model:value="record.queryMode" style="width: 100%">
              <a-select-option :value="obj" v-for='obj in operatorData'>{{obj}}</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'columnValue'">
            <a-input v-model:value="record.columnValue" />
          </template>
          <template v-else-if="column.key === 'logicalSymbol'">
            <a-select v-model:value="record.logicalSymbol" style="width: 100%">
              <a-select-option value="并且">并且</a-select-option>
               <a-select-option value="或者">或者</a-select-option>
            </a-select>
          </template>
        </template>
      </a-table>
    </div>
  </a-modal>
</template>

<script setup>
import { ref } from 'vue';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue';
const props = defineProps({
  visible: '',
  indexQueryDate:'',
  columnQueries: Array,
})

  const emit = defineEmits(['update:visible','handleOk']);

  const handleOk = () => {
    // 过滤空值条件
    const validConditions = dataSource.value.filter(condition => 
      condition.columnName && condition.columnValue
    );
    
    // 传递有效条件数据给父组件
    emit('handleOk', validConditions);
    emit('update:visible', false);
  };

  const handleCancel = () => {
    emit('update:visible', false);
  };
  //选中行key
  const rowSelection = ref([])
  // 表格列定义
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      align: 'center',
    },
    {
          title: '逻辑',
          key: 'logicalSymbol',
          align: 'center',
          width:200
    },
    {
      title: '指标名称',
      dataIndex: 'columnName',
      key: 'columnName',
      align: 'center',
      width:250
    },
    {
      title: '运算符',
      dataIndex: 'queryMode',
      key: 'queryMode',
      align: 'center',
      width:200
    },
    {
      title: '值',
      dataIndex: 'columnValue',
      key: 'columnValue',
      align: 'center',
    },
  ];
  //运算符号
  const operatorData = ref(['等于','大于','大于等于','小于','小于等于','不等于','前缀','非前缀','后缀','非后缀','包含','不包含'])

// 表格数据
const dataSource = ref([]);

// 监听props.columnQueries变化，初始化数据
watch(() => props.columnQueries, (newVal) => {
  if (newVal) {
    dataSource.value = [...newVal];
  }
}, { immediate: true, deep: true });

  //添加
  const add = ()=>{
    dataSource.value.push({
    "key":Math.random(),
    "columnName": "", //查询字段
      "columnValue": "", //查询值
      "queryMode": "等于", //查询方式（如：模糊查询或者等于）
      "logicalSymbol": "并且", //逻辑符号（如：and）
    })
  };
  //删除
  const getDelete = ()=>{
  rowSelection.value.map(res=>{
   dataSource.value.map((obj,index)=>{
    if(obj.key ==res){
    dataSource.value.splice(index,1)
    }
   })
  })
  };
  //列表复选事件
    const onSelectChange = (selectRowKeys)=>{
    rowSelection.value = selectRowKeys
  };
</script>

<style scoped>
  .condition-container {
    padding: 16px;
  }

  .header-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .right-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* 黑色按钮样式 */
  .dark-button {
    background-color: #000;
    color: #fff;
    border-color: #000;
  }

  .dark-button:hover {
    background-color: rgb(0 0 0 / 80%);
    color: #fff;
    border-color: rgb(0 0 0 / 80%);
  }

  :deep(.ant-table-thead > tr > th) {
    background: #fafafa;
    font-weight: 500;
    text-align: center !important;
  }

  :deep(.ant-pagination-options) {
    margin-left: 8px;
  }

  :deep(.ant-table-bordered) {
    border: 1px solid #f0f0f0;
  }

  /* 修改选择年输入框的图标 */
  :deep(.ant-select-selection-placeholder) {
    color: rgb(0 0 0 / 25%);
  }

  :deep(.ant-select-arrow) {
    color: rgb(0 0 0 / 25%);
  }

  /* 值字段相关样式 */
  .value-field-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .value-action-button {
    border-radius: 5px;
    align-items: flex-end;
    display: flex;
    margin: 2px;
    padding: 2px 10px;
    background: rgb(245 245 247 / 100%);
    border: 1px solid rgb(227 227 232 / 100%);
  }

  .value-action-icon {
    background: rgb(245 245 247 / 100%);
    color: black;
    margin-top: 2px;
  }
</style>
