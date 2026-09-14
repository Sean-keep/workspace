<template>
  <div class="tasks-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-radio-group v-model="viewMode">
          <el-radio-button value="list">列表</el-radio-button>
          <el-radio-button value="board">看板</el-radio-button>
        </el-radio-group>

        <el-select v-model="filterStatus" placeholder="状态" clearable class="filter-select">
          <el-option
            v-for="status in taskStatuses"
            :key="status.value"
            :label="status.label"
            :value="status.value"
          />
        </el-select>

        <el-select v-model="filterPriority" placeholder="优先级" clearable class="filter-select">
          <el-option label="紧急" value="urgent" />
          <el-option label="高" value="high" />
          <el-option label="中" value="medium" />
          <el-option label="低" value="low" />
        </el-select>
      </div>

      <div class="header-right">
        <el-button @click="statusDialogVisible = true">
          <el-icon><Setting /></el-icon>
          管理状态
        </el-button>
        <el-button type="primary" @click="showAddDialog()">
          <el-icon><Plus /></el-icon>
          新建任务
        </el-button>
      </div>
    </div>

    <!-- List View -->
    <div v-if="viewMode === 'list'" class="task-list">
      <el-table :data="filteredTasks" stripe>
        <el-table-column width="50">
          <template #default="{ row }">
            <el-checkbox
              :model-value="row.status === 'done'"
              @change="(val: boolean) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>

        <el-table-column prop="title" label="任务名称" min-width="200">
          <template #default="{ row }">
            <div class="task-title-cell">
              <span :class="{ 'done': isCompletedStatus(row.status) }">{{ row.title }}</span>
              <el-tag
                v-if="row.is_recurring"
                type="warning"
                size="small"
                class="task-tag"
              >
                <el-icon><Refresh /></el-icon>
                {{ getRecurrenceLabel(row.recurrence_type) }}
              </el-tag>
              <el-tag
                v-for="tag in row.tags"
                :key="tag"
                size="small"
                class="task-tag"
              >
                {{ tag }}
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :color="getStatusColor(row.status)" size="small" effect="dark">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="due_date" label="截止日期" width="150">
          <template #default="{ row }">
            <span v-if="row.due_date" :class="{ 'overdue': isOverdue(row.due_date) }">
              {{ formatDate(row.due_date) }}
            </span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="editTask(row)">编辑</el-button>
            <el-button type="danger" link @click="deleteTask(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Board View -->
    <div v-else class="task-board">
      <div
        v-for="column in taskStatuses"
        :key="column.value"
        class="board-column"
        :data-status="column.value"
      >
        <div class="column-header">
          <div class="column-title-wrapper">
            <span class="column-dot" :style="{ backgroundColor: column.color }"></span>
            <span class="column-title">{{ column.label }}</span>
            <el-badge :value="getColumnTasks(column.value).length" class="column-count" />
          </div>
          <el-button type="primary" link @click="showAddDialog(column.value)">
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>

        <div
          class="column-content"
          :data-status="column.value"
          @dragover.prevent="handleDragOver"
          @dragleave="handleDragLeave"
          @drop="(e: DragEvent) => handleDrop(e, column.value)"
        >
          <div
            v-for="task in getColumnTasks(column.value)"
            :key="task.id"
            class="board-card"
            :class="{ 'dragging': draggedTask?.id === task.id }"
            draggable="true"
            @dragstart="(e: DragEvent) => handleDragStart(e, task)"
            @dragend="handleDragEnd"
          >
            <div class="card-header">
              <el-tag :type="getPriorityType(task.priority)" size="small">
                {{ getPriorityLabel(task.priority) }}
              </el-tag>
              <el-dropdown @command="(cmd: string) => handleCardAction(cmd, task)">
                <el-icon class="card-more"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="card-title">{{ task.title }}</div>
            <div v-if="task.description" class="card-desc">{{ task.description }}</div>
            <div class="card-tags" v-if="task.tags?.length">
              <el-tag v-for="tag in task.tags" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
            </div>
            <div class="card-footer">
              <div v-if="task.is_recurring" class="recurring-badge">
                <el-icon><Refresh /></el-icon>
                <span>{{ getRecurrenceLabel(task.recurrence_type) }}</span>
              </div>
              <div v-if="task.due_date" class="card-due" :class="{ 'overdue': isOverdue(task.due_date) }">
                <el-icon><Clock /></el-icon>
                {{ formatDate(task.due_date) }}
              </div>
            </div>
          </div>

          <div class="add-card" @click="showAddDialog(column.value)">
            <el-icon><Plus /></el-icon>
            <span>添加任务</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Task Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingTask ? '编辑任务' : '新建任务'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="taskFormRef"
        :model="taskForm"
        :rules="taskRules"
        label-width="80px"
      >
        <el-form-item label="任务名称" prop="title">
          <el-input v-model="taskForm.title" placeholder="请输入任务名称" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-select v-model="taskForm.priority" placeholder="选择优先级">
            <el-option label="紧急" value="urgent" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select v-model="taskForm.status" placeholder="选择状态">
            <el-option
              v-for="status in taskStatuses"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="截止日期" prop="due_date">
          <el-date-picker
            v-model="taskForm.due_date"
            type="datetime"
            placeholder="选择截止日期"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="taskForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="添加标签"
          >
            <el-option
              v-for="tag in commonTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-divider />

        <el-form-item label="周期任务">
          <el-switch v-model="taskForm.is_recurring" @change="onRecurringChange" />
        </el-form-item>

        <el-form-item v-if="taskForm.is_recurring" label="重复方式" prop="recurrence_type">
          <el-select v-model="taskForm.recurrence_type" placeholder="选择重复方式">
            <el-option label="每天" value="daily" />
            <el-option label="工作日（周一至周五）" value="weekdays" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="taskForm.recurrence_type === 'custom'" label="自定义">
          <el-checkbox-group v-model="taskForm.recurrence_days">
            <el-checkbox :value="0">周一</el-checkbox>
            <el-checkbox :value="1">周二</el-checkbox>
            <el-checkbox :value="2">周三</el-checkbox>
            <el-checkbox :value="3">周四</el-checkbox>
            <el-checkbox :value="4">周五</el-checkbox>
            <el-checkbox :value="5">周六</el-checkbox>
            <el-checkbox :value="6">周日</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ editingTask ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Status Management Dialog -->
    <el-dialog
      v-model="statusDialogVisible"
      title="管理任务状态"
      width="650px"
      destroy-on-close
    >
      <div class="status-management">
        <div class="status-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>拖拽状态项可以调整顺序，状态颜色会显示在看板列头和任务标签上</span>
        </div>
        <div class="status-list">
          <div
            v-for="(status, index) in taskStatuses"
            :key="status.value"
            class="status-item"
            draggable="true"
            @dragstart="(e: DragEvent) => handleStatusDragStart(e, index)"
            @dragover.prevent
            @drop="(e: DragEvent) => handleStatusDrop(e, index)"
          >
            <div class="status-info">
              <el-icon class="drag-handle"><Rank /></el-icon>
              <span class="status-dot" :style="{ backgroundColor: status.color }"></span>
              <el-input
                v-model="status.label"
                size="small"
                style="width: 120px"
              />
              <el-color-picker v-model="status.color" size="small" />
            </div>
            <el-button
              v-if="!status.isDefault"
              type="danger"
              :icon="Delete"
              circle
              size="small"
              @click="removeStatus(index)"
            />
            <el-tag v-else type="info" size="small">默认</el-tag>
          </div>
        </div>

        <div class="add-status">
          <el-input
            v-model="newStatusLabel"
            placeholder="新状态名称"
            style="width: 200px"
            @keyup.enter="addStatus"
          />
          <el-color-picker v-model="newStatusColor" size="small" />
          <el-button type="primary" @click="addStatus" :disabled="!newStatusLabel">
            <el-icon><Plus /></el-icon>
            添加状态
          </el-button>
        </div>
      </div>

      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveStatuses">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Delete, Rank, InfoFilled } from '@element-plus/icons-vue'
