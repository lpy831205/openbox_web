<template>
  <div class="superadmin-container">
    <el-page-header @back="goBack" content="超级管理员面板">
      <template #icon>
        <el-icon><Star /></el-icon>
      </template>
    </el-page-header>

    <el-tabs v-model="activeTab" class="superadmin-tabs">
      <!-- 激活管理员 -->
      <el-tab-pane label="激活管理员" name="activate">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户管理</span>
            </div>
          </template>

          <el-alert
            title="注意：激活管理员权限是不可逆操作，请谨慎操作！"
            type="warning"
            :closable="false"
            show-icon
            class="mb-4"
          />

          <el-table :data="adminUsers" border stripe style="width: 100%">
            <el-table-column prop="account" label="账号" width="150" />
            <el-table-column prop="role" label="角色" width="120">
              <template #default="{ row }">
                <el-tag :type="getRoleTagType(row.role)">
                  {{ getRoleText(row.role) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="deviceCode" label="设备码" show-overflow-tooltip>
              <template #default="{ row }">
                <span class="device-code">{{ formatDeviceCode(row.deviceCode) }}</span>
              </template>
            </el-table-column>
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
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button
                    size="small"
                    type="primary"
                    @click="activateAdmin(row)"
                    :disabled="row.role === 'admin' || row.role === 'superadmin'"
                    class="action-btn"
                  >
                    <el-icon><Star /></el-icon>
                    激活管理员
                  </el-button>
                  <el-button
                    size="small"
                    type="success"
                    @click="setCustomRole(row)"
                    class="action-btn"
                  >
                    <el-icon><Edit /></el-icon>
                    自定义角色
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- IP黑名单管理 -->
      <el-tab-pane label="IP黑名单" name="blacklist">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>IP黑名单管理</span>
              <el-button type="primary" @click="showBlacklistDialog">
                <el-icon><Plus /></el-icon> 添加IP
              </el-button>
            </div>
          </template>

          <el-alert
            title="黑名单中的IP地址将无法访问系统"
            type="info"
            :closable="false"
            show-icon
            class="mb-4"
          />

          <el-table :data="blacklistIps" border stripe style="width: 100%">
            <el-table-column prop="ip" label="IP地址" width="200" />
            <el-table-column prop="addTime" label="添加时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.addTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="封禁原因" show-overflow-tooltip />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  link
                  type="danger"
                  @click="removeFromBlacklist(row.ip)"
                >
                  移除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- 系统安全监控 -->
      <el-tab-pane label="安全监控" name="security">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card class="security-card">
              <template #header>
                <div class="card-header">
                  <span>登录失败统计</span>
                  <el-button type="primary" @click="refreshSecurityData">
                    <el-icon><Refresh /></el-icon> 刷新
                  </el-button>
                </div>
              </template>

              <el-table :data="failedLogins" border stripe style="width: 100%">
                <el-table-column prop="ip" label="IP地址" width="150" />
                <el-table-column prop="attempts" label="失败次数" width="100" />
                <el-table-column prop="lastAttempt" label="最后尝试" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.lastAttempt) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120">
                  <template #default="{ row }">
                    <el-button
                      link
                      type="danger"
                      @click="addToBlacklist(row.ip, '多次登录失败')"
                    >
                      加入黑名单
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card class="security-card">
              <template #header>
                <span>可疑活动</span>
              </template>

              <el-table :data="suspiciousActivities" border stripe style="width: 100%">
                <el-table-column prop="ip" label="IP地址" width="150" />
                <el-table-column prop="type" label="活动类型" width="120" />
                <el-table-column prop="timestamp" label="时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.timestamp) }}
                  </template>
                </el-table-column>
                <el-table-column prop="details" label="详情" show-overflow-tooltip />
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 激活管理员对话框 -->
    <el-dialog
      v-model="activateDialogVisible"
      title="激活管理员"
      width="500px"
      destroy-on-close
    >
      <el-alert
        title="激活管理员权限后将无法撤销，请确认操作"
        type="warning"
        :closable="false"
        show-icon
        class="mb-4"
      />
      
      <div class="confirm-user-info">
        <p><strong>账号：</strong>{{ activateForm.account }}</p>
        <p><strong>当前角色：</strong>{{ activateForm.currentRole }}</p>
      </div>
      
      <el-form
        ref="activateFormRef"
        :model="activateForm"
        :rules="activateRules"
        label-position="top"
      >
        <el-form-item label="确认操作" prop="confirm">
          <el-checkbox v-model="activateForm.confirm">
            我确认要将此账号激活为管理员（此操作不可逆）
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="activateDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="confirmActivateAdmin"
            :loading="loading"
            :disabled="!activateForm.confirm"
          >
            确认激活
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- IP黑名单对话框 -->
    <el-dialog
      v-model="blacklistDialogVisible"
      title="添加IP到黑名单"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="blacklistFormRef"
        :model="blacklistForm"
        :rules="blacklistRules"
        label-position="top"
      >
        <el-form-item label="IP地址" prop="ip">
          <el-input
            v-model="blacklistForm.ip"
            placeholder="请输入IP地址，如：192.168.1.100"
            clearable
          />
        </el-form-item>
        <el-form-item label="封禁原因" prop="reason">
          <el-input
            v-model="blacklistForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入封禁原因"
            clearable
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="blacklistDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="confirmAddToBlacklist"
            :loading="loading"
          >
            添加
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加自定义角色对话框 -->
    <el-dialog
      v-model="customRoleDialogVisible"
      title="设置自定义角色"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="customRoleFormRef"
        :model="customRoleForm"
        :rules="customRoleRules"
        label-position="top"
      >
        <el-form-item label="目标账号" prop="account">
          <el-input
            v-model="customRoleForm.account"
            placeholder="请输入要设置角色的账号"
            clearable
          />
        </el-form-item>
        <el-form-item label="自定义角色" prop="role">
          <el-input
            v-model="customRoleForm.role"
            placeholder="请输入自定义角色名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="确认操作" prop="confirm">
          <el-checkbox v-model="customRoleForm.confirm">
            我确认要将此账号设置为自定义角色
          </el-checkbox>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="customRoleDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="confirmCustomRole"
            :loading="loading"
            :disabled="!customRoleForm.confirm"
          >
            确认设置
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, UserFilled, Plus, Refresh, Edit } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()

