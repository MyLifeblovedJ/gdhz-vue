<template>
  <div class="alert-banner-wrapper">
    <!-- 浣跨敤 grid 鍔ㄧ敾瀹炵幇骞虫粦楂樺害杩囨浮 -->
    <div class="banner-grid-wrapper" :class="{ collapsed: isCollapsed }">
      <div class="alert-marquee-bar">
        <div class="alert-marquee-bar-inner">
          <!-- 婊氬姩鍐呭鍖?-->
          <div class="alert-marquee-content">
            <div class="marquee-track" ref="trackRef">
              <span
                v-for="(msg, index) in displayMessages"
                :key="index"
                class="marquee-item"
              >
                <span
                  v-if="msg.title"
                  class="marquee-title"
                  :class="msg.level ? `level-${msg.level}` : ''"
                >
                  【{{ msg.title }}】
                </span>
                <span class="marquee-body">{{ msg.body }}</span>
              </span>
            </div>
          </div>

          <div class="marquee-action-slot">
            <!-- 鏀惰捣鎸夐挳 -->
            <button class="marquee-collapse-btn" @click="collapseBanner">
              <i class="fa-solid fa-chevron-up"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 灞曞紑鎸夐挳 (妯箙鏀惰捣鏃舵樉绀? -->
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
import { duplicateAlertBannerMessages } from '../../utils/alertBanner'

const route = useRoute()
const store = useAppStore()

// 鏈湴鐘舵€佹帶鍒讹紝鏇村姞娴佺晠
const isCollapsed = ref(false)

// 鏄剧ず鐨勬秷鎭?(澶嶅埗涓€浠界敤浜庢棤缂濇粴鍔?
const displayMessages = computed(() => {
  return duplicateAlertBannerMessages(store.marqueeMessages)
})

function collapseBanner() {
  isCollapsed.value = true
}

function expandBanner() {
  isCollapsed.value = false
}

// 鏍规嵁璺敱鍐冲畾妯箙榛樿鐘舵€?
function updateBannerState() {
  const shouldDefaultClosed = route.meta.bannerDefaultCollapsed === true
  
  if (shouldDefaultClosed) {
    // 闇€瑕佸叧闂í骞咃紝濡傛灉褰撳墠鏄睍寮€鐨勶紝鎾斁鍏抽棴鍔ㄧ敾
    if (!isCollapsed.value) {
      setTimeout(() => {
        isCollapsed.value = true
      }, 300)
    }
  } else {
    // 涓嶉渶瑕佸叧闂í骞咃紙濡備富椤碉級锛岀‘淇濇í骞呭睍寮€
    if (isCollapsed.value) {
      isCollapsed.value = false
    }
  }
}

// 鐩戝惉璺敱鍙樺寲锛岀珛鍗崇敓鏁?
watch(() => route.path, () => {
  updateBannerState()
}, { immediate: true })

onMounted(() => {
  store.fetchMarqueeMessages()
})
</script>

<style scoped>
/* 妯箙瀹瑰櫒 - 涓哄睍寮€鎸夐挳鎻愪緵瀹氫綅涓婁笅鏂?*/
.alert-banner-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 100%;
}

/* Grid 鍖呰鍣?- 瀹炵幇骞虫粦楂樺害鍔ㄧ敾 */
.banner-grid-wrapper {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  contain: layout paint;
}

.banner-grid-wrapper.collapsed {
  grid-template-rows: 0fr;
}

/* 妯箙鍐呭 - 蹇呴』璁剧疆 min-height: 0 鍜?overflow: hidden 鎵嶈兘琚?grid 鏀剁缉 */
.alert-marquee-bar {
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.alert-marquee-bar-inner {
  height: 48px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.985);
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 14px;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  isolation: isolate;
  opacity: 1;
  transition: opacity 0.25s ease-out;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.banner-grid-wrapper.collapsed .alert-marquee-bar-inner {
  opacity: 0;
}

/* 婊氬姩鍐呭 */
.alert-marquee-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  padding-left: 18px;
  padding-right: 8px;
  contain: layout paint;
}

.alert-marquee-content::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 64px;
  height: 100%;
  pointer-events: none;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.985) 72%);
}

.marquee-track {
  display: inline-flex;
  width: max-content;
  animation: marquee-scroll 44s linear infinite;
  white-space: nowrap;
  will-change: transform;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
}

.marquee-track:hover {
  animation-play-state: paused;
}

@keyframes marquee-scroll {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
  }
}

.marquee-item {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  padding: 0 64px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
}

.marquee-title {
  color: var(--text-secondary);
}

.marquee-title.level-red {
  color: #dc2626;
}

.marquee-title.level-orange {
  color: #ea580c;
}

.marquee-title.level-yellow {
  color: #ca8a04;
}

.marquee-title.level-blue {
  color: #2563eb;
}

.marquee-body {
  color: var(--text-primary);
}

.marquee-item::before {
  content: '•';
  color: #dc2626;
  margin-right: 12px;
  font-size: 11px;
}

.marquee-action-slot {
  width: 48px;
  height: 100%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.985) 38%);
}

/* 收起按钮 */
.marquee-collapse-btn {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: var(--text-secondary);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
  position: relative;
  z-index: 2;
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.marquee-collapse-btn:hover {
  background: rgba(255, 248, 236, 0.98);
  color: #8a5a00;
  border-color: rgba(196, 134, 28, 0.26);
  box-shadow: 0 4px 12px rgba(196, 134, 28, 0.18);
  transform: scale(1.05);
}

/* 灞曞紑鎸夐挳 - 鍥哄畾瀹氫綅纭繚鍙 */
.marquee-expand-btn {
  position: absolute;
  top: 12px;
  right: 14px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: var(--text-secondary);
  width: 34px;
  height: 34px;
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  transition: background 0.15s ease-out, color 0.15s ease-out, box-shadow 0.15s ease-out;
}

.marquee-expand-btn:hover {
  background: rgba(255, 248, 236, 0.98);
  color: #8a5a00;
  border-color: rgba(196, 134, 28, 0.26);
  box-shadow: 0 12px 28px rgba(196, 134, 28, 0.18);
  transform: scale(1.05);
}

/* 灞曞紑鎸夐挳鍔ㄧ敾 */
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

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
    transform: none;
  }
}
</style>