import api from '@/utils/api'
import dayjs from 'dayjs'

const viewMode = ref<'list' | 'board'>('board')
const filterStatus = ref('')
const filterPriority = ref('')
const tasks = ref<any[]>([])
const dialogVisible = ref(false)
const statusDialogVisible = ref(false)
const editingTask = ref<any>(null)
const submitting = ref(false)
const taskFormRef = ref<FormInstance>()
const draggedTask = ref<any>(null)
const draggedStatusIndex = ref<number>(-1)
const newStatusLabel = ref('')
const newStatusColor = ref('#409eff')

const commonTags = ['工作', '学习', '生活', '紧急', '重要']

// Task statuses with colors
const taskStatuses = ref([
  { value: 'todo', label: '待办', color: '#909399', isDefault: true },
  { value: 'in_progress', label: '进行中', color: '#e6a23c', isDefault: true },
  { value: 'done', label: '已完成', color: '#67c23a', isDefault: true }
])

const taskForm = reactive({
  title: '',
  description: '',
  priority: 'medium',
  status: 'todo',
  due_date: '',
  tags: [] as string[],
  is_recurring: false,
  recurrence_type: 'daily',
  recurrence_days: [] as number[]
})

const filteredTasks = computed(() => {
  let result = [...tasks.value]
  if (filterStatus.value) {
    result = result.filter(t => t.status === filterStatus.value)
  }
  if (filterPriority.value) {
    result = result.filter(t => t.priority === filterPriority.value)
  }
  return result
})