// 标签页
const activeTab = ref('activate')

// 加载状态
const loading = ref(false)

// 管理员用户列表
const adminUsers = ref([])

// IP黑名单
const blacklistIps = ref([])

// 安全监控数据
const failedLogins = ref([])
const suspiciousActivities = ref([])

// 对话框控制
const activateDialogVisible = ref(false)
const blacklistDialogVisible = ref(false)
const customRoleDialogVisible = ref(false)

// 表单引用
const activateFormRef = ref(null)
const blacklistFormRef = ref(null)
const customRoleFormRef = ref(null)

// 激活管理员表单
const activateForm = ref({
  account: '',
  currentRole: '',
  confirm: false
})

const activateRules = {
  confirm: [
    { type: 'boolean', message: '请确认操作', trigger: 'change', transform: value => value === true }
  ]
}

// IP黑名单表单
const blacklistForm = ref({
  ip: '',
  reason: ''
})

const blacklistRules = {
  ip: [
    { required: true, message: '请输入IP地址', trigger: 'blur' },
    {
      pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      message: '请输入有效的IP地址',
      trigger: 'blur'
    }
  ],
  reason: [
    { required: true, message: '请输入封禁原因', trigger: 'blur' }
  ]
}

// 添加自定义角色相关状态
const customRoleForm = ref({
  account: '',
  role: '',
  confirm: false
})

const customRoleRules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ],
  confirm: [
    { type: 'boolean', message: '请确认操作', trigger: 'change', transform: value => value === true }
  ]
}

// 获取管理员用户列表
const fetchAdminUsers = async () => {
  try {
    const response = await request.get('/api/admin/users/query')
    adminUsers.value = response.data || []
  } catch (error) {
    ElMessage.error('获取用户列表失败：' + error.message)
  }
}

// 获取IP黑名单
const fetchBlacklistIps = async () => {
  try {
    const response = await request.get('/api/superadmin/blacklist-ips')
    const ips = response.data.blacklist_ips || []
    blacklistIps.value = ips.map(ip => ({
      ip,
      addTime: new Date().toISOString(),
      reason: '系统添加'
    }))
  } catch (error) {
    ElMessage.error('获取IP黑名单失败：' + error.message)
  }
}

