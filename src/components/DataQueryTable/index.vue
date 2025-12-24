<template>
  <div class="search-section">
    <div class="search-form">
      <a-form layout="inline">
        <a-form-item label="报表编号" style="align-items: center">
          <a-input v-model:value="searchForm.keyword" placeholder="请输入报表编号" class="custom-input" style="width: 20rem" />
        </a-form-item>
        <a-form-item label="年份" style="align-items: center">
          <a-select v-model:value="searchForm.year" class="custom-select" style="width: 12rem">
            <a-select-option value="2025">2023年</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="报表名称" style="align-items: center">
          <a-input v-model:value="searchForm.templateName" placeholder="报表名称" class="custom-input" style="width: 20rem" />
        </a-form-item>
        <a-form-item>
          <a-space :size="16">
            <a-button type="primary" class="search-btn" @click="GetQuery">
              <template #icon><SearchOutlined /></template>
              查询
            </a-button>
            <a-button class="reset-btn" @click="reset">
              <template #icon><ReloadOutlined /></template>
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </div>
    <div ref="containerRef" class="custom-table">
    <!-- 数据表格 -->
        <a-table :columns="columns" :data-source="tableData" :pagination="pagination" @change="refreshData"
        :scroll="{ x: '100%', y:tableHeight}"
         style="height: 100%;"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-button type="link" @click="handleView(record)">
                <template #icon><EyeOutlined /></template>
                查看
              </a-button>
            </template>
            <template v-else-if="column.dataIndex === 'description'">
              <span class="description-link" @click="handleView(record)">{{ record.description }}</span>
            </template>
          </template>
        </a-table>
    </div>
  </div>
</template>

