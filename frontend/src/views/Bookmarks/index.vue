<template>
  <div class="bookmarks-page">
    <PageHeader class="bookmarks-header">
      <template #left>
        <el-input
          v-model="searchQuery"
          placeholder="搜索书签..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
      </template>
      <template #right>
        <el-button type="primary" @click="openAddDialog()">
          <el-icon><Plus /></el-icon>
          添加书签
        </el-button>
      </template>
    </PageHeader>

    <div class="bookmarks-container">
      <div v-for="category in sortedCategories" :key="category.name" class="category-section">
        <div class="category-header">
          <h3>{{ category.name || '未分类' }}</h3>
          <el-tag size="small" type="info">{{ category.bookmarks.length }}</el-tag>
        </div>
        <div class="bookmarks-grid">
          <BookmarkCard
            v-for="bookmark in category.bookmarks"
            :key="bookmark.id"
            :bookmark="bookmark"
            @open="openBookmark"
            @action="handleAction"
          />

          <div class="bookmark-card add-card" @click="openAddDialog(category.name)">
            <el-icon :size="28"><Plus /></el-icon>
            <span>添加书签</span>
          </div>
        </div>
      </div>

      <div v-if="sortedCategories.length === 0" class="empty-state">
        <el-empty description="暂无书签">
          <el-button type="primary" @click="openAddDialog()">添加书签</el-button>
        </el-empty>
      </div>
    </div>

    <BookmarkDialog
      v-model:visible="bookmarkDialog.visible"
      :bookmark="bookmarkDialog.editing"
      :categories="categories"
      :submitting="bookmarkDialog.submitting"
      :default-category="pendingCategory"
      @submit="submitBookmark"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { PageHeader } from '@/components/index'
import BookmarkCard from './components/BookmarkCard.vue'
import BookmarkDialog from './components/BookmarkDialog.vue'
import { useBookmarks } from './composables/useBookmarks'

const {
  searchQuery,
  categories,
  sortedCategories,
  bookmarkDialog,
  fetchBookmarks,
  submitBookmark,
  handleAction,
  openBookmark
} = useBookmarks()

const pendingCategory = ref('')

function openAddDialog(category?: string) {
  pendingCategory.value = category || ''
  bookmarkDialog.openCreate()
}

onMounted(() => {
  fetchBookmarks()
})
</script>

<style scoped lang="scss">
.bookmarks-page {
  .bookmarks-header {
    margin-bottom: 24px;

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

.bookmark-card.add-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #909399;
  border: 1px dashed #dcdfe6;
  min-height: 120px;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;
    color: #409eff;
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}
</style>
