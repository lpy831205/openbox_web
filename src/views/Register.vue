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
        <div class="password-strength-tip">
          <el-alert
            title="密码必须包含大小写字母和数字，且长度至少为6位"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
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

// 表单引用
const inviteForm = ref(null)
const registerForm = ref(null)

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
  // 先进行表单验证
  if (!inviteForm.value) {
    ElMessage.error('表单引用错误')
    return
  }
  
  try {
    // 使用Element Plus的表单验证
    const valid = await inviteForm.value.validate()
    if (!valid) {
      return // 验证失败，直接返回，不显示错误消息
    }
  } catch (error) {
    // 验证失败，直接返回，不发送请求
    return
  }
  
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
  // 先进行表单验证
  if (!registerForm.value) {
    ElMessage.error('表单引用错误')
    return
  }
  
  try {
    // 使用Element Plus的表单验证
    const valid = await registerForm.value.validate()
    if (!valid) {
      return // 验证失败，直接返回，不显示错误消息
    }
  } catch (error) {
    // 验证失败，直接返回，不发送请求
    return
  }
  
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
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 25px;
  position: relative;
}

.register-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="%23ffffff" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
  pointer-events: none;
}

.register-card {
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 480px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: slideUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.password-strength-tip {
  margin-top: 8px;
  font-size: 12px;
}

.card-header {
  text-align: center;
  margin-bottom: 20px;
}

.card-header h2 {
  color: #333;
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 3px solid #dee2e6;
  padding: 25px;
  border-radius: 16px;
  width: 100%;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.device-code-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.1), transparent);
  transition: left 0.6s ease;
}

.device-code-info:hover {
  border-color: #667eea;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.device-code-info:hover::before {
  left: 100%;
}

.device-code-text {
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Courier New', monospace;
  background-color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
  font-weight: 800;
  letter-spacing: 2px;
  position: relative;
  z-index: 1;
}

.steps {
  margin: 20px 0;
}

.submit-btn {
  width: 100%;
  margin-bottom: 10px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 14px;
  color: white;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;
  overflow: hidden;
}

.submit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.5);
}

.submit-btn:hover:not(:disabled)::before {
  left: 100%;
}

.submit-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  animation: pulse 1.5s ease-in-out infinite;
}

.submit-btn:active:not(:disabled) {
  transform: translateY(-1px);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.back-btn {
  width: 100%;
  height: 45px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.form-footer {
  text-align: center;
  margin-top: 30px;
  font-size: 15px;
  color: #606266;
  font-weight: 500;
}

.login-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 700;
  transition: all 0.3s ease;
  position: relative;
}

.login-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.login-link:hover {
  color: #5a6fd8;
}

.login-link:hover::after {
  width: 100%;
}

/* Element Plus 样式覆盖 */
:deep(.el-input__wrapper) {
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid #e4e7ed;
  background-color: rgba(255, 255, 255, 0.9);
}

:deep(.el-input__wrapper:hover) {
  border-color: #c0c4cc;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

:deep(.el-input__inner) {
  font-size: 16px;
  padding: 14px 18px;
  font-weight: 500;
}

:deep(.el-form-item__error) {
  font-size: 13px;
  margin-top: 6px;
  font-weight: 600;
}

:deep(.el-steps) {
  margin: 35px 0;
}

:deep(.el-step__head) {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-step__head.is-process) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

:deep(.el-step__line) {
  background-color: #e4e7ed;
  height: 3px;
  border-radius: 2px;
  transition: all 0.4s ease;
}

:deep(.el-step__line.is-process) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-container {
    padding: 20px 15px;
  }
  
  .register-card {
    max-width: 100%;
    border-radius: 20px;
  }
  
  .card-header h2 {
    font-size: 28px;
  }
  
  .device-code-info {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .register-container {
    padding: 15px 10px;
  }
  
  .register-card {
    border-radius: 16px;
  }
  
  .card-header h2 {
    font-size: 24px;
  }
  
  .device-code-info {
    padding: 18px 15px;
  }
  
  .submit-btn {
    height: 45px;
    font-size: 15px;
  }
}
</style>