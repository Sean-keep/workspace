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

// 手机（≤767px）。⚠️ 断点与 stores/ui.ts 的 MOBILE_MEDIA、
// assets/styles/main.scss 的 $bp-mobile 保持同步（768px）。
// 不 wrap 的话标题 + 一排按钮在 360px 上会互相挤掉。
@media (max-width: 767px) {
  .page-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .header-left,
  .header-right {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
