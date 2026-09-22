<template>
  <div class="project-list">
    <div
      v-for="project in projects"
      :key="project.id"
      class="project-card"
      :class="{ active: selectedId === project.id }"
      @click="$emit('select', project)"
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
        <el-button type="primary" link size="small" @click.stop="$emit('edit', project)">编辑</el-button>
        <el-button type="danger" link size="small" @click.stop="$emit('delete', project)">删除</el-button>
      </div>
    </div>

    <div class="project-card add-project" @click="$emit('add')">
      <el-icon :size="24"><Plus /></el-icon>
      <span>新建项目</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '@/types/models'
import {
  getCompletedTasks,
  getPriorityLabel,
  getPriorityType,
  getProjectProgress,
  getStatusLabel,
  getStatusType
} from '../composables/useProjects'

defineProps<{
  projects: Project[]
  selectedId?: number | null
}>()

defineEmits<{
  select: [project: Project]
  edit: [project: Project]
  delete: [project: Project]
  add: []
}>()
</script>

<style scoped lang="scss">
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
</style>
