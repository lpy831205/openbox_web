<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <h2>注册</h2>
          <div class="device-code-info">
            <span>设备码:</span>
            <el-tooltip
              class="box-item"
              effect="dark"
              :content="authStore.deviceCode || '加载中...'"
              placement="top"
            >
              <span class="device-code-text">{{ authStore.deviceCode ? `${authStore.deviceCode.slice(0, 8)}...${authStore.deviceCode.slice(-8)}` : '加载中...' }}</span>
            </el-tooltip>
            <el-button link @click="copyDeviceCode" :disabled="!authStore.deviceCode">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </div>
        </div>
      </template>

      <el-steps :active="currentStep" finish-status="success" class="steps">
        <el-step title="验证邀请码" />
        <el-step title="创建账号" />
      </el-steps>

      <!-- 邀请码验证表单 -->
      <el-form
        v-if="currentStep === 0"
        ref="inviteForm"
        :model="inviteData"
        :rules="inviteRules"
        label-position="top"
        @submit.prevent="handleVerifyInvite"
      >
        <el-form-item label="邀请码" prop="inviteCode">
          <el-input
            v-model="inviteData.inviteCode"
            placeholder="请输入邀请码"
            :prefix-icon="Key"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            class="submit-btn"
          >
            验证
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 注册表单 -->
      <el-form
        v-else
        ref="registerForm"
        :model="registerData"
        :rules="registerRules"
        label-position="top"
        @submit.prevent="handleRegister"
      >
        <el-form-item label="账号" prop="account">
          <el-input
            v-model="registerData.account"
            placeholder="请输入账号"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerData.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerData.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            :loading="loading"
            class="submit-btn"
          >
            注册
          </el-button>
          <el-button @click="currentStep = 0" class="back-btn">
            返回
          </el-button>
        </el-form-item>
      </el-form>

      <div class="form-footer">
        <router-link to="/login" class="login-link">
          已有账号？立即登录
        </router-link>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Key, CopyDocument } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const currentStep = ref(0)

const inviteData = ref({
  inviteCode: ''
})

const registerData = ref({
  account: '',
  password: '',
  confirmPassword: ''
})

// 邀请码验证规则
const inviteRules = {
  inviteCode: [
    { required: true, message: '请输入邀请码', trigger: 'blur' },
    { min: 10, message: '邀请码格式不正确', trigger: 'blur' }
  ]
}

// 注册表单验证规则
const registerRules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/,
      message: '密码必须包含大小写字母和数字',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerData.value.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

onMounted(async () => {
  // 获取服务器公钥
  await authStore.fetchPublicKey()
  // 生成设备码
  authStore.generateDeviceCode()
})

// 验证邀请码
const handleVerifyInvite = async () => {
  try {
    loading.value = true
    await authStore.verifyInviteCode(inviteData.value.inviteCode)
    ElMessage.success('邀请码验证成功')
    currentStep.value = 1
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

// 注册账号
const handleRegister = async () => {
  try {
    loading.value = true
    await authStore.register({
      account: registerData.value.account,
      password: registerData.value.password,
      inviteCode: inviteData.value.inviteCode
    })
    ElMessage.success('注册成功，请登录')
    router.push('/login')
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loading.value = false
  }
}

// 复制设备码
const copyDeviceCode = async () => {
  if (authStore.deviceCode) {
    try {
      // 优先使用Clipboard API
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(authStore.deviceCode)
        ElMessage.success('设备码已复制到剪贴板')
      } else {
        // 降级方案：使用document.execCommand
        const textarea = document.createElement('textarea')
        textarea.value = authStore.deviceCode
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        ElMessage.success('设备码已复制到剪贴板')
      }
    } catch (error) {
      ElMessage.error('复制失败，请手动复制')
      console.error('复制设备码失败:', error)
    }
  }
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  box-sizing: border-box;
}

.register-content {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.register-card {
  width: 100%;
  max-width: 450px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.5s ease-out;
  background-color: rgba(255, 255, 255, 0.95);
}

.card-header {
  text-align: center;
  margin-bottom: 20px;
}

.card-header h2 {
  color: #333;
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
}

.subtitle {
  color: #666;
  margin: 0 0 16px 0;
  font-size: 18px;
}

.device-code-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #606266;
  background-color: #f8f9fa;
  padding: 8px 12px;
  border-radius: 4px;
  width: 100%;
  justify-content: center;
}

.device-code-text {
  font-family: monospace;
  background-color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
}

.steps {
  margin: 20px 0;
}

.submit-btn {
  width: 100%;
  margin-bottom: 10px;
}

.back-btn {
  width: 100%;
}

.form-footer {
  text-align: center;
  margin-top: 20px;
}

.login-link {
  color: var(--el-color-primary);
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}
</style>