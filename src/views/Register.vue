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
        class="invite-form"
      >
        <el-form-item label="邀请码" prop="inviteCode" class="invite-form-item">
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
  // 生成设备码 - 使用await确保异步操作完成
  await authStore.generateDeviceCode()
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
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
}

.register-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  z-index: 0;
}

.register-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-2xl);
  box-shadow: var(--shadow-2xl);
  width: 100%;
  max-width: 500px;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideUp var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.register-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
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
  margin-bottom: var(--spacing-lg);
  position: relative;
  z-index: 2;
}

.card-header h2 {
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 1px;
}

.subtitle {
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--text-lg);
  font-weight: var(--font-medium);
}

.device-code-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  padding: var(--spacing-xl);
  border-radius: var(--border-radius-xl);
  width: 100%;
  justify-content: center;
  transition: all var(--transition-normal) cubic-bezier(0.4, 0, 0.2, 1);
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
  background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
  transition: left var(--transition-slow) ease;
}

.device-code-info:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.device-code-info:hover::before {
  left: 100%;
}

.device-code-text {
  font-family: var(--font-mono);
  background: var(--bg-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-color);
  cursor: pointer;
  font-weight: var(--font-bold);
  letter-spacing: 2px;
  position: relative;
  z-index: 1;
  transition: all var(--transition-fast) ease;
}

.device-code-text:hover {
  background: var(--bg-secondary);
  transform: scale(1.02);
}

.steps {
  margin: var(--spacing-lg) 0;
  padding: 0 var(--spacing-md);
}

:deep(.el-steps) {
  margin: var(--spacing-2xl) 0 !important;
}

:deep(.el-step__head) {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  transition: all var(--transition-normal) cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

:deep(.el-step__head.is-process) {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)) !important;
  border-color: var(--primary-color) !important;
  transform: scale(1.1) !important;
  box-shadow: var(--shadow-lg) !important;
}

:deep(.el-step__head.is-wait) {
  background-color: var(--bg-secondary) !important;
  border-color: var(--border-color) !important;
}

:deep(.el-step__head.is-finish) {
  background: var(--success-color) !important;
  border-color: var(--success-color) !important;
}

:deep(.el-step__line) {
  background-color: var(--border-color) !important;
  height: 3px !important;
  border-radius: var(--border-radius-sm) !important;
  transition: all var(--transition-normal) ease !important;
}

:deep(.el-step__line.is-process) {
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color)) !important;
}

:deep(.el-step__line.is-finish) {
  background: var(--success-color) !important;
}

:deep(.el-step__title) {
  font-weight: var(--font-medium) !important;
  color: var(--text-primary) !important;
  margin-top: 8px !important;
  font-size: 16px !important;
}

:deep(.el-step__title.is-process) {
  color: var(--primary-color) !important;
  font-weight: var(--font-semibold) !important;
}

:deep(.el-step__title.is-wait) {
  color: var(--text-secondary) !important;
}

:deep(.el-step__icon-inner) {
  font-weight: 600 !important;
  font-size: 16px !important;
}

:deep(.el-step) {
  padding-right: 20px !important; /* 增加步骤之间的间距 */
}

:deep(.el-step.is-horizontal .el-step__line) {
  height: 2px !important;
  top: 20px !important;
  left: 0 !important;
  right: 0 !important;
}

.submit-btn {
  width: 100%;
  margin-bottom: var(--spacing-md);
  height: 52px;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  border: none;
  border-radius: var(--border-radius-lg);
  color: white;
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  cursor: pointer;
  transition: all var(--transition-fast) cubic-bezier(0.4, 0, 0.2, 1);
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
  transition: left var(--transition-slow) ease;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-dark), var(--secondary-dark));
  transform: translateY(-3px);
  box-shadow: var(--shadow-xl);
}

.submit-btn:hover:not(:disabled)::before {
  left: 100%;
}

.submit-btn:disabled {
  background: var(--neutral-400);
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
  height: 48px;
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-semibold);
  transition: all var(--transition-fast) ease;
  border: 2px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.back-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--primary-color);
  background: var(--bg-primary);
}

.form-footer {
  text-align: center;
  margin-top: var(--spacing-xl);
  font-size: var(--text-base);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}

.login-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: var(--font-bold);
  transition: all var(--transition-fast) ease;
  position: relative;
}

.login-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
  transition: width var(--transition-fast) ease;
}

