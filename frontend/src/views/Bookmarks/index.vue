<template>
  <div class="bookmarks-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索书签..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
      </div>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        添加书签
      </el-button>
    </div>

    <!-- Bookmarks by Category -->
    <div class="bookmarks-container">
      <div v-for="category in sortedCategories" :key="category.name" class="category-section">
        <div class="category-header">
          <h3>{{ category.name || '未分类' }}</h3>
          <el-tag size="small" type="info">{{ category.bookmarks.length }}</el-tag>
        </div>
        <div class="bookmarks-grid">
          <div
            v-for="bookmark in category.bookmarks"
            :key="bookmark.id"
            class="bookmark-card"
            @dblclick="openBookmark(bookmark)"
          >
            <div class="card-header">
              <div class="favicon-wrapper">
                <img
                  :src="getFaviconUrl(bookmark.url)"
                  class="favicon"
                  @error="handleFaviconError"
                  loading="lazy"
                />
              </div>
              <el-dropdown @command="(cmd: string) => handleAction(cmd, bookmark)">
                <el-icon class="card-more"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="open">打开链接</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <div class="card-title">{{ bookmark.title }}</div>
            <div class="card-url">{{ getDomain(bookmark.url) }}</div>
            <div v-if="bookmark.description" class="card-desc">{{ bookmark.description }}</div>
            <div class="card-footer">
              <div v-if="bookmark.tags?.length" class="card-tags">
                <el-tag v-for="tag in bookmark.tags.slice(0, 2)" :key="tag" size="small" type="info">
                  {{ tag }}
                </el-tag>
              </div>
              <span class="visit-count">访问 {{ bookmark.visit_count }} 次</span>
            </div>
            <div class="dblclick-hint">双击打开</div>
          </div>

          <!-- Add Card -->
          <div class="bookmark-card add-card" @click="showAddDialog(category.name)">
            <el-icon :size="28"><Plus /></el-icon>
            <span>添加书签</span>
          </div>
        </div>
      </div>

      <!-- Empty state for no categories -->
      <div v-if="sortedCategories.length === 0" class="empty-state">
        <el-empty description="暂无书签">
          <el-button type="primary" @click="showAddDialog()">添加书签</el-button>
        </el-empty>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingBookmark ? '编辑书签' : '添加书签'"
      width="500px"
    >
      <el-form
        ref="bookmarkFormRef"
        :model="bookmarkForm"
        :rules="bookmarkRules"
        label-width="80px"
      >
        <el-form-item label="网址" prop="url">
          <el-input v-model="bookmarkForm.url" placeholder="请输入网址" @blur="fetchTitle">
            <template #prepend>
              <el-icon><Link /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="标题" prop="title">
          <el-input v-model="bookmarkForm.title" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="bookmarkForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入描述"
          />
        </el-form-item>

        <el-form-item label="分类" prop="category">
          <el-select
            v-model="bookmarkForm.category"
            filterable
            allow-create
            default-first-option
            placeholder="选择或创建分类"
          >
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="bookmarkForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="添加标签"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ editingBookmark ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { MoreFilled } from '@element-plus/icons-vue'
import api from '@/utils/api'

const bookmarks = ref<any[]>([])
const searchQuery = ref('')
const dialogVisible = ref(false)
const editingBookmark = ref<any>(null)
const submitting = ref(false)
const bookmarkFormRef = ref<FormInstance>()

const categories = computed(() => {
  const cats = new Set(bookmarks.value.map(b => b.category).filter(Boolean))
  return Array.from(cats)
})

const sortedCategories = computed(() => {
  const categoryMap = new Map<string, any[]>()

  // Filter by search
  let filtered = [...bookmarks.value]
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(b =>
      b.title.toLowerCase().includes(query) ||
      b.url.toLowerCase().includes(query) ||
      b.description?.toLowerCase().includes(query)
    )
  }

  // Group by category
  filtered.forEach(b => {
    const cat = b.category || ''
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, [])
    }
    categoryMap.get(cat)!.push(b)
  })

  // Convert to array and sort
  const result = Array.from(categoryMap.entries()).map(([name, bookmarks]) => ({
    name,
    bookmarks
  }))

  // Sort: named categories first, then empty
  result.sort((a, b) => {
    if (!a.name) return 1
    if (!b.name) return -1
    return a.name.localeCompare(b.name)
  })

  return result
})

