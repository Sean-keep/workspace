<template>
  <div class="notes-page">
    <!-- 浏览模式 -->
    <div v-if="mode === 'browse'" class="browse-mode">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <el-input
            v-model="searchQuery"
            placeholder="搜索笔记..."
            prefix-icon="Search"
            clearable
            class="search-input"
          />
          <el-select v-model="filterType" placeholder="类型" clearable>
            <el-option label="全部" value="" />
            <el-option label="笔记" value="note" />
            <el-option label="清单" value="checklist" />
          </el-select>
        </div>
        <el-dropdown @command="createNoteByType">
          <el-button type="primary">
            <el-icon><Plus /></el-icon>
            新建
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="note">
                <el-icon><Document /></el-icon>
                新建笔记
              </el-dropdown-item>
              <el-dropdown-item command="checklist">
                <el-icon><Finished /></el-icon>
                新建清单
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <!-- Notes List -->
      <el-table
        :data="filteredNotes"
        style="width: 100%"
        @row-click="viewNote"
        row-class-name="clickable-row"
      >
        <el-table-column width="40">
          <template #default="{ row }">
            <el-icon :size="18">
              <Finished v-if="row.note_type === 'checklist'" />
              <Document v-else />
            </el-icon>
          </template>
        </el-table-column>

        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div class="title-cell">
              <el-tag v-if="row.is_pinned" size="small" type="warning" class="mr-2">置顶</el-tag>
              <el-tag v-if="row.is_favorite" size="small" type="danger" class="mr-2">收藏</el-tag>
              <span class="title-text">{{ row.title }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="内容预览" min-width="300">
          <template #default="{ row }">
            <div class="preview-cell">
              <!-- 清单预览 -->
              <template v-if="row.note_type === 'checklist'">
                <div class="checklist-info">
                  <el-progress
                    :percentage="getChecklistProgress(row)"
                    :stroke-width="4"
                    :show-text="false"
                    style="width: 60px;"
                  />
                  <span>{{ getCheckedCount(row) }}/{{ row.checklist_items?.length || 0 }}</span>
                </div>
              </template>
              <!-- 笔记预览 -->
              <template v-else>
                <span class="preview-text">{{ getContentPreview(row.content) }}</span>
              </template>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="标签" width="200">
          <template #default="{ row }">
            <div class="tags-cell">
              <el-tag v-for="tag in row.tags?.slice(0, 2)" :key="tag" size="small" type="info">
                {{ tag }}
              </el-tag>
              <span v-if="row.tags?.length > 2" class="more-tags">+{{ row.tags.length - 2 }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="150">
          <template #default="{ row }">
            <span class="time-text">{{ formatDate(row.updated_at) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click.stop="editNote(row)">
              编辑
            </el-button>
            <el-button type="danger" link @click.stop="deleteNote(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="filteredNotes.length === 0" description="暂无笔记" />
    </div>

    <!-- 查看/编辑模式 -->
    <div v-else class="edit-mode">
      <div class="edit-header">
        <div class="edit-header-left">
          <el-button @click="backToList">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <el-tag v-if="currentNote.note_type === 'checklist'" type="success">清单</el-tag>
          <el-tag v-else>笔记</el-tag>
        </div>
        <div class="edit-header-right">
          <template v-if="isEditing">
            <el-button @click="cancelEdit">取消</el-button>
            <el-button type="primary" :loading="saving" @click="saveNote">
              保存
            </el-button>
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
                    {{ currentNote.is_pinned ? '取消置顶' : '置顶' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="favorite">
                    {{ currentNote.is_favorite ? '取消收藏' : '收藏' }}
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

      <div class="edit-content">
        <!-- 标题 -->
        <div class="note-title">
          <template v-if="isEditing">
            <el-input
              v-model="editForm.title"
              placeholder="笔记标题"
              class="title-input"
            />
          </template>
          <template v-else>
            <h1>{{ currentNote.title }}</h1>
          </template>
        </div>

        <!-- 标签 -->
        <div class="note-tags">
          <template v-if="isEditing">
            <el-tag
              v-for="tag in editForm.tags"
              :key="tag"
              closable
              @close="removeTag(tag)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              v-if="tagInputVisible"
              ref="tagInputRef"
              v-model="newTag"
              class="tag-input"
              size="small"
              @keyup.enter="addTag"
              @blur="addTag"
            />
            <el-button v-else size="small" @click="showTagInput">
              + 添加标签
            </el-button>
          </template>
          <template v-else>
            <el-tag v-for="tag in currentNote.tags" :key="tag" type="info">
              {{ tag }}
            </el-tag>
          </template>
        </div>

        <!-- 内容区域 -->
        <div class="note-body">
          <!-- 清单 -->
          <template v-if="currentNote.note_type === 'checklist'">
            <div class="checklist-container">
              <div
                v-for="(item, index) in (isEditing ? editForm.checklist_items : currentNote.checklist_items)"
                :key="index"
                class="checklist-item"
              >
                <el-checkbox
                  v-model="item.checked"
                  :disabled="!isEditing"
                />
                <template v-if="isEditing">
                  <el-input
                    v-model="item.text"
                    class="item-input"
                    placeholder="输入内容..."
                    @keyup.enter="addChecklistItem(index)"
                  />
                  <el-button
                    type="danger"
                    :icon="Delete"
                    circle
                    size="small"
                    @click="removeChecklistItem(index)"
                  />
                </template>
                <template v-else>
                  <span :class="{ 'checked': item.checked }">{{ item.text }}</span>
                </template>
              </div>
              <div v-if="isEditing" class="add-checklist-item" @click="addChecklistItem()">
                <el-icon><Plus /></el-icon>
                <span>添加项目</span>
              </div>
              <div class="checklist-stats">
                已完成 {{ getCheckedCount(isEditing ? editForm : currentNote) }} / {{ (isEditing ? editForm.checklist_items : currentNote.checklist_items)?.length || 0 }} 项
              </div>
            </div>
          </template>

          <!-- 笔记内容 -->
          <template v-else>
            <template v-if="isEditing">
              <el-input
                v-model="editForm.content"
                type="textarea"
                :rows="20"
                placeholder="开始编写..."
              />
            </template>
            <template v-else>
              <div class="note-content" v-html="renderedContent" />
            </template>
          </template>
        </div>

        <div class="note-meta">
          创建于 {{ formatDate(currentNote.created_at) }} | 更新于 {{ formatDate(currentNote.updated_at) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, ArrowLeft, ArrowDown, Edit } from '@element-plus/icons-vue'
import api from '@/utils/api'
import dayjs from 'dayjs'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()

const notes = ref<any[]>([])
const currentNote = ref<any>(null)
const searchQuery = ref('')
const filterType = ref('')
const mode = ref<'browse' | 'edit'>('browse')
const isEditing = ref(false)
const saving = ref(false)
const tagInputVisible = ref(false)
const newTag = ref('')
const tagInputRef = ref<any>(null)

const editForm = reactive({
  title: '',
  content: '',
  tags: [] as string[],
  checklist_items: [] as any[]
})

const filteredNotes = computed(() => {
  let result = [...notes.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(n =>
      n.title.toLowerCase().includes(query) ||
      n.content?.toLowerCase().includes(query)
    )
  }

  if (filterType.value) {
    result = result.filter(n => n.note_type === filterType.value)
  }

  result.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  })

  return result
})

const renderedContent = computed(() => {
  if (!currentNote.value?.content) return ''
  return md.render(currentNote.value.content)
})

onMounted(() => {
  fetchNotes()
})

async function fetchNotes() {
  try {
    const res: any = await api.get('/notes')
    notes.value = res.data
  } catch (error) {
    console.error('Failed to fetch notes:', error)
  }
}

function viewNote(row: any) {
  currentNote.value = { ...row, checklist_items: row.checklist_items ? [...row.checklist_items] : [] }
  isEditing.value = false
  mode.value = 'edit'
}

function editNote(row: any) {
  currentNote.value = { ...row, checklist_items: row.checklist_items ? [...row.checklist_items] : [] }
  startEdit()
  mode.value = 'edit'
}

function startEdit() {
  editForm.title = currentNote.value.title
  editForm.content = currentNote.value.content || ''
  editForm.tags = [...(currentNote.value.tags || [])]
  editForm.checklist_items = currentNote.value.checklist_items
    ? currentNote.value.checklist_items.map((item: any) => ({ ...item }))
    : []
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

function backToList() {
  mode.value = 'browse'
  currentNote.value = null
  isEditing.value = false
  fetchNotes()
}

async function saveNote() {
  if (!currentNote.value) return

  saving.value = true
  try {
    const updateData: any = {
      title: editForm.title,
      tags: editForm.tags,
      note_type: currentNote.value.note_type
    }

    if (currentNote.value.note_type === 'checklist') {
      updateData.checklist_items = editForm.checklist_items.filter(
        (item: any) => item.text.trim() !== ''
      )
    } else {
      updateData.content = editForm.content
    }

    await api.put(`/notes/${currentNote.value.id}`, updateData)

    // Update current note
    currentNote.value.title = editForm.title
    currentNote.value.content = editForm.content
    currentNote.value.tags = [...editForm.tags]
    currentNote.value.checklist_items = [...editForm.checklist_items]

    isEditing.value = false
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('Failed to save note:', error)
  } finally {
    saving.value = false
  }
}

async function createNoteByType(type: string) {
  try {
    const data: any = {
      title: type === 'checklist' ? '新建清单' : '新建笔记',
      note_type: type
    }

    if (type === 'checklist') {
      data.checklist_items = [{ text: '', checked: false }]
    } else {
      data.content = ''
    }

    const res: any = await api.post('/notes', data)
    notes.value.unshift(res.data)
    editNote(res.data)
  } catch (error) {
    console.error('Failed to create note:', error)
  }
}

async function deleteNote(row: any) {
  try {
    await ElMessageBox.confirm('确定要删除这个笔记吗？', '提示', {
      type: 'warning'
    })
    await api.delete(`/notes/${row.id}`)
    notes.value = notes.value.filter(n => n.id !== row.id)
    if (currentNote.value?.id === row.id) {
      backToList()
    }
    ElMessage.success('笔记已删除')
  } catch (error) {
    // Cancelled
  }
}

async function handleAction(command: string) {
  if (!currentNote.value) return

  switch (command) {
    case 'pin':
      try {
        await api.put(`/notes/${currentNote.value.id}`, { is_pinned: !currentNote.value.is_pinned })
        currentNote.value.is_pinned = !currentNote.value.is_pinned
      } catch (error) {
        console.error('Failed to update note:', error)
      }
      break
    case 'favorite':
      try {
        await api.put(`/notes/${currentNote.value.id}`, { is_favorite: !currentNote.value.is_favorite })
        currentNote.value.is_favorite = !currentNote.value.is_favorite
      } catch (error) {
        console.error('Failed to update note:', error)
      }
      break
    case 'delete':
      await deleteNote(currentNote.value)
      break
  }
}

function addChecklistItem(index?: number) {
  const items = isEditing.value ? editForm.checklist_items : currentNote.value?.checklist_items
  if (!items) return

  const newItem = { text: '', checked: false }

  if (index !== undefined) {
    items.splice(index + 1, 0, newItem)
  } else {
    items.push(newItem)
  }

  nextTick(() => {
    const inputs = document.querySelectorAll('.checklist-item .el-input__inner')
    const targetIndex = index !== undefined ? index + 1 : items.length - 1
    if (inputs[targetIndex]) {
      (inputs[targetIndex] as HTMLInputElement).focus()
    }
  })
}

function removeChecklistItem(index: number) {
  const items = isEditing.value ? editForm.checklist_items : currentNote.value?.checklist_items
  if (!items) return
  items.splice(index, 1)
}

function showTagInput() {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

function addTag() {
  if (newTag.value) {
    if (!editForm.tags.includes(newTag.value)) {
      editForm.tags.push(newTag.value)
    }
  }
  tagInputVisible.value = false
  newTag.value = ''
}

function removeTag(tag: string) {
  editForm.tags = editForm.tags.filter(t => t !== tag)
}

function getCheckedCount(note: any) {
  if (!note?.checklist_items) return 0
  return note.checklist_items.filter((item: any) => item.checked).length
}

function getChecklistProgress(note: any) {
  if (!note?.checklist_items?.length) return 0
  return Math.round((getCheckedCount(note) / note.checklist_items.length) * 100)
}

function getContentPreview(content: string) {
  if (!content) return '暂无内容'
  return content.substring(0, 80) + (content.length > 80 ? '...' : '')
}

function formatDate(date: string) {
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.notes-page {
  background-color: #fff;
  border-radius: 8px;
  min-height: calc(100vh - 120px);
}

// 浏览模式
.browse-mode {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid #ebeef5;

    .header-left {
      display: flex;
      gap: 12px;
    }

    .search-input {
      width: 300px;
    }
  }

  .el-table {
    .clickable-row {
      cursor: pointer;
    }

    .title-cell {
      display: flex;
      align-items: center;

      .mr-2 {
        margin-right: 8px;
      }

      .title-text {
        font-weight: 500;
      }
    }

    .preview-cell {
      .checklist-info {
        display: flex;
        align-items: center;
        gap: 10px;

        span {
          font-size: 12px;
          color: #909399;
        }
      }

      .preview-text {
        font-size: 13px;
        color: #606266;
      }
    }

    .tags-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;

      .more-tags {
        font-size: 12px;
        color: #909399;
      }
    }

    .time-text {
      font-size: 13px;
      color: #909399;
    }
  }
}

// 编辑模式
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

  .edit-content {
    padding: 20px;
    max-width: 900px;
    margin: 0 auto;
  }

  .note-title {
    margin-bottom: 16px;

    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }

    .title-input {
      :deep(.el-input__inner) {
        font-size: 24px;
        font-weight: 600;
      }
    }
  }

  .note-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid #ebeef5;

    .tag-input {
      width: 100px;
    }
  }

  .note-body {
    margin-bottom: 20px;
  }

  .note-content {
    font-size: 15px;
    line-height: 1.8;
    color: #303133;

    :deep(h1), :deep(h2), :deep(h3) {
      margin-top: 20px;
      margin-bottom: 10px;
    }

    :deep(p) {
      margin-bottom: 12px;
    }

    :deep(code) {
      background-color: #f5f7fa;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
    }

    :deep(pre) {
      background-color: #1d1e1f;
      color: #e5eaf3;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }

    :deep(ul), :deep(ol) {
      padding-left: 24px;
      margin-bottom: 12px;
    }
  }

  .note-meta {
    font-size: 13px;
    color: #909399;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
  }
}

// 清单样式
.checklist-container {
  .checklist-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #f5f7fa;

    &:last-of-type {
      border-bottom: none;
    }

    .item-input {
      flex: 1;
    }

    .checked {
      text-decoration: line-through;
      color: #c0c4cc;
    }
  }

  .add-checklist-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 0;
    color: #909399;
    cursor: pointer;

    &:hover {
      color: #409eff;
    }
  }

  .checklist-stats {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;
    font-size: 14px;
    color: #909399;
  }
}

:deep(.el-table .el-table__row) {
  cursor: pointer;
}
</style>
