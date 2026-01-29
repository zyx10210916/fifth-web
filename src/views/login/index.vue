<template>
  <Header/>
  <div class="login-container">

    <div class="bottom-image">
      <img src="@/assets/images/dibu.png" alt="底部图片" class="dibu-image" />
    </div>
    <div class="title-login">广州市第五次全国经济普查地理信息系统</div>
    <div class="login-form-wrapper">
      <div class="login-title">用户登录</div>
      <a-form
          ref="formRef"
          :model="loginForm"
          class="login-form"
      >

        <a-form-item name="username" class="input-item">
          <div class="inline-input-container">
            <label class="input-label">用户名：</label>
            <div class="input-with-icon">
              <a-input
                  v-model:value="loginForm.username"
                  placeholder="请输入用户名"
                  prefix-icon="user"
                  size="large"
                  class="custom-input-t"
              />
              <img src="@/assets/images/user.png" alt="用户名图标" class="input-icon" />
            </div>
          </div>
        </a-form-item>

        <!-- 密码输入框 - 所有元素同一行 -->
        <a-form-item name="password" class="input-item">
          <div class="inline-input-container">
            <label class="input-label">密码：</label>
            <div class="input-with-icon">
              <a-input
                  type="password"
                  v-model:value="loginForm.password"
                  placeholder="请输入密码"
                  prefix-icon="lock"
                  size="large"
                  class="custom-input"
              />
              <img src="@/assets/images/password.png" alt="密码图标" class="input-icon-password" />
            </div>
          </div>
        </a-form-item>

        <!-- 验证码输入框 - 所有元素同一行 -->
        <a-form-item name="captcha" class="input-item">
          <div class="inline-input-container">
            <label class="input-label">验证码：</label>
            <div class="captcha-input-wrapper">
              <a-row :gutter="8" class="captcha-row">
                <a-col :span="15">
                  <a-input
                      v-model:value="loginForm.captcha"
                      placeholder="请输入验证码"
                      prefix-icon="safety"
                      size="large"
                      class="custom-input"
                  />
                </a-col>
                <a-col :span="9">
                  <img
                      src="@/assets/images/yzm.png"
                      alt="验证码"
                      class="captcha-image"
                      @click="handleCaptchaClick"
                  />
                </a-col>
              </a-row>
            </div>
          </div>
        </a-form-item>

        <a-form-item>
          <a-button
              type="primary"
              html-type="submit"
              class="login-button"
              size="large"
              :loading="loading"
              @click="handleLogin"
          >
            立即登录
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { message, type FormInstance } from 'ant-design-vue';
// 导入 Store
import { useUserStore } from '@/store/modules/user'; 
import Header from '../../components/Header/index.vue';

const router = useRouter();
const userStore = useUserStore(); // 初始化 Store，解决“找不到名称 userStore”
const formRef = ref<FormInstance>();
const loading = ref(false);

// 1. 修复类型报错：给 reactive 指定明确的结构，解决“不存在属性 username/password/captcha”
const loginForm = reactive({
  username: '',
  password: '',
  captcha: ''
});

// 2. 修复“已声明但从未读取”：将 rules 绑定到 a-form 的 :rules 属性上（模板中需要添加）
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  // captcha: [
  //   { required: true, message: '请输入验证码', trigger: 'blur' }
  // ]
};

// 刷新验证码
const handleCaptchaClick = () => {
  console.log('刷新验证码');
};