const bookmarkForm = reactive({
  url: '',
  title: '',
  description: '',
  category: '',
  tags: [] as string[]
})

const bookmarkRules: FormRules = {
  url: [
    { required: true, message: '请输入网址', trigger: 'blur' }
  ],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

onMounted(() => {
  fetchBookmarks()
})

async function fetchBookmarks() {
  try {
    const res: any = await api.get('/bookmarks')
    bookmarks.value = res.data
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error)
  }
}

// Generate favicon URL using Google's favicon service
function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch {
    return ''
  }
}

// Handle favicon load error
function handleFaviconError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
}

// Get domain from URL
function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

// Fetch title from URL (placeholder - would need backend support)
async function fetchTitle() {
  if (!bookmarkForm.url || bookmarkForm.title) return
  // Auto-generate a title from URL
  try {
    const domain = new URL(bookmarkForm.url).hostname
    bookmarkForm.title = domain.replace('www.', '').split('.')[0]
  } catch {
    // Ignore
  }
}

function showAddDialog(category?: string) {
  editingBookmark.value = null
  bookmarkForm.url = ''
  bookmarkForm.title = ''
  bookmarkForm.description = ''
  bookmarkForm.category = category || ''
  bookmarkForm.tags = []
  dialogVisible.value = true
}

function editBookmark(bookmark: any) {
  editingBookmark.value = bookmark
  bookmarkForm.url = bookmark.url
  bookmarkForm.title = bookmark.title
  bookmarkForm.description = bookmark.description || ''
  bookmarkForm.category = bookmark.category
  bookmarkForm.tags = bookmark.tags || []
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await bookmarkFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingBookmark.value) {
      await api.put(`/bookmarks/${editingBookmark.value.id}`, bookmarkForm)
      ElMessage.success('书签已更新')
    } else {
      await api.post('/bookmarks', bookmarkForm)
      ElMessage.success('书签已添加')
    }
    dialogVisible.value = false
    fetchBookmarks()
  } catch (error) {
    // Error handled by interceptor
  } finally {
    submitting.value = false
  }
}

async function deleteBookmark(bookmark: any) {
  try {
    await ElMessageBox.confirm('确定要删除这个书签吗？', '提示', {
      type: 'warning'
    })
    await api.delete(`/bookmarks/${bookmark.id}`)
    ElMessage.success('书签已删除')
    fetchBookmarks()
  } catch (error) {
    // Cancelled
  }
}

function handleAction(cmd: string, bookmark: any) {
  if (cmd === 'edit') editBookmark(bookmark)
  if (cmd === 'delete') deleteBookmark(bookmark)
  if (cmd === 'open') openBookmark(bookmark)
}

function openBookmark(bookmark: any) {
  window.open(bookmark.url, '_blank')
}
</script>

<style scoped lang="scss">
.bookmarks-page {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;

    .header-left {
      display: flex;
      gap: 12px;
    }

    .search-input {
      width: 300px;
    }
  }
}

.bookmarks-container {
  .category-section {
    margin-bottom: 32px;

    .category-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #ebeef5;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }
    }
  }
}

.bookmarks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.bookmark-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  border: 1px solid #ebeef5;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  &.add-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #909399;
    border: 1px dashed #dcdfe6;
    min-height: 120px;

    &:hover {
      border-color: #409eff;
      color: #409eff;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;

    .favicon-wrapper {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      overflow: hidden;
      background-color: #f5f7fa;
      display: flex;
      align-items: center;
      justify-content: center;

      .favicon {
        width: 20px;
        height: 20px;
        object-fit: contain;
      }
    }

    .card-more {
      color: #909399;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;

      &:hover {
        color: #409eff;
        background-color: #f5f7fa;
      }
    }
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-url {
    font-size: 12px;
    color: #909399;
    margin-bottom: 8px;
  }

  .card-desc {
    font-size: 13px;
    color: #606266;
    margin-bottom: 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-tags {
      display: flex;
      gap: 4px;
    }

    .visit-count {
      font-size: 12px;
      color: #c0c4cc;
    }
  }

  .dblclick-hint {
    position: absolute;
    bottom: 8px;
    right: 8px;
    font-size: 11px;
    color: #c0c4cc;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover .dblclick-hint {
    opacity: 1;
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}
</style>