function isCompletedStatus(status: string) {
  const found = taskStatuses.value.find(s => s.value === status)
  // Assume the last status is "completed"
  return taskStatuses.value.indexOf(found!) === taskStatuses.value.length - 1
}

function onRecurringChange(val: boolean) {
  if (!val) {
    taskForm.recurrence_type = 'daily'
    taskForm.recurrence_days = []
  }
}

const taskRules: FormRules = {
  title: [{ required: true, message: '请输入任务名称', trigger: 'blur' }]
}

onMounted(() => {
  fetchTasks()
  loadStatuses()
})

async function fetchTasks() {
  try {
    const res: any = await api.get('/tasks')
    tasks.value = res.data.items || []
  } catch (error) {
    console.error('Failed to fetch tasks:', error)
  }
}

function loadStatuses() {
  const saved = localStorage.getItem('taskStatuses')
  if (saved) {
    try {
      taskStatuses.value = JSON.parse(saved)
    } catch (e) {
      // Use defaults
    }
  }
}

function saveStatuses() {
  localStorage.setItem('taskStatuses', JSON.stringify(taskStatuses.value))
  statusDialogVisible.value = false
  ElMessage.success('状态已保存')
}

function addStatus() {
  if (!newStatusLabel.value) return

  const value = `custom_${Date.now()}`
  taskStatuses.value.push({
    value: value,
    label: newStatusLabel.value,
    color: newStatusColor.value,
    isDefault: false
  })
  newStatusLabel.value = ''
  newStatusColor.value = '#409eff'
  ElMessage.success('状态已添加')
}

function removeStatus(index: number) {
  taskStatuses.value.splice(index, 1)
}

// Status drag and drop
function handleStatusDragStart(e: DragEvent, index: number) {
  draggedStatusIndex.value = index
  e.dataTransfer!.effectAllowed = 'move'
}

function handleStatusDrop(e: DragEvent, targetIndex: number) {
  e.preventDefault()
  if (draggedStatusIndex.value >= 0 && draggedStatusIndex.value !== targetIndex) {
    const item = taskStatuses.value.splice(draggedStatusIndex.value, 1)[0]
    taskStatuses.value.splice(targetIndex, 0, item)
  }
  draggedStatusIndex.value = -1
}

