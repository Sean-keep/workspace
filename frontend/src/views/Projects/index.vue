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
          <el-radio-group v-model="subtaskViewMode" size="small" class="view-switch">
            <el-radio-button value="kanban">看板</el-radio-button>
            <el-radio-button value="swimlane">泳道图</el-radio-button>
            <el-radio-button value="list">列表</el-radio-button>
          </el-radio-group>
          <el-button class="section-btn" size="small" @click="statusDialogVisible = true">
            <el-icon><Setting /></el-icon>
            管理状态
          </el-button>
          <el-button class="section-btn" type="primary" size="small" @click="openAddSubtask()">
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
        @edit="subtaskDialog.openEdit"
        @delete="deleteSubtask"
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

// 手机（≤767px）。⚠️ 断点与 stores/ui.ts 的 MOBILE_MEDIA、
// assets/styles/main.scss 的 $bp-mobile 保持同步（768px）。
@media (max-width: 767px) {
  .projects-page .projects-header .search-input {
    width: 100%;
  }

  // 视图切换栏：手机上一行塞不下「radio 组 + 两个按钮」。
  // radio 组独占一行三段铺满，两个按钮平分第二行。
  .subtasks-section .section-header .section-actions {
    width: 100%;
    flex-wrap: wrap;

    // EP 2.14 的 el-radio-group 没有 stretch 属性，只能 CSS 铺满
    .view-switch {
      display: flex;
      flex: 0 0 100%;

      :deep(.el-radio-button) {
        flex: 1;
      }

      // el-radio-button__inner 是 EP 内部 DOM，scoped 的 data-v 到不了，必须 deep
      :deep(.el-radio-button__inner) {
        width: 100%;
        text-align: center;
      }
    }

    .section-btn {
      flex: 1;
    }

    // EP 全局的 .el-button + .el-button { margin-left: 12px } 会把 flex:1 顶成一宽一窄
    .section-btn + .section-btn {
      margin-left: 0;
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
