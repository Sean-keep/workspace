<template>
  <div class="notes-page">
    <!-- 浏览模式 -->
    <NotesTable
      v-if="mode === 'browse'"
      :notes="filteredNotes"
      :loading="loading"
      :search-query="searchQuery"
      @update:search-query="searchQuery = $event"
      @view="note => openNote(note, false)"
      @edit="note => openNote(note, true)"
      @delete="deleteNote"
      @create="createNote"
    />

    <!-- 查看/编辑模式 -->
    <div v-else class="edit-mode">
      <div class="edit-header">
        <div class="edit-header-left">
          <el-button @click="backToList">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <el-tag>笔记</el-tag>
        </div>
        <div class="edit-header-right">
          <template v-if="isEditing">
            <el-button @click="cancelEdit">取消</el-button>
            <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
          </template>
          <template v-else>
            <el-dropdown @command="handleAction">
              <el-button>
                更多
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="pin">
                    {{ currentNote?.is_pinned ? '取消置顶' : '置顶' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="favorite">
                    {{ currentNote?.is_favorite ? '取消收藏' : '收藏' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button type="primary" @click="startEdit">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </template>
        </div>
      </div>

      <NoteEditor
        v-if="isEditing && currentNote"
        ref="editorRef"
        :note="currentNote"
      />
      <NoteViewer
        v-else-if="currentNote"
        :note="currentNote"
        :rendered-content="renderedContent"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import NotesTable from './components/NotesTable.vue'
import NoteViewer from './components/NoteViewer.vue'
import NoteEditor, { type NoteEditForm } from './components/NoteEditor.vue'
import { useNotes } from './composables/useNotes'

const {
  filteredNotes,
  loading,
  currentNote,
  searchQuery,
  mode,
  isEditing,
  saving,
  renderedContent,
  fetchNotes,
  openNote,
  startEdit,
  cancelEdit,
  backToList,
  saveNote,
  createNote,
  deleteNote,
  handleAction
} = useNotes()

const editorRef = ref<InstanceType<typeof NoteEditor> | null>(null)

async function handleSave() {
  const form = editorRef.value?.getForm() as NoteEditForm | undefined
  if (!form) return
  await saveNote(form)
}

onMounted(() => {
  fetchNotes()
})
</script>

<style scoped lang="scss">
.notes-page {
  background-color: #fff;
  border-radius: 8px;
  min-height: calc(100vh - 120px);
}

// 手机（≤767px）。⚠️ 断点与 stores/ui.ts 的 MOBILE_MEDIA、
// assets/styles/main.scss 的 $bp-mobile 保持同步（768px）。
// 100vh 在 Android Chrome 上会被地址栏裁掉，100dvh 才是真实可视高度。
@media (max-width: 767px) {
  .notes-page {
    min-height: calc(100dvh - 120px);
  }
}

.edit-mode {
  .edit-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;

    .edit-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .edit-header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
  }
}
</style>
