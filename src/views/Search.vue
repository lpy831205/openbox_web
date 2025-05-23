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
      <el-form :model="searchForm" :inline="true" @submit.prevent="handleSearch">
        <el-form-item label="姓名">
          <el-input
            v-model="searchForm.name"
            placeholder="支持模糊搜索"
            clearable
          />
        </el-form-item>

        <el-form-item label="班级">
          <el-input
            v-model="searchForm.class"
            placeholder="如：2310、23级10班"
            clearable
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" native-type="submit" :loading="loading">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 查询结果表格 -->
    <el-card class="search-result" v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>查询结果</span>
          <el-button
            type="primary"
            :disabled="!tableData.length"
            @click="handleExport"
          >
            <el-icon><Download /></el-icon> 导出
          </el-button>
        </div>
      </template>

      <el-table
        :data="tableData"
        style="width: 100%"
        border
        stripe
        v-show="tableData.length"
      >
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="class" label="班级" width="120" />
        <el-table-column prop="course" label="课程" width="120" />
        <el-table-column prop="course_type" label="课程类型" width="100" />
        <el-table-column prop="teacher" label="任课教师" width="100" />
        <el-table-column prop="time" label="上课时间" width="120" show-overflow-tooltip />
        <el-table-column prop="max_students" label="人数上限" width="100" />
        <el-table-column prop="current_students" label="已报名" width="100" />
        <el-table-column prop="register_time" label="报名时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.register_time) }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="120">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleViewDetail(row)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-show="!tableData.length" description="暂无数据" />

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
        <el-descriptions-item label="身份证号" :span="2">{{ currentDetail.id_card }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentDetail.notes }}</el-descriptions-item>
        <el-descriptions-item label="确认信息" :span="2">{{ currentDetail.confirm_info }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

// 日期格式化函数
const formatDate = (dateStr) => {
  if (!dateStr) return ''
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
}

// 搜索表单数据
const searchForm = ref({
  name: '',
  class: ''
})

// 表格数据
const tableData = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 详情对话框
const detailDialogVisible = ref(false)
const currentDetail = ref({})

// 查询数据
const fetchData = async () => {
  try {
    loading.value = true
    // 将查询参数通过 URL params 传递
    const params = {
      name: searchForm.value.name,
      class: searchForm.value.class, // 后端期望的是 'class' 参数名
      // 后端 /api/students 接口目前未实现分页逻辑，但暂时保留前端分页参数以备将来扩展
      page: currentPage.value,
      size: pageSize.value
    }

    // 使用get方法，并将参数通过params选项传递
    const response = await request.get('/api/students', { params })
    // 响应已在request.js的拦截器中解密
    if (response) {
      tableData.value = response.students || []
      total.value = response.students ? response.students.length : 0
    } else {
      console.log(response.data)
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    ElMessage.error('查询失败：' + error.message)
  } finally {
    loading.value = false
  }
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

// 处理分页
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchData()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
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
    const response = await request.get('/api/students/export', {
      params: searchForm.value,
      responseType: 'blob'
    })

    const blob = new Blob([response], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `学生信息_${new Date().toLocaleDateString()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(link.href)
  } catch (error) {
    ElMessage.error('导出失败：' + error.message)
  }
}

// 敏感信息脱敏
const maskSensitiveInfo = (info) => {
  if (!info) return ''
  if (info.length <= 4) return '*'.repeat(info.length)
  return info.slice(0, 3) + '*'.repeat(info.length - 3)
}
</script>

<style scoped>
.search-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-form {
  background-color: #fff;
}

.search-result {
  background-color: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table) {
  margin-top: 20px;
}

:deep(.el-descriptions) {
  padding: 20px;
}
</style>