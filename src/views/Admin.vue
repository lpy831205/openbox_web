<template>
  <div class="admin-container">
    <el-tabs v-model="activeTab" class="admin-tabs">
      <!-- 用户管理 -->
      <el-tab-pane label="用户管理" name="users">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户列表</span>
              <el-button type="primary" @click="handleGenerateInvite">
                <el-icon><Plus /></el-icon> 生成邀请码
              </el-button>
            </div>
          </template>

          <el-table :data="users" border stripe style="width: 100%">
            <el-table-column prop="account" label="账号" width="120" />
            <el-table-column prop="role" label="角色" width="100">
              <template #default="{ row }">
                <el-tag :type="row.role === 'admin' ? 'danger' : 'success'">
                  {{ row.role === 'admin' ? '管理员' : '普通用户' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deviceCode" label="设备码" show-overflow-tooltip />
            <el-table-column prop="registerTime" label="注册时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.registerTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="lastLoginTime" label="最后登录" width="180">
              <template #default="{ row }">
                {{ formatDate(row.lastLoginTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  @click="handleResetPassword(row)"
                >
                  重置密码
                </el-button>
                <el-button
                  link
                  type="danger"
                  @click="handleDeleteUser(row)"
                  :disabled="row.role === 'admin'"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 查询日志 -->
      <el-tab-pane label="查询日志" name="logs">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>查询记录</span>
              <el-button type="primary" @click="handleExportLogs">
                <el-icon><Download /></el-icon> 导出日志
              </el-button>
            </div>
          </template>

          <el-table :data="queryLogs" border stripe style="width: 100%">
            <el-table-column prop="timestamp" label="时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.timestamp) }}
              </template>
            </el-table-column>
            <el-table-column prop="account" label="操作账号" width="120" />
            <el-table-column prop="ip" label="IP地址" width="120" />
            <el-table-column prop="action" label="操作类型" width="120" />
            <el-table-column prop="query" label="查询内容" show-overflow-tooltip />
            <el-table-column prop="resultCount" label="结果数" width="80" />
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </el-tab-pane>

      <!-- 系统监控 -->
      <el-tab-pane label="系统监控" name="monitor">
        <el-row :gutter="20">
          <!-- 系统状态卡片 -->
          <el-col :span="12">
            <el-card class="monitor-card">
              <template #header>
                <div class="card-header">
                  <span>系统状态</span>
                  <el-button type="primary" @click="refreshSystemStatus">
                    <el-icon><Refresh /></el-icon> 刷新
                  </el-button>
                </div>
              </template>

              <el-descriptions :column="1" border>
                <el-descriptions-item label="CPU使用率">
                  <el-progress
                    :percentage="systemStatus.cpuUsage"
                    :status="systemStatus.cpuUsage > 80 ? 'exception' : ''"
                  />
                </el-descriptions-item>
                <el-descriptions-item label="内存使用率">
                  <el-progress
                    :percentage="systemStatus.memoryUsage"
                    :status="systemStatus.memoryUsage > 80 ? 'exception' : ''"
                  />
                </el-descriptions-item>
                <el-descriptions-item label="磁盘使用率">
                  <el-progress
                    :percentage="systemStatus.diskUsage"
                    :status="systemStatus.diskUsage > 80 ? 'exception' : ''"
                  />
                </el-descriptions-item>
                <el-descriptions-item label="系统运行时间">
                  {{ systemStatus.uptime }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>

          <!-- 在线用户卡片 -->
          <el-col :span="12">
            <el-card class="monitor-card">
              <template #header>
                <div class="card-header">
                  <span>在线用户 ({{ onlineUsers.length }})</span>
                </div>
              </template>

              <el-table :data="onlineUsers" border stripe style="width: 100%">
                <el-table-column prop="account" label="账号" />
                <el-table-column prop="ip" label="IP地址" />
                <el-table-column prop="loginTime" label="登录时间">
                  <template #default="{ row }">
                    {{ formatDate(row.loginTime) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                  <template #default="{ row }">
                    <el-button
                      link
                      type="danger"
                      @click="handleForceLogout(row)"
                    >
                      强制下线
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 生成邀请码对话框 -->
    <el-dialog
      v-model="inviteDialogVisible"
      title="生成邀请码"
      width="400px"
      destroy-on-close
    >
      <el-form
        v-if="inviteFormData" 
        ref="inviteFormRef"
        :model="inviteFormData"
        label-position="top"
      >
        <el-form-item label="设备码">
          <el-input
            v-model="inviteFormData.deviceCode"
            type="textarea"
            :rows="3"
            placeholder="请输入设备码"
            clearable 
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="inviteDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="confirmGenerateInvite"
            :loading="loading"
          >
            生成
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog
      v-model="resetPasswordDialogVisible"
      title="重置密码"
      width="400px"
      destroy-on-close
    >
      <el-form
        ref="resetPasswordFormEl"
        :model="resetPasswordFormData"
        :rules="resetPasswordRules"
        label-position="top"
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetPasswordFormData.newPassword"
            type="password"
            show-password
            autocomplete="off"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="confirmResetPassword"
            :loading="loading"
          >
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Plus, Download, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

// 标签页
const activeTab = ref('users')

// 用户列表
const users = ref([])

// 查询日志
const queryLogs = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 系统状态
const systemStatus = ref({
  cpuUsage: 0,
  memoryUsage: 0,
  diskUsage: 0,
  uptime: '',
  online: false,
  lastUpdate: null,
  cpuTemperature: 0,
  memoryTotal: 0,
  memoryUsed: 0,
  diskTotal: 0,
  diskUsed: 0,
  cpuCores: 0,
  loadAverage: [0, 0, 0],
  networkIn: 0,
  networkOut: 0
})

// 在线用户
const onlineUsers = ref([])

// 对话框控制
const loading = ref(false)
const inviteDialogVisible = ref(false)
const resetPasswordDialogVisible = ref(false)
const resetPasswordFormEl = ref(null) // 用于模板引用 ElForm 实例

// 表单数据
const inviteFormData = ref({
  deviceCode: '' // 确保初始值为空字符串
})

const resetPasswordFormData = ref({
  account: '',
  newPassword: '' // 确保初始值为空字符串
})

const resetPasswordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/,
      message: '密码必须包含大小写字母和数字',
      trigger: 'blur'
    }
  ]
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    // 使用GET方法，安全头信息会在request.js中自动添加
    const response = await request.get('/api/admin/users/query')
    // 响应已在request.js的拦截器中解密
    users.value = response.data
  } catch (error) {
    ElMessage.error('获取用户列表失败：' + error.message)
  }
}

// 获取查询日志
const fetchQueryLogs = async () => {
  try {
    // 使用GET方法，参数通过params传递，安全头信息会在request.js中自动添加
    const response = await request.get('/api/admin/logs', {
      params: {
        page: currentPage.value,
        size: pageSize.value
      }
    })
    // 响应已在request.js的拦截器中解密
    queryLogs.value = response.data
    total.value = response.total
  } catch (error) {
    ElMessage.error('获取查询日志失败：' + error.message)
  }
}

// 获取系统状态
const fetchSystemStatus = async () => {
  try {
    // 使用GET方法，安全头信息会在request.js中自动添加
    const response = await request.get('/api/admin/system-status')
    // 响应已在request.js的拦截器中解密
    if (response.data) {
      // 确保所有必要的字段都存在，使用默认值防止undefined
      systemStatus.value = {
        cpuUsage: response.data.cpuUsage || 0,
        memoryUsage: response.data.memoryUsage || 0,
        diskUsage: response.data.diskUsage || 0,
        uptime: response.data.uptime || '',
        online: response.data.online || false,
        lastUpdate: response.data.lastUpdate || null,
        cpuTemperature: response.data.cpuTemperature || 0,
        memoryTotal: response.data.memoryTotal || 0,
        memoryUsed: response.data.memoryUsed || 0,
        diskTotal: response.data.diskTotal || 0,
        diskUsed: response.data.diskUsed || 0,
        cpuCores: response.data.cpuCores || 0,
        loadAverage: response.data.loadAverage || [0, 0, 0],
        networkIn: response.data.networkIn || 0,
        networkOut: response.data.networkOut || 0
      }
    }
  } catch (error) {
    ElMessage.error('获取系统状态失败：' + error.message)
  }
}

// 获取在线用户
const fetchOnlineUsers = async () => {
  try {
    // 使用GET方法，安全头信息会在request.js中自动添加
    const response = await request.get('/api/admin/online-users')
    // 响应已在request.js的拦截器中解密
    onlineUsers.value = response.data
  } catch (error) {
    ElMessage.error('获取在线用户失败：' + error.message)
  }
}

// 生成邀请码
const handleGenerateInvite = () => {
  // 确保 inviteFormData 不是 null，以防意外情况
  if (!inviteFormData.value) {
    inviteFormData.value = { deviceCode: '' };
  } else {
    inviteFormData.value.deviceCode = ''; // 清空设备码
  }
  inviteDialogVisible.value = true;
}

const confirmGenerateInvite = async () => {
  try {
    loading.value = true
    const response = await request.post('/api/admin/generate-invite', {
      device_code: inviteFormData.value.deviceCode
    })
    ElMessage.success('邀请码生成成功')
    ElMessageBox.alert(response.data.invite_code, '邀请码', {
      confirmButtonText: '复制',
      callback: (action) => {
        if (action === 'confirm') {
          navigator.clipboard.writeText(response.data.invite_code)
          ElMessage.success('已复制到剪贴板')
        }
      }
    })
    inviteDialogVisible.value = false
  } catch (error) {
    ElMessage.error('生成邀请码失败：' + error.message)
  } finally {
    loading.value = false
  }
}

// 重置密码
const handleResetPassword = (user) => {
  resetPasswordFormData.value.account = user.account;
  resetPasswordFormData.value.newPassword = ''; // 清空密码字段
  resetPasswordDialogVisible.value = true;

  // DOM 更新后（对话框和表单已渲染），重置表单校验状态
  nextTick(() => {
    if (resetPasswordFormEl.value) {
      resetPasswordFormEl.value.resetFields();
    }
  });
};

const confirmResetPassword = async () => {
  if (!resetPasswordFormEl.value) return; // 防御性检查

  try {
    await resetPasswordFormEl.value.validate(); // 首先校验表单
    loading.value = true;
    await request.post('/api/admin/reset-password', {
      account: resetPasswordFormData.value.account,
      new_password: resetPasswordFormData.value.newPassword
    });
    ElMessage.success('密码重置成功');
    resetPasswordDialogVisible.value = false;
  } catch (errorOrValidationError) {
    if (errorOrValidationError && errorOrValidationError.message) {
      ElMessage.error('重置密码失败：' + errorOrValidationError.message);
    } else {
      console.log('表单校验失败或API请求被取消/无消息错误:', errorOrValidationError);
    }
  } finally {
    loading.value = false;
  }
};

// 删除用户
const handleDeleteUser = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 ${user.account} 吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    // 使用post方法替代delete方法，确保请求体被加密
    await request.post('/api/admin/users/delete', {
      account: user.account
    })
    ElMessage.success('用户删除成功')
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除用户失败：' + error.message)
    }
  }
}

// 导出日志
const handleExportLogs = async () => {
  try {
    // 使用GET方法，安全头信息会在request.js中自动添加
    // 对于文件下载，需要特殊处理响应类型
    const response = await request.get('/api/admin/export-logs', {
      responseType: 'blob'
    })
    // 注意：对于blob类型响应，不会经过常规的响应拦截器解密
    // 服务端应直接返回解密后的文件内容
    const blob = new Blob([response], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `查询日志_${new Date().toLocaleDateString()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(link.href)
  } catch (error) {
    ElMessage.error('导出日志失败：' + error.message)
  }
}

// 强制用户下线
const handleForceLogout = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要强制用户 ${user.account} 下线吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await request.post('/api/admin/force-logout', {
      account: user.account
    })
    ElMessage.success('用户已强制下线')
    fetchOnlineUsers()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('强制下线失败：' + error.message)
    }
  }
}

// 刷新系统状态
const refreshSystemStatus = () => {
  fetchSystemStatus()
  fetchOnlineUsers()
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchQueryLogs()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchQueryLogs()
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

// 初始化数据
onMounted(async () => {
  await fetchUsers()
  await fetchSystemStatus()
  await fetchOnlineUsers()
})
</script>

<style scoped>
.admin-container {
  padding: 20px;
}

.admin-tabs :deep(.el-tabs__content) {
  padding: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.monitor-card {
  margin-bottom: 20px;
}

:deep(.el-descriptions) {
  padding: 20px;
}
</style>
