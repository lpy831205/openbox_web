import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import './style.css'
import './assets/layout.css'
import App from './App.vue'
import router from './router'
import ErrorHandler from './utils/error-handler'
// 导入 Stagewise 工具栏组件（仅在开发环境下）
import { StagewiseToolbar } from '@stagewise/toolbar-vue'

// 导入自定义全局组件
import CardContainer from './components/CardContainer.vue'
import GridLayout from './components/GridLayout.vue'
import FormLayout from './components/FormLayout.vue'

// 预处理WebAssembly错误
window.addEventListener('error', (event) => {
  if (event.message && (
    event.message.includes('WebAssembly') || 
    event.message.includes('指纹') ||
    event.message.includes('AudioContext')
  )) {
    // 防止错误打断应用加载
    console.warn('非关键功能加载失败，应用将继续运行:', event.message);
    event.preventDefault();
    return true;
  }
});

// 创建应用实例
const app = createApp(App)

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册自定义全局组件
app.component('CardContainer', CardContainer)
app.component('GridLayout', GridLayout)
app.component('FormLayout', FormLayout)

// 注册全局属性
app.config.globalProperties.$appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0'
app.config.globalProperties.$appName = import.meta.env.VITE_APP_NAME || '李端棻中学报名系统'

// 使用插件
app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
  size: 'default',
  zIndex: 3000
})
app.use(ErrorHandler)

// 性能优化配置
app.config.unwrapInjectedRef = true
app.config.compilerOptions = {
  hoistStatic: true,
  prefixIdentifiers: false
}

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue全局错误:', err);
  // 允许ErrorHandler继续处理
  if (app.config.globalProperties.$errorHandler) {
    app.config.globalProperties.$errorHandler.handleError(err, vm, info);
  }
};

// 性能监控
if (import.meta.env.DEV) {
  app.config.performance = true
  
  // 在开发环境下配置并挂载 Stagewise 工具栏
  const stagewiseConfig = {
    plugins: []
  }
  
  // 注册 Stagewise 工具栏组件
  app.component('StagewiseToolbar', StagewiseToolbar)
  
  // 开发环境下的性能提示
  console.info('🚀 应用已启动，性能监控已开启')
}

// 挂载应用
app.mount('#app')
