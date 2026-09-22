<template>
  <div class="scripts-page">
    <PageHeader class="scripts-header">
      <template #left>
        <el-input
          v-model="searchQuery"
          placeholder="搜索脚本..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-select v-model="filterLanguage" placeholder="语言" clearable>
          <el-option v-for="lang in languages" :key="lang" :label="lang" :value="lang" />
        </el-select>
      </template>
      <template #right>
        <el-button type="primary" @click="scriptDialog.openCreate()">
          <el-icon><Plus /></el-icon>
          新建脚本
        </el-button>
      </template>
    </PageHeader>

    <div class="scripts-list">
      <ScriptCard
        v-for="script in filteredScripts"
        :key="script.id"
        :script="script"
        @copy="copyScript"
        @edit="scriptDialog.openEdit"
        @delete="deleteScript"
      />

      <el-empty v-if="filteredScripts.length === 0" description="暂无脚本" />
    </div>

    <ScriptDialog
      v-model:visible="scriptDialog.visible"
      :script="scriptDialog.editing"
      :submitting="scriptDialog.submitting"
      @submit="submitScript"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { PageHeader } from '@/components/index'
import ScriptCard from './components/ScriptCard.vue'
import ScriptDialog from './components/ScriptDialog.vue'
import { useScripts } from './composables/useScripts'

const {
  searchQuery,
  filterLanguage,
  languages,
  filteredScripts,
  scriptDialog,
  fetchScripts,
  submitScript,
  deleteScript,
  copyScript
} = useScripts()

onMounted(() => {
  fetchScripts()
})
</script>

<style scoped lang="scss">
.scripts-page {
  .scripts-header {
    margin-bottom: 20px;

    .search-input {
      width: 300px;
    }
  }
}
</style>
