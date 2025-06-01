<template>
  <div id="app-container">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <!-- Stagewise 工具栏组件，仅在开发模式下显示 -->
    <StagewiseToolbar v-if="isDevelopment" :config="stagewiseConfig" />
  </div>
</template>

<script setup>
import { onMounted, ref, provide, computed } from 'vue'
import { useAuthStore } from './stores/auth'
import { ElMessage, ElNotification } from 'element-plus'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const isInitialized = ref(false)
const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'
const appEnv = import.meta.env.VITE_APP_ENV || 'production'

// 判断是否为开发环境
const isDevelopment = computed(() => import.meta.env.DEV)

// Stagewise 工具栏配置
const stagewiseConfig = {
  plugins: []
}

// 提供应用配置给所有组件
provide('appConfig', {
  version: appVersion,
  environment: appEnv,
  appName: import.meta.env.VITE_APP_NAME || '李端棻中学报名系统'
})

// 检查并修正系统时间
const checkSystemTime = () => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  
  // 检查系统时间是否在合理范围内（2020-2030年）
  if (currentYear < 2020 || currentYear > 2030) {
    console.warn('检测到系统时间异常：', currentDate.toISOString())
    ElMessage.warning('系统时间设置异常，请确保系统时间在2020-2030年范围内')
  }
}

// 检查浏览器安全性
const checkBrowserSecurity = () => {
  // 检查是否为HTTPS连接
  if (window.location.protocol !== 'https:' && appEnv === 'production') {
    ElNotification({
      title: '安全警告',
      message: '当前连接不安全，建议使用HTTPS连接',
      type: 'warning',
      duration: 10000
    })
  }
  
  // 检查是否为隐私模式
  try {
    localStorage.setItem('test', 'test')
    localStorage.removeItem('test')
  } catch (e) {
    ElMessage.warning('您似乎正在使用隐私浏览模式，某些功能可能受限')
  }
}

onMounted(async () => {
  try {
    // 检查系统时间
    checkSystemTime()
    
    // 检查浏览器安全性
    checkBrowserSecurity()
    
    // 初始化时获取服务器公钥
    const success = await authStore.fetchPublicKey()
    if (!success) {
      ElMessage.error('初始化失败：无法获取服务器公钥')
      // 如果当前不是登录页，则重定向到登录页
      if (router.currentRoute.value.name !== 'Login') {
        router.push('/login')
      }
    }
    // 生成设备码 - 使用await确保异步操作完成
    await authStore.generateDeviceCode()
    isInitialized.value = true
  } catch (error) {
    console.error('应用初始化失败:', error)
    ElMessage.error('应用初始化失败，请刷新页面重试')
  }
})
</script>

<style>
/* 应用容器样式 */
html, body, #app-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  overscroll-behavior: none; /* 防止页面弹跳 */
}

#app-container {
  font-family: var(--font-family, 'Inter', 'PingFang SC', 'Helvetica Neue', Helvetica, 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--text-primary);
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  will-change: transform; /* 提高动画性能 */
}

/* 背景装饰 - 使用CSS Houdini或CSS变量优化性能 */
#app-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.03) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
  transform: translateZ(0); /* 启用GPU加速 */
}

/* 确保内容在背景之上 */
#app-container > * {
  position: relative;
  z-index: 1;
}

/* 页面过渡动画 - 使用transform代替opacity以获得更好的性能 */
.fade-enter-active {
  transition: all var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity; /* 提示浏览器优化 */
}

.fade-leave-active {
  transition: all var(--transition-base) cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.98);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(1.02);
}

/* 移动端优化 */
@media (max-width: 768px) {
  #app-container {
    background: var(--bg-secondary);
  }
  
  #app-container::before {
    display: none; /* 移动端禁用复杂背景以提高性能 */
  }
  
  /* 为移动设备添加触摸优化 */
  #app-container {
    touch-action: manipulation; /* 优化触摸体验 */
  }
}

/* 高性能模式 */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity var(--transition-fast);
  }
  
  .fade-enter-from,
  .fade-leave-to {
    transform: none;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  #app-container {
    background: linear-gradient(135deg, var(--gray-900) 0%, var(--gray-800) 100%);
  }
  
  #app-container::before {
    background: 
      radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
  }
}
</style>
