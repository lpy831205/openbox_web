import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { SHA3 } from 'crypto-js'
import { JSEncrypt } from 'jsencrypt'
import { CryptoService } from '../utils/crypto';
import service from '../utils/request';

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const token = ref(localStorage.getItem('token') || '')
  const deviceCode = ref(localStorage.getItem('deviceCode') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
  // 从localStorage获取公钥，确保页面刷新后仍能使用
  const publicKey = ref(localStorage.getItem('publicKey') || '')
  
  // 创建全局唯一的JSEncrypt实例
  const encryptor = new JSEncrypt()
  // 创建全局唯一的CryptoService实例
  const cryptoService = new CryptoService(encryptor)
  
  // 如果已有公钥，初始化时设置到encryptor
  if (publicKey.value) {
    encryptor.setPublicKey(publicKey.value)
  }

  const isAuthenticated = computed(() => !!token.value)

  // 生成设备码
  const generateDeviceCode = () => {
    if (!deviceCode.value) {
      const browserInfo = navigator.userAgent + navigator.language + screen.width + screen.height
      deviceCode.value = SHA3(browserInfo, { outputLength: 512 }).toString().toLowerCase()
      localStorage.setItem('deviceCode', deviceCode.value)
    }
    return deviceCode.value
  }

  // 获取服务器公钥
  const fetchPublicKey = async () => {
    try {
      // 使用从request.js导入的service实例，以统一baseURL
      const response = await service.get('/api/auth/public-key')
      
      if (response.data && response.data.public_key) {
        publicKey.value = response.data.public_key
        // 将公钥保存到localStorage，确保持久化
        localStorage.setItem('publicKey', publicKey.value)
        encryptor.setPublicKey(publicKey.value)
        console.log('公钥获取成功')
        return true
      } else {
        console.error('获取公钥失败: 响应格式不正确', response.data)
        return false
      }
    } catch (error) {
      console.error('获取公钥失败:', error)
      return false
    }
  }

  // 验证邀请码
  const verifyInviteCode = async (inviteCode) => {
    try {
      // 确保公钥已获取并正确设置
      if (!publicKey.value || !encryptor.getPublicKey()) {
        const success = await fetchPublicKey()
        if (!success) {
          throw new Error('获取服务器公钥失败')
        }
        // 确保公钥设置到encryptor
        encryptor.setPublicKey(publicKey.value)
      }
      
      const device = generateDeviceCode()
      // 移除敏感信息的日志输出
      const response = await service.post('/api/verify_invite', {
        device_code: device,
        invite_code: inviteCode
      })
      return response.data
    } catch (error) {
      console.error('邀请码验证失败:', error.response?.status || error.message) // 不输出完整错误对象
      throw new Error(error.response?.data?.message || '邀请码验证失败')
    }
  }

  // 用户注册
  const register = async ({ account, password, inviteCode }) => {
    try {
      const device = generateDeviceCode()
      const response = await service.post('/api/auth/register', {
        account,
        password,
        device_code: device,
        invite_code: inviteCode
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || '注册失败')
    }
  }

  // 用户登录
  const login = async ({ account, password }) => {
    try {
      const device = generateDeviceCode()
      const response = await service.post('/api/auth/login', {
        account,
        password,
        device_code: device
      })
      
      // 响应已经在request.js的响应拦截器中被解密
      // 解密后的数据结构应该包含token、expiry和user
      const { token: newToken, expiry, user } = response
      token.value = newToken
      userInfo.value = user
      
      localStorage.setItem('token', newToken)
      localStorage.setItem('userInfo', JSON.stringify(user))
      
      return true
    } catch (error) {
      console.error('登录失败:', error)
      throw new Error(error.response?.data?.message || '登录失败')
    }
  }

  // 退出登录
  const logout = () => {
    token.value = ''
    userInfo.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    router.push('/login')
  }

    // 刷新token
  const refreshToken = async () => {
    try {
      const response = await service.post('/api/auth/refresh_token')
      
      // 响应已经在request.js的响应拦截器中被解密
      const { token: newToken, expiry, user } = response
      token.value = newToken
      userInfo.value = user
      
      localStorage.setItem('token', newToken)
      localStorage.setItem('userInfo', JSON.stringify(user))
      
      return true
    } catch (error) {
      console.error('刷新token失败:', error)
      throw new Error(error.response?.data?.message || 'token刷新失败')
    }
  }

  // 更新密钥
  const updateKey = async () => {
    try {
      // 先获取新的公钥
      await fetchPublicKey()
      // 调用更新密钥接口
      const response = await service.post('/api/auth/updatekey')
      return response
    } catch (error) {
      console.error('更新密钥失败:', error)
      throw new Error(error.response?.data?.message || '更新密钥失败')
    }
  }

  return {
    token,
    deviceCode,
    userInfo,
    publicKey,
    cryptoService,
    encryptor,
    isAuthenticated,
    generateDeviceCode,
    fetchPublicKey,
    verifyInviteCode,
    register,
    login,
    logout,
    refreshToken,
    updateKey
  }
})