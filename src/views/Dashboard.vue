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
        :collapse-transition="false"
        :unique-opened="true"
        text-color="#fff"
        active-text-color="#ffffff"
        background-color="transparent"
      >
        <el-menu-item index="/dashboard/search" class="menu-item">
          <el-icon><Search /></el-icon>
          <template #title>学生查询</template>
        </el-menu-item>
        <el-menu-item index="/dashboard/profile" class="menu-item">
          <el-icon><User /></el-icon>
          <template #title>个人中心</template>
        </el-menu-item>
        <el-menu-item index="/dashboard/admin" v-if="isAdmin" class="menu-item">
          <el-icon><Setting /></el-icon>
          <template #title>系统管理</template>
        </el-menu-item>
        <el-menu-item index="/dashboard/superadmin" v-if="isSuperAdmin" class="menu-item">
          <el-icon><Key /></el-icon>
          <template #title>超级管理</template>
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
          <el-badge :value="unreadCount > 0 ? unreadCount : ''" class="notification-badge">
            <el-icon class="notification-icon" @click="notificationDrawer = true"><Bell /></el-icon>
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
    
    <!-- 通知抽屉 -->
    <el-drawer
      v-model="notificationDrawer"
      title="通知中心"
      direction="rtl"
      size="350px"
    >
      <template #header>
        <div class="notification-drawer-header">
          <h3>通知中心</h3>
          <el-button 
            v-if="notifications.length > 0" 
            type="primary" 
            text 
            @click="markAllAsRead"
            :disabled="unreadCount === 0"
          >
            全部已读
          </el-button>
        </div>
      </template>
      <div class="notification-list">
        <template v-if="notifications.length > 0">
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            class="notification-item"
            :class="{ 'unread': !notification.is_read }"
            @click="viewNotification(notification)"
          >
            <div class="notification-dot" v-if="!notification.is_read"></div>
            <div class="notification-content">
              <div class="notification-title">{{ notification.title }}</div>
              <div class="notification-time">{{ formatDate(notification.create_time) }}</div>
              <div class="notification-preview">
                {{ truncateText(notification.content, 50) }}
              </div>
            </div>
          </div>
          <div class="notification-pagination">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              layout="prev, pager, next"
              :total="notificationTotal"
              @current-change="fetchNotifications"
              small
            />
          </div>
        </template>
        <el-empty 
          v-else 
          description="暂无通知" 
          :image-size="100"
        ></el-empty>
      </div>
    </el-drawer>
    
    <!-- 通知详情对话框 -->
    <el-dialog
      v-model="notificationDetailVisible"
      :title="currentNotification?.title || '通知详情'"
      width="500px"
    >
      <template v-if="currentNotification">
        <div class="notification-detail">
          <div class="notification-detail-meta">
            <div class="notification-detail-sender">
              <span class="meta-label">发送人:</span> {{ currentNotification.sender }}
            </div>
            <div class="notification-detail-time">
              {{ formatDate(currentNotification.create_time) }}
            </div>
          </div>
          <div class="notification-detail-content">
            {{ currentNotification.content }}
          </div>
        </div>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, inject } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, User, Setting, CaretBottom, Key, Expand, Fold, Bell, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const appConfig = inject('appConfig')

// 响应式状态
const sidebarCollapsed = ref(localStorage.getItem('sidebarCollapsed') === 'true')
const isMobile = ref(false)
const showFooter = ref(true)
const appVersion = appConfig?.version || '1.0.0'
const currentYear = new Date().getFullYear()

// 通知相关状态
const notifications = ref([])
const unreadCount = ref(0)
const notificationDrawer = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const notificationTotal = ref(0)
const notificationDetailVisible = ref(false)
const currentNotification = ref(null)

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

// 获取通知列表
const fetchNotifications = async (page = currentPage.value) => {
  try {
    currentPage.value = page
    const res = await request.get('/api/notifications', {
      params: {
        page: currentPage.value,
        page_size: pageSize.value
      }
    })
    
    if (res.success) {
      notifications.value = res.notifications || []
      notificationTotal.value = res.total || 0
      unreadCount.value = res.unread_count || 0
    } else {
      console.error('获取通知失败:', res.message)
      ElMessage.error(res.message || '获取通知失败')
    }
  } catch (error) {
    console.error('获取通知列表失败:', error)
    // 不向用户显示错误，避免影响用户体验
  }
}

