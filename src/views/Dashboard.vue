<template>
  <el-container class="dashboard-container">
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>学生信息系统</h2>
      </div>
      <el-menu
        :default-active="$route.path"
        class="menu"
        router
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
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, User, Setting, CaretBottom } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const userInfo = computed(() => authStore.userInfo)
const isAdmin = computed(() => userInfo.value.role === 'admin')

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
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
  width: 100%;
  display: flex;
}

.sidebar {
  background-color: #3d87e72a;
  color: #fff;
  transition: width 0.3s;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #3d87e72a;
}

.logo h2 {
  color: #fff;
  margin: 0;
  font-size: 18px;
}

.menu {
  border-right: none;
  background-color: transparent;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 30px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  height: 60px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 0 8px;
  height: 40px;
  color: #606266;
}

.user-info:hover {
  background-color: #f5f7fa;
  border-radius: 4px;
}

.main {
  background-color: #f5f7fa;
  padding: 30px;
  width: 100%;
  overflow-y: auto;
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