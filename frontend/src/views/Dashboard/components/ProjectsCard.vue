<template>
  <el-card class="list-card">
    <template #header>
      <div class="card-header">
        <span><el-icon><Folder /></el-icon> 项目进度</span>
        <el-button type="primary" link @click="router.push('/projects')">查看全部</el-button>
      </div>
    </template>
    <div class="list-scroll project-list">
      <div
        v-for="project in projects.slice(0, 5)"
        :key="project.id"
        class="project-item"
        @click="router.push('/projects')"
      >
        <div class="project-info">
          <div class="project-name">
            <span class="project-dot" :style="{ backgroundColor: project.color || '#409eff' }"></span>
            {{ project.name }}
          </div>
          <span class="project-count">
            {{ getProjectCompletedCount(project) }}/{{ project.subtasks?.length || 0 }}
          </span>
        </div>
        <el-progress :percentage="getProjectProgress(project)" :stroke-width="6" :show-text="false" />
      </div>
      <el-empty v-if="projects.length === 0" description="暂无项目" :image-size="60" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Folder } from '@element-plus/icons-vue'
import {
  getProjectCompletedCount,
  getProjectProgress,
  type DashboardProject
} from '../composables/useDashboard'

defineProps<{ projects: DashboardProject[] }>()

const router = useRouter()
</script>

<style scoped lang="scss">
@use './card-shared.scss' as *;

.project-item {
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f5f7fa;
    margin: 0 -20px;
    padding: 10px 20px;
  }

  .project-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;

    .project-name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #303133;
      font-weight: 500;
    }

    .project-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .project-count {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
