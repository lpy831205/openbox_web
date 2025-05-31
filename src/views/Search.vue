<template>
  <div class="search-container">
    <!-- 搜索表单 -->
    <el-card class="search-form">
      <template #header>
        <div class="card-header">
          <span>学生报名信息查询</span>
          <el-tag type="info" effect="plain">支持模糊搜索</el-tag>
        </div>
      </template>
      <el-form :model="searchForm" :inline="true" @submit.prevent="handleSearch" ref="searchFormRef">
        <el-form-item label="姓名" prop="name">
          <el-input
            v-model="searchForm.name"
            placeholder="支持模糊搜索"
            clearable
            @clear="handleInputClear"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="班级" prop="class">
          <el-input
            v-model="searchForm.class"
            placeholder="如：2310、23级10班"
            clearable
            @clear="handleInputClear"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><School /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading" :icon="Search">
            查询
          </el-button>
          <el-button @click="handleReset" :icon="Refresh">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 查询结果表格 -->
    <el-card class="search-result" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>查询结果 <el-tag v-if="tableData.length" type="success" size="small">共 {{ total }} 条记录</el-tag></span>
          <div class="header-actions">
            <el-tooltip content="刷新数据" placement="top" :hide-after="1500">
              <el-button
                circle
                :icon="RefreshRight"
                @click="refreshData"
                :disabled="loading || !tableData.length"
              />
            </el-tooltip>
            <el-tooltip content="导出数据" placement="top" :hide-after="1500">
              <el-button
                circle
                type="primary"
                :icon="Download"
                @click="handleExport"
                :disabled="loading || !tableData.length"
              />
            </el-tooltip>
          </div>
        </div>
      </template>

      <el-table
        :data="paginatedData"
        style="width: 100%"
        border
        stripe
        highlight-current-row
        v-show="tableData.length"
        :default-sort="{ prop: 'register_time', order: 'descending' }"
        @sort-change="handleSortChange"
        row-key="id"
      >
        <el-table-column prop="name" label="姓名" width="100" sortable />
        <el-table-column prop="class" label="班级" width="120" sortable />
        <el-table-column prop="course" label="课程" width="120" sortable />
        <el-table-column prop="course_type" label="课程类型" width="100" sortable />
        <el-table-column prop="teacher" label="任课教师" width="100" sortable />
        <el-table-column prop="time" label="上课时间" width="120" show-overflow-tooltip />
        <el-table-column prop="max_students" label="人数上限" width="100" sortable />
        <el-table-column prop="current_students" label="已报名" width="100" sortable />
        <el-table-column prop="register_time" label="报名时间" width="160" sortable>
          <template #default="{ row }">
            {{ formatDate(row.register_time) }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row)" :icon="View">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-show="!tableData.length" description="暂无数据">
        <template #image>
          <el-icon :size="60"><Document /></el-icon>
        </template>
        <template #description>
          <span>暂无查询结果，请尝试其他搜索条件</span>
        </template>
      </el-empty>

      <div class="pagination" v-show="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="学生详细信息"
      width="50%"
      destroy-on-close
      draggable
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="学期">{{ currentDetail.term }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ currentDetail.name }}</el-descriptions-item>
        <el-descriptions-item label="班级">{{ currentDetail.class }}</el-descriptions-item>
        <el-descriptions-item label="年级">{{ currentDetail.grade }}</el-descriptions-item>
        <el-descriptions-item label="课程">{{ currentDetail.course }}</el-descriptions-item>
        <el-descriptions-item label="课程类型">{{ currentDetail.course_type }}</el-descriptions-item>
        <el-descriptions-item label="任课教师">{{ currentDetail.teacher }}</el-descriptions-item>
        <el-descriptions-item label="上课时间">{{ currentDetail.time }}</el-descriptions-item>
        <el-descriptions-item label="报名人数上限">{{ currentDetail.max_students }}</el-descriptions-item>
        <el-descriptions-item label="已报名人数">{{ currentDetail.current_students }}</el-descriptions-item>
        <el-descriptions-item label="报名时间">{{ formatDate(currentDetail.register_time) }}</el-descriptions-item>
        <el-descriptions-item label="身份证号" :span="2">{{ maskSensitiveInfo(currentDetail.id_card) }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentDetail.notes || '无' }}</el-descriptions-item>
        <el-descriptions-item label="确认信息" :span="2">{{ currentDetail.confirm_info || '无' }}</el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Search, Refresh, Download, RefreshRight, View, User, School, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { debounce } from 'lodash-es'

// 日期格式化函数
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch (error) {
    return dateStr
  }
}

// 搜索表单数据
const searchForm = ref({
  name: '',
  class: ''
})
const searchFormRef = ref(null)

