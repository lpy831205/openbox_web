<template>
  <el-container class="dashboard-container">
    <!-- 移动端菜单遮罩 -->
    <div v-if="isMobile && !sidebarCollapsed" class="mobile-overlay" @click="toggleSidebar"></div>
    
    <el-aside :width="sidebarWidth" class="sidebar" :class="{ 'collapsed': sidebarCollapsed && !isMobile, 'mobile-sidebar': isMobile, 'mobile-open': isMobile && !sidebarCollapsed }">
      <div class="logo">
        <img src="../assets/logo.svg" alt="Logo" class="logo-img" />
        <h2 v-if="!sidebarCollapsed || isMobile" class="logo-text">学生信息系统</h2>
      </div>
      <el-menu
        :default-active="$route.path"
        class="menu"
        router
        :collapse="sidebarCollapsed && !isMobile"
        :unique-opened="true"
        text-color="#fff"
        active-text-color="#ffffff"
        background-color="transparent"
      >
        <el-menu-item index="/dashboard/search" class="menu-item">
          <el-icon><Search /></el-icon>
          <span>学生查询</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/profile" class="menu-item">
          <el-icon><User /></el-icon>
          <span>个人中心</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/admin" v-if="isAdmin" class="menu-item">
          <el-icon><Setting /></el-icon>
          <span>系统管理</span>
        </el-menu-item>
        <el-menu-item index="/dashboard/superadmin" v-if="isSuperAdmin" class="menu-item">
          <el-icon><Key /></el-icon>
          <span>超级管理</span>
        </el-menu-item>
      </el-menu>
      
      <div class="sidebar-footer">
        <span class="app-version">v{{ appVersion }}</span>
      </div>
    </el-aside>

    <el-container class="main-container">
      <el-header class="header">
        <div class="header-left">
          <el-button 
            type="text" 
            @click="toggleSidebar" 
            class="menu-toggle"
            :class="{ 'menu-toggle-active': !sidebarCollapsed }"
          >
            <el-icon :size="20" class="toggle-icon">
              <component :is="sidebarCollapsed ? Expand : Fold" />
            </el-icon>
          </el-button>
          <h3 class="page-title">{{ currentPageTitle }}</h3>
        </div>
        <div class="header-right">
          <el-badge :is-dot="hasNotifications" class="notification-badge">
            <el-icon class="notification-icon" @click="showNotifications"><Bell /></el-icon>
          </el-badge>
          <el-dropdown @command="handleCommand" trigger="click">
            <div class="user-info">
              <el-avatar :size="32" class="user-avatar">{{ userInitials }}</el-avatar>
              <span class="user-name">{{ userInfo.account }}</span>
              <el-icon><CaretBottom /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>设置
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
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
      
      <el-footer class="footer" v-if="showFooter">
        <div class="footer-content">
          <span>© {{ currentYear }} 李端棻中学报名系统</span>
          <span>|</span>
          <span>技术支持: IT部门</span>
        </div>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, User, Setting, CaretBottom, Key, Expand, Fold, Bell, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appConfig = inject('appConfig')

// 响应式状态
const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
const isMobile = ref(false)
const hasNotifications = ref(false)
const showFooter = ref(true)
const appVersion = appConfig?.version || '1.0.0'
const currentYear = new Date().getFullYear()

// 页面标题映射
const pageTitles = {
  '/dashboard/search': '学生查询',
  '/dashboard/profile': '个人中心',
  '/dashboard/admin': '系统管理',
  '/dashboard/superadmin': '超级管理'
}

// 计算当前页面标题
const currentPageTitle = computed(() => {
  return pageTitles[route.path] || '仪表盘'
})

const userInfo = computed(() => authStore.userInfo)
const isAdmin = computed(() => userInfo.value.role === 'admin' || userInfo.value.role === 'superadmin')
const isSuperAdmin = computed(() => userInfo.value.role === 'superadmin')

// 计算用户头像显示的首字母
const userInitials = computed(() => {
  if (!userInfo.value.account) return '?'
  return userInfo.value.account.substring(0, 1).toUpperCase()
})

// 计算侧边栏宽度
const sidebarWidth = computed(() => {
  if (isMobile.value) {
    return sidebarCollapsed.value ? '0px' : '240px'
  }
  return sidebarCollapsed.value ? '64px' : '240px'
})

// 检查是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value && !localStorage.getItem('sidebarCollapsedManual')) {
    sidebarCollapsed.value = true
  }
}

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebarCollapsed', sidebarCollapsed.value)
  localStorage.setItem('sidebarCollapsedManual', 'true')
}

// 显示通知
const showNotifications = () => {
  // 实现通知功能
  hasNotifications.value = false
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
    case 'settings':
      // 实现设置功能
      break
    case 'logout':
      authStore.logout()
      break
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
  
  // 模拟有新通知
  setTimeout(() => {
    hasNotifications.value = true
  }, 3000)
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
  background: var(--bg-secondary);
  overflow: hidden;
}

.sidebar {
  background: linear-gradient(145deg, var(--primary-color) 0%, var(--primary-dark) 50%, #5b21b6 100%);
  color: var(--text-inverse);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-xl);
  z-index: 1000;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  will-change: width;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(145deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.05) 50%, 
    rgba(255, 255, 255, 0.02) 100%);
  pointer-events: none;
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
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.mobile-sidebar.mobile-open {
  transform: translateX(0);
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
  -webkit-backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  margin-bottom: 8px;
  overflow: hidden;
}

.logo-img {
  height: 32px;
  width: 32px;
  margin-right: 12px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu {
  flex: 1;
  border-right: none;
  background-color: transparent;
}

.menu-item {
  margin: 8px 12px;
  border-radius: 8px;
  height: 48px;
  line-height: 48px;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.menu-item.is-active {
  background-color: rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.sidebar-footer {
  padding: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background-color: var(--bg-primary);
  box-shadow: var(--shadow-sm);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle {
  margin-right: 16px;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.menu-toggle:hover {
  background-color: var(--bg-tertiary);
}

.menu-toggle-active {
  background-color: var(--bg-tertiary);
}

.toggle-icon {
  transition: transform 0.3s ease;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.notification-badge {
  margin-right: 8px;
}

.notification-icon {
  font-size: 32px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.notification-icon:hover {
  background-color: var(--bg-tertiary);
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.user-info:hover {
  background-color: var(--bg-tertiary);
}

.user-avatar {
  background-color: var(--primary-color);
  color: white;
  font-weight: 600;
  margin-right: 8px;
}

.user-name {
  margin-right: 8px;
  font-weight: 500;
}

.main {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: var(--bg-secondary);
}

.footer {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-tertiary);
}

.footer-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
  will-change: opacity, transform;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header {
    padding: 0 12px;
  }
  
  .main {
    padding: 16px;
  }
  
  .user-name {
    display: none;
  }
  
  .page-title {
    font-size: 16px;
  }
  
  .footer {
    height: 40px;
    font-size: 11px;
  }
}

/* 高性能模式 */
@media (prefers-reduced-motion: reduce) {
  .sidebar, .sidebar.mobile-sidebar,
  .fade-enter-active, .fade-leave-active,
  .menu-toggle, .toggle-icon {
    transition: none;
  }
}
</style>