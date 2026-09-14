<template>
  <div class="snippets-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索代码片段..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-select v-model="filterLanguage" placeholder="语言" clearable>
          <el-option
            v-for="lang in languages"
            :key="lang"
            :label="lang"
            :value="lang"
          />
        </el-select>
      </div>
      <el-button type="primary" @click="showAddDialog">
        <el-icon><Plus /></el-icon>
        新建片段
      </el-button>
    </div>

    <!-- Snippets List -->
    <div class="snippets-list">
      <div
        v-for="snippet in filteredSnippets"
        :key="snippet.id"
        class="snippet-card"
      >
        <div class="card-header">
          <div class="card-title">
            <el-icon><Document /></el-icon>
            <span>{{ snippet.title }}</span>
          </div>
          <div class="card-actions">
            <el-tag size="small">{{ snippet.language }}</el-tag>
            <el-button type="primary" link @click="copySnippet(snippet)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
            <el-button type="primary" link @click="editSnippet(snippet)">
              编辑
            </el-button>
            <el-button type="danger" link @click="deleteSnippet(snippet)">
              删除
            </el-button>
          </div>
        </div>

        <div v-if="snippet.description" class="card-desc">
          {{ snippet.description }}
        </div>

        <div class="card-code">
          <pre><code>{{ snippet.code }}</code></pre>
        </div>

        <div v-if="snippet.tags.length > 0" class="card-tags">
          <el-tag
            v-for="tag in snippet.tags"
            :key="tag"
            size="small"
            type="info"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>

      <el-empty v-if="filteredSnippets.length === 0" description="暂无代码片段" />
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingSnippet ? '编辑片段' : '新建片段'"
      width="700px"
    >
      <el-form
        ref="snippetFormRef"
        :model="snippetForm"
        :rules="snippetRules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="snippetForm.title" placeholder="请输入标题" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="snippetForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入描述"
          />
        </el-form-item>

        <el-form-item label="语言" prop="language">
          <el-select
            v-model="snippetForm.language"
            filterable
            allow-create
            default-first-option
            placeholder="选择语言"
          >
            <el-option
              v-for="lang in commonLanguages"
              :key="lang"
              :label="lang"
              :value="lang"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="代码" prop="code">
          <el-input
            v-model="snippetForm.code"
            type="textarea"
            :rows="12"
            placeholder="粘贴代码..."
            class="code-textarea"
          />
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="snippetForm.tags"
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
          {{ editingSnippet ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { CopyDocument } from '@element-plus/icons-vue'
import api from '@/utils/api'

const snippets = ref<any[]>([])
const searchQuery = ref('')
const filterLanguage = ref('')
const dialogVisible = ref(false)
const editingSnippet = ref<any>(null)
const submitting = ref(false)
const snippetFormRef = ref<FormInstance>()

const commonLanguages = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go',
  'Rust', 'C', 'C++', 'C#', 'PHP',
  'Ruby', 'Swift', 'Kotlin', 'SQL', 'Shell',
  'HTML', 'CSS', 'Vue', 'React', 'JSON',
  'YAML', 'Markdown', 'Dockerfile', 'Nginx'
]

const languages = computed(() => {
  const langs = new Set(snippets.value.map(s => s.language).filter(Boolean))
  return Array.from(langs)
})

const filteredSnippets = computed(() => {
  let result = [...snippets.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(s =>
      s.title.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query)
    )
  }

  if (filterLanguage.value) {
    result = result.filter(s => s.language === filterLanguage.value)
  }

  return result
})

const snippetForm = reactive({
  title: '',
  description: '',
  language: 'JavaScript',
  code: '',
  tags: [] as string[]
})

const snippetRules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  code: [{ required: true, message: '请输入代码', trigger: 'blur' }]
}

onMounted(() => {
  fetchSnippets()
})

async function fetchSnippets() {
  try {
    const res: any = await api.get('/snippets')
    snippets.value = res.data
  } catch (error) {
    console.error('Failed to fetch snippets:', error)
  }
}

function showAddDialog() {
  editingSnippet.value = null
  snippetForm.title = ''
  snippetForm.description = ''
  snippetForm.language = 'JavaScript'
  snippetForm.code = ''
  snippetForm.tags = []
  dialogVisible.value = true
}

function editSnippet(snippet: any) {
  editingSnippet.value = snippet
  snippetForm.title = snippet.title
  snippetForm.description = snippet.description || ''
  snippetForm.language = snippet.language
  snippetForm.code = snippet.code
  snippetForm.tags = snippet.tags || []
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await snippetFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingSnippet.value) {
      await api.put(`/snippets/${editingSnippet.value.id}`, snippetForm)
      ElMessage.success('片段已更新')
    } else {
      await api.post('/snippets', snippetForm)
      ElMessage.success('片段已创建')
    }
    dialogVisible.value = false
    fetchSnippets()
  } catch (error) {
    // Error handled by interceptor
  } finally {
    submitting.value = false
  }
}

async function deleteSnippet(snippet: any) {
  try {
    await ElMessageBox.confirm('确定要删除这个代码片段吗？', '提示', {
      type: 'warning'
    })
    await api.delete(`/snippets/${snippet.id}`)
    ElMessage.success('片段已删除')
    fetchSnippets()
  } catch (error) {
    // Cancelled
  }
}

async function copySnippet(snippet: any) {
  try {
    await navigator.clipboard.writeText(snippet.code)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped lang="scss">
.snippets-page {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .header-left {
      display: flex;
      gap: 12px;
    }

    .search-input {
      width: 300px;
    }
  }
}

.snippet-card {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    .card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .card-desc {
    font-size: 13px;
    color: #606266;
    margin-bottom: 12px;
  }

  .card-code {
    background-color: #1d1e1f;
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
    margin-bottom: 12px;

    pre {
      margin: 0;

      code {
        font-family: 'Courier New', Consolas, monospace;
        font-size: 13px;
        color: #e5eaf3;
        line-height: 1.6;
      }
    }
  }

  .card-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.code-textarea {
  :deep(.el-textarea__inner) {
    font-family: 'Courier New', Consolas, monospace;
    font-size: 13px;
    line-height: 1.6;
  }
}
</style>