function showAddDialog(status?: string) {
  editingTask.value = null
  taskForm.title = ''
  taskForm.description = ''
  taskForm.priority = 'medium'
  taskForm.status = status || taskStatuses.value[0]?.value || 'todo'
  taskForm.due_date = ''
  taskForm.tags = []
  taskForm.is_recurring = false
  taskForm.recurrence_type = 'daily'
  taskForm.recurrence_days = []
  dialogVisible.value = true
}

function editTask(task: any) {
  editingTask.value = task
  taskForm.title = task.title
  taskForm.description = task.description || ''
  taskForm.priority = task.priority
  taskForm.status = task.status
  taskForm.due_date = task.due_date || ''
  taskForm.tags = task.tags || []
  taskForm.is_recurring = task.is_recurring || false
  taskForm.recurrence_type = task.recurrence_type || 'daily'
  taskForm.recurrence_days = task.recurrence_days || []
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await taskFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingTask.value) {
      await api.put(`/tasks/${editingTask.value.id}`, taskForm)
      ElMessage.success('任务已更新')
    } else {
      await api.post('/tasks', taskForm)
      ElMessage.success('任务已创建')
    }
    dialogVisible.value = false
    fetchTasks()
  } catch (error) {
    // Error handled by interceptor
  } finally {
    submitting.value = false
  }
}

async function deleteTask(task: any) {
  try {
    await ElMessageBox.confirm('确定要删除这个任务吗？', '提示', {
      type: 'warning'
    })
    await api.delete(`/tasks/${task.id}`)
    ElMessage.success('任务已删除')
    fetchTasks()
  } catch (error) {
    // Cancelled
  }
}

async function duplicateTask(task: any) {
  try {
    const data = {
      title: task.title + ' (副本)',
      description: task.description,
      priority: task.priority,
      status: taskStatuses.value[0]?.value || 'todo',
      tags: task.tags || [],
      is_recurring: false
    }
    await api.post('/tasks', data)
    ElMessage.success('任务已复制')
    fetchTasks()
  } catch (error) {
    console.error('Failed to duplicate task:', error)
  }
}

async function handleStatusChange(task: any, done: boolean) {
  const lastStatus = taskStatuses.value[taskStatuses.value.length - 1]
  const firstStatus = taskStatuses.value[0]
  const newStatus = done ? lastStatus.value : firstStatus.value
  try {
    await api.put(`/tasks/${task.id}`, { status: newStatus })
    task.status = newStatus
  } catch (error) {
    // Revert
  }
}

function handleCardAction(cmd: string, task: any) {
  if (cmd === 'edit') editTask(task)
  if (cmd === 'delete') deleteTask(task)
  if (cmd === 'duplicate') duplicateTask(task)
}

function getColumnTasks(status: string) {
  return filteredTasks.value.filter(t => t.status === status)
}

// Task Drag and Drop
function handleDragStart(e: DragEvent, task: any) {
  draggedTask.value = task
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', task.id.toString())
  setTimeout(() => {
    const el = e.target as HTMLElement
    el.classList.add('dragging')
  }, 0)
}

function handleDragEnd(e: DragEvent) {
  draggedTask.value = null
  const el = e.target as HTMLElement
  el.classList.remove('dragging')
  document.querySelectorAll('.column-content').forEach(col => {
    col.classList.remove('drag-over')
  })
}

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  const target = e.currentTarget as HTMLElement
  target.classList.add('drag-over')
}

function handleDragLeave(e: DragEvent) {
  const target = e.currentTarget as HTMLElement
  target.classList.remove('drag-over')
}

