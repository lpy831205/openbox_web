<template>
  <div class="login-container">
    <div class="login-content">
      <el-card class="login-card">
        <template #header>
          <div class="card-header">
            <h2>李端棻中学报名系统</h2>
            <p class="subtitle">登录</p>
          </div>
        </template>

      <el-form
        ref="loginForm"
        :model="loginData"
        :rules="rules"
        label-position="top"
        @submit.prevent="handleLogin"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="账号" prop="account">
          <el-input
            v-model="loginData.account"
            placeholder="请输入账号"
            :prefix-icon="User"
            autocomplete="username"
            :disabled="loading"
            @focus="clearError"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginData.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            autocomplete="current-password"
            :disabled="loading"
            @focus="clearError"
          />
        </el-form-item>

        <div v-if="errorMessage" class="error-message">
          <el-alert
            :title="errorMessage"
            type="error"
            show-icon
            :closable="false"
          />
        </div>

        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            class="submit-btn"
          >
            登录
          </el-button>
        </el-form-item>

        <div class="form-footer">
          <router-link to="/register" class="register-link">
            没有账号？立即注册
          </router-link>
        </div>
      </el-form>
    </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const errorMessage = ref('')
const loginAttempts = ref(0)
const maxLoginAttempts = 5
const loginForm = ref(null)

const loginData = ref({
  account: '',
  password: ''
})

const rules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
    { 
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\S]{6,}$/, 
      message: '密码必须包含大小写字母和数字', 
      trigger: 'blur' 
    }
  ]
}

onMounted(async () => {
  // 获取服务器公钥
  await authStore.fetchPublicKey()
  
  // 检查是否已经登录
  if (authStore.isAuthenticated) {
    router.push('/dashboard')
  }
  
  // 自动聚焦到账号输入框
  setTimeout(() => {
    const accountInput = document.querySelector('input[autocomplete="username"]')
    if (accountInput) {
      accountInput.focus()
    }
  }, 500)
})

// 清除错误消息
const clearError = () => {
  errorMessage.value = ''
}

const handleLogin = async () => {
  if (loading.value) return
  
  try {
    // 表单验证
    if (!loginForm.value) return
    await loginForm.value.validate()
    
    // 检查登录尝试次数
    if (loginAttempts.value >= maxLoginAttempts) {
      errorMessage.value = '登录尝试次数过多，请稍后再试'
      return
    }
    
    loading.value = true
    clearError()
    
    await authStore.login(loginData.value)
    ElMessage.success('登录成功')
    router.push('/dashboard')
    
    // 登录成功，重置尝试次数
    loginAttempts.value = 0
    
  } catch (error) {
    loginAttempts.value++
    errorMessage.value = error.message || '登录失败，请检查账号和密码'
    
    // 清空密码字段
    loginData.value.password = ''
    
    // 如果尝试次数过多，显示警告
    if (loginAttempts.value >= maxLoginAttempts) {
      errorMessage.value = '登录尝试次数过多，请稍后再试'
    }
  } finally {
    loading.value = false
  }
}

// 组件卸载前清理
onBeforeUnmount(() => {
  clearError()
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background: var(--bg-secondary);
  padding: var(--spacing-lg);
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  z-index: 0;
  animation: gradientAnimation 15s ease infinite;
}

@keyframes gradientAnimation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.login-content {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;
}

.login-card {
  width: 100%;
  max-width: 450px;
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-xl);
  animation: fadeIn var(--transition-slow) ease-out;
  background: var(--bg-primary);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  z-index: 1;
}

.card-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
  position: relative;
  z-index: 2;
}

.card-header h2 {
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: var(--text-secondary);
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
}

.error-message {
  margin: var(--spacing-md) 0;
}

.submit-btn {
  width: 100%;
  margin-top: var(--spacing-lg);
  height: 48px;
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border: none;
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-fast) ease;
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left var(--transition-normal) ease;
}

.submit-btn:hover::before {
  left: 100%;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.form-footer {
  text-align: center;
  margin-top: var(--spacing-lg);
}

.register-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all var(--transition-fast) ease;
  position: relative;
}

.register-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  transition: width var(--transition-fast) ease;
}

.register-link:hover::after {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-card {
    max-width: 100%;
    margin: 0 var(--spacing-md);
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-container::before {
    animation: none;
  }
  
  .submit-btn::before {
    display: none;
  }
  
  .submit-btn:hover {
    transform: none;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>