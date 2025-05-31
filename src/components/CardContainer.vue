<template>
  <div class="card-container" :class="[`elevation-${elevation}`, { 'hoverable': hoverable, 'loading': loading }]">
    <div v-if="title || $slots.header" class="card-header">
      <h3 v-if="title" class="card-title">{{ title }}</h3>
      <slot name="header"></slot>
      <div v-if="$slots.action" class="card-actions">
        <slot name="action"></slot>
      </div>
    </div>
    
    <div class="card-content" :class="{ 'no-padding': noPadding }">
      <div v-if="loading" class="card-loading-overlay">
        <div class="loading-spinner"></div>
      </div>
      <slot></slot>
    </div>
    
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  title: {
    type: String,
    default: ''
  },
  elevation: {
    type: Number,
    default: 1,
    validator: (value) => value >= 0 && value <= 5
  },
  hoverable: {
    type: Boolean,
    default: false
  },
  noPadding: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.card-container {
  background-color: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  position: relative;
  transition: all 0.3s ease;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 阴影层级 */
.elevation-0 {
  box-shadow: none;
  border: 1px solid var(--border-color);
}

.elevation-1 {
  box-shadow: var(--shadow-sm);
}

.elevation-2 {
  box-shadow: var(--shadow);
}

.elevation-3 {
  box-shadow: var(--shadow-md);
}

.elevation-4 {
  box-shadow: var(--shadow-lg);
}

.elevation-5 {
  box-shadow: var(--shadow-xl);
}

/* 悬停效果 */
.hoverable {
  cursor: pointer;
}

.hoverable:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* 卡片头部 */
.card-header {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  flex: 1;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 卡片内容 */
.card-content {
  padding: 20px;
  flex: 1;
  overflow: auto;
  position: relative;
}

.card-content.no-padding {
  padding: 0;
}

/* 卡片底部 */
.card-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
}

/* 加载状态 */
.loading {
  pointer-events: none;
}

.card-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(2px);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--primary-light);
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .card-header {
    padding: 12px 16px;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .card-footer {
    padding: 10px 16px;
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .card-loading-overlay {
    background-color: rgba(0, 0, 0, 0.5);
  }
}

/* 高性能模式 */
@media (prefers-reduced-motion: reduce) {
  .card-container {
    transition: none;
  }
  
  .hoverable:hover {
    transform: none;
  }
  
  .loading-spinner {
    animation: none;
    border: 2px solid var(--primary-color);
  }
}
</style> 