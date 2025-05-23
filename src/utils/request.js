import axios from 'axios'
import CryptoJS from 'crypto-js'
// 不再直接导入cryptoService，改为从auth.js获取

// 避免循环依赖，改为动态导入
let authStore = null

// 创建axios实例
const service = axios.create({
  baseURL: 'http://192.168.110.38:5000',
  timeout: 15000
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
        console.error('获取公钥失败:', error)
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
      const sortedParams = Object.entries(config.params).sort()
      requestDataForSig = sortedParams.map(([k, v]) => `${k}=${v}`).join('&')
    }
    
    const signature = cryptoService.generateSignature(
      config.url,
      config.method.toUpperCase(),
      requestDataForSig,
      aesKey.toString(CryptoJS.enc.Base64),
      nonce,
      timestamp
    )

    // 设置安全头 - 无论是GET还是其他请求都需要
    config.headers['X-Encrypted-Key'] = encryptedKey
    config.headers['X-Signature'] = signature
    config.headers['X-Nonce'] = nonce
    config.headers['X-Timestamp'] = timestamp
    config.headers['X-Client-IP'] = '127.0.0.1' // 本地开发测试用

    // 设置认证头
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    console.error('请求错误:', error)
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
        console.error('响应解密失败:', error)
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
            console.error('刷新token失败:', refreshError)
            // 刷新失败，清除token并跳转到登录页
            const auth = await getAuthStore()
            auth.logout()
          }
          break
        case 403:
          console.error('没有权限访问该资源')
          break
        case 500:
          console.error('服务器错误')
          break
        default:
          console.error(`未知错误: ${error.response.status}`)
      }
    } else if (error.request) {
      console.error('未收到响应')
    } else {
      console.error('请求配置错误'+error)
    }

    return Promise.reject(error)
  }
)

export default service