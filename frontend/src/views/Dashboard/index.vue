<template>
  <div class="dashboard">
    <StatCards :stats="stats" :projects="projects" />

    <!-- :xs 在 ≤767px 全宽堆叠 —— 正好是 Element Plus 的 xs 边界，也是本项目的手机断点 -->
    <el-row :gutter="16">
      <el-col :span="8" :xs="24">
        <RecentTasksCard :tasks="recentTasks" />
      </el-col>
      <el-col :span="8" :xs="24">
        <UpcomingEventsCard :events="upcomingEvents" />
      </el-col>
      <el-col :span="8" :xs="24">
        <ProjectsCard :projects="projects" />
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16">
      <el-col :span="12" :xs="24">
        <TrendChart :trend="stats.task_trend || []" />
      </el-col>
      <el-col :span="12" :xs="24">
        <RecentNotesCard :notes="recentNotes" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import StatCards from './components/StatCards.vue'
import RecentTasksCard from './components/RecentTasksCard.vue'
import UpcomingEventsCard from './components/UpcomingEventsCard.vue'
import ProjectsCard from './components/ProjectsCard.vue'
import TrendChart from './components/TrendChart.vue'
import RecentNotesCard from './components/RecentNotesCard.vue'
import { useDashboard } from './composables/useDashboard'

const { stats, recentTasks, upcomingEvents, projects, recentNotes } = useDashboard()
</script>

<style scoped lang="scss">
.dashboard {
  .mt-16 {
    margin-top: 16px;
  }
}

// 手机（≤767px）。⚠️ 断点与 stores/ui.ts 的 MOBILE_MEDIA、
// assets/styles/main.scss 的 $bp-mobile 保持同步（768px）。
// 这个 .mt-16 挂在 el-row 上，不在 .list-card 子树里 —— card-shared 的那条命中不到它。
@media (max-width: 767px) {
  .dashboard .mt-16 {
    margin-top: 12px;
  }
}
</style>
