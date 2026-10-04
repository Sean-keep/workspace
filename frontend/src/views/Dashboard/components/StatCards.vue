<template>
  <el-row :gutter="16" class="stats-row">
    <el-col :span="6" :xs="12">
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

    <el-col :span="6" :xs="12">
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

    <el-col :span="6" :xs="12">
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

    <el-col :span="6" :xs="12">
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

// 手机（≤767px）。⚠️ 断点与 stores/ui.ts 的 MOBILE_MEDIA、
// assets/styles/main.scss 的 $bp-mobile 保持同步（768px）。
// 2×2 保持不变（4-up 在 320px 下只有 ~72px 更糟），只把磁贴收窄：
// 48px 图标 + 14px gap 在 ~167px 的卡里吃掉 62px，中文标签必然换行。
@media (max-width: 767px) {
  .stats-row {
    margin-bottom: 12px;
  }

  .stat-card :deep(.el-card__body) {
    gap: 8px;
    padding: 12px 10px;
  }

  .stat-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;

    // el-icon 的 :size="24" 渲染成 inline font-size，普通声明压不过，必须 important
    :deep(.el-icon) {
      font-size: 18px !important;
    }
  }

  .stat-info {
    .stat-value {
      font-size: 18px;
    }

    .stat-label {
      font-size: 12px;
      margin-top: 1px;
      // 内置四个标签都放得下；自定义更长的文案兜底省略，不撑破卡片
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}
</style>
