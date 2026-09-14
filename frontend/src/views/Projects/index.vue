<template>
  <div class="projects-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索项目..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
      </div>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        新建项目
      </el-button>
    </div>

    <!-- Project List -->
    <div class="project-list">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="project-card"
        :class="{ active: selectedProject?.id === project.id }"
        @click="selectProject(project)"
      >
        <div class="project-header">
          <div class="project-info">
            <el-icon :color="project.color || '#409eff'" :size="20"><Folder /></el-icon>
            <div>
              <div class="project-name">{{ project.name }}</div>
              <div class="project-desc">{{ project.description || '暂无描述' }}</div>
            </div>
          </div>
          <div class="project-meta">
            <el-tag :type="getStatusType(project.status)" size="small">
              {{ getStatusLabel(project.status) }}
            </el-tag>
            <el-tag :type="getPriorityType(project.priority)" size="small">
              {{ getPriorityLabel(project.priority) }}
            </el-tag>
          </div>
        </div>
        <div class="project-progress">
          <el-progress :percentage="getProjectProgress(project)" :stroke-width="6" />
          <span class="task-count">{{ getCompletedTasks(project) }}/{{ project.subtasks?.length || 0 }} 子任务</span>
        </div>
        <div class="project-actions">
          <el-button type="primary" link size="small" @click.stop="editProject(project)">编辑</el-button>
          <el-button type="danger" link size="small" @click.stop="deleteProject(project)">删除</el-button>
        </div>
      </div>

      <div class="project-card add-project" @click="showAddDialog">
        <el-icon :size="24"><Plus /></el-icon>
        <span>新建项目</span>
      </div>
    </div>

    <!-- Subtasks View (Kanban/Swimlane) -->
    <div v-if="selectedProject" class="subtasks-section">
      <div class="section-header">
        <div class="section-title">
          <el-icon :color="selectedProject.color || '#409eff'"><Folder /></el-icon>
          <h3>{{ selectedProject.name }} - 子任务</h3>
        </div>
        <div class="section-actions">
          <el-radio-group v-model="subtaskViewMode" size="small">
            <el-radio-button value="kanban">看板</el-radio-button>
            <el-radio-button value="swimlane">泳道图</el-radio-button>
            <el-radio-button value="list">列表</el-radio-button>
          </el-radio-group>
          <el-button size="small" @click="showStatusDialog">
            <el-icon><Setting /></el-icon>
            管理状态
          </el-button>
          <el-button type="primary" size="small" @click="showAddSubtaskDialog">
            <el-icon><Plus /></el-icon>
            添加子任务
          </el-button>
        </div>
      </div>

      <!-- Subtask Kanban -->
      <div v-if="subtaskViewMode === 'kanban'" class="subtask-kanban">
        <div v-for="status in subtaskStatuses" :key="status.value" class="kanban-column">
          <div class="column-header">
            <span class="column-dot" :style="{ backgroundColor: status.color }"></span>
            <span class="column-title">{{ status.label }}</span>
            <el-tag size="small" round>{{ getSubtasksByStatus(status.value).length }}</el-tag>
          </div>
          <div
            class="column-body"
            @dragover.prevent
            @drop="(e: DragEvent) => handleSubtaskDrop(e, status.value)"
          >
            <div
              v-for="task in getSubtasksByStatus(status.value)"
              :key="task.id"
              class="subtask-card"
              draggable="true"
              @dragstart="(e: DragEvent) => handleSubtaskDragStart(e, task)"
            >
              <div class="card-header">
                <el-dropdown @command="(cmd: string) => handleSubtaskAction(cmd, task)">
                  <el-icon class="card-more"><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <div class="card-title" :class="{ completed: task.status === 'done' }">{{ task.title }}</div>
              <div v-if="task.assignee" class="card-assignee">
                <el-avatar :size="20">{{ task.assignee.charAt(0) }}</el-avatar>
                <span>{{ task.assignee }}</span>
              </div>
            </div>
            <div class="add-card" @click="showAddSubtaskDialog(status.value)">
              <el-icon><Plus /></el-icon>
              <span>添加</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Subtask Swimlane -->
      <div v-else-if="subtaskViewMode === 'swimlane'" class="subtask-swimlane">
        <div class="swimlane-container">
          <div class="swimlane-header">
            <div class="swimlane-label">优先级</div>
            <div v-for="status in subtaskStatuses" :key="status.value" class="swimlane-status">
              {{ status.label }}
            </div>
          </div>

          <div v-for="priority in priorities" :key="priority.value" class="swimlane-row">
            <div class="swimlane-label" :style="{ borderLeftColor: getPriorityColor(priority.value) }">
              <span>{{ priority.label }}</span>
            </div>
            <div
              v-for="status in subtaskStatuses"
              :key="status.value"
              class="swimlane-cell"
              @dragover.prevent
              @drop="(e: DragEvent) => handleSwimlaneDrop(e, priority.value, status.value)"
            >
              <div
                v-for="task in getSubtasksByPriorityAndStatus(priority.value, status.value)"
                :key="task.id"
                class="swimlane-card"
                draggable="true"
                @dragstart="(e: DragEvent) => handleSubtaskDragStart(e, task)"
              >
                <span class="mini-title" :class="{ completed: task.status === 'done' }">{{ task.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Subtask List -->
      <div v-else class="subtask-list">
        <el-table :data="selectedProject.subtasks || []" size="small">
          <el-table-column prop="title" label="标题" min-width="200">
            <template #default="{ row }">
              <span :class="{ completed: row.status === 'done' }">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :color="getSubtaskStatusColor(row.status)" size="small" effect="dark">
                {{ getSubtaskStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="80">
            <template #default="{ row }">
              <el-tag :type="getPriorityType(row.priority)" size="small">
                {{ getPriorityLabel(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="editSubtask(row)">编辑</el-button>
              <el-button type="danger" link size="small" @click="deleteSubtask(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Add/Edit Project Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingProject ? '编辑项目' : '新建项目'"
      width="500px"
      destroy-on-close
    >
      <el-form
        ref="projectFormRef"
        :model="projectForm"
        :rules="projectRules"
        label-width="100px"
      >
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>

        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="projectForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入项目描述"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="projectForm.status" placeholder="选择状态">
                <el-option
                  v-for="status in projectStatuses"
                  :key="status.value"
                  :label="status.label"
                  :value="status.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="projectForm.priority" placeholder="选择优先级">
                <el-option
                  v-for="p in priorities"
                  :key="p.value"
                  :label="p.label"
                  :value="p.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="截止日期" prop="deadline">
              <el-date-picker
                v-model="projectForm.deadline"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目颜色" prop="color">
              <el-color-picker v-model="projectForm.color" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="projectForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="添加标签"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ editingProject ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Add/Edit Subtask Dialog -->
    <el-dialog
      v-model="subtaskDialogVisible"
      :title="editingSubtask ? '编辑子任务' : '添加子任务'"
      width="450px"
      destroy-on-close
    >
      <el-form
        ref="subtaskFormRef"
        :model="subtaskForm"
        :rules="subtaskRules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="subtaskForm.title" placeholder="请输入子任务标题" />
        </el-form-item>

        <el-form-item label="状态" prop="status">
          <el-select v-model="subtaskForm.status" placeholder="选择状态">
            <el-option
              v-for="status in subtaskStatuses"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-select v-model="subtaskForm.priority" placeholder="选择优先级">
            <el-option label="紧急" value="urgent" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>

        <el-form-item label="负责人" prop="assignee">
          <el-input v-model="subtaskForm.assignee" placeholder="请输入负责人" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="subtaskDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubtaskSubmit">
          {{ editingSubtask ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Status Management Dialog -->
    <el-dialog
      v-model="statusDialogVisible"
      title="管理子任务状态"
      width="500px"
      destroy-on-close
    >
      <div class="status-management">
        <div class="status-list">
          <div
            v-for="(status, index) in subtaskStatuses"
            :key="status.value"
            class="status-item"
            draggable="true"
            @dragstart="(e: DragEvent) => handleStatusDragStart(e, index)"
            @dragover.prevent
            @drop="(e: DragEvent) => handleStatusDrop(e, index)"
          >
            <el-icon class="drag-handle"><Rank /></el-icon>
            <span class="status-dot" :style="{ backgroundColor: status.color }"></span>
            <span class="status-label">{{ status.label }}</span>
            <el-color-picker v-model="status.color" size="small" @change="saveSubtaskStatuses" />
            <el-button
              v-if="!status.isDefault"
              type="danger"
              :icon="Delete"
              circle
              size="small"
              @click="removeSubtaskStatus(index)"
            />
            <el-tag v-else type="info" size="small">默认</el-tag>
          </div>
        </div>

        <div class="add-status">
          <el-input
            v-model="newStatusLabel"
            placeholder="新状态名称"
            style="width: 200px"
            @keyup.enter="addSubtaskStatus"
          />
          <el-color-picker v-model="newStatusColor" size="small" />
          <el-button type="primary" @click="addSubtaskStatus" :disabled="!newStatusLabel">
            <el-icon><Plus /></el-icon>
            添加状态
          </el-button>
        </div>
      </div>

      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSubtaskStatuses">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { MoreFilled, Folder, Delete, Rank, Setting } from '@element-plus/icons-vue'
import api from '@/utils/api'
import dayjs from 'dayjs'

const projects = ref<any[]>([])
const selectedProject = ref<any>(null)
const searchQuery = ref('')
const subtaskViewMode = ref<'kanban' | 'swimlane' | 'list'>('kanban')
const dialogVisible = ref(false)
const subtaskDialogVisible = ref(false)
const statusDialogVisible = ref(false)
const editingProject = ref<any>(null)
const editingSubtask = ref<any>(null)
const submitting = ref(false)
const projectFormRef = ref<FormInstance>()
const subtaskFormRef = ref<FormInstance>()
const draggedSubtask = ref<any>(null)
const draggedStatusIndex = ref<number>(-1)
const newStatusLabel = ref('')
const newStatusColor = ref('#409eff')

const projectStatuses = [
  { value: 'planning', label: '规划中' },
  { value: 'in_progress', label: '进行中' },
  { value: 'testing', label: '测试中' },
  { value: 'completed', label: '已完成' },
  { value: 'on_hold', label: '已暂停' }
]

const subtaskStatuses = ref([
  { value: 'todo', label: '待办', color: '#909399', isDefault: true },
  { value: 'in_progress', label: '进行中', color: '#e6a23c', isDefault: true },
  { value: 'done', label: '已完成', color: '#67c23a', isDefault: true }
])

const priorities = [
  { value: 'urgent', label: '紧急' },
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' }
]

const filteredProjects = computed(() => {
  let result = [...projects.value]
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query)
    )
  }
  return result
})

const projectForm = reactive({
  name: '',
  description: '',
  status: 'planning',
  priority: 'medium',
  deadline: null as any,
  color: '#409eff',
  tags: [] as string[]
})

const subtaskForm = reactive({
  title: '',
  status: 'todo',
  priority: 'medium',
  assignee: '',
  completed: false
})

const projectRules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }]
}

const subtaskRules: FormRules = {
  title: [{ required: true, message: '请输入子任务标题', trigger: 'blur' }]
}

onMounted(() => {
  loadSubtaskStatuses()
  fetchProjects()
})

function loadSubtaskStatuses() {
  const saved = localStorage.getItem('projectSubtaskStatuses')
  if (saved) {
    try {
      subtaskStatuses.value = JSON.parse(saved)
    } catch (e) {
      // Use defaults
    }
  }
}

function saveSubtaskStatuses() {
  localStorage.setItem('projectSubtaskStatuses', JSON.stringify(subtaskStatuses.value))
  statusDialogVisible.value = false
  ElMessage.success('状态已保存')
}

async function fetchProjects() {
  try {
    const res: any = await api.get('/projects')
    projects.value = res.data || []
  } catch (error) {
    // Mock data
    projects.value = [
      {
        id: 1, name: '示例项目1', description: '这是一个示例项目', status: 'in_progress', priority: 'high',
        progress: 60, deadline: '2024-12-31', color: '#409eff', tags: ['开发'], members: 3,
        subtasks: [
          { id: 1, title: '设计数据库', status: 'done', priority: 'high', completed: true, assignee: '张三' },
          { id: 2, title: '开发API', status: 'in_progress', priority: 'high', completed: false, assignee: '李四' },
          { id: 3, title: '前端页面', status: 'todo', priority: 'medium', completed: false, assignee: '王五' },
          { id: 4, title: '测试', status: 'todo', priority: 'low', completed: false, assignee: '' }
        ]
      },
      {
        id: 2, name: '示例项目2', description: '另一个示例', status: 'planning', priority: 'medium',
        progress: 20, deadline: '2025-01-15', color: '#67c23a', tags: ['设计'], members: 2,
        subtasks: [
          { id: 5, title: '需求分析', status: 'done', priority: 'high', completed: true, assignee: '张三' },
          { id: 6, title: 'UI设计', status: 'in_progress', priority: 'medium', completed: false, assignee: '李四' }
        ]
      }
    ]
  }

  // Auto-select the first project
  if (projects.value.length > 0 && !selectedProject.value) {
    selectedProject.value = projects.value[0]
  }
}

function selectProject(project: any) {
  selectedProject.value = project
}

function getProjectsByStatus(status: string) {
  return filteredProjects.value.filter(p => p.status === status)
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    planning: 'info',
    in_progress: '',
    testing: 'warning',
    completed: 'success',
    on_hold: 'danger'
  }
  return map[status] || 'info'
}

function getStatusLabel(status: string) {
  return projectStatuses.find(s => s.value === status)?.label || status
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
  return priorities.find(p => p.value === priority)?.label || priority
}

function getPriorityColor(priority: string) {
  const map: Record<string, string> = {
    urgent: '#f56c6c',
    high: '#e6a23c',
    medium: '#409eff',
    low: '#909399'
  }
  return map[priority] || '#409eff'
}

function getCompletedTasks(project: any) {
  if (!project.subtasks) return 0
  return project.subtasks.filter((t: any) => t.status === 'done').length
}

function getProjectProgress(project: any) {
  if (!project.subtasks || project.subtasks.length === 0) return 0
  const completed = project.subtasks.filter((t: any) => t.status === 'done').length
  return Math.round((completed / project.subtasks.length) * 100)
}

function updateSubtaskProgress() {
  if (!selectedProject.value) return
  selectedProject.value.progress = getProjectProgress(selectedProject.value)
}

// Subtask functions
function getSubtasksByStatus(status: string) {
  if (!selectedProject.value?.subtasks) return []
  return selectedProject.value.subtasks.filter((t: any) => t.status === status)
}

function getSubtasksByPriorityAndStatus(priority: string, status: string) {
  if (!selectedProject.value?.subtasks) return []
  return selectedProject.value.subtasks.filter((t: any) => t.priority === priority && t.status === status)
}

function getSubtaskStatusColor(status: string) {
  return subtaskStatuses.value.find(s => s.value === status)?.color || '#909399'
}

function getSubtaskStatusLabel(status: string) {
  return subtaskStatuses.value.find(s => s.value === status)?.label || status
}

function showStatusDialog() {
  statusDialogVisible.value = true
}

function addSubtaskStatus() {
  if (!newStatusLabel.value) return

  const value = newStatusLabel.value.toLowerCase().replace(/\s+/g, '_')
  const exists = subtaskStatuses.value.some(s => s.value === value)
  if (exists) {
    ElMessage.warning('该状态已存在')
    return
  }

  subtaskStatuses.value.push({
    value,
    label: newStatusLabel.value,
    color: newStatusColor.value,
    isDefault: false
  })

  newStatusLabel.value = ''
  newStatusColor.value = '#409eff'
  ElMessage.success('状态已添加')
}

function removeSubtaskStatus(index: number) {
  subtaskStatuses.value.splice(index, 1)
}

// Status drag and drop
function handleStatusDragStart(e: DragEvent, index: number) {
  draggedStatusIndex.value = index
  e.dataTransfer!.effectAllowed = 'move'
}

function handleStatusDrop(e: DragEvent, targetIndex: number) {
  e.preventDefault()
  if (draggedStatusIndex.value >= 0 && draggedStatusIndex.value !== targetIndex) {
    const item = subtaskStatuses.value.splice(draggedStatusIndex.value, 1)[0]
    subtaskStatuses.value.splice(targetIndex, 0, item)
  }
  draggedStatusIndex.value = -1
}

function showAddSubtaskDialog(status?: string) {
  editingSubtask.value = null
  subtaskForm.title = ''
  subtaskForm.status = status || subtaskStatuses.value[0]?.value || 'todo'
  subtaskForm.priority = 'medium'
  subtaskForm.assignee = ''
  subtaskForm.completed = false
  subtaskDialogVisible.value = true
}

function editSubtask(task: any) {
  editingSubtask.value = task
  subtaskForm.title = task.title
  subtaskForm.status = task.status
  subtaskForm.priority = task.priority
  subtaskForm.assignee = task.assignee || ''
  subtaskForm.completed = task.completed
  subtaskDialogVisible.value = true
}

async function handleSubtaskSubmit() {
  if (!selectedProject.value) return

  if (!selectedProject.value.subtasks) {
    selectedProject.value.subtasks = []
  }

  if (editingSubtask.value) {
    Object.assign(editingSubtask.value, subtaskForm)
  } else {
    selectedProject.value.subtasks.push({
      id: Date.now(),
      ...subtaskForm
    })
  }

  updateSubtaskProgress()
  await saveProjectSubtasks()
  subtaskDialogVisible.value = false
  ElMessage.success(editingSubtask.value ? '子任务已更新' : '子任务已添加')
}

async function deleteSubtask(task: any) {
  if (!selectedProject.value?.subtasks) return
  const index = selectedProject.value.subtasks.findIndex((t: any) => t.id === task.id)
  if (index > -1) {
    selectedProject.value.subtasks.splice(index, 1)
    updateSubtaskProgress()
    await saveProjectSubtasks()
    ElMessage.success('子任务已删除')
  }
}

function handleSubtaskAction(cmd: string, task: any) {
  if (cmd === 'edit') editSubtask(task)
  if (cmd === 'delete') deleteSubtask(task)
}

// Subtask Drag and Drop
function handleSubtaskDragStart(e: DragEvent, task: any) {
  draggedSubtask.value = task
  e.dataTransfer!.effectAllowed = 'move'
}

async function handleSubtaskDrop(e: DragEvent, status: string) {
  e.preventDefault()
  if (draggedSubtask.value) {
    draggedSubtask.value.status = status
    updateSubtaskProgress()
    draggedSubtask.value = null
    await saveProjectSubtasks()
  }
}

async function handleSwimlaneDrop(e: DragEvent, priority: string, status: string) {
  e.preventDefault()
  if (draggedSubtask.value) {
    draggedSubtask.value.priority = priority
    draggedSubtask.value.status = status
    updateSubtaskProgress()
    draggedSubtask.value = null
    await saveProjectSubtasks()
  }
}

async function saveProjectSubtasks() {
  if (!selectedProject.value) return
  try {
    const progress = getProjectProgress(selectedProject.value)
    selectedProject.value.progress = progress

    // Update the project in the projects array
    const index = projects.value.findIndex(p => p.id === selectedProject.value.id)
    if (index > -1) {
      projects.value[index] = { ...selectedProject.value }
    }

    await api.put(`/projects/${selectedProject.value.id}`, {
      subtasks: selectedProject.value.subtasks,
      progress: progress
    })
  } catch (error) {
    console.error('Failed to save subtasks:', error)
  }
}

// Project functions
function showAddDialog() {
  editingProject.value = null
  projectForm.name = ''
  projectForm.description = ''
  projectForm.status = 'planning'
  projectForm.priority = 'medium'
  projectForm.deadline = null
  projectForm.color = '#409eff'
  projectForm.tags = []
  dialogVisible.value = true
}

function editProject(project: any) {
  editingProject.value = project
  projectForm.name = project.name
  projectForm.description = project.description || ''
  projectForm.status = project.status
  projectForm.priority = project.priority
  projectForm.deadline = project.deadline
  projectForm.color = project.color || '#409eff'
  projectForm.tags = project.tags || []
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await projectFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingProject.value) {
      Object.assign(editingProject.value, projectForm)
      ElMessage.success('项目已更新')
    } else {
      projects.value.push({
        ...projectForm,
        id: Date.now(),
        progress: 0,
        subtasks: [],
        members: 1
      })
      ElMessage.success('项目已创建')
    }
    dialogVisible.value = false
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

async function deleteProject(project: any) {
  try {
    await ElMessageBox.confirm('确定要删除这个项目吗？', '提示', {
      type: 'warning'
    })
    projects.value = projects.value.filter(p => p.id !== project.id)
    if (selectedProject.value?.id === project.id) {
      selectedProject.value = null
    }
    ElMessage.success('项目已删除')
  } catch (error) {
    // Cancelled
  }
}
</script>

<style scoped lang="scss">
.projects-page {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .search-input {
      width: 300px;
    }
  }
}

// Project List
.project-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.project-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 14px;
  border: 2px solid #ebeef5;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #c0c4cc;
  }

  &.active {
    border-color: #409eff;
    background-color: #ecf5ff;
  }

  &.add-project {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #909399;
    border-style: dashed;

    &:hover {
      color: #409eff;
      border-color: #409eff;
    }
  }

  .project-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 10px;

    .project-info {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      flex: 1;
    }

    .project-name {
      font-size: 15px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 2px;
    }

    .project-desc {
      font-size: 12px;
      color: #909399;
    }

    .project-meta {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }
  }

  .project-progress {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;

    .el-progress {
      flex: 1;
    }

    .task-count {
      font-size: 12px;
      color: #909399;
      white-space: nowrap;
    }
  }

  .project-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}

