<template>
  <div class="dashboard">
    <StatCards :stats="stats" :projects="projects" />

    <el-row :gutter="16">
      <el-col :span="8">
        <RecentTasksCard :tasks="recentTasks" />
      </el-col>
      <el-col :span="8">
        <UpcomingEventsCard :events="upcomingEvents" />
      </el-col>
      <el-col :span="8">
        <ProjectsCard :projects="projects" />
      </el-col>
    </el-row>

    <el-row :gutter="16" class="mt-16">
      <el-col :span="12">
        <TrendChart :trend="stats.task_trend || []" />
      </el-col>
      <el-col :span="12">
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
</style>
