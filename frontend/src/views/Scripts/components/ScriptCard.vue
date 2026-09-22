<template>
  <el-card class="script-card" shadow="hover">
    <div class="card-header">
      <div class="card-title">
        <el-icon :size="20"><Monitor /></el-icon>
        <span>{{ script.title }}</span>
      </div>
      <div class="card-actions">
        <el-tag size="small" type="info">{{ script.language }}</el-tag>
        <el-button type="primary" link @click="$emit('copy', script)">
          <el-icon><CopyDocument /></el-icon>
        </el-button>
        <el-button type="primary" link @click="$emit('edit', script)">编辑</el-button>
        <el-button type="danger" link @click="$emit('delete', script)">删除</el-button>
      </div>
    </div>

    <div v-if="script.description" class="card-desc">
      {{ script.description }}
    </div>

    <div class="card-code">
      <div class="code-header">
        <span class="code-lang">{{ script.language }}</span>
        <el-button size="small" @click="$emit('copy', script)">
          <el-icon><CopyDocument /></el-icon>
          复制
        </el-button>
      </div>
      <pre><code>{{ script.code }}</code></pre>
    </div>

    <div class="card-footer">
      <div v-if="script.tags.length > 0" class="card-tags">
        <el-tag v-for="tag in script.tags" :key="tag" size="small" type="info">
          {{ tag }}
        </el-tag>
      </div>
      <div class="card-meta">
        <span>更新于 {{ formatDate(script.updated_at) }}</span>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { Snippet } from '@/types/models'
import { formatDate } from '../composables/useScripts'

defineProps<{
  script: Snippet
}>()

defineEmits<{
  copy: [script: Snippet]
  edit: [script: Snippet]
  delete: [script: Snippet]
}>()
</script>

<style scoped lang="scss">
.script-card {
  margin-bottom: 16px;

  :deep(.el-card__body) {
    padding: 20px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .card-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 18px;
      font-weight: 600;
      color: #303133;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .card-desc {
    font-size: 14px;
    color: #606266;
    margin-bottom: 16px;
    line-height: 1.6;
  }

  .card-code {
    background-color: #1d1e1f;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;

    .code-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background-color: #2d2d2d;
      border-bottom: 1px solid #3d3d3d;

      .code-lang {
        font-size: 12px;
        color: #909399;
      }
    }

    pre {
      margin: 0;
      padding: 16px;
      overflow-x: auto;

      code {
        font-family: 'Courier New', Consolas, monospace;
        font-size: 13px;
        color: #e5eaf3;
        line-height: 1.6;
      }
    }
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .card-meta {
      font-size: 12px;
      color: #909399;
    }
  }
}
</style>
