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
  
  // 创建全局唯一的JSEncrypt实例，设置密钥大小为3072位
  const encryptor = new JSEncrypt({ default_key_size: 3072 })
  // 创建全局唯一的CryptoService实例
  const cryptoService = new CryptoService(encryptor)
  
  // 如果已有公钥，初始化时设置到encryptor
  if (publicKey.value) {
    encryptor.setPublicKey(publicKey.value)
  }

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin' || userInfo.value?.role === 'superadmin')
  const isSuperAdmin = computed(() => userInfo.value?.role === 'superadmin')

  // 安全地保存数据到localStorage
  const secureStore = (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      // 如果localStorage不可用（例如隐私模式），则静默失败
      console.warn('无法保存到localStorage，可能处于隐私模式')
    }
  }

  // 生成设备码
  const generateDeviceCode = () => {
    if (!deviceCode.value) {
      // 增加更多设备唯一性标识
      const browserInfo = navigator.userAgent + 
                          navigator.language + 
                          screen.width + 
                          screen.height + 
                          navigator.hardwareConcurrency + 
                          navigator.deviceMemory + 
                          navigator.platform +
                          new Date().getTimezoneOffset();
      
      deviceCode.value = SHA3(browserInfo, { outputLength: 512 }).toString().toLowerCase()
      secureStore('deviceCode', deviceCode.value)
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
        secureStore('publicKey', publicKey.value)
        encryptor.setPublicKey(publicKey.value)
        return true
      } else {
        return false
      }
    } catch (error) {
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
      const response = await service.post('/api/verify_invite', {
        device_code: device,
        invite_code: inviteCode
      })
      return response.data
    } catch (error) {
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
      
      secureStore('token', newToken)
      secureStore('userInfo', JSON.stringify(user))
      
      return true
    } catch (error) {
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
      
      secureStore('token', newToken)
      secureStore('userInfo', JSON.stringify(user))
      
      return true
    } catch (error) {
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
    isAdmin,
    isSuperAdmin,
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