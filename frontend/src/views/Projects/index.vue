<template>
  <div class="projects-page">
    <PageHeader class="projects-header">
      <template #left>
        <el-input
          v-model="searchQuery"
          placeholder="搜索项目..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
      </template>
      <template #right>
        <el-button type="primary" @click="projectDialog.openCreate()">
          <el-icon><Plus /></el-icon>
          新建项目
        </el-button>
      </template>
    </PageHeader>

    <ProjectList
      :projects="filteredProjects"
      :selected-id="selectedProject?.id"
      @select="selectProject"
      @edit="projectDialog.openEdit"
      @delete="deleteProject"
      @add="projectDialog.openCreate()"
    />

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
          <el-button size="small" @click="statusDialogVisible = true">
            <el-icon><Setting /></el-icon>
            管理状态
          </el-button>
          <el-button type="primary" size="small" @click="openAddSubtask()">
            <el-icon><Plus /></el-icon>
            添加子任务
          </el-button>
        </div>
      </div>

      <SubtaskBoard
        v-if="subtaskViewMode === 'kanban'"
        :subtasks="selectedProject.subtasks || []"
        :statuses="subtaskStatuses"
        @add="openAddSubtask"
        @edit="subtaskDialog.openEdit"
        @delete="deleteSubtask"
        @move="moveSubtask"
      />

      <SubtaskSwimlane
        v-else-if="subtaskViewMode === 'swimlane'"
        :subtasks="selectedProject.subtasks || []"
        :statuses="subtaskStatuses"
        @move="moveSubtask"
      />

      <SubtaskList
        v-else
        :subtasks="selectedProject.subtasks || []"
        :status-color="getSubtaskStatusColor"
        :status-label="getSubtaskStatusLabel"
        @edit="subtaskDialog.openEdit"
        @delete="deleteSubtask"
      />
    </div>

    <ProjectDialog
      v-model:visible="projectDialog.visible"
      :project="projectDialog.editing"
      :submitting="projectDialog.submitting"
      @submit="submitProject"
    />

    <SubtaskDialog
      v-model:visible="subtaskDialog.visible"
      :subtask="subtaskDialog.editing"
      :statuses="subtaskStatuses"
      :default-status="pendingSubtaskStatus"
      @submit="submitSubtask"
    />

    <ProjectStatusDialog
      v-model:visible="statusDialogVisible"
      :statuses="subtaskStatuses"
      @add="addSubtaskStatus"
      @remove="removeSubtaskStatus"
      @reorder="reorderSubtaskStatus"
      @save="saveSubtaskStatuses"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { PageHeader } from '@/components/index'
import ProjectList from './components/ProjectList.vue'
import SubtaskBoard from './components/SubtaskBoard.vue'
import SubtaskSwimlane from './components/SubtaskSwimlane.vue'
import SubtaskList from './components/SubtaskList.vue'
import ProjectDialog from './components/ProjectDialog.vue'
import SubtaskDialog from './components/SubtaskDialog.vue'
import ProjectStatusDialog from './components/ProjectStatusDialog.vue'
import { useProjects } from './composables/useProjects'

const {
  getSubtaskStatusColor,
  getSubtaskStatusLabel,
  searchQuery,
  filteredProjects,
  selectedProject,
  subtaskViewMode,
  subtaskStatuses,
  statusDialogVisible,
  projectDialog,
  subtaskDialog,
  loadSubtaskStatuses,
  saveSubtaskStatuses,
  addSubtaskStatus,
  removeSubtaskStatus,
  reorderSubtaskStatus,
  selectProject,
  fetchProjects,
  deleteSubtask,
  moveSubtask,
  submitSubtask,
  submitProject,
  deleteProject
} = useProjects()

const pendingSubtaskStatus = ref<string | undefined>()

function openAddSubtask(status?: string) {
  pendingSubtaskStatus.value = status
  subtaskDialog.openCreate()
}

onMounted(() => {
  loadSubtaskStatuses()
  fetchProjects()
})
</script>

<style scoped lang="scss">
.projects-page {
  .projects-header {
    margin-bottom: 20px;

    .search-input {
      width: 300px;
    }
  }
}

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
</style>
