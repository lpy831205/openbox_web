<template>
  <div class="admin-container">
    <el-tabs v-model="activeTab" class="admin-tabs" @tab-change="handleTabChange">
      <!-- 用户管理 -->
      <el-tab-pane label="用户管理" name="users">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户列表</span>
            </div>
          </template>

          <el-table :data="users" border stripe style="width: 100%">
            <el-table-column prop="account" label="账号" width="120" />
            <el-table-column prop="role" label="角色" width="100">
              <template #default="{ row }">
                <el-tag :type="getRoleTagType(row.role)">
                  {{ getRoleText(row.role) }}
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
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button
                    size="small"
                    type="primary"
                    @click="handleResetPassword(row)"
                    class="action-btn reset-btn"
                  >
                    <el-icon><Key /></el-icon>
                    重置密码
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="handleDeleteUser(row)"
                    :disabled="row.role === 'admin'"
                    class="action-btn"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
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
              <div class="header-buttons">
                <el-button 
                  type="danger" 
                  @click="handleClearLogs" 
                  class="clear-btn"
                >
                  <el-icon><Delete /></el-icon> 清除日志
                </el-button>
                <el-button 
                  type="primary" 
                  @click="handleExportLogs" 
                  class="export-btn"
                >
                  <el-icon><Download /></el-icon> 导出日志
                </el-button>
              </div>
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
            <el-table-column prop="action" label="操作类型" width="150">
              <template #default="{ row }">
                <el-tag :type="getActionTagType(row.action)">
                  {{ formatAction(row.action) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="query" label="查询内容" show-overflow-tooltip />
            <el-table-column prop="result_count" label="结果数" width="80" />
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

      <!-- 通知管理 -->
      <el-tab-pane label="通知管理" name="notifications">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>通知列表</span>
              <el-button type="primary" @click="handleCreateNotification">
                <el-icon><Plus /></el-icon> 发送通知
              </el-button>
            </div>
          </template>

          <el-table :data="notifications" border stripe style="width: 100%">
            <el-table-column prop="title" label="标题" show-overflow-tooltip />
            <el-table-column prop="create_time" label="发送时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.create_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="recipients" label="接收人" width="150">
              <template #default="{ row }">
                <el-tag v-if="row.recipients === 'all'" type="success">所有用户</el-tag>
                <el-tag v-else type="info">指定用户({{ row.recipients.length }}人)</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="已读情况" width="150">
              <template #default="{ row }">
                <el-progress 
                  :percentage="Math.round((row.read_count / row.total_recipients) * 100)" 
                  :format="percentageFormat"
                  :status="getReadStatus(row.read_count, row.total_recipients)"
                />
                <div class="read-count">{{ row.read_count }}/{{ row.total_recipients }}</div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <div class="action-buttons">
                  <el-button
                    size="small"
                    type="primary"
                    @click="handleViewNotification(row)"
                    class="action-btn"
                  >
                    <el-icon><View /></el-icon>
                    查看
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click="handleDeleteNotification(row)"
                    class="action-btn"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="notificationCurrentPage"
              v-model:page-size="notificationPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="notificationTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleNotificationSizeChange"
              @current-change="handleNotificationCurrentChange"
            />
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>

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

    <!-- 发送通知对话框 -->
    <el-dialog
      v-model="notificationDialogVisible"
      title="发送通知"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="notificationFormRef"
        :model="notificationForm"
        :rules="notificationRules"
        label-position="top"
      >
        <el-form-item label="通知标题" prop="title">
          <el-input
            v-model="notificationForm.title"
            placeholder="请输入通知标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="接收人" prop="recipientType">
          <el-radio-group v-model="notificationForm.recipientType">
            <el-radio label="all">所有用户</el-radio>
            <el-radio label="selected">指定用户</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item 
          v-if="notificationForm.recipientType === 'selected'" 
          label="选择用户" 
          prop="selectedUsers"
        >
          <el-select
            v-model="notificationForm.selectedUsers"
            multiple
            filterable
            placeholder="请选择用户"
            style="width: 100%"
          >
            <el-option
              v-for="user in users"
              :key="user.account"
              :label="user.account"
              :value="user.account"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="通知内容" prop="content">
          <el-input
            v-model="notificationForm.content"
            type="textarea"
            :rows="6"
            placeholder="请输入通知内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="notificationDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="submitNotification"
            :loading="notificationLoading"
          >
            发送
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 查看通知对话框 -->
    <el-dialog
      v-model="viewNotificationDialogVisible"
      :title="currentNotification?.title || '通知详情'"
      width="600px"
    >
      <template v-if="currentNotification">
        <div class="notification-info">
          <p class="notification-meta">
            <span class="notification-sender">发送人: {{ currentNotification.sender }}</span>
            <span class="notification-time">{{ formatDate(currentNotification.create_time) }}</span>
          </p>
          <p class="notification-recipients">
            接收人: 
            <el-tag v-if="currentNotification.recipients === 'all'" type="success">所有用户</el-tag>
            <template v-else>
              <el-tag 
                v-for="(recipient, index) in currentNotification.recipients" 
                :key="index" 
                class="recipient-tag"
              >
                {{ recipient }}
              </el-tag>
            </template>
          </p>
          <div class="notification-content">
            {{ currentNotification.content }}
          </div>
          <div class="notification-read-status">
            <p>已读状态: {{ currentNotification.read_count }}/{{ currentNotification.total_recipients }}</p>
            <el-progress 
              :percentage="Math.round((currentNotification.read_count / currentNotification.total_recipients) * 100)"
              :format="percentageFormat"
              :status="getReadStatus(currentNotification.read_count, currentNotification.total_recipients)"
            />
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { Plus, Download, Refresh, Key, Delete, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

// 标签页
const activeTab = ref('users')

// 监听标签页变化，加载相应数据
const handleTabChange = (tab) => {
  // 根据当前活动的标签页加载相应数据
  if (tab === 'users') {
    fetchUsers()
  } else if (tab === 'logs') {
    fetchQueryLogs()
  } else if (tab === 'monitor') {
    refreshSystemStatus()
  } else if (tab === 'notifications') {
    getNotifications()
  }
}

// 用户列表
const users = ref([])

// 查询日志
const queryLogs = ref([
  {
    timestamp: new Date(),
    account: 'admin',
    ip: '192.168.1.100',
    action: '查询',
    query: '姓名:张三',
    result_count: 5
  },
  {
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    account: 'user1',
    ip: '192.168.1.101',
    action: '导出',
    query: '班级:初一(1)班',
    result_count: 42
  },
  {
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    account: 'admin',
    ip: '192.168.1.100',
    action: '查询',
    query: '学号:20230001',
    result_count: 1
  }
])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(3)

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
const resetPasswordDialogVisible = ref(false)
const resetPasswordFormEl = ref(null) // 用于模板引用 ElForm 实例

// 表单数据
const resetPasswordFormData = ref({
  account: '',
  newPassword: ''
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

// 通知相关
const notifications = ref([]);
const notificationCurrentPage = ref(1);
const notificationPageSize = ref(10);
const notificationTotal = ref(0);
const notificationDialogVisible = ref(false);
const notificationLoading = ref(false);
const viewNotificationDialogVisible = ref(false);
const currentNotification = ref(null);

const notificationForm = ref({
  title: '',
  content: '',
  recipientType: 'all',
  selectedUsers: []
});

const notificationRules = {
  title: [
    { required: true, message: '请输入通知标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度应在2到50个字符之间', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入通知内容', trigger: 'blur' },
    { min: 5, max: 500, message: '内容长度应在5到500个字符之间', trigger: 'blur' }
  ],
  recipientType: [
    { required: true, message: '请选择接收人类型', trigger: 'change' }
  ],
  selectedUsers: [
    { 
      required: true, 
      message: '请选择至少一个用户', 
      trigger: 'change',
      validator: (rule, value, callback) => {
        if (notificationForm.value.recipientType === 'selected' && (!value || value.length === 0)) {
          callback(new Error('请选择至少一个用户'));
        } else {
          callback();
        }
      }
    }
  ]
};

const notificationFormRef = ref(null);

const percentageFormat = (percentage) => {
  return percentage === 100 ? '完成' : `${percentage}%`;
};

const getReadStatus = (readCount, totalRecipients) => {
  const percentage = (readCount / totalRecipients) * 100;
  if (percentage === 100) return 'success';
  if (percentage > 50) return 'warning';
  return '';
};

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
    // 使用GET方法，参数通过params传递
    const response = await request.get('/api/admin/logs', {
      params: {
        page: currentPage.value,
        size: pageSize.value
      }
    })
    
    console.log('查询日志响应:', response)
    
    // 处理返回的日志数据，这是一个包含 logs 数组的对象
    if (response && response.logs && Array.isArray(response.logs)) {
      // 将查询内容从对象转为字符串以便显示
      queryLogs.value = response.logs.map(log => ({
        ...log,
        query: log.query ? JSON.stringify(log.query) : ''
      }))
      total.value = response.logs.length
    } else if (response && Array.isArray(response)) {
      // 兼容直接返回数组的情况
      queryLogs.value = response.map(log => ({
        ...log,
        query: log.query ? JSON.stringify(log.query) : ''
      }))
      total.value = response.length
    } else {
      console.error('查询日志数据格式不正确:', response)
      queryLogs.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取查询日志失败:', error)
    ElMessage.error('获取查询日志失败：' + error.message)
    queryLogs.value = []
    total.value = 0
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
    ElMessage.info('正在准备导出日志，请稍候...')
    
    // 先获取日志数据，然后手动生成表格
    const response = await request.get('/api/admin/logs', {
      params: {
        page: 1,
        size: 1000  // 获取更多日志
      }
    })
    
    let logsData = []
    
    // 处理返回的日志数据
    if (response && response.logs && Array.isArray(response.logs)) {
      logsData = response.logs
    } else if (response && Array.isArray(response)) {
      logsData = response
    } else {
      throw new Error('获取日志数据失败，数据格式不正确')
    }
    
    if (logsData.length === 0) {
      ElMessage.warning('没有日志数据可供导出')
      return
    }
    
    // 创建工作表数据
    const header = ['时间', '操作账号', 'IP地址', '操作类型', '查询内容', '结果数']
    const rows = logsData.map(log => [
      formatDate(log.timestamp),
      log.account || '',
      log.ip || '',
      formatAction(log.action) || '',
      typeof log.query === 'object' ? JSON.stringify(log.query) : (log.query || ''),
      log.result_count?.toString() || '0'
    ])
    
    // 组装CSV内容
    let csvContent = header.join(',') + '\n'
    rows.forEach(row => {
      // 确保CSV字段中的逗号和引号被正确处理
      const processedRow = row.map(field => {
        // 如果字段包含逗号、引号或换行符，将其包裹在引号中
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
          // 将字段中的引号替换为两个引号（CSV标准）
          return `"${field.replace(/"/g, '""')}"`
        }
        return field
      })
      csvContent += processedRow.join(',') + '\n'
    })
    
    // 创建 Blob 并下载
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    
    // 创建下载链接并点击
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    // 使用当前日期作为文件名
    const date = new Date().toISOString().split('T')[0]
    link.download = `系统查询日志_${date}.csv`
    link.click()
    
    // 清理 URL 对象
    window.URL.revokeObjectURL(link.href)
    
    ElMessage.success('日志导出成功')
  } catch (error) {
    console.error('导出日志失败:', error)
    ElMessage.error('导出日志失败：' + (error.message || '未知错误'))
  }
}

// 清除日志
const handleClearLogs = async () => {
  try {
    // 弹出确认框
    await ElMessageBox.confirm(
      '确定要清除所有查询日志吗？此操作不可恢复！',
      '警告',
      {
        confirmButtonText: '确定清除',
        cancelButtonText: '取消',
        type: 'warning',
        distinguishCancelAndClose: true,
        closeOnClickModal: false
      }
    )
    
    loading.value = true
    ElMessage.info('正在清除日志，请稍候...')
    
    // 调用清除日志接口
    const response = await request.post('/api/admin/clear-logs', {
      log_type: 'query' // 清除查询日志
    })
    
    // 清除成功后刷新日志列表
    await fetchQueryLogs()
    
    // 显示成功消息
    ElMessage.success('日志清除成功')
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('清除日志失败:', error)
      ElMessage.error('清除日志失败：' + (error.message || '未知错误'))
    }
  } finally {
    loading.value = false
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

// 获取通知列表
const getNotifications = async () => {
  try {
    const { page, page_size } = {
      page: notificationCurrentPage.value,
      page_size: notificationPageSize.value
    };
    
    const res = await request.get('/api/admin/notifications', { 
      params: { 
        page, 
        page_size 
      } 
    });
    if (res.success) {
      notifications.value = res.notifications || [];
      notificationTotal.value = res.total || 0;
    } else {
      console.error('获取通知列表失败:', res.message);
      ElMessage.error(res.message || '获取通知列表失败');
    }
  } catch (error) {
    console.error('获取通知列表失败:', error);
    ElMessage.error('网络错误，请稍后重试');
  }
};

// 发送通知
const handleCreateNotification = () => {
  notificationForm.value.title = '';
  notificationForm.value.content = '';
  notificationForm.value.recipientType = 'all';
  notificationForm.value.selectedUsers = [];
  notificationDialogVisible.value = true;
};

// 提交发送通知
const submitNotification = async () => {
  if (!notificationFormRef.value) return;
  
  await notificationFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    notificationLoading.value = true;
    try {
      const recipients = notificationForm.value.recipientType === 'all' 
        ? 'all' 
        : notificationForm.value.selectedUsers;
        
      if (notificationForm.value.recipientType === 'selected' && (!recipients || recipients.length === 0)) {
        ElMessage.warning('请至少选择一个接收用户');
        notificationLoading.value = false;
        return;
      }
        
      const res = await request.post('/api/admin/notifications/send', {
        title: notificationForm.value.title,
        content: notificationForm.value.content,
        recipients
      });
      
      if (res.success) {
        ElMessage.success('通知发送成功');
        notificationDialogVisible.value = false;
        getNotifications();
      } else {
        ElMessage.error(res.message || '发送通知失败');
      }
    } catch (error) {
      console.error('发送通知失败:', error);
      ElMessage.error('网络错误，请稍后重试');
    } finally {
      notificationLoading.value = false;
    }
  });
};

// 查看通知详情
const handleViewNotification = (row) => {
  if (!row) {
    console.error('通知数据不完整');
    return;
  }
  currentNotification.value = row;
  viewNotificationDialogVisible.value = true;
};

// 删除通知
const handleDeleteNotification = (row) => {
  if (!row || !row.id) {
    console.error('通知ID不存在');
    ElMessage.error('通知数据不完整，无法删除');
    return;
  }
  
  ElMessageBox.confirm(
    '确定要删除该通知吗？此操作不可恢复。',
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const res = await request.post('/api/admin/notifications/delete', {
        notification_id: row.id
      });
      
      if (res.success) {
        ElMessage.success('通知已删除');
        getNotifications();
      } else {
        ElMessage.error(res.message || '删除通知失败');
      }
    } catch (error) {
      console.error('删除通知失败:', error);
      ElMessage.error('网络错误，请稍后重试');
    }
  }).catch(() => {
    // 用户取消删除
  });
};

// 分页处理
const handleNotificationSizeChange = (size) => {
  notificationPageSize.value = size;
  getNotifications();
};

const handleNotificationCurrentChange = (page) => {
  notificationCurrentPage.value = page;
  getNotifications();
};

// 工具函数
const getRoleTagType = (role) => {
  switch (role) {
    case 'superadmin': return 'danger'
    case 'admin': return 'warning'
    case 'user': return 'success'
    default: return 'info'
  }
}

const getRoleText = (role) => {
  switch (role) {
    case 'superadmin': return '超级管理员'
    case 'admin': return '管理员'
    case 'user': return '普通用户'
    default: return role // 直接显示role属性的内容
  }
}

// 根据操作类型返回标签类型
const getActionTagType = (action) => {
  if (!action) return 'info';
  
  if (action.includes('login_success') || action.includes('success')) {
    return 'success';
  } else if (action.includes('query') || action.includes('get_')) {
    return 'info';
  } else if (action.includes('export') || action.includes('download')) {
    return 'warning';
  } else if (action.includes('delete') || action.includes('remove') || action.includes('fail') || action.includes('error')) {
    return 'danger';
  } else if (action.includes('add') || action.includes('create') || action.includes('insert') || action.includes('update')) {
    return 'primary';
  }
  
  return 'info';
}

// 格式化操作类型为友好显示
const formatAction = (action) => {
  if (!action) return '未知操作';
  
  // 登录相关
  if (action === 'login_success') return '登录成功';
  if (action === 'login_fail') return '登录失败';
  if (action === 'logout') return '登出';
  
  // 查询相关
  if (action === 'query_students') return '查询学生';
  if (action === 'get_login_records') return '查看登录记录';
  if (action === 'get_system_status') return '查看系统状态';
  if (action === 'get_admin_logs') return '查看管理日志';
  
  // 管理相关
  if (action === 'admin_get_online_users') return '查看在线用户';
  if (action === 'admin_export_logs_attempt') return '导出日志';
  if (action === 'superadmin_get_blacklist_ips') return '查看黑名单';
  if (action === 'superadmin_activate_admin') return '激活管理员';
  if (action === 'superadmin_set_custom_role') return '设置角色';
  
  // 如果没有匹配的，美化显示格式
  return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

// 初始化数据
onMounted(async () => {
  await fetchUsers() // 默认加载用户列表
  
  // 如果默认标签页不是 users，则加载对应标签页的数据
  if (activeTab.value === 'logs') {
    await fetchQueryLogs()
  } else if (activeTab.value === 'monitor') {
    await fetchSystemStatus()
    await fetchOnlineUsers()
  } else if (activeTab.value === 'notifications') {
    await getNotifications()
  }
})

// 监听标签页变化
watch(() => activeTab.value, (newTab) => {
  handleTabChange(newTab)
})
</script>

<style scoped>
.admin-container {
  padding: 25px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  position: relative;
}

.admin-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
  pointer-events: none;
}

.admin-tabs {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  padding: 30px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  z-index: 1;
}

.admin-tabs :deep(.el-tabs__content) {
  padding: 25px 0;
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
  color: #fff !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px 10px 0 0;
  box-shadow: 0 0 10px rgba(102, 126, 234, 0.3);
  transform: translateY(0);
}

:deep(.el-tabs__active-bar) {
  background: transparent; /* 移除底部激活条 */
  height: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.card-header span {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

:deep(.el-card) {
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

:deep(.el-card__header) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px 16px 0 0;
}

:deep(.el-table) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-table th) {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #495057;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f1f3f4;
}

:deep(.el-table tr:hover > td) {
  background-color: rgba(102, 126, 234, 0.05) !important;
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

:deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
}

.pagination {
  margin-top: 25px;
  display: flex;
  justify-content: flex-end;
}

.monitor-card {
  margin-bottom: 25px;
  transition: all 0.3s ease;
}

.monitor-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

:deep(.el-descriptions) {
  padding: 25px;
}

:deep(.el-progress-bar__outer) {
  border-radius: 10px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-container {
    padding: 20px 15px;
  }
  
  .admin-tabs {
    padding: 20px 15px;
    border-radius: 15px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  :deep(.el-tabs__item) {
    padding: 0 15px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .admin-container {
    padding: 15px 10px;
  }
  
  .admin-tabs {
    padding: 15px 10px;
    border-radius: 12px;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.admin-tabs {
  animation: fadeInUp 0.6s ease-out;
}

.monitor-card {
  animation: fadeInUp 0.6s ease-out;
}

.monitor-card:nth-child(2) {
  animation-delay: 0.1s;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
}

.action-btn {
  width: 100%;
  margin: 0 !important;
  justify-content: center;
}

.reset-btn {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border: none;
}

.reset-btn:hover {
  background: linear-gradient(135deg, #2980b9 0%, #2471a3 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
}

.export-btn {
  background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
  border: none;
  padding: 8px 16px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.export-btn:hover {
  background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

/* 通知样式 */
.notification-info {
  padding: 10px 0;
}

.notification-meta {
  display: flex;
  justify-content: space-between;
  color: #606266;
  font-size: 14px;
  margin-bottom: 10px;
}

.notification-recipients {
  margin-bottom: 15px;
}

.recipient-tag {
  margin-right: 5px;
  margin-bottom: 5px;
}

.notification-content {
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  min-height: 100px;
  white-space: pre-wrap;
  word-break: break-all;
}

.notification-read-status {
  margin-top: 20px;
}

.read-count {
  font-size: 12px;
  color: #909399;
  text-align: center;
  margin-top: 5px;
}
</style>