// Subtasks Section
.subtasks-section {
  background-color: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 10px;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
    }

    .section-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
}

// Subtask Kanban
.subtask-kanban {
  display: flex;
  gap: 16px;
  overflow-x: auto;
}

.kanban-column {
  min-width: 250px;
  max-width: 250px;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;

  .column-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background-color: #fff;
    border-bottom: 1px solid #ebeef5;

    .column-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .column-title {
      font-size: 13px;
      font-weight: 600;
      color: #303133;
      flex: 1;
    }
  }

  .column-body {
    padding: 10px;
    min-height: 200px;
  }
}

.subtask-card {
  background-color: #fff;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 8px;
  cursor: grab;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;

    .card-more {
      cursor: pointer;
      color: #909399;

      &:hover {
        color: #409eff;
      }
    }
  }

  .card-title {
    font-size: 13px;
    color: #303133;
    margin-bottom: 6px;

    &.completed {
      text-decoration: line-through;
      color: #909399;
    }
  }

  .card-assignee {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #909399;
  }
}

.add-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  color: #909399;
  font-size: 12px;

  &:hover {
    color: #409eff;
    border-color: #409eff;
  }
}

// Subtask Swimlane
.subtask-swimlane {
  overflow: auto;
}

.swimlane-container {
  min-width: 100%;
}