// 查看通知详情
const viewNotification = async (notification) => {
  try {
    if (!notification || !notification.id) {
      console.error('通知数据不完整')
      return
    }
    
    currentNotification.value = notification
    notificationDetailVisible.value = true
    
    // 如果通知未读，标记为已读
    if (!notification.is_read) {
      try {
        const res = await request.post('/api/notifications/read', {
          notification_id: notification.id
        })
        
        if (res.success) {
          // 更新本地状态
          notification.is_read = true
          // 减少未读数量
          if (unreadCount.value > 0) {
            unreadCount.value--
          }
        }
      } catch (markError) {
        console.error('标记通知已读失败:', markError)
        // 不显示错误给用户
      }
    }
  } catch (error) {
    console.error('查看通知详情失败:', error)
    ElMessage.error('查看通知详情失败，请稍后重试')
  }
}

// 全部标记为已读
const markAllAsRead = async () => {
  if (unreadCount.value === 0) return
  
  try {
    // 遍历所有未读通知
    const markPromises = []
    for (const notification of notifications.value) {
      if (!notification.is_read && notification.id) {
        const promise = request.post('/api/notifications/read', {
          notification_id: notification.id
        }).then(res => {
          if (res.success) {
            notification.is_read = true
            return true
          }
          return false
        }).catch(error => {
          console.error(`标记通知 ${notification.id} 已读失败:`, error)
          return false
        })
        
        markPromises.push(promise)
      }
    }
    
    // 等待所有请求完成
    const results = await Promise.allSettled(markPromises)
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length
    
    // 更新未读数量
    unreadCount.value = 0
    
    if (successCount > 0) {
      ElMessage.success(`已将 ${successCount} 条通知标记为已读`)
    } else {
      ElMessage.warning('没有通知需要标记为已读')
    }
  } catch (error) {
    console.error('标记全部已读失败:', error)
    ElMessage.error('操作失败，请稍后重试')
  }
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000) // 秒数差
  
  if (diff < 60) {
    return '刚刚'
  } else if (diff < 3600) {
    return `${Math.floor(diff / 60)}分钟前`
  } else if (diff < 86400) {
    return `${Math.floor(diff / 3600)}小时前`
  } else if (diff < 604800) {
    return `${Math.floor(diff / 86400)}天前`
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
}

// 截断文本
const truncateText = (text, length) => {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// 显示通知
const showNotifications = () => {
  notificationDrawer.value = true
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
  
  // 获取通知列表
  fetchNotifications()
  
  // 设置定时器，定期检查新通知
  const notificationTimer = setInterval(() => {
    fetchNotifications()
  }, 60000) // 每分钟检查一次
  
  // 组件卸载时清除定时器
  onUnmounted(() => {
    clearInterval(notificationTimer)
  })
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

/* 添加图标居中样式 */
:deep(.el-menu--collapse .el-menu-item) {
  display: flex;
  justify-content: center;
  padding: 0 !important;
}

:deep(.el-menu--collapse .el-menu-item .el-icon) {
  margin: 0 auto;
  position: relative;
  left: 0;
  right: 0;
  transform: none;
}

/* 确保菜单项在收起状态下的正确对齐 */
:deep(.el-menu--collapse) {
  width: 64px;
}

:deep(.el-menu-item [class^="el-icon"]) {
  vertical-align: middle;
  margin-right: 5px;
  width: 24px;
  text-align: center;
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

:deep(.el-menu--collapse) .menu-item {
  margin: 8px auto;
  width: 48px;
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
  margin-right: 20px;
  cursor: pointer;
}

.notification-icon {
  font-size: 22px;
  color: var(--text-secondary);
  transition: all 0.2s;
}

.notification-icon:hover {
  color: var(--primary-color);
  transform: scale(1.1);
}

.notification-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.notification-list {
  height: 100%;
  overflow-y: auto;
  padding: 0 10px;
}

.notification-item {
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  display: flex;
  align-items: flex-start;
}

.notification-item:hover {
  background-color: var(--hover-color);
}

.notification-item.unread {
  background-color: rgba(var(--primary-rgb), 0.05);
}

.notification-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--primary-color);
  position: absolute;
  top: 15px;
  left: 5px;
}

.notification-content {
  flex: 1;
  margin-left: 15px;
}

.notification-title {
  font-weight: 600;
  margin-bottom: 5px;
}

.notification-time {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 5px;
}

.notification-preview {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notification-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.notification-detail {
  padding: 10px 0;
}

.notification-detail-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.notification-detail-sender {
  font-size: 14px;
  color: var(--text-secondary);
}

.meta-label {
  font-weight: 600;
}

.notification-detail-time {
  font-size: 14px;
  color: var(--text-secondary);
}

.notification-detail-content {
  background-color: var(--bg-secondary);
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  min-height: 100px;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 14px;
  line-height: 1.6;
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