// 处理登录
const handleLogin = async () => {
  try {
    await formRef.value?.validate();
    loading.value = true;

    // 调用 Store 动作，它内部会通过 token 接口同时存下 access_token 和 refresh_token
    await userStore.login({
      username: loginForm.username,
      password: loginForm.password
    });

    message.success('登录成功');
    router.push('/home');
  } catch (error: any) {
    // 如果是表单验证失败，不需要弹出错误消息
    if (error?.errorFields) return;
    
    message.error(error.message || '登录失败');
    console.error('登录过程发生错误:', error);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="less">
.bottom-image {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1;
}

.dibu-image {
  width: 100%;
  height: auto;
  display: block;
}

.login-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
  background-image: url("@/assets/images/bj.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  position: relative;
}

.login-form-wrapper {
  width: 579px;
  padding: 90px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title-login {
  width: 980px;
  height: 200px;
  opacity: 1;
  font-size: 76px;
  font-weight: 300;
  letter-spacing: 0px;
  line-height: 100px;
  color: rgba(71, 71, 71, 1);
  text-align: center;
  vertical-align: top;
  margin-bottom: 30px;
}

.login-title {
  font-size: 36px;
  font-weight: 500;
  letter-spacing: 0.56px;
  line-height: 37px;
  color: rgba(56, 56, 56, 1);
  text-align: center;
  vertical-align: top;
  margin-bottom: 50px ;

}

.login-form {
  width: 100%;
  height: 230px;
}

.login-button {
  margin-left: 15px;
  margin-top: 20px;
  width: 100%;
  background: rgba(84, 111, 255, 1);
  padding: 5px;
}

// 输入项样式
.input-item {
  margin-bottom: 20px;
  position: relative;
}

// 同一行输入容器
.inline-input-container {
  display: flex;
  align-items: center;
  width: 100%;
  position: relative;
}

// 输入标签样式
.input-label {
  display: inline-block;
  width: 80px;
  font-size: 14px;
  color: rgba(56, 56, 56, 1);
  font-weight: 500;
  margin-right: 10px;
  text-align: right;
}

// 验证码行特殊处理
.captcha-row {
  flex: 1;
  min-width: 0;
  position: static;
}
.captcha-row > .ant-col:first-child {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #d9d9d9;
    transition: background-color 0.3s;
  }

  &:hover::after {
    background-color: #4096ff;
  }
}


// 输入框右侧图标样式
.input-icon,
.input-icon-password {
  width: 20px;
  height: 20px;
  margin-left: 10px;
  pointer-events: none;
}

.captcha-image {
  width: 80%;
  height: 80%;
  margin-left: 30px;
}
// 自定义输入框容器 - 关键修改：将横线应用到这个容器上
.custom-input {
  flex: 1;
  min-width: 0;
  position: relative;
  // 输入框和图标的组合容器
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    right: 30px; // 为右侧图标留出空间
    height: 1px;
    background-color: #d9d9d9;
    transition: background-color 0.3s;
  }

  &:hover::after {
    background-color: #4096ff;
  }
}
.custom-input-t {
  flex: 1;
  min-width: 0;
  padding-left: 10px;
  position: relative;
  // 输入框和图标的组合容器
  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    right: 30px; // 为右侧图标留出空间
    height: 1px;
    background-color: #d9d9d9;
    transition: background-color 0.3s;
  }

  &:hover::after {
    background-color: #4096ff;
  }
}
// 用户名和密码输入区域的特殊处理
.input-with-icon {
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    right: 0;
    height: 1px;
    background-color: #d9d9d9;
    transition: background-color 0.3s;
  }

  &:hover::after {
    background-color: #4096ff;
  }
}

// 验证码输入区域的特殊处理
.captcha-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 40px; // 与其他输入框保持一致的高度
  display: flex;
  align-items: center;

}


// 输入框通用样式修改
:deep(.ant-input-affix-wrapper) {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background-color: transparent !important;
  padding: 0 11px !important;
  min-height: 32px;

  &::after,
  &::before {
    display: none !important;
  }
}

:deep(.ant-input) {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background-color: transparent !important;
  padding: 4px 0 !important;
  height: auto !important;
  min-height: 32px;
  text-indent: 0 !important;

  &:hover,
  &:focus {
    box-shadow: none !important;
    border-color: transparent !important;
  }
}

// 密码输入框特定样式
:deep(.ant-input-password .ant-input) {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background-color: transparent !important;
  padding: 4px 0 !important;
}

// 确保前缀图标样式
:deep(.ant-input-affix-wrapper .anticon) {
  color: rgba(0, 0, 0, 0.45);
}
</style>





