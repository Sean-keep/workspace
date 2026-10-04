<template>
  <!--
    表格 ↔ 卡片的开关。真正共用的只有「开关 + 容器 + 空态/加载 + 底距」，
    行内容各自用插槽画 —— 任务/笔记/子任务的列结构差太多，通用列配置会比插槽还长。

    行**不**挂 click：卡片自己发事件（内部按钮要 @click.stop，挂在包裹层会打架）。
  -->
  <div v-if="ui.isMobile" v-loading="!!loading" class="rl-mobile">
    <div v-for="item in items" :key="item.id" class="rl-row">
      <slot name="mobile" :item="item" />
    </div>
    <el-empty
      v-if="!loading && items.length === 0"
      :description="emptyText ?? '暂无数据'"
      :image-size="80"
    />
  </div>
  <!-- 桌面：调用方把现有的 el-table 原样塞进来，DOM 一个字节都不变 -->
  <slot v-else name="desktop" />
</template>

<script setup lang="ts" generic="T extends { id: number }">
import { useUiStore } from '@/stores/ui'

defineProps<{
  items: T[]
  loading?: boolean
  emptyText?: string
}>()

const ui = useUiStore()
</script>

<style scoped lang="scss">
.rl-mobile {
  // 安全区底距由壳层的 .mobile-main 统一留，这里只管行间距
  .rl-row + .rl-row {
    margin-top: 8px;
  }
}
</style>
