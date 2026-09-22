<template>
  <el-dialog
    :model-value="visible"
    title="管理任务状态"
    width="650px"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="status-management">
      <div class="status-tip">
        <el-icon><InfoFilled /></el-icon>
        <span>拖拽状态项可以调整顺序，状态颜色会显示在看板列头和任务标签上</span>
      </div>
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
          <div class="status-info">
            <el-icon class="drag-handle"><Rank /></el-icon>
            <span class="status-dot" :style="{ backgroundColor: status.color }"></span>
            <el-input v-model="status.label" size="small" style="width: 120px" />
            <el-color-picker v-model="status.color" size="small" />
          </div>
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
  .status-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background-color: #ecf5ff;
    border-radius: 6px;
    margin-bottom: 16px;
    font-size: 13px;
    color: #409eff;
  }

  .status-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .status-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    margin-bottom: 8px;
    background-color: #f5f7fa;
    border-radius: 6px;
    cursor: move;
    transition: all 0.2s;

    &:hover {
      background-color: #ecf5ff;
    }

    .status-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .drag-handle {
        color: #c0c4cc;
        cursor: move;

        &:hover {
          color: #909399;
        }
      }

      .status-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
      }
    }
  }

  .add-status {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
  }
}
</style>
