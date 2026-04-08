<template>
  <div class="app-container">
    <AppHeader @mega-menu-toggle="handleMegaMenuToggle" />
    <Transition name="app-backdrop">
      <div v-if="isMegaMenuOpen" class="app-backdrop"></div>
    </Transition>
    <!-- AlertBanner 绉昏嚦鍚勯〉闈㈠唴閮ㄦ帶鍒讹紝瀹炵幇鏂规B甯冨眬 -->
    <main class="app-view">
      <router-view v-slot="{ Component, route }">
        <Transition :name="transitionName" mode="out-in">
          <component :is="Component" :key="route.path" />
        </Transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useAppStore } from './stores/app'
import AppHeader from './components/layout/AppHeader.vue'

const store = useAppStore()

// 椤甸潰鍒囨崲鍔ㄧ敾鍚嶇О
const transitionName = ref('page-fade')
const isMegaMenuOpen = ref(false)
let clockTimer = null

function handleMegaMenuToggle(nextState) {
  isMegaMenuOpen.value = Boolean(nextState)
}

onMounted(() => {
  // 鍚姩鏃堕挓
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
/* 鍏ㄥ眬鏍峰紡宸插湪 main.js 涓鍏?*/

.app-container {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
}

.app-view {
  width: 100%;
  height: 100%;
}

.app-backdrop {
  position: fixed;
  top: 92px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1299;
  background: rgba(248, 250, 252, 0.38);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1300;
}

.app-backdrop-enter-active,
.app-backdrop-leave-active {
  transition: opacity 0.22s ease;
}

.app-backdrop-enter-from,
.app-backdrop-leave-to {
  opacity: 0;
}

/* 椤甸潰娣″叆娣″嚭鍔ㄧ敾 - 蹇€熷垏鎹㈠噺灏戦粦灞忔劅鐭?*/
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.1s ease-out;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}

/* 鍙€夛細婊戝姩鍒囨崲鍔ㄧ敾 */
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
