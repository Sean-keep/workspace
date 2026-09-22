<template>
  <div class="tag-list" :class="{ inline }">
    <el-tag v-for="tag in tags" :key="tag" :size="size" :type="type">
      {{ tag }}
    </el-tag>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    tags: string[]
    size?: 'large' | 'default' | 'small'
    type?: 'success' | 'info' | 'warning' | 'danger' | 'primary'
    inline?: boolean
  }>(),
  {
    size: 'small',
    type: 'info',
    inline: true
  }
)
</script>

<style scoped lang="scss">
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  &.inline {
    display: contents;
  }
}
</style>
