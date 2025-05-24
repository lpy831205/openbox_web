<template>
  <el-container class="dashboard-container">
    <!-- 移动端菜单遮罩 -->
    <div v-if="isMobile && sidebarCollapsed" class="mobile-overlay" @click="toggleSidebar"></div>
    
    <el-aside :width="sidebarWidth" class="sidebar" :class="{ 'collapsed': sidebarCollapsed && !isMobile, 'mobile-sidebar': isMobile }">
      <div class="logo">
        <h2 v-if="!sidebarCollapsed || isMobile">学生信息系统</h2>
        <h2 v-else class="logo-collapsed">学生</h2>
      </div>
      <el-menu
        :default-active="$route.path"
        class="menu"
        router
        :collapse="sidebarCollapsed && !isMobile"
      >
        <el-menu-item index="/dashboard/search">
          <el-icon><Search /></el-icon>
          <span>学生查询</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/profile">
          <el-icon><User /></el-icon>
          <span>个人中心</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/admin" v-if="isAdmin">
          <el-icon><Setting /></el-icon>
          <span>系统管理</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/superadmin" v-if="isSuperAdmin">
          <el-icon><Key /></el-icon>
          <span>超级管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button 
            type="text" 
            @click="toggleSidebar" 
            class="menu-toggle"
            :icon="sidebarCollapsed ? Expand : Fold"
          >
          </el-button>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              {{ userInfo.account }}
              <el-icon><CaretBottom /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, User, Setting, CaretBottom, Key, Expand, Fold } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// 响应式状态
const sidebarCollapsed = ref(false)
const isMobile = ref(false)

const userInfo = computed(() => authStore.userInfo)
const isAdmin = computed(() => userInfo.value.role === 'admin')
const isSuperAdmin = computed(() => userInfo.value.role === 'superadmin')

// 计算侧边栏宽度
const sidebarWidth = computed(() => {
  if (isMobile.value) {
    return sidebarCollapsed.value ? '0px' : '200px'
  }
  return sidebarCollapsed.value ? '64px' : '200px'
})

// 检查是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    sidebarCollapsed.value = true
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 处理窗口大小变化
const handleResize = () => {
  checkMobile()
}

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/dashboard/profile')
      break
    case 'logout':
      authStore.logout()
      break
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
  width: 100%;
  display: flex;
  position: relative;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.sidebar {
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  backdrop-filter: blur(10px);
}

.sidebar.collapsed {
  width: 64px !important;
}

.sidebar.mobile-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1001;
  border-radius: 0 20px 20px 0;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.logo {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 0 15px;
  margin: 10px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.logo h2 {
  color: #fff;
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.logo-collapsed {
  font-size: 16px !important;
}

.menu {
  border-right: none;
  background-color: transparent;
  padding: 10px;
}

:deep(.el-menu-item) {
  margin: 5px 0;
  border-radius: 8px;
  transition: all 0.3s ease;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.2) !important;
  transform: translateX(5px);
}

:deep(.el-menu-item.is-active) {
  background-color: rgba(255, 255, 255, 0.25) !important;
  color: #fff !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.header {
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(220, 223, 230, 0.5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 25px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: 70px;
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
}

.menu-toggle {
  font-size: 20px;
  color: #606266;
  margin-right: 15px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.menu-toggle:hover {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.1);
  transform: scale(1.1);
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 16px;
  height: 44px;
  color: #606266;
  border-radius: 22px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.user-info:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.main {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 25px;
  width: 100%;
  overflow-y: auto;
  border-radius: 20px 0 0 0;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .header {
    padding: 0 20px;
    height: 60px;
  }
  
  .main {
    padding: 20px 15px;
    border-radius: 15px 0 0 0;
  }
  
  .menu-toggle {
    margin-right: 10px;
    font-size: 18px;
  }
  
  .logo {
    height: 60px;
    margin: 8px;
  }
  
  .logo h2 {
    font-size: 18px;
  }
  
  .user-info {
    padding: 6px 12px;
    height: 36px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .main {
    padding: 15px 10px;
  }
  
  .header {
    padding: 0 15px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 滚动条样式 */
.main::-webkit-scrollbar {
  width: 6px;
}

.main::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.main::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.main::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}
</style>