<template>
  <div class="census-container">
    <!-- 主体内容 -->
    <div class="main-content">
      <!-- 左侧导航栏 -->
      <div class="side-menu">
        <div class="menu-item">
          <FolderOpenOutlined />
          <span>数据入库</span>
        </div>
        <div class="menu-item" :class="{active: $route.path === '/home' || $route.path === '/home/data-processing'}" @click="router.push('/home/data-processing')">
          <BarChartOutlined />
          <span>数据处理</span>
        </div>
        <div class="menu-item" :class="{active: $route.path === '/home/data-display'}" @click="router.push('/home/data-display')">
          <PieChartOutlined />
          <span>数据展示</span>
        </div>
        <div class="menu-item" :class="{active: $route.path === '/home/thematic-display'}" @click="router.push('/home/thematic-display')">
          <FileTextOutlined />
          <span>专题展示</span>
        </div>
        <div class="menu-item">
          <ControlOutlined />
          <span>运维管理</span>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="content-area">
        <!-- 顶部操作栏 -->
        <div class="top-actions">
          <div class="left">
            <img src="@/assets/images/icon.png" alt="logo" />
            <span class="page-title">广州市第五次全国经济普查地理信息系统</span>
          </div>
          <div class="right">
            <a-space :size="16">
              <a-dropdown>
                <span class="user-info">
                  <UserOutlined style="font-size: 1.4rem; color: white" />
                  <span style="margin-left: 8px; font-size: 14px; color: white"
                  >{{ userInfo.account || '未知用户' }} ·  <span style="margin-left: 8px; font-size: 14px; color: white; font-weight: none">{{ userInfo.admin ? '管理员' : '普通用户' }}</span></span
                  >
                </span>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="1">个人设置</a-menu-item>
                    <a-menu-item key="2" @click="handleLogout">退出登录</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </div>
        </div>

        <div class="section">
          <router-view />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { clearToken } from '@/utils/auth';
import { useRouter } from 'vue-router';
import { ref, onMounted } from 'vue';
import { getUserProfile } from '@/api/user/index';
import { message } from 'ant-design-vue';
import {
  UserOutlined,
  FolderOpenOutlined,
  BarChartOutlined,
  PieChartOutlined,
  FileTextOutlined,
  ControlOutlined,
} from '@ant-design/icons-vue';

const router = useRouter();
// 用户信息
const userInfo = ref({
  account: '',
  fullName: '',
  admin: false,
});

// 获取用户信息
const fetchUserInfo = async () => {
  try {
    const response = await getUserProfile();
    if (response && response.data) {
      userInfo.value = response.data.user || response.data;
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    message.error('获取用户信息失败');
  }
};

// 退出登录
const handleLogout = () => {
  clearToken();
  router.push('/login');
};

// 组件挂载时获取用户信息
onMounted(() => {
  fetchUserInfo();
});
</script>

<style scoped lang="less">
.census-container {
  width: 100vw; /* 确保宽度为视口宽度 */
  height: 100vh; /* 确保高度为视口高度 */
  display: flex;
  background-color: #f5f5f5;
  margin: 0;
  padding: 0;
  overflow: hidden; /* 防止滚动条影响布局 */

  .main-content {
    flex: 1;
    display: flex;
    width: 100%; /* 确保宽度100% */
    height: 100%; /* 确保高度100% */
    min-width: 0; /* 关键：允许flex子项收缩 */

    .side-menu {
      width: 100px;
      background: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 112px;
      height: 100%; /* 确保高度100% */
      flex-shrink: 0; /* 防止导航栏被压缩 */
      z-index: 10;

      .menu-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        color: #666;
        transition: all 0.3s;
        font-size: 1.6rem;
        padding: 16px 0; /* 增加垂直间距 */
        width: 100%; /* 确保宽度100% */

        :deep(.anticon) {
          font-size: 20px;
          margin-bottom: 8px;
          color: #666;
        }

        span {
          font-size: 1.4rem;
          text-align: center;
        }

        &:hover {
          color: rgb(84 111 255 / 100%);
          background-color: #f0f5ff;

          :deep(.anticon) {
            color: rgb(84 111 255 / 100%);
          }
        }

        &.active {
          color: rgb(84 111 255 / 100%);
          background-color: #f0f5ff;

          :deep(.anticon) {
            color: rgb(84 111 255 / 100%);
          }
        }
      }
    }

    .content-area {
      flex: 1; /* 占据剩余所有空间 */
      display: flex;
      flex-direction: column;
      min-width: 0; /* 关键：允许flex子项收缩 */
      height: 100%; /* 确保高度100% */
      overflow: hidden; /* 防止内部滚动 */

      .top-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px;
        //background: white;
        border-radius: 0;
        margin-bottom: 0;
        flex-shrink: 0; /* 防止头部被压缩 */
        height: 80px; /* 固定高度 */

        .left {
          display: flex;
          align-items: center;
          gap: 12px;

          img {
            width: 48px;
            height: 48px;
            border-radius: 4px;
          }

          .page-title {
            font-size: 20px;
            font-weight: 500;
            color: rgb(0 0 0 / 85%);
          }
        }

        .right {
          .user-info {
            border-radius: 20px;
            padding: 8px 16px;
            cursor: pointer;
            height: 40px;
            display: flex;
            align-items: center;
            background-color: #546fff;
            transition: all 0.3s;

            .anticon {
              font-size: 16px;
            }

            span {
              margin-left: 8px;
              font-size: 14px;
              color: white;
            }

            &:hover {
              background-color: #4058cc;
            }
          }
        }
      }

      .section {
        flex: 1; /* 占据剩余所有空间 */
        display: flex;
        flex-direction: column;
        background: #f5f5f5;
        overflow: hidden; /* 防止内部滚动 */
        min-height: 0; /* 关键：允许flex子项收缩 */
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .census-container {
    .main-content {
      flex-direction: column;

      .side-menu {
        width: 100%;
        height: auto;
        padding-top: 16px;
        flex-direction: row;
        justify-content: space-around;

        .menu-item {
          padding: 8px;
          flex: 1;
        }
      }
    }
  }
}
</style>