// 获取安全监控数据
const fetchSecurityData = async () => {
  try {
    // 这里可以添加获取失败登录和可疑活动的API调用
    // 暂时使用模拟数据
    failedLogins.value = [
      { ip: '192.168.1.100', attempts: 5, lastAttempt: new Date().toISOString() },
      { ip: '10.0.0.50', attempts: 3, lastAttempt: new Date().toISOString() }
    ]
    suspiciousActivities.value = [
      { ip: '192.168.1.200', type: '异常请求', timestamp: new Date().toISOString(), details: '频繁访问敏感接口' }
    ]
  } catch (error) {
    ElMessage.error('获取安全监控数据失败：' + error.message)
  }
}

// 显示激活管理员对话框
const showActivateDialog = () => {
  activateForm.value.account = ''
  activateForm.value.currentRole = ''
  activateForm.value.confirm = false
  activateDialogVisible.value = true
}

// 激活指定用户为管理员
const activateAdmin = (user) => {
  activateForm.value.account = user.account
  activateForm.value.currentRole = getRoleText(user.role)
  activateForm.value.confirm = false
  activateDialogVisible.value = true
  
  // DOM 更新后重置表单校验状态
  nextTick(() => {
    if (activateFormRef.value) {
      activateFormRef.value.resetFields()
    }
  })
}

// 设置自定义角色
const setCustomRole = (user) => {
  customRoleForm.value.account = user.account
  customRoleForm.value.role = ''
  customRoleForm.value.confirm = false
  customRoleDialogVisible.value = true
  
  // DOM 更新后重置表单校验状态
  nextTick(() => {
    if (customRoleFormRef.value) {
      customRoleFormRef.value.resetFields()
    }
  })
}

// 确认激活管理员
const confirmActivateAdmin = async () => {
  if (!activateFormRef.value) return

  try {
    await activateFormRef.value.validate()
    loading.value = true
    
    await request.post('/api/superadmin/activate-admin', {
      account: activateForm.value.account
    })
    
    ElMessage.success('管理员激活成功')
    activateDialogVisible.value = false
    await fetchAdminUsers()
  } catch (error) {
    if (error.message) {
      ElMessage.error('激活管理员失败：' + error.message)
    }
  } finally {
    loading.value = false
  }
}

// 显示IP黑名单对话框
const showBlacklistDialog = () => {
  blacklistForm.value = {
    ip: '',
    reason: ''
  }
  blacklistDialogVisible.value = true
}

// 确认添加到黑名单
const confirmAddToBlacklist = async () => {
  if (!blacklistFormRef.value) return

  try {
    await blacklistFormRef.value.validate()
    loading.value = true
    
    await request.post('/api/superadmin/blacklist-ip', {
      ip: blacklistForm.value.ip,
      action: 'add'
    })
    
    ElMessage.success('IP已添加到黑名单')
    blacklistDialogVisible.value = false
    await fetchBlacklistIps()
  } catch (error) {
    if (error.message) {
      ElMessage.error('添加IP到黑名单失败：' + error.message)
    }
  } finally {
    loading.value = false
  }
}

