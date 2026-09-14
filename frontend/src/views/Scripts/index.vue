<template>
  <div class="scripts-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索脚本..."
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
        新建脚本
      </el-button>
    </div>

    <!-- Scripts List -->
    <div class="scripts-list">
      <el-card
        v-for="script in filteredScripts"
        :key="script.id"
        class="script-card"
        shadow="hover"
      >
        <div class="card-header">
          <div class="card-title">
            <el-icon :size="20"><Monitor /></el-icon>
            <span>{{ script.title }}</span>
          </div>
          <div class="card-actions">
            <el-tag size="small" type="info">{{ script.language }}</el-tag>
            <el-button type="primary" link @click="copyScript(script)">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
            <el-button type="primary" link @click="editScript(script)">
              编辑
            </el-button>
            <el-button type="danger" link @click="deleteScript(script)">
              删除
            </el-button>
          </div>
        </div>

        <div v-if="script.description" class="card-desc">
          {{ script.description }}
        </div>

        <div class="card-code">
          <div class="code-header">
            <span class="code-lang">{{ script.language }}</span>
            <el-button size="small" @click="copyScript(script)">
              <el-icon><CopyDocument /></el-icon>
              复制
            </el-button>
          </div>
          <pre><code>{{ script.code }}</code></pre>
        </div>

        <div class="card-footer">
          <div v-if="script.tags.length > 0" class="card-tags">
            <el-tag
              v-for="tag in script.tags"
              :key="tag"
              size="small"
              type="info"
            >
              {{ tag }}
            </el-tag>
          </div>
          <div class="card-meta">
            <span>更新于 {{ formatDate(script.updated_at) }}</span>
          </div>
        </div>
      </el-card>

      <el-empty v-if="filteredScripts.length === 0" description="暂无脚本" />
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingScript ? '编辑脚本' : '新建脚本'"
      width="800px"
      top="5vh"
    >
      <el-form
        ref="scriptFormRef"
        :model="scriptForm"
        :rules="scriptRules"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="scriptForm.title" placeholder="请输入脚本标题" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="scriptForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入脚本描述（可选）"
          />
        </el-form-item>

        <el-form-item label="语言" prop="language">
          <el-select
            v-model="scriptForm.language"
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

        <el-form-item label="脚本内容" prop="code">
          <el-input
            v-model="scriptForm.code"
            type="textarea"
            :rows="16"
            placeholder="粘贴脚本内容..."
            class="code-textarea"
          />
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="scriptForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="添加标签"
          >
            <el-option
              v-for="tag in commonTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ editingScript ? '保存' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { CopyDocument, Monitor } from '@element-plus/icons-vue'
import api from '@/utils/api'
import dayjs from 'dayjs'

const scripts = ref<any[]>([])
const searchQuery = ref('')
const filterLanguage = ref('')
const dialogVisible = ref(false)
const editingScript = ref<any>(null)
const submitting = ref(false)
const scriptFormRef = ref<FormInstance>()

const commonLanguages = [
  'Python', 'JavaScript', 'TypeScript', 'Shell', 'Bash',
  'Go', 'Rust', 'Java', 'C', 'C++',
  'PHP', 'Ruby', 'SQL', 'PowerShell', 'Dockerfile',
  'YAML', 'JSON', 'Lua', 'Perl', 'R'
]

const commonTags = [
  '工具', '自动化', '部署', '监控', '备份',
  '数据处理', '网络', '安全', '运维', '开发'
]

const languages = computed(() => {
  const langs = new Set(scripts.value.map(s => s.language).filter(Boolean))
  return Array.from(langs)
})

const filteredScripts = computed(() => {
  let result = [...scripts.value]

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

const scriptForm = reactive({
  title: '',
  description: '',
  language: 'Shell',
  code: '',
  tags: [] as string[]
})

const scriptRules: FormRules = {
  title: [{ required: true, message: '请输入脚本标题', trigger: 'blur' }],
  code: [{ required: true, message: '请输入脚本内容', trigger: 'blur' }]
}

onMounted(() => {
  fetchScripts()
})

async function fetchScripts() {
  try {
    const res: any = await api.get('/snippets')
    scripts.value = res.data
  } catch (error) {
    console.error('Failed to fetch scripts:', error)
  }
}

function showAddDialog() {
  editingScript.value = null
  scriptForm.title = ''
  scriptForm.description = ''
  scriptForm.language = 'Shell'
  scriptForm.code = ''
  scriptForm.tags = []
  dialogVisible.value = true
}

function editScript(script: any) {
  editingScript.value = script
  scriptForm.title = script.title
  scriptForm.description = script.description || ''
  scriptForm.language = script.language
  scriptForm.code = script.code
  scriptForm.tags = script.tags || []
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await scriptFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    if (editingScript.value) {
      await api.put(`/snippets/${editingScript.value.id}`, scriptForm)
      ElMessage.success('脚本已更新')
    } else {
      await api.post('/snippets', scriptForm)
      ElMessage.success('脚本已创建')
    }
    dialogVisible.value = false
    fetchScripts()
  } catch (error) {
    // Error handled by interceptor
  } finally {
    submitting.value = false
  }
}

async function deleteScript(script: any) {
  try {
    await ElMessageBox.confirm('确定要删除这个脚本吗？', '提示', {
      type: 'warning'
    })
    await api.delete(`/snippets/${script.id}`)
    ElMessage.success('脚本已删除')
    fetchScripts()
  } catch (error) {
    // Cancelled
  }
}

async function copyScript(script: any) {
  try {
    await navigator.clipboard.writeText(script.code)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

function formatDate(date: string) {
  return dayjs(date).format('MM-DD HH:mm')
}
</script>

<style scoped lang="scss">
.scripts-page {
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

.code-textarea {
  :deep(.el-textarea__inner) {
    font-family: 'Courier New', Consolas, monospace;
    font-size: 13px;
    line-height: 1.6;
    tab-size: 2;
  }
}
</style>
