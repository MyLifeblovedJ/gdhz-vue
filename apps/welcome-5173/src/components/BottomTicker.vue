<template>
  <footer class="bottom-ticker panel-mask">
    <div class="ticker-left">播报：{{ ticker.broadcast }}</div>
    <div class="ticker-right">
      <span>经度：{{ ticker.longitude }}</span>
      <span>纬度：{{ ticker.latitude }}</span>
      <span>比例尺：{{ ticker.scale }}</span>
      <button type="button" class="mode-switch" @click="$emit('toggle-mode')">
        {{ mapMode }} / 切换
      </button>
    </div>
  </footer>
</template>

<script setup>
defineProps({
  ticker: {
    type: Object,
    default: () => ({})
  },
  mapMode: {
    type: String,
    default: '2D'
  }
})

defineEmits(['toggle-mode'])
</script>
