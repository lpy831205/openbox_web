<template>
  <div class="grid-layout" :class="[`cols-${cols}`, `gap-${gap}`]">
    <slot></slot>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  cols: {
    type: [Number, String],
    default: 1,
    validator: (value) => {
      const numValue = Number(value)
      return !isNaN(numValue) && numValue >= 1 && numValue <= 12
    }
  },
  gap: {
    type: [Number, String],
    default: 'md',
    validator: (value) => {
      if (typeof value === 'number') {
        return value >= 0
      }
      return ['none', 'xs', 'sm', 'md', 'lg', 'xl'].includes(value)
    }
  }
})
</script>

<style scoped>
.grid-layout {
  display: grid;
  width: 100%;
}

/* 列数配置 */
.cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
.cols-7 { grid-template-columns: repeat(7, minmax(0, 1fr)); }
.cols-8 { grid-template-columns: repeat(8, minmax(0, 1fr)); }
.cols-9 { grid-template-columns: repeat(9, minmax(0, 1fr)); }
.cols-10 { grid-template-columns: repeat(10, minmax(0, 1fr)); }
.cols-11 { grid-template-columns: repeat(11, minmax(0, 1fr)); }
.cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }

/* 间距配置 */
.gap-none { gap: 0; }
.gap-xs { gap: var(--spacing-xs, 8px); }
.gap-sm { gap: var(--spacing-sm, 12px); }
.gap-md { gap: var(--spacing-md, 16px); }
.gap-lg { gap: var(--spacing-lg, 24px); }
.gap-xl { gap: var(--spacing-xl, 32px); }

/* 数字间距 */
.gap-0 { gap: 0; }
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.gap-4 { gap: 16px; }
.gap-5 { gap: 20px; }
.gap-6 { gap: 24px; }
.gap-8 { gap: 32px; }
.gap-10 { gap: 40px; }
.gap-12 { gap: 48px; }

/* 响应式布局 */
@media (max-width: 1280px) {
  .cols-6, .cols-7, .cols-8, .cols-9, .cols-10, .cols-11, .cols-12 {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .cols-4, .cols-5, .cols-6, .cols-7, .cols-8, .cols-9, .cols-10, .cols-11, .cols-12 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  
  .gap-xl { gap: var(--spacing-lg, 24px); }
}

@media (max-width: 768px) {
  .cols-3, .cols-4, .cols-5, .cols-6, .cols-7, .cols-8, .cols-9, .cols-10, .cols-11, .cols-12 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  
  .gap-lg, .gap-xl { gap: var(--spacing-md, 16px); }
}

@media (max-width: 480px) {
  .cols-2, .cols-3, .cols-4, .cols-5, .cols-6, .cols-7, .cols-8, .cols-9, .cols-10, .cols-11, .cols-12 {
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  
  .gap-md, .gap-lg, .gap-xl { gap: var(--spacing-sm, 12px); }
}
</style> 