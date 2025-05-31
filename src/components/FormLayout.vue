<template>
  <div class="form-layout" :class="[`layout-${layout}`, { 'compact': compact }]">
    <slot></slot>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  layout: {
    type: String,
    default: 'vertical',
    validator: (value) => ['vertical', 'horizontal', 'inline'].includes(value)
  },
  compact: {
    type: Boolean,
    default: false
  }
})
</script>

<style>
.form-layout {
  width: 100%;
}

/* 垂直布局 */
.layout-vertical .el-form-item {
  margin-bottom: 24px;
}

.layout-vertical.compact .el-form-item {
  margin-bottom: 16px;
}

/* 水平布局 */
.layout-horizontal .el-form-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
}

.layout-horizontal .el-form-item__label {
  width: 120px;
  text-align: right;
  padding-right: 12px;
  flex-shrink: 0;
}

.layout-horizontal .el-form-item__content {
  flex: 1;
  margin-left: 0 !important;
}

.layout-horizontal.compact .el-form-item {
  margin-bottom: 12px;
}

/* 内联布局 */
.layout-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.layout-inline .el-form-item {
  margin-bottom: 0;
  flex: 0 0 auto;
}

.layout-inline.compact {
  gap: 8px;
}

/* 表单项样式增强 */
.form-layout .el-form-item__label {
  font-weight: 500;
  color: var(--text-secondary);
}

.form-layout .el-form-item.is-required .el-form-item__label:before {
  color: var(--error-color);
}

.form-layout .el-form-item.is-error .el-input__wrapper {
  box-shadow: 0 0 0 1px var(--error-color) inset !important;
}

.form-layout .el-form-item__error {
  font-size: 12px;
  padding-top: 4px;
  color: var(--error-color);
}

/* 输入框样式增强 */
.form-layout .el-input__wrapper,
.form-layout .el-textarea__inner {
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
  box-shadow: 0 0 0 1px var(--border-color) inset;
}

.form-layout .el-input__wrapper:hover,
.form-layout .el-textarea__inner:hover {
  box-shadow: 0 0 0 1px var(--border-color-hover) inset;
}

.form-layout .el-input__wrapper.is-focus,
.form-layout .el-textarea__inner:focus {
  box-shadow: 0 0 0 1px var(--primary-color) inset !important;
}

/* 按钮组样式 */
.form-layout .form-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.layout-horizontal .form-buttons {
  margin-left: 120px;
}

.layout-vertical.compact .form-buttons,
.layout-horizontal.compact .form-buttons {
  margin-top: 16px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .layout-horizontal .el-form-item {
    flex-direction: column;
    align-items: stretch;
  }
  
  .layout-horizontal .el-form-item__label {
    width: 100%;
    text-align: left;
    padding-right: 0;
    margin-bottom: 8px;
  }
  
  .layout-horizontal .form-buttons {
    margin-left: 0;
  }
  
  .layout-inline {
    flex-direction: column;
    gap: 12px;
  }
  
  .layout-inline .el-form-item {
    width: 100%;
  }
}
</style> 