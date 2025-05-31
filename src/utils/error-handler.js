import { ElMessage, ElNotification } from 'element-plus'

/**
 * 错误处理工具类
 * 提供统一的错误处理方法，包括错误日志记录、用户提示等
 */
class ErrorHandler {
  constructor() {
    this.errorHistory = []
    this.maxHistoryLength = 50
    
    // 注册全局未捕获错误处理
    window.addEventListener('error', this.handleGlobalError.bind(this))
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this))
  }
  
  /**
   * 处理API错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文
   * @param {boolean} showNotification - 是否显示通知
   * @returns {string} 格式化后的错误消息
   */
  handleApiError(error, context = '', showNotification = true) {
    let errorMessage = '未知错误'
    let statusCode = null
    
    if (error.response) {
      // 服务器返回错误响应
      statusCode = error.response.status
      errorMessage = error.response.data?.message || this.getStatusCodeMessage(statusCode)
    } else if (error.request) {
      // 请求已发送但未收到响应
      errorMessage = '服务器无响应，请检查网络连接'
    } else {
      // 请求配置错误
      errorMessage = error.message || '请求配置错误'
    }
    
    // 记录错误
    this.logError({
      type: 'API',
      context,
      message: errorMessage,
      statusCode,
      timestamp: new Date().toISOString(),
      details: error
    })
    
    // 显示通知
    if (showNotification) {
      this.showErrorNotification(errorMessage, context)
    }
    
    return errorMessage
  }
  
  /**
   * 处理全局未捕获错误
   * @param {ErrorEvent} event - 错误事件
   */
  handleGlobalError(event) {
    const { message, filename, lineno, colno, error } = event
    
    this.logError({
      type: 'GLOBAL',
      message,
      source: `${filename}:${lineno}:${colno}`,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    })
    
    // 在生产环境中，可以将错误发送到服务器进行记录
    if (import.meta.env.PROD) {
      // TODO: 实现错误上报功能
    }
  }
  
  /**
   * 处理未处理的Promise拒绝
   * @param {PromiseRejectionEvent} event - Promise拒绝事件
   */
  handleUnhandledRejection(event) {
    const { reason } = event
    
    this.logError({
      type: 'PROMISE',
      message: reason?.message || String(reason),
      stack: reason?.stack,
      timestamp: new Date().toISOString()
    })
  }
  
  /**
   * 记录错误
   * @param {Object} errorInfo - 错误信息对象
   */
  logError(errorInfo) {
    console.error('[ERROR]', errorInfo)
    
    // 添加到历史记录
    this.errorHistory.unshift(errorInfo)
    
    // 限制历史记录长度
    if (this.errorHistory.length > this.maxHistoryLength) {
      this.errorHistory.pop()
    }
    
    // 存储到localStorage（可选）
    try {
      const storedErrors = JSON.parse(localStorage.getItem('error_logs') || '[]')
      storedErrors.unshift(errorInfo)
      
      // 限制存储的错误数量
      while (storedErrors.length > this.maxHistoryLength) {
        storedErrors.pop()
      }
      
      localStorage.setItem('error_logs', JSON.stringify(storedErrors))
    } catch (e) {
      // localStorage可能不可用（隐私模式）
    }
  }
  
  /**
   * 显示错误通知
   * @param {string} message - 错误消息
   * @param {string} context - 错误上下文
   */
  showErrorNotification(message, context = '') {
    const title = context ? `错误 (${context})` : '错误'
    
    ElMessage.error({
      message: message,
      duration: 5000,
      showClose: true
    })
  }
  
  /**
   * 显示严重错误通知
   * @param {string} message - 错误消息
   * @param {string} context - 错误上下文
   */
  showCriticalError(message, context = '') {
    const title = context ? `严重错误 (${context})` : '严重错误'
    
    ElNotification({
      title,
      message,
      type: 'error',
      duration: 0,
      showClose: true
    })
  }
  
  /**
   * 获取HTTP状态码对应的消息
   * @param {number} statusCode - HTTP状态码
   * @returns {string} 状态码对应的消息
   */
  getStatusCodeMessage(statusCode) {
    const statusMessages = {
      400: '请求参数错误',
      401: '未授权，请重新登录',
      403: '拒绝访问',
      404: '请求的资源不存在',
      408: '请求超时',
      409: '数据冲突',
      429: '请求过于频繁',
      500: '服务器内部错误',
      501: '服务未实现',
      502: '网关错误',
      503: '服务不可用',
      504: '网关超时'
    }
    
    return statusMessages[statusCode] || `未知错误 (${statusCode})`
  }
  
  /**
   * 获取错误历史
   * @returns {Array} 错误历史记录
   */
  getErrorHistory() {
    return [...this.errorHistory]
  }
  
  /**
   * 清除错误历史
   */
  clearErrorHistory() {
    this.errorHistory = []
    try {
      localStorage.removeItem('error_logs')
    } catch (e) {
      // localStorage可能不可用
    }
  }
}

// 导出单例
export const errorHandler = new ErrorHandler()

// 导出Vue插件
export default {
  install(app) {
    app.config.errorHandler = (err, vm, info) => {
      errorHandler.logError({
        type: 'VUE',
        message: err.message,
        stack: err.stack,
        info,
        component: vm?.$options?.name,
        timestamp: new Date().toISOString()
      })
    }
    
    // 提供全局属性
    app.provide('errorHandler', errorHandler)
  }
} 