<template>
  <div class="page-header">
    <div class="header-left">
      <slot name="left" />
    </div>
    <div class="header-right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
