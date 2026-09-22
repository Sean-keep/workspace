<template>
  <el-dialog
    :model-value="visible"
    title="管理子任务状态"
    width="500px"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="status-management">
      <div class="status-list">
        <div
          v-for="(status, index) in statuses"
          :key="status.value"
          class="status-item"
          draggable="true"
          @dragstart="(e: DragEvent) => onDragStart(e, index)"
          @dragover.prevent
          @drop="(e: DragEvent) => onDrop(e, index)"
        >
          <el-icon class="drag-handle"><Rank /></el-icon>
          <span class="status-dot" :style="{ backgroundColor: status.color }"></span>
          <span class="status-label">{{ status.label }}</span>
          <el-color-picker v-model="status.color" size="small" @change="$emit('save')" />
          <el-button
            v-if="!status.isDefault"
            type="danger"
            :icon="Delete"
            circle
            size="small"
            @click="$emit('remove', index)"
          />
          <el-tag v-else type="info" size="small">默认</el-tag>
        </div>
      </div>

      <div class="add-status">
        <el-input
          v-model="newStatusLabel"
          placeholder="新状态名称"
          style="width: 200px"
          @keyup.enter="handleAdd"
        />
        <el-color-picker v-model="newStatusColor" size="small" />
        <el-button type="primary" @click="handleAdd" :disabled="!newStatusLabel">
          <el-icon><Plus /></el-icon>
          添加状态
        </el-button>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="$emit('save')">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import type { TaskStatus } from '@/types/models'

defineProps<{
  visible: boolean
  statuses: TaskStatus[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  add: [label: string, color: string]
  remove: [index: number]
  reorder: [from: number, to: number]
  save: []
}>()

const newStatusLabel = ref('')
const newStatusColor = ref('#409eff')
let draggedIndex = -1

function handleAdd() {
  if (!newStatusLabel.value) return
  emit('add', newStatusLabel.value, newStatusColor.value)
  newStatusLabel.value = ''
  newStatusColor.value = '#409eff'
}

function onDragStart(e: DragEvent, index: number) {
  draggedIndex = index
  e.dataTransfer!.effectAllowed = 'move'
}

function onDrop(e: DragEvent, targetIndex: number) {
  e.preventDefault()
  if (draggedIndex >= 0 && draggedIndex !== targetIndex) {
    emit('reorder', draggedIndex, targetIndex)
  }
  draggedIndex = -1
}
</script>

<style scoped lang="scss">
.status-management {
  .status-list {
    margin-bottom: 16px;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background-color: #f5f7fa;
    border-radius: 6px;
    margin-bottom: 8px;
    cursor: grab;

    &:hover {
      background-color: #ecf5ff;
    }

    .drag-handle {
      cursor: grab;
      color: #909399;

      &:active {
        cursor: grabbing;
      }
    }

    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .status-label {
      flex: 1;
      font-size: 14px;
      color: #303133;
    }
  }

  .add-status {
    display: flex;
    align-items: center;
    gap: 10px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
  }
}
</style>