.swimlane-header {
  display: flex;
  background-color: #f5f7fa;
  border-radius: 6px 6px 0 0;
  border: 1px solid #ebeef5;
  border-bottom: 2px solid #ebeef5;

  .swimlane-label {
    width: 100px;
    min-width: 100px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    color: #303133;
    border-right: 1px solid #ebeef5;
  }

  .swimlane-status {
    flex: 1;
    padding: 8px 12px;
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #606266;
    border-right: 1px solid #ebeef5;

    &:last-child {
      border-right: none;
    }
  }
}

.swimlane-row {
  display: flex;
  border: 1px solid #ebeef5;
  border-top: none;

  &:last-child {
    border-radius: 0 0 6px 6px;
  }

  .swimlane-label {
    width: 100px;
    min-width: 100px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    border-right: 1px solid #ebeef5;
    border-left: 3px solid #409eff;
    background-color: #fff;
    font-size: 12px;
    font-weight: 500;
    color: #303133;
  }

  .swimlane-cell {
    flex: 1;
    min-height: 50px;
    padding: 6px;
    border-right: 1px solid #ebeef5;
    background-color: #fff;

    &:last-child {
      border-right: none;
    }

    &:hover {
      background-color: #f5f7fa;
    }
  }
}

.swimlane-card {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  margin-bottom: 4px;
  background-color: #ecf5ff;
  border-radius: 4px;
  border: 1px solid #d9ecff;
  cursor: pointer;

  &:hover {
    background-color: #d9ecff;
  }

  .mini-title {
    font-size: 12px;
    color: #303133;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.completed {
      text-decoration: line-through;
      color: #909399;
    }
  }
}

// Subtask List
.subtask-list {
  :deep(.el-table) {
    font-size: 13px;
  }

  .completed {
    text-decoration: line-through;
    color: #909399;
  }
}

// Status Management
.status-management {
  .status-list {
    margin-bottom: 16px;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background-color: #f5f7fa;
    border-radius: 6px;
    margin-bottom: 8px;
    cursor: grab;

    &:hover {
      background-color: #ecf5ff;
    }

    .drag-handle {
      cursor: grab;
      color: #909399;

      &:active {
        cursor: grabbing;
      }
    }

    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .status-label {
      flex: 1;
      font-size: 14px;
      color: #303133;
    }
  }

  .add-status {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
  }
}

.text-danger {
  color: #f56c6c;
}

:deep(.el-table .el-table__row) {
  cursor: pointer;
}
</style>