// 表格数据
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const sortBy = ref('register_time')
const sortOrder = ref('descending')

// 详情对话框
const detailDialogVisible = ref(false)
const currentDetail = ref({})

// 计算分页后的数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableData.value.slice(start, end)
})

// 监听表单变化，实现实时搜索
const debouncedSearch = debounce(() => {
  if (searchForm.value.name.length >= 2 || searchForm.value.class.length >= 2) {
    handleSearch()
  }
}, 500)

watch(() => [searchForm.value.name, searchForm.value.class], () => {
  debouncedSearch()
})

// 组件挂载时执行
onMounted(() => {
  // 如果URL中有查询参数，自动执行查询
  const urlParams = new URLSearchParams(window.location.search)
  const nameParam = urlParams.get('name')
  const classParam = urlParams.get('class')
  
  if (nameParam || classParam) {
    searchForm.value.name = nameParam || ''
    searchForm.value.class = classParam || ''
    handleSearch()
  }
})

// 查询数据
const fetchData = async () => {
  try {
    loading.value = true
    // 将查询参数通过 URL params 传递
    const params = {
      name: searchForm.value.name,
      class: searchForm.value.class,
      page: currentPage.value,
      size: pageSize.value
    }

    const response = await request.get('/api/students', { params })
    
    if (response && response.students) {
      tableData.value = response.students || []
      total.value = response.students.length
      
      // 根据当前排序设置对数据进行排序
      handleSortChange({ prop: sortBy.value, order: sortOrder.value })
      
      // 更新URL参数，方便分享和刷新
      updateUrlParams()
    } else {
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    ElMessage.error('查询失败：' + (error.message || '未知错误'))
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// 更新URL参数
const updateUrlParams = () => {
  const params = new URLSearchParams()
  if (searchForm.value.name) params.set('name', searchForm.value.name)
  if (searchForm.value.class) params.set('class', searchForm.value.class)
  
  const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
  window.history.replaceState({}, '', newUrl)
}

// 处理查询
const handleSearch = () => {
  currentPage.value = 1
  fetchData()
}

// 处理重置
const handleReset = () => {
  searchForm.value = {
    name: '',
    class: ''
  }
  currentPage.value = 1
  fetchData()
}

// 处理输入框清除
const handleInputClear = () => {
  if (!searchForm.value.name && !searchForm.value.class) {
    handleReset()
  }
}

// 处理分页
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 处理排序
const handleSortChange = ({ prop, order }) => {
  if (!prop) return
  
  sortBy.value = prop
  sortOrder.value = order
  
  // 对数据进行排序
  tableData.value.sort((a, b) => {
    let aValue = a[prop]
    let bValue = b[prop]
    
    // 特殊处理日期类型
    if (prop === 'register_time') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    }
    
    // 数字类型转换
    if (prop === 'max_students' || prop === 'current_students') {
      aValue = Number(aValue) || 0
      bValue = Number(bValue) || 0
    }
    
    if (order === 'ascending') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
}

// 刷新数据
const refreshData = () => {
  fetchData()
}

// 查看详情
const handleViewDetail = (row) => {
  currentDetail.value = row
  detailDialogVisible.value = true
}

// 导出数据
const handleExport = async () => {
  try {
    loading.value = true
    const response = await request.get('/api/export-students', {
      params: searchForm.value,
      responseType: 'blob'
    })

    const blob = new Blob([response], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `学生信息_${new Date().toLocaleDateString()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(link.href)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败：' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

// 敏感信息脱敏
const maskSensitiveInfo = (info) => {
  if (!info) return '未提供'
  if (info.length <= 4) return '*'.repeat(info.length)
  if (info.length === 18) { // 身份证号
    return info.slice(0, 6) + '*'.repeat(8) + info.slice(14)
  }
  return info.slice(0, 3) + '*'.repeat(info.length - 3)
}
</script>

<style scoped>
.search-container {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  height: 100%;
  overflow-y: auto;
}

.search-form {
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  transition: box-shadow var(--transition-fast) ease;
}

.search-form:hover {
  box-shadow: var(--shadow-lg);
}

.search-result {
  flex: 1;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  transition: box-shadow var(--transition-fast) ease;
}

.search-result:hover {
  box-shadow: var(--shadow-lg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.pagination {
  margin-top: var(--spacing-lg);
  display: flex;
  justify-content: flex-end;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-container {
    padding: var(--spacing-md);
  }
  
  .el-form {
    display: flex;
    flex-direction: column;
  }
  
  .el-form-item {
    margin-right: 0 !important;
    width: 100%;
  }
}

/* 减少动画 */
@media (prefers-reduced-motion: reduce) {
  .search-form, .search-result {
    transition: none;
  }
}
</style>