.login-link:hover {
  color: var(--primary-dark);
  transform: translateY(-1px);
}

.login-link:hover::after {
  width: 100%;
}

/* Element Plus 样式覆盖 */
:deep(.el-form-item__label) {
  color: var(--text-primary) !important;
  font-weight: var(--font-medium) !important;
  font-size: var(--text-sm) !important;
}

:deep(.el-input__wrapper) {
  border-radius: var(--border-radius-lg) !important;
  box-shadow: var(--shadow-sm) !important;
  transition: all var(--transition-fast) cubic-bezier(0.4, 0, 0.2, 1) !important;
  border: 2px solid var(--border-color) !important;
  background: var(--bg-primary) !important;
}

:deep(.el-input__wrapper:hover) {
  border-color: var(--neutral-300) !important;
  box-shadow: var(--shadow-md) !important;
  transform: translateY(-1px) !important;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
  transform: translateY(-1px) !important;
}

:deep(.el-input__inner) {
  font-size: var(--text-base) !important;
  padding: var(--spacing-md) var(--spacing-lg) !important;
  font-weight: var(--font-medium) !important;
  color: var(--text-primary) !important;
}

:deep(.el-form-item__error) {
  font-size: var(--text-xs) !important;
  margin-top: var(--spacing-xs) !important;
  font-weight: var(--font-semibold) !important;
  color: var(--error-color) !important;
}

:deep(.el-alert) {
  border-radius: var(--border-radius-lg) !important;
  border: none !important;
  background: var(--bg-secondary) !important;
}

:deep(.el-alert__content) {
  color: var(--text-secondary) !important;
  font-size: var(--text-xs) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .register-container {
    padding: var(--spacing-lg) var(--spacing-md);
  }
  
  .register-card {
    max-width: 100%;
    border-radius: var(--border-radius-xl);
    margin: 0 var(--spacing-sm);
  }
  
  .card-header h2 {
    font-size: var(--text-2xl);
  }
  
  .device-code-info {
    padding: var(--spacing-lg);
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .device-code-text {
    word-break: break-all;
  }
  
  :deep(.el-steps) {
    margin: var(--spacing-lg) 0 !important;
  }
  
  :deep(.el-step__head) {
    width: 32px !important;
    height: 32px !important;
  }
}

@media (max-width: 480px) {
  .register-container {
    padding: var(--spacing-md) var(--spacing-sm);
  }
  
  .register-card {
    border-radius: var(--border-radius-lg);
    margin: 0;
  }
  
  .card-header h2 {
    font-size: var(--text-xl);
  }
  
  .device-code-info {
    padding: var(--spacing-md);
  }
  
  .submit-btn {
    height: 48px;
    font-size: var(--text-base);
  }
  
  .back-btn {
    height: 44px;
  }
  
  :deep(.el-input__inner) {
    padding: var(--spacing-sm) var(--spacing-md) !important;
  }
}

/* 高对比度模式支持 */
@media (prefers-contrast: high) {
  .register-card {
    border: 2px solid var(--text-primary);
  }
  
  .card-header h2 {
    -webkit-text-fill-color: var(--text-primary);
  }
  
  .device-code-info {
    border: 3px solid var(--text-primary);
  }
}

/* 减少动画模式支持 */
@media (prefers-reduced-motion: reduce) {
  .register-card {
    animation: none;
  }
  
  .submit-btn::before,
  .device-code-info::before {
    display: none;
  }
  
  .submit-btn:hover,
  .back-btn:hover,
  .login-link:hover,
  .device-code-info:hover {
    transform: none;
  }
  
  :deep(.el-step__head) {
    transition: none !important;
  }
}

/* 打印样式 */
@media print {
  .register-container {
    background: white;
    padding: 0;
  }
  
  .register-card {
    box-shadow: none;
    border: 1px solid #000;
  }
  
  .submit-btn,
  .back-btn {
    display: none;
  }
}

.invite-form {
  margin-bottom: var(--spacing-xl);
}

.invite-form-item {
  margin-bottom: var(--spacing-2xl);
}

/* 确保错误提示有足够的空间显示 */
:deep(.el-form-item__error) {
  position: absolute;
  margin-top: 4px;
  font-size: var(--text-xs) !important;
  font-weight: var(--font-semibold) !important;
  color: var(--error-color) !important;
  z-index: 2;
}

:deep(.el-steps) {
  margin: var(--spacing-2xl) 0 !important;
}
</style>