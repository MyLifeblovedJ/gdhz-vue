<template>
  <div class="app-container">
    <AppHeader />
    <!-- AlertBanner 移至各页面内部控制，实现方案B布局 -->
    <router-view v-slot="{ Component, route }">
      <Transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </router-view>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useAppStore } from './stores/app'
import AppHeader from './components/layout/AppHeader.vue'

const store = useAppStore()

// 页面切换动画名称
const transitionName = ref('page-fade')
let clockTimer = null

onMounted(() => {
  // 启动时钟
  store.updateCurrentTime()
  clockTimer = setInterval(() => {
    store.updateCurrentTime()
  }, 60000)
})

onUnmounted(() => {
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = null
  }
})
</script>

<style>
/* 全局样式已在 main.js 中导入 */

.app-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 页面淡入淡出动画 - 快速切换减少黑屏感知 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.1s ease-out;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

/* 可选：滑动切换动画 */
.page-slide-enter-active,
.page-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
