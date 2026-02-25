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
                {{ msg }}
              </span>
            </div>
          </div>

          <!-- 鏀惰捣鎸夐挳 -->
          <button class="marquee-collapse-btn" @click="collapseBanner" title="鏀惰捣棰勮妯箙">
            <i class="fa-solid fa-chevron-up"></i>
          </button>
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

const route = useRoute()
const store = useAppStore()

// 鏈湴鐘舵€佹帶鍒讹紝鏇村姞娴佺晠
const isCollapsed = ref(false)

// 鏄剧ず鐨勬秷鎭?(澶嶅埗涓€浠界敤浜庢棤缂濇粴鍔?
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
}

/* Grid 鍖呰鍣?- 瀹炵幇骞虫粦楂樺害鍔ㄧ敾 */
.banner-grid-wrapper {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows 0.35s cubic-bezier(0.4, 0, 0.2, 1);
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

/* 妯箙鍐呴儴瀹為檯鍐呭鍖?*/
.alert-marquee-bar::before {
  content: '';
  height: 8px; /* margin-top 鐨勬浛浠ｏ紝鍙備笌 grid 鍔ㄧ敾 */
  flex-shrink: 0;
}

.alert-marquee-bar-inner {
  height: 50px;
  flex-shrink: 0;
  background: linear-gradient(90deg,
    rgba(239, 68, 68, 0.16) 0%,
    rgba(239, 68, 68, 0.05) 40%,
    rgba(239, 68, 68, 0.05) 60%,
    rgba(239, 68, 68, 0.16) 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
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

/* 婊氬姩鍐呭 */
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
  color: #e6bcbc;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.marquee-item::before {
  content: '•';
  color: var(--alert-red);
  margin-right: 12px;
  font-size: 12px;
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

/* 鏀惰捣鎸夐挳 */
.marquee-collapse-btn {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(239, 68, 68, 0.18);
  border: 1px solid rgba(239, 68, 68, 0.36);
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

/* 灞曞紑鎸夐挳 - 鍥哄畾瀹氫綅纭繚鍙 */
.marquee-expand-btn {
  position: fixed;
  top: 88px; /* Header(80px) + margin-top(8px) */
  right: 360px; /* 鍙充晶杈规爮瀹藉害(340px) + 闂磋窛(10px) + 缂撳啿(10px) */
  background: rgba(239, 68, 68, 0.82);
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
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.45);
  transition: all 0.15s ease-out;
}

.marquee-expand-btn:hover {
  background: var(--alert-red);
  transform: translateY(2px);
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
</style>