// 从黑名单移除IP
const removeFromBlacklist = async (ip) => {
  try {
    await ElMessageBox.confirm(
      `确定要从黑名单中移除IP ${ip} 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await request.post('/api/superadmin/blacklist-ip', {
      ip: ip,
      action: 'remove'
    })
    
    ElMessage.success('IP已从黑名单移除')
    await fetchBlacklistIps()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('移除IP失败：' + error.message)
    }
  }
}

// 添加IP到黑名单（从安全监控）
const addToBlacklist = async (ip, reason) => {
  try {
    await ElMessageBox.confirm(
      `确定要将IP ${ip} 添加到黑名单吗？\n原因：${reason}`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await request.post('/api/superadmin/blacklist-ip', {
      ip: ip,
      action: 'add'
    })
    
    ElMessage.success('IP已添加到黑名单')
    await fetchBlacklistIps()
    await fetchSecurityData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('添加IP到黑名单失败：' + error.message)
    }
  }
}

// 刷新安全数据
const refreshSecurityData = () => {
  fetchSecurityData()
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 工具函数
const getRoleTagType = (role) => {
  switch (role) {
    case 'superadmin': return 'danger'
    case 'admin': return 'warning'
    default: return 'success'
  }
}

const getRoleText = (role) => {
  switch (role) {
    case 'superadmin': return '超级管理员'
    case 'admin': return '管理员'
    default: return '普通用户'
  }
}

const formatDeviceCode = (deviceCode) => {
  if (!deviceCode) return ''
  return `${deviceCode.slice(0, 8)}...${deviceCode.slice(-8)}`
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

// 显示自定义角色对话框
const showCustomRoleDialog = () => {
  customRoleForm.value = {
    account: '',
    role: '',
    confirm: false
  }
  customRoleDialogVisible.value = true
}

// 确认设置自定义角色
const confirmCustomRole = async () => {
  if (!customRoleFormRef.value) return

  try {
    await customRoleFormRef.value.validate()
    loading.value = true
    
    await request.post('/api/superadmin/set-custom-role', {
      account: customRoleForm.value.account,
      role: customRoleForm.value.role
    })
    
    ElMessage.success('角色设置成功')
    customRoleDialogVisible.value = false
    await fetchAdminUsers()
  } catch (error) {
    if (error.message) {
      ElMessage.error('设置角色失败：' + error.message)
    }
  } finally {
    loading.value = false
  }
}

// 初始化数据
onMounted(async () => {
  await fetchAdminUsers()
  await fetchBlacklistIps()
  await fetchSecurityData()
})
</script>

<style scoped>
.super-admin-container {
  padding: 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
}

.super-admin-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
  pointer-events: none;
}

.page-header {
  margin-bottom: 35px;
  text-align: center;
  position: relative;
  z-index: 1;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  letter-spacing: 1px;
}

.page-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.9);
  margin: 15px 0 0 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.tabs-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 30px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

:deep(.el-tabs__header) {
  margin-bottom: 25px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 600;
  padding: 0 25px;
  border-radius: 10px 10px 0 0;
  transition: all 0.3s ease;
}

:deep(.el-tabs__item:hover) {
  color: #667eea;
}

:deep(.el-tabs__item.is-active) {
  color: #ffffff; /* 白色文字以适应渐变背景 */
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 图片中的渐变背景 */
  border-radius: 8px; /* 圆角 */

  /* 添加 flex 布局以垂直居中文本 */
  display: inline-flex;
  align-items: center;   /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  /* 如果el-tabs__item有固定的height，这通常足够了 */
  /* 如果需要，可以取消注释并调整padding或line-height */
  /* padding-top: 8px; */
  /* padding-bottom: 8px; */
  /* line-height: normal; */
}

.superadmin-tabs :deep(.el-tabs__content) {
  padding: 20px 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.mb-4 {
  margin-bottom: 16px;
}

.security-card {
  margin-bottom: 20px;
}

.device-code {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid #dee2e6;
  color: #495057;
  font-weight: 500;
}

:deep(.el-page-header) {
  margin-bottom: 20px;
}

:deep(.el-page-header__content) {
  font-size: 18px;
  font-weight: 600;
}

:deep(.el-button) {
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

:deep(.el-button--danger:hover) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 101, 101, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .super-admin-container {
    padding: 20px 15px;
  }
  
  .tabs-container {
    padding: 20px 15px;
    border-radius: 15px;
  }
  
  :deep(.el-tabs__item) {
    padding: 0 15px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .super-admin-container {
    padding: 15px 10px;
  }
  
  .tabs-container {
    padding: 15px 10px;
    border-radius: 12px;
  }
}

.header-actions {
  display: flex;
  gap: 10px;
}

.confirm-user-info {
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  border-left: 4px solid var(--el-color-primary);
}

.confirm-user-info p {
  margin: 8px 0;
  font-size: 14px;
}

.confirm-user-info strong {
  color: #303133;
  margin-right: 5px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 120px;
}

.action-btn {
  width: 100%;
  margin: 0;
  justify-content: center;
}
</style>