async function handleDrop(e: DragEvent, status: string) {
  e.preventDefault()
  const target = e.currentTarget as HTMLElement
  target.classList.remove('drag-over')

  if (draggedTask.value && draggedTask.value.status !== status) {
    const oldStatus = draggedTask.value.status
    draggedTask.value.status = status

    try {
      await api.put(`/tasks/${draggedTask.value.id}`, { status })
      ElMessage.success(`任务已移动到${getStatusLabel(status)}`)
    } catch (error) {
      draggedTask.value.status = oldStatus
    }
  }
  draggedTask.value = null
}

function getPriorityType(priority: string) {
  const map: Record<string, string> = {
    urgent: 'danger',
    high: 'warning',
    medium: '',
    low: 'info'
  }
  return map[priority] || ''
}

function getPriorityLabel(priority: string) {
  const map: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    medium: '中',
    low: '低'
  }
  return map[priority] || priority
}

function getStatusLabel(status: string) {
  const found = taskStatuses.value.find(s => s.value === status)
  return found?.label || status
}

function getStatusColor(status: string) {
  const found = taskStatuses.value.find(s => s.value === status)
  return found?.color || '#909399'
}

function getRecurrenceLabel(type: string) {
  const map: Record<string, string> = {
    daily: '每天',
    weekdays: '工作日',
    weekly: '每周',
    monthly: '每月',
    custom: '自定义'
  }
  return map[type] || type
}

function formatDate(date: string) {
  if (!date) return '-'
  return dayjs(date).format('MM-DD HH:mm')
}

function isOverdue(date: string) {
  if (!date) return false
  return dayjs(date).isBefore(dayjs())
}
</script>

<style scoped lang="scss">
.tasks-page {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .filter-select {
      width: 120px;
    }
  }
}

.task-title-cell {
  display: flex;
  align-items: center;
  gap: 8px;

  .done {
    text-decoration: line-through;
    color: #909399;
  }

  .task-tag {
    margin-left: 4px;
  }
}

.text-muted {
  color: #c0c4cc;
}

.overdue {
  color: #f56c6c;
}

// Board View
.task-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 20px;
}

.board-column {
  min-width: 300px;
  max-width: 300px;
  background-color: #f5f7fa;
  border-radius: 10px;
  overflow: hidden;

  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background-color: #fff;
    border-bottom: 1px solid #ebeef5;

    .column-title-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;

      .column-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }

      .column-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
    }
  }
}

.column-content {
  padding: 10px;
  min-height: 350px;
  transition: background-color 0.2s;

  &.drag-over {
    background-color: #ecf5ff;
  }
}

.board-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: grab;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
  border: 2px solid transparent;

  &:hover {
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
    transform: translateY(-1px);
  }

  &:active {
    cursor: grabbing;
  }

  &.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;

    .card-more {
      cursor: pointer;
      color: #909399;
      padding: 2px;
      border-radius: 4px;

      &:hover {
        color: #409eff;
        background-color: #f5f7fa;
      }
    }
  }

  .card-title {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 4px;
    line-height: 1.4;
  }

  .card-desc {
    font-size: 12px;
    color: #909399;
    margin-bottom: 6px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 6px;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;

    .recurring-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #e6a23c;
    }

    .card-due {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #909399;

      &.overdue {
        color: #f56c6c;
      }
    }
  }
}

.add-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  color: #909399;
  transition: all 0.2s;

  &:hover {
    border-color: #409eff;
    color: #409eff;
    background-color: #ecf5ff;
  }
}

// List View
.task-list {
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
}

// Status Management
.status-management {
  .status-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background-color: #ecf5ff;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #409eff;
  }

  .status-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .status-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    margin-bottom: 8px;
    background-color: #f5f7fa;
    border-radius: 6px;
    cursor: move;
    transition: all 0.2s;

    &:hover {
      background-color: #ecf5ff;
    }

    .status-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .drag-handle {
        color: #c0c4cc;
        cursor: move;

        &:hover {
          color: #909399;
        }
      }

      .status-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
      }
    }
  }

  .add-status {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
  }
}
</style>
