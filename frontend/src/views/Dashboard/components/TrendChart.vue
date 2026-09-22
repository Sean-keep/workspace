<template>
  <el-card class="chart-card">
    <template #header>
      <div class="card-header">
        <span><el-icon><TrendCharts /></el-icon> 任务完成趋势</span>
        <span class="chart-subtitle">近7天</span>
      </div>
    </template>
    <div class="trend-chart">
      <div class="trend-bars">
        <div v-for="(item, index) in trend" :key="index" class="trend-bar-wrapper">
          <div class="trend-bar-container">
            <div class="trend-bar" :style="{ height: getBarHeight(item.count) + '%' }"></div>
          </div>
          <div class="trend-label">{{ item.date }}</div>
          <div class="trend-value">{{ item.count }}</div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { TrendCharts } from '@element-plus/icons-vue'

const props = defineProps<{ trend: { date: string; count: number }[] }>()

const maxCount = computed(() => Math.max(...props.trend.map((t) => t.count), 1))

function getBarHeight(count: number) {
  return Math.max((count / maxCount.value) * 100, 5)
}
</script>

<style scoped lang="scss">
.chart-card {
  height: 280px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    span {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }

    .chart-subtitle {
      font-size: 12px;
      color: #909399;
      font-weight: normal;
    }
  }
}

.trend-chart {
  height: 200px;
  padding: 10px 0;
}

.trend-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 100%;
  gap: 8px;
}

.trend-bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.trend-bar-container {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.trend-bar {
  width: 70%;
  background: linear-gradient(180deg, #409eff 0%, #79bbff 100%);
  border-radius: 4px 4px 0 0;
  min-height: 4px;
  transition: height 0.3s;
}

.trend-label {
  font-size: 11px;
  color: #909399;
  margin-top: 6px;
}

.trend-value {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  margin-top: 2px;
}
</style>
