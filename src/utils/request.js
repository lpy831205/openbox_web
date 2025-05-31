import axios from 'axios'
import CryptoJS from 'crypto-js'
// 不再直接导入cryptoService，改为从auth.js获取

// 避免循环依赖，改为动态导入
let authStore = null

// 创建axios实例
const service = axios.create({
  // 使用相对路径，避免硬编码IP地址
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// 获取authStore的函数，避免循环依赖
const getAuthStore = async () => {
  if (!authStore) {
    // 使用动态导入替代require
    const authModule = await import('../stores/auth')
    const { useAuthStore } = authModule
    authStore = useAuthStore()
  }
  return authStore
}

// 获取客户端IP（使用ips.im API获取真实公网IP）
const getClientIP = async () => {
  try {
    // 使用ips.im API获取真实公网IP
    const response = await axios.get('https://ips.im/api/json')
    return response.data.ip
  } catch (error) {
    console.error('获取公网IP失败:', error)
    return '127.0.0.1' // 失败时返回本地IP
  }
}

// 请求拦截器
service.interceptors.request.use(
  async (config) => {
    // 对于公钥请求，不需要加密和认证
    if (config.url === '/api/auth/public-key') {
      return config
    }
    
    const auth = await getAuthStore()
    const { cryptoService, encryptor } = auth
    // 确保公钥已获取
    if (!encryptor.getPublicKey()) {
      try {
        const success = await auth.fetchPublicKey()
        if (!success) {
          return Promise.reject(new Error('获取服务器公钥失败'))
        }
      } catch (error) {
        return Promise.reject(new Error('获取服务器公钥失败'))
      }
    }

    const token = auth.token

    // 生成加密所需的参数
    const nonce = cryptoService.generateNonce()
    const timestamp = Date.now().toString()
    const aesKey = cryptoService.generateAESKey()

    // 存储AES密钥到请求配置中，以便在响应拦截器中使用
    config._aesKey = aesKey

    // 确保公钥已经设置好了
    if (!encryptor.getPublicKey()) {
      return Promise.reject(new Error('公钥未设置'))
    }
    
    // 加密密钥
    const encryptedKey = cryptoService.encryptKey(
      aesKey,
      auth.publicKey // 使用已获取的公钥
    )
    
    // 处理请求数据
    let requestData = ''
    if (config.data) {
      const encrypted = cryptoService.encryptAES(config.data)
      // 设置加密后的请求体
      requestData = encrypted.combined.toString(CryptoJS.enc.Base64)
      config.data = requestData
    }
    
    // 生成签名 - 对于GET请求，将查询参数转换为字符串并加入签名
    let requestDataForSig = requestData
    if (config.method.toUpperCase() === 'GET' && config.params) {
      // 按照后端逻辑，对GET请求的参数进行排序并拼接
      const sortedParams = Object.entries(config.params).sort((a, b) => a[0].localeCompare(b[0]))
      requestDataForSig = sortedParams.map(([k, v]) => `${k}=${v}`).join('&')
      console.log('GET请求参数字符串:', requestDataForSig)
    }
    
    const signature = cryptoService.generateSignature(
      config.url,
      config.method.toUpperCase(),
      requestDataForSig,
      aesKey.toString(CryptoJS.enc.Base64),
      nonce,
      timestamp
    )

    console.log('签名参数:', {
      path: config.url,
      method: config.method.toUpperCase(),
      requestData: requestDataForSig,
      aesKey: aesKey.toString(CryptoJS.enc.Base64),
      nonce: nonce,
      timestamp: timestamp,
      signature: signature
    })

    // 设置安全头 - 无论是GET还是其他请求都需要
    config.headers['X-Encrypted-Key'] = encryptedKey
    config.headers['X-Signature'] = signature
    config.headers['X-Nonce'] = nonce
    config.headers['X-Timestamp'] = timestamp
    config.headers['X-Client-IP'] = await getClientIP()

    // 设置认证头
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  async (response) => {
    // 如果是公钥请求，直接返回原始数据，不需要解密
    if (response.config.url === '/api/auth/public-key') {
      return response;
    }

    // 如果响应包含加密数据，进行解密
    if (response.data && response.data.data) {
      try {
        const auth = await getAuthStore()
        const { cryptoService } = auth
        
        // 获取请求时使用的AES密钥（从请求配置中获取）
        const requestConfig = response.config
        const aesKey = requestConfig._aesKey // 我们需要在请求拦截器中存储这个值

        // 解析加密数据
        const encryptedData = CryptoJS.enc.Base64.parse(response.data.data)
        const iv = encryptedData.clone()
        iv.sigBytes = 16
        iv.clamp()

        const ciphertext = encryptedData.clone()
        ciphertext.words.splice(0, 4) // 移除IV
        ciphertext.sigBytes -= 16

        // 使用请求时的AES密钥解密
        const decryptedData = cryptoService.decryptAES(ciphertext, aesKey, iv)
        // 返回解密后的数据，而不是再次解密
        return decryptedData
      } catch (error) {
        throw new Error('响应数据解密失败')
      }
    }
    return response.data
  },
  async (error) => {
    // 处理错误响应
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 尝试刷新token
          try {
            const auth = await getAuthStore()
            // 检查是否为token过期错误
            if (error.response.data && error.response.data.message && 
                error.response.data.message.includes('Token expired')) {
              // 尝试刷新token
              const refreshSuccess = await auth.refreshToken()
              if (refreshSuccess) {
                // 刷新成功，重试原请求
                const config = error.config
                // 确保使用新的token
                config.headers['Authorization'] = `Bearer ${auth.token.value}`
                return service(config)
              }
            }
            // 如果不是token过期或刷新失败，则登出
            auth.logout()
          } catch (refreshError) {
            // 刷新失败，清除token并跳转到登录页
            const auth = await getAuthStore()
            auth.logout()
          }
          break
        case 403:
          // 权限错误处理
          break
        case 500:
          // 服务器错误处理
          break
        default:
          // 其他错误处理
      }
    }

    return Promise.reject(error)
  }
)

export default service