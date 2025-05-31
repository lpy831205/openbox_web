<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <!-- 个人信息卡片 -->
      <el-col :span="12">
        <el-card class="profile-card">
          <template #header>
            <div class="card-header">
              <span>个人信息</span>
              <el-button type="primary" @click="handleEdit">
                <el-icon><Edit /></el-icon> 修改密码
              </el-button>
            </div>
          </template>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="账号">
              {{ userInfo.account }}
            </el-descriptions-item>
            <el-descriptions-item label="角色">
              {{ userInfo.role === 'admin' ? '管理员' : '普通用户' }}
            </el-descriptions-item>
            <el-descriptions-item label="设备码">
              {{ deviceCode }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ formatDate(userInfo.registerTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <!-- 登录记录卡片 -->
      <el-col :span="12">
        <el-card class="login-record-card">
          <template #header>
            <div class="card-header">
              <span>登录记录</span>
            </div>
          </template>

          <el-timeline>
            <el-timeline-item
              v-for="(record, index) in loginRecords"
              :key="index"
              :timestamp="formatDate(record.time)"
              :type="record.status === 'success' ? 'success' : 'danger'"
            >
              {{ record.ip }}
              <el-tag
                :type="record.status === 'success' ? 'success' : 'danger'"
                size="small"
                class="ml-2"
              >
                {{ record.status === 'success' ? '登录成功' : '登录失败' }}
              </el-tag>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <!-- 修改密码对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="修改密码"
      width="400px"
      destroy-on-close
    >
      <el-form
        ref="passwordFormEl"
        :model="passwordForm"
        :rules="passwordRules"
        label-position="top"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleUpdatePassword" :loading="loading">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { Edit } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import request from '../utils/request'

const authStore = useAuthStore()
const userInfo = computed(() => authStore.userInfo)
const deviceCode = computed(() => authStore.deviceCode)

// 登录记录
const loginRecords = ref([])

// 修改密码相关
const dialogVisible = ref(false)
const loading = ref(false)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordFormEl = ref(null) // 用于模板引用 ElForm 实例

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/,
      message: '密码必须包含大小写字母和数字',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 获取登录记录
const fetchLoginRecords = async () => {
  try {
    // 使用post方法替代get方法，确保请求体被加密
    // 即使没有参数，也使用post方法以确保请求头中的认证信息被加密传输
    const response = await request.post('/api/auth/login-records')
    // 响应已在request.js的拦截器中解密
    loginRecords.value = response // 服务器直接返回数组，而不是包含在对象中
  } catch (error) {
    ElMessage.error('获取登录记录失败：' + error.message)
  }
}

// 打开修改密码对话框
const handleEdit = () => {
  // 重置表单数据对象，确保字段存在且为空
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  dialogVisible.value = true; // 显示对话框

  // DOM 更新后（对话框和表单已渲染），重置表单校验状态
  nextTick(() => {
    if (passwordFormEl.value) {
      passwordFormEl.value.resetFields();
    }
  });
};

// 修改密码
const handleUpdatePassword = async () => {
  if (!passwordFormEl.value) return; // 防御性检查，确保 el-form 实例存在

  try {
    await passwordFormEl.value.validate(); // 首先校验表单
    
    loading.value = true;
    await request.post('/api/auth/update-password', {
      old_password: passwordForm.value.oldPassword,
      new_password: passwordForm.value.newPassword
    });
    ElMessage.success('密码修改成功，请重新登录');
    dialogVisible.value = false; // 开始关闭对话框

    // 等待对话框关闭动画完成或DOM更新后再执行logout
    await nextTick(); // 确保DOM更新（对话框关闭）已处理
    authStore.logout(); // 然后执行登出操作
  } catch (errorOrValidationError) {
    // 如果是 API 请求错误，它通常有一个 message 属性
    // 如果是表单校验错误 (validate promise reject), Element Plus 的 Form 组件通常会自动显示校验错误信息
    if (errorOrValidationError && errorOrValidationError.message) {
      ElMessage.error('修改密码失败：' + errorOrValidationError.message);
    } else {
      // 表单校验失败时，validate() 会 reject，但错误信息已由组件显示
      // 可以在控制台记录，以便调试
      console.log('表单校验失败或API请求被取消/无消息错误:', errorOrValidationError);
    }
  } finally {
    loading.value = false;
  }
};

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

onMounted(() => {
  fetchLoginRecords()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card,
.login-record-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.el-descriptions) {
  padding: 20px;
}

.ml-2 {
  margin-left: 8px;
}

:deep(.el-timeline) {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}
</style>