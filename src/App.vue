<template>
  <div id="app-container">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const isInitialized = ref(false)

// 检查并修正系统时间
const checkSystemTime = () => {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  
  // 如果系统时间显示为2025年或更晚，这可能是错误的
  if (currentYear < 2025) {
    console.warn('检测到系统时间异常：', currentDate.toISOString())
    ElMessage.warning('系统时间设置异常，请检查您的系统时间设置')
  }
}

onMounted(async () => {
  try {
    // 检查系统时间
    checkSystemTime()
    
    // 初始化时获取服务器公钥
    const success = await authStore.fetchPublicKey()
    if (!success) {
      ElMessage.error('初始化失败：无法获取服务器公钥')
      // 如果当前不是登录页，则重定向到登录页
      if (router.currentRoute.value.name !== 'Login') {
        router.push('/login')
      }
    }
    // 生成设备码
    authStore.generateDeviceCode()
    isInitialized.value = true
  } catch (error) {
    console.error('应用初始化失败:', error)
    ElMessage.error('应用初始化失败，请刷新页面重试')
  }
})
</script>

<style>
/* 重置全局样式 */
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
}

#app-container {
  font-family: 'PingFang SC', 'Helvetica Neue', Helvetica, 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
