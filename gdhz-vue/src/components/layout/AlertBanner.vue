<template>
  <div class="alert-banner-wrapper">
    <!-- 使用 grid 动画实现平滑高度过渡 -->
    <div class="banner-grid-wrapper" :class="{ collapsed: isCollapsed }">
      <div class="alert-marquee-bar">
        <div class="alert-marquee-bar-inner">
          <!-- 滚动内容区 -->
          <div class="alert-marquee-content">
            <div class="marquee-track" ref="trackRef">
              <span
                v-for="(msg, index) in displayMessages"
                :key="index"
                class="marquee-item"
              >
                {{ msg }}
              </span>
            </div>
          </div>

          <!-- 收起按钮 -->
          <button class="marquee-collapse-btn" @click="collapseBanner" title="收起预警横幅">
            <i class="fa-solid fa-chevron-up"></i>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 展开按钮 (横幅收起时显示) -->
    <Transition name="expand-btn">
      <button 
        v-show="isCollapsed"
        class="marquee-expand-btn"
        @click="expandBanner"
      >
        <i class="fa-solid fa-chevron-down"></i>
      </button>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '../../stores/app'

const route = useRoute()
const store = useAppStore()

// 本地状态控制，更加流畅
const isCollapsed = ref(false)

// 显示的消息 (复制一份用于无缝滚动)
const displayMessages = computed(() => {
  const messages = store.marqueeMessages
  return [...messages, ...messages]
})

function collapseBanner() {
  isCollapsed.value = true
}

function expandBanner() {
  isCollapsed.value = false
}

// 根据路由决定横幅默认状态
function updateBannerState() {
  const shouldDefaultClosed = route.meta.bannerDefaultCollapsed === true
  
  if (shouldDefaultClosed) {
    // 需要关闭横幅，如果当前是展开的，播放关闭动画
    if (!isCollapsed.value) {
      setTimeout(() => {
        isCollapsed.value = true
      }, 300)
    }
  } else {
    // 不需要关闭横幅（如主页），确保横幅展开
    if (isCollapsed.value) {
      isCollapsed.value = false
    }
  }
}

// 监听路由变化，立即生效
watch(() => route.path, () => {
  updateBannerState()
}, { immediate: true })

onMounted(() => {
  store.fetchMarqueeMessages()
})
</script>

<style scoped>
/* 横幅容器 - 为展开按钮提供定位上下文 */
.alert-banner-wrapper {
  position: relative;
  flex-shrink: 0;
}

/* Grid 包装器 - 实现平滑高度动画 */
.banner-grid-wrapper {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.banner-grid-wrapper.collapsed {
  grid-template-rows: 0fr;
}

/* 横幅内容 - 必须设置 min-height: 0 和 overflow: hidden 才能被 grid 收缩 */
.alert-marquee-bar {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 横幅内部实际内容区 */
.alert-marquee-bar::before {
  content: '';
  height: 8px; /* margin-top 的替代，参与 grid 动画 */
  flex-shrink: 0;
}

.alert-marquee-bar-inner {
  height: 50px;
  flex-shrink: 0;
  background: linear-gradient(90deg,
    rgba(255, 71, 87, 0.2) 0%,
    rgba(255, 71, 87, 0.06) 40%,
    rgba(255, 71, 87, 0.06) 60%,
    rgba(255, 71, 87, 0.2) 100%);
  border: 1px solid rgba(255, 71, 87, 0.35);
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  position: relative;
  opacity: 1;
  transition: opacity 0.25s ease-out;
}

.banner-grid-wrapper.collapsed .alert-marquee-bar-inner {
  opacity: 0;
}

/* 滚动内容 */
.alert-marquee-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  padding-left: 15px;
  mask-image: linear-gradient(90deg,
    black 0%,
    black 90%,
    transparent 100%);
  -webkit-mask-image: linear-gradient(90deg,
    black 0%,
    black 90%,
    transparent 100%);
}

.marquee-track {
  display: flex;
  animation: marquee-scroll 40s linear infinite;
  white-space: nowrap;
}

.marquee-track:hover {
  animation-play-state: paused;
}

@keyframes marquee-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.marquee-item {
  display: inline-flex;
  align-items: center;
  padding: 0 80px;
  font-size: 14px;
  color: #ffcaca;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.marquee-item::before {
  content: '▶';
  color: var(--alert-red);
  margin-right: 12px;
  font-size: 10px;
  animation: blink 1.2s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* 收起按钮 */
.marquee-collapse-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 71, 87, 0.2);
  border: 1px solid rgba(255, 71, 87, 0.4);
  color: var(--alert-red);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  z-index: 20;
  transition: all 0.15s ease-out;
}

.marquee-collapse-btn:hover {
  background: var(--alert-red);
  color: #fff;
}

/* 展开按钮 - 固定定位确保可见 */
.marquee-expand-btn {
  position: fixed;
  top: 88px; /* Header(80px) + margin-top(8px) */
  right: 360px; /* 右侧边栏宽度(340px) + 间距(10px) + 缓冲(10px) */
  background: rgba(255, 71, 87, 0.9);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 0 0 8px 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  box-shadow: 0 4px 15px rgba(255, 71, 87, 0.6);
  transition: all 0.15s ease-out;
}

.marquee-expand-btn:hover {
  background: var(--alert-red);
  transform: translateY(2px);
}

/* 展开按钮动画 */
.expand-btn-enter-active,
.expand-btn-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
}

.expand-btn-enter-from,
.expand-btn-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.expand-btn-enter-to,
.expand-btn-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
