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
              <el-button type="primary" @click="handleGenerateInvite">
                <el-icon><Plus /></el-icon> 生成邀请码
              </el-button>
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
        <el-row :gutter="20" class="mb-4">
          <el-col :span="24">
            <el-card shadow="hover" class="security-stats-card">
              <div class="security-stats">
                <div class="stat-item">
                  <div class="stat-value">{{ securityStats.totalFailedLogins }}</div>
                  <div class="stat-label">失败登录总数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ securityStats.totalSuspiciousActivities }}</div>
                  <div class="stat-label">可疑活动总数</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">{{ securityStats.blockedIpCount }}</div>
                  <div class="stat-label">已封禁IP数</div>
                </div>
                <div class="stat-item stat-last-updated">
                  <div class="stat-label">最后更新时间</div>
                  <div class="stat-time">{{ formatDate(securityStats.lastUpdated) }}</div>
                </div>
              </div>
              <div class="security-actions">
                <el-button type="primary" @click="refreshSecurityData" :loading="securityLoading">
                  <el-icon><Refresh /></el-icon> 刷新数据
                </el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-card class="security-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>登录失败统计</span>
                  <div>
                    <el-button size="small" @click="clearFailedLogins()">
                      <el-icon><Delete /></el-icon> 清除全部
                    </el-button>
                  </div>
                </div>
              </template>

              <el-table :data="failedLogins" border stripe style="width: 100%" v-loading="securityLoading">
                <el-table-column prop="ip" label="IP地址" width="130" />
                <el-table-column prop="account" label="账号" width="100" />
                <el-table-column prop="attempts" label="失败次数" width="80" sortable>
                  <template #default="{ row }">
                    <el-tag :type="row.attempts > 5 ? 'danger' : 'warning'" effect="dark">
                      {{ row.attempts }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="reason" label="失败原因" width="120" />
                <el-table-column prop="lastAttempt" label="最后尝试" width="160">
                  <template #default="{ row }">
                    {{ formatDate(row.lastAttempt) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="160" fixed="right">
                  <template #default="{ row }">
                    <div class="action-buttons">
                      <el-button
                        link
                        type="primary"
                        size="small"
                        @click="clearFailedLogins(row.ip)"
                      >
                        清除记录
                      </el-button>
                      <el-button
                        link
                        type="danger"
                        size="small"
                        @click="addToBlacklist(row.ip, '多次登录失败')"
                      >
                        加入黑名单
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card class="security-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>可疑活动</span>
                </div>
              </template>

              <el-table :data="suspiciousActivities" border stripe style="width: 100%" v-loading="securityLoading">
                <el-table-column prop="ip" label="IP地址" width="130" />
                <el-table-column prop="type" label="活动类型" width="100" />
                <el-table-column prop="severity" label="严重性" width="80">
                  <template #default="{ row }">
                    <el-tag :type="getSeverityTagType(row.severity)" effect="dark">
                      {{ row.severity || '中' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="timestamp" label="时间" width="160">
                  <template #default="{ row }">
                    {{ formatDate(row.timestamp) }}
                  </template>
                </el-table-column>
                <el-table-column prop="details" label="详情" show-overflow-tooltip />
                <el-table-column label="操作" width="160" fixed="right">
                  <template #default="{ row }">
                    <div class="action-buttons">
                      <el-button
                        link
                        type="primary"
                        size="small"
                        @click="viewActivityDetails(row)"
                      >
                        查看详情
                      </el-button>
                      <el-button
                        link
                        type="danger"
                        size="small"
                        @click="addToBlacklist(row.ip, row.details)"
                      >
                        加入黑名单
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="mt-4">
          <el-col :span="24">
            <el-card class="security-card" shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>系统日志</span>
                  <el-radio-group v-model="logFilter" size="small">
                    <el-radio-button label="all">全部</el-radio-button>
                    <el-radio-button label="error">错误</el-radio-button>
                    <el-radio-button label="warning">警告</el-radio-button>
                    <el-radio-button label="info">信息</el-radio-button>
                  </el-radio-group>
                </div>
              </template>

              <el-table 
                :data="filteredSystemLogs" 
                border 
                stripe 
                style="width: 100%" 
                v-loading="securityLoading"
                height="300"
              >
                <el-table-column prop="timestamp" label="时间" width="160">
                  <template #default="{ row }">
                    {{ formatDate(row.timestamp) }}
                  </template>
                </el-table-column>
                <el-table-column prop="level" label="级别" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getLogLevelTagType(row.level)" effect="plain">
                      {{ row.level }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="source" label="来源" width="120" />
                <el-table-column prop="message" label="消息" show-overflow-tooltip />
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

    <!-- 生成邀请码对话框 -->
    <el-dialog
      v-model="inviteDialogVisible"
      title="生成邀请码"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="inviteFormRef"
        :model="inviteFormData"
        label-position="top"
      >
        <el-form-item label="设备码（可选）" prop="deviceCode">
          <el-input
            v-model="inviteFormData.deviceCode"
            placeholder="请输入设备码（可选）"
            clearable
          />
          <div class="form-tip">
            如果不填写设备码，系统将生成通用邀请码
          </div>
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

    <!-- 查看可疑活动详情对话框 -->
    <el-dialog
      v-model="activityDetailsDialogVisible"
      title="可疑活动详情"
      width="500px"
      destroy-on-close
    >
      <div class="activity-details">
        <p><strong>IP地址：</strong>{{ currentActivityDetails.ip }}</p>
        <p><strong>活动类型：</strong>{{ currentActivityDetails.type }}</p>
        <p><strong>严重性：</strong>{{ currentActivityDetails.severity }}</p>
        <p><strong>时间：</strong>{{ formatDate(currentActivityDetails.timestamp) }}</p>
        <p><strong>详情：</strong>{{ currentActivityDetails.details }}</p>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="activityDetailsDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Star, UserFilled, Plus, Refresh, Edit, Delete } from '@element-plus/icons-vue'
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
const systemLogs = ref([])
const securityStats = ref({
  totalFailedLogins: 0,
  totalSuspiciousActivities: 0,
  blockedIpCount: 0,
  lastUpdated: ''
})
const securityLoading = ref(false)
const logFilter = ref('all')

// 过滤后的系统日志
const filteredSystemLogs = computed(() => {
  if (logFilter.value === 'all') {
    return systemLogs.value
  }
  return systemLogs.value.filter(log => log.level === logFilter.value)
})

// 对话框控制
const activateDialogVisible = ref(false)
const blacklistDialogVisible = ref(false)
const customRoleDialogVisible = ref(false)
const activityDetailsDialogVisible = ref(false)
const inviteDialogVisible = ref(false)

// 表单引用
const activateFormRef = ref(null)
const blacklistFormRef = ref(null)
const customRoleFormRef = ref(null)
const inviteFormRef = ref(null)

// 当前查看的可疑活动详情
const currentActivityDetails = ref(null)

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

// 邀请码相关状态
const inviteFormData = ref({
  deviceCode: ''
})

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
    securityLoading.value = true
    
    // 获取登录失败记录
    const failedLoginsResponse = await request.get('/api/superadmin/security/failed-logins')
    failedLogins.value = failedLoginsResponse.data || []
    
    // 获取可疑活动
    const suspiciousActivitiesResponse = await request.get('/api/superadmin/security/suspicious-activities')
    suspiciousActivities.value = suspiciousActivitiesResponse.data || []
    
    // 获取系统日志
    const systemLogsResponse = await request.get('/api/superadmin/security/system-logs', {
      params: { limit: 100 }
    })
    systemLogs.value = systemLogsResponse.data || []
    
    // 获取安全统计数据
    const securityStatsResponse = await request.get('/api/superadmin/security/stats')
    securityStats.value = securityStatsResponse.data || {
      totalFailedLogins: 0,
      totalSuspiciousActivities: 0,
      blockedIpCount: 0,
      lastUpdated: new Date().toISOString()
    }
    
    ElMessage.success('安全监控数据已更新')
  } catch (error) {
    ElMessage.error('获取安全监控数据失败：' + error.message)
    // 如果API尚未实现，使用模拟数据以便前端开发测试
    failedLogins.value = [
      { ip: '192.168.1.100', attempts: 5, lastAttempt: new Date().toISOString(), account: 'user1', reason: '多次登录失败' },
      { ip: '10.0.0.50', attempts: 3, lastAttempt: new Date().toISOString(), account: 'admin2', reason: '多次登录失败' },
      { ip: '172.16.0.10', attempts: 8, lastAttempt: new Date().toISOString(), account: 'test', reason: '多次登录失败' }
    ]
    suspiciousActivities.value = [
      { ip: '192.168.1.200', type: '异常请求', timestamp: new Date().toISOString(), details: '频繁访问敏感接口', severity: 'high' },
      { ip: '10.0.0.25', type: '暴力破解', timestamp: new Date().toISOString(), details: '尝试破解管理员账号', severity: 'critical' },
      { ip: '172.16.0.5', type: '异常登录', timestamp: new Date().toISOString(), details: '非常规时间登录系统', severity: 'medium' }
    ]
    systemLogs.value = [
      { timestamp: new Date().toISOString(), level: 'warning', message: '用户admin多次尝试访问未授权资源', source: 'auth-service' },
      { timestamp: new Date(Date.now() - 3600000).toISOString(), level: 'error', message: '数据库连接异常', source: 'db-service' },
      { timestamp: new Date(Date.now() - 7200000).toISOString(), level: 'info', message: '系统定时备份完成', source: 'backup-service' }
    ]
    securityStats.value = {
      totalFailedLogins: 56,
      totalSuspiciousActivities: 12,
      blockedIpCount: 5,
      lastUpdated: new Date().toISOString()
    }
  } finally {
    securityLoading.value = false
  }
}

// 清除失败登录记录
const clearFailedLogins = async (ip) => {
  try {
    await ElMessageBox.confirm(
      `确定要清除${ip ? `IP ${ip} 的` : '所有'}失败登录记录吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await request.post('/api/superadmin/security/clear-failed-logins', {
      ip: ip || null
    })
    
    ElMessage.success(`${ip ? `IP ${ip} 的` : '所有'}失败登录记录已清除`)
    await fetchSecurityData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清除失败登录记录失败：' + error.message)
    }
  }
}

// 获取安全事件严重性标签类型
const getSeverityTagType = (severity) => {
  switch (severity) {
    case 'critical': return 'danger'
    case 'high': return 'warning'
    case 'medium': return 'info'
    case 'low': return 'success'
    default: return 'info'
  }
}

// 获取日志级别标签类型
const getLogLevelTagType = (level) => {
  switch (level) {
    case 'error': return 'danger'
    case 'warning': return 'warning'
    case 'info': return 'info'
    case 'debug': return 'success'
    default: return 'info'
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

// 查看可疑活动详情
const viewActivityDetails = (activity) => {
  currentActivityDetails.value = activity
  activityDetailsDialogVisible.value = true
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

:deep(.el-tabs__nav-wrap) {
  /* 确保导航包装元素不会裁剪内容 */
  overflow: visible !important;
}

:deep(.el-tabs__nav) {
  /* 确保导航元素不会裁剪内容 */
  overflow: visible !important;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 600;
  padding: 0 25px;
  border-radius: 10px 10px 0 0;
  transition: all 0.3s ease;
  position: relative;
  overflow: visible !important; /* 确保内容不被裁剪 */
  margin: 0 2px; /* 添加边距，避免相邻标签项背景重叠 */
}

:deep(.el-tabs__item:hover) {
  color: #667eea;
}

:deep(.el-tabs__item.is-active) {
  color: #ffffff; /* 白色文字以适应渐变背景 */
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* 图片中的渐变背景 */
  border-radius: 10px 10px 0 0; /* 保持与上方定义一致的圆角 */
  transform: translateY(0); /* 确保不会有偏移 */
}

:deep(.el-tabs__active-bar) {
  background: transparent; /* 移除底部激活条 */
  height: 0;
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

.security-stats-card {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  padding: 20px;
  position: relative;
  z-index: 1;
  border: none;
}

.security-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.stat-item {
  text-align: center;
  padding: 15px;
  min-width: 120px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.stat-last-updated {
  text-align: right;
  background: transparent;
  box-shadow: none;
}

.stat-time {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.security-actions {
  text-align: right;
}

.security-card {
  margin-bottom: 20px;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.security-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.activity-details {
  padding: 20px;
  background: #f9fafc;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.activity-details p {
  margin: 10px 0;
  line-height: 1.6;
}

.activity-details strong {
  color: #303133;
  margin-right: 8px;
}

.mt-4 {
  margin-top: 16px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

:deep(.el-radio-button__inner) {
  border-radius: 4px;
  padding: 8px 15px;
  font-weight: 500;
}

:deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-left-color: #dcdfe6;
  border-radius: 4px 0 0 4px;
}

:deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 4px 4px 0;
}
</style>