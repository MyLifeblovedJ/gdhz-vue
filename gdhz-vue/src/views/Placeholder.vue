<template>
  <div class="placeholder-container">
    <div class="placeholder-content">
      <i class="fa-solid fa-hammer placeholder-icon"></i>
      <h2 class="placeholder-title">{{ pageTitle }}</h2>
      <p class="placeholder-text">该功能模块正在开发中，敬请期待...</p>
      <router-link to="/" class="back-btn">
        <i class="fa-solid fa-arrow-left"></i>
        返回态势感知
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const pageTitle = computed(() => route.meta.title || '页面')
</script>

<style scoped>
.placeholder-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-deep);
}

.placeholder-content {
  text-align: center;
  padding: 40px;
  background: var(--bg-panel);
  border: 1px solid var(--border-normal);
  border-radius: var(--border-radius-lg);
  backdrop-filter: blur(12px);
  animation: fadeIn 0.5s ease-out;
}

.placeholder-icon {
  font-size: 48px;
  color: var(--accent-cyan);
  margin-bottom: 20px;
  animation: breathe 2s ease-in-out infinite;
}

.placeholder-title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 10px;
}

.placeholder-text {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: 1px solid var(--accent-cyan);
  color: var(--accent-cyan);
  border-radius: 20px;
  text-decoration: none;
  font-size: 13px;
  transition: all var(--transition-fast);
}

.back-btn:hover {
  background: var(--accent-cyan);
  color: #000;
}
</style>
