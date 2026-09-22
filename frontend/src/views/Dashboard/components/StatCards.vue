<template>
  <el-row :gutter="16" class="stats-row">
    <el-col :span="6">
      <el-card class="stat-card" shadow="hover" @click="router.push('/tasks')">
        <div class="stat-icon" style="background-color: #409eff22; color: #409eff">
          <el-icon :size="24"><List /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.tasks?.pending || 0 }}</div>
          <div class="stat-label">待办任务</div>
        </div>
      </el-card>
    </el-col>

    <el-col :span="6">
      <el-card class="stat-card" shadow="hover" @click="router.push('/calendar')">
        <div class="stat-icon" style="background-color: #67c23a22; color: #67c23a">
          <el-icon :size="24"><Calendar /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.events?.today || 0 }}</div>
          <div class="stat-label">今日日程</div>
        </div>
      </el-card>
    </el-col>

    <el-col :span="6">
      <el-card class="stat-card" shadow="hover" @click="router.push('/projects')">
        <div class="stat-icon" style="background-color: #e6a23c22; color: #e6a23c">
          <el-icon :size="24"><Folder /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ projectCount }}</div>
          <div class="stat-label">进行中项目</div>
        </div>
      </el-card>
    </el-col>

    <el-col :span="6">
      <el-card class="stat-card" shadow="hover" @click="router.push('/notes')">
        <div class="stat-icon" style="background-color: #f56c6c22; color: #f56c6c">
          <el-icon :size="24"><Notebook /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.notes || 0 }}</div>
          <div class="stat-label">笔记数量</div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { List, Calendar, Folder, Notebook } from '@element-plus/icons-vue'
import type { DashboardProject, DashboardStats } from '../composables/useDashboard'

const props = defineProps<{
  stats: DashboardStats
  projects: DashboardProject[]
}>()

const router = useRouter()
const projectCount = computed(() => props.projects.length)
</script>

<style scoped lang="scss">
.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  :deep(.el-card__body) {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
  }

  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-top: 2px;
  }
}
</style>