<script setup>
  import { reactive,ref,onMounted} from 'vue';
  import { SearchOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons-vue';
  import { dataQueryTableList } from '@/api/data-processing/index';
  import { setToken } from '@/utils/auth';
  import { isLogin } from '@/utils/auth';
  import router from "../../router";


// 设置表格高度
const containerRef = ref(null);
const tableHeight = ref(0);
  // 搜索表单数据
  const searchForm = reactive({
    templateName: '',
    year: '2025',
    keyword: '',
  });

  // 表格列配置
  const columns = [
    { title: '报表编号', dataIndex: 'TABLE_NO', width: '12rem' },
    { title: '报表名称', dataIndex: 'TABLE_NAME', width: '30rem' },
    { title: '报表类型', dataIndex: 'REPORT_TYPE', width: '12rem' },
    // { title: '创建时间', dataIndex: 'CREATE_TIME_', width: '12rem' },
    { title: '操作', key: 'action', width: '10rem', fixed: 'right' },
  ];

  // 表格数据
  const tableData = ref([]);

  // 分页配置
  const pagination = ref({
         total: 0,
         current: 1,
         pageSize: 20,
         showSizeChanger: true,
         showQuickJumper: true,
         showTotal: (total) => `共 ${total} 条`,
         pageSizeOptions: ['10','20', '30', '40', '50'],
         locale: {
               items_per_page: '条/页',
               jump_to:'跳至'
         },
       })

  const emit = defineEmits(['goDetail']);
  const handleView = (record) => {
    emit('goDetail', record);
  };
  const getDataData = {
  pageNo:pagination.value.current,
  pageSize:pagination.value.pageSize
  }
  function refreshData(page){
    pagination.value = page;
    pagination.value.showTotal= (total) => `共 ${total} 条`,
    getInit();
  }

  //初始胡获取列表数据
  const getInit = () =>{
      let getDataData = {
        pageNo:pagination.value.current,
        pageSize:pagination.value.pageSize,
        params:{
          Q_TABLE_NAME_S_LK:searchForm.templateName,
          Q_TABLE_NO_S_LK:searchForm.keyword
        }
      }
    dataQueryTableList(getDataData).then(res=>{
      console.log(res)
      tableData.value = res.data;
      pagination.value.total = res.totalCount;
      })
  };


  
  //重置
  const reset = () =>{
  pagination.value.current = 1;
      searchForm.templateName = '';
      searchForm.year = '';
      searchForm.keyword = '';
      getInit()
  };
  //查询
  const GetQuery = () =>{
      pagination.value.current=1;
      getInit()
  }
  onMounted(()=>{
    getInit();
    if (containerRef.value) {
      const containerHeight = containerRef.value.clientHeight;
      tableHeight.value = containerHeight - 110
    }
  })
  //定义getInit方法，供父组件调用
  defineExpose({
    getInit
  });
</script>

<style scoped lang="less">
  .search-section {
    background: white;
    border-radius: 1.8rem;
    .search-form {
      padding: 1.6rem;
      background-color: white;
      border-radius: 0 0 1.8rem 1.8rem;

      :deep(.ant-form) {
        gap: 1.2rem;
      }

      :deep(.ant-form-item) {
        margin-bottom: 0;
        margin-right: 1.2rem;
      }

      :deep(.ant-form-item-label) {
        label {
          color: rgb(113 113 113 / 100%);
          font-size: 1.4rem;
          height: 3.2rem;
          padding-right: 0.8rem;
        }
      }

      :deep(.custom-input) {
        border-radius: 1.8rem;
        background: rgb(245 245 245 / 100%);
        border: none;

        &:hover,
        &:focus {
          background: rgb(245 245 245 / 100%);
          box-shadow: none;
        }

        input {
          background: transparent;

          &::placeholder {
            color: rgb(0 0 0 / 85%);
          }
        }
      }

      :deep(.custom-select) {
        .ant-select-selector {
          border-radius: 1.8rem;
          background: rgb(245 245 245 / 100%);
          border: none;

          .ant-select-selection-placeholder {
            color: rgb(0 0 0 / 85%);
          }
        }

        &:hover .ant-select-selector {
          background: rgb(245 245 245 / 100%);
          box-shadow: none;
        }
      }

      :deep(.search-btn) {
        background: #546fff;
        border-radius: 1.8rem;
        border: none;
        height: 3.2rem;
        padding: 0 1.6rem;

        &:hover {
          background: #4058cc;
        }
      }

      :deep(.reset-btn) {
        border-radius: 1.8rem;
        border: 0.1rem solid #d9d9d9;
        height: 3.2rem;
        padding: 0 1.6rem;
        color: rgb(113 113 113 / 100%);

        &:hover {
          color: #546fff;
          border-color: #546fff;
        }
      }
    }
  }

  .custom-table {
    background: white;
    height: 80%;
    border-radius: 1.8rem;
    padding: 1.6rem;
    overflow: visible !important;
    :deep(.ant-spin-nested-loading){
      height: auto !important;
    }
    :deep(.ant-spin-container){
      height: auto !important;
    }
    :deep(.ant-table){
      height: auto !important;
      overflow: visible !important;
    }
    :deep(.ant-table-body) {
      max-height: calc(100vh - 400px);
      overflow-y: auto;
    }


    :deep(.ant-table-thead > tr > th) {
      background: rgb(245 245 245 / 100%);
      font-weight: normal;
      color: black;
      font-size: 1.4rem;
      text-align: center;
      height: 3.6rem;
      padding: 0;
    }

    :deep(.ant-table-tbody > tr > td) {
      height: 3.6rem;
      padding: 0;
      line-height: 3.6rem;
      text-align: center;
      font-size: 1.4rem;

      // 除了模板描述和操作列，其他列的字体颜色
      &:not(:nth-child(3)):not(:last-child) {
        color: rgb(90 96 107 / 100%);
      }

      // 模板描述列的样式
      &:nth-child(3) {
        color: rgb(84 111 255 / 100%);
        cursor: pointer;
      }
    }
    deep(.ant-table-pagination) {
    margin-top: 16px !important;
    display: flex !important;
    justify-content: flex-end !important;
    visibility: visible !important;
    height: auto !important;
    position: relative !important;
  }

  }

  .description-link {
    cursor: pointer;
    color: rgb(84 111 255 / 100%);

    &:hover {
      opacity: 0.8;
    }
  }
</style>
