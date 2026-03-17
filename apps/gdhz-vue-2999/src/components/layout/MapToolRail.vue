<template>
  <div class="tool-rail">
    <button
      class="tool-btn"
      :class="{ active: layerPanelOpen }"
      title="图层控制"
      @click="$emit('toggle-layer-panel')"
    >
      <i class="fa-solid fa-layer-group"></i>
    </button>
    <button
      v-if="showDeviceBtn"
      class="tool-btn"
      :class="{ active: devicePanelOpen }"
      title="观测设备"
      @click="$emit('toggle-device-panel')"
    >
      <i class="fa-solid fa-satellite-dish"></i>
    </button>
    <button
      v-if="showAIBtn"
      class="tool-btn ai-btn"
      :class="{ active: aiPanelOpen }"
      title="AI"
      @click="$emit('toggle-ai-panel')"
    >
      <div class="ai-loader-wrap">
        <div class="ai-loader">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <defs>
              <mask id="rail-ai-clip">
                <polygon points="0,0 100,0 100,100 0,100" fill="black"></polygon>
                <polygon points="25,25 75,25 50,75" fill="white"></polygon>
                <polygon points="50,25 75,75 25,75" fill="white"></polygon>
                <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                <polygon points="35,35 65,35 50,65" fill="white"></polygon>
                <polygon points="35,35 65,35 50,65" fill="white"></polygon>
              </mask>
            </defs>
          </svg>
          <div class="ai-loader-box"></div>
        </div>
      </div>
    </button>
  </div>
</template>

<script setup>
defineProps({
  layerPanelOpen: { type: Boolean, default: false },
  devicePanelOpen: { type: Boolean, default: false },
  aiPanelOpen: { type: Boolean, default: false },
  showDeviceBtn: { type: Boolean, default: false },
  showAIBtn: { type: Boolean, default: false },
})

defineEmits(['toggle-layer-panel', 'toggle-device-panel', 'toggle-ai-panel'])
</script>

<style scoped>
.tool-rail {
  position: fixed;
  right: 24px;
  top: 150px;
  z-index: 900;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
  padding: 10px 8px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.58);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(244, 247, 250, 0.56));
  backdrop-filter: blur(18px) saturate(1.08);
  -webkit-backdrop-filter: blur(18px) saturate(1.08);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
}

.tool-btn {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(237, 241, 245, 0.82));
  color: #526071;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.85);
  transition: transform 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.tool-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(15, 23, 42, 0.12);
  background: linear-gradient(180deg, rgba(255, 255, 255, 1), rgba(244, 247, 251, 0.9));
  color: #1f2937;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.tool-btn.active {
  border-color: rgba(196, 134, 28, 0.24);
  background: linear-gradient(180deg, rgba(255, 248, 236, 0.98), rgba(248, 237, 214, 0.9));
  color: #8a5a00;
  box-shadow: 0 12px 24px rgba(196, 134, 28, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.tool-btn i {
  font-size: 14px;
}

.ai-btn {
  position: relative;
  overflow: hidden;
}

.ai-loader-wrap {
  width: 28px;
  height: 28px;
  position: relative;
  overflow: hidden;
  border-radius: 50%;
}

.ai-loader {
  --color-one: #ffbf48;
  --color-two: #be4a1d;
  --color-three: #ffbf4780;
  --color-four: #bf4a1d80;
  --color-five: #ffbf4740;
  --time-animation: 2s;
  position: absolute;
  top: 0;
  left: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  transform: scale(0.28);
  transform-origin: top left;
  box-shadow:
    0 0 25px 0 var(--color-three),
    0 20px 50px 0 var(--color-four);
  animation: ai-colorize calc(var(--time-animation) * 3) ease-in-out infinite;
}

.ai-loader::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border-top: solid 1px var(--color-one);
  border-bottom: solid 1px var(--color-two);
  background: linear-gradient(180deg, var(--color-five), var(--color-four));
  box-shadow:
    inset 0 10px 10px 0 var(--color-three),
    inset 0 -10px 10px 0 var(--color-four);
}

.ai-loader .ai-loader-box {
  width: 100px;
  height: 100px;
  background: linear-gradient(180deg, var(--color-one) 30%, var(--color-two) 70%);
  mask: url(#rail-ai-clip);
  -webkit-mask: url(#rail-ai-clip);
}

.ai-loader svg {
  position: absolute;
}

.ai-loader svg #rail-ai-clip {
  filter: contrast(15);
  animation: ai-roundness calc(var(--time-animation) / 2) linear infinite;
}

.ai-loader svg #rail-ai-clip polygon {
  filter: blur(7px);
}

.ai-loader svg #rail-ai-clip polygon:nth-child(1) {
  transform-origin: 75% 25%;
  transform: rotate(90deg);
}

.ai-loader svg #rail-ai-clip polygon:nth-child(2) {
  transform-origin: 50% 50%;
  animation: ai-rotation var(--time-animation) linear infinite reverse;
}

.ai-loader svg #rail-ai-clip polygon:nth-child(3) {
  transform-origin: 50% 60%;
  animation: ai-rotation var(--time-animation) linear infinite;
  animation-delay: calc(var(--time-animation) / -3);
}

.ai-loader svg #rail-ai-clip polygon:nth-child(4) {
  transform-origin: 40% 40%;
  animation: ai-rotation var(--time-animation) linear infinite reverse;
}

.ai-loader svg #rail-ai-clip polygon:nth-child(5) {
  transform-origin: 40% 40%;
  animation: ai-rotation var(--time-animation) linear infinite reverse;
  animation-delay: calc(var(--time-animation) / -2);
}

.ai-loader svg #rail-ai-clip polygon:nth-child(6) {
  transform-origin: 60% 40%;
  animation: ai-rotation var(--time-animation) linear infinite;
}

.ai-loader svg #rail-ai-clip polygon:nth-child(7) {
  transform-origin: 60% 40%;
  animation: ai-rotation var(--time-animation) linear infinite;
  animation-delay: calc(var(--time-animation) / -1.5);
}

@keyframes ai-rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes ai-roundness {
  0% { filter: contrast(15); }
  20% { filter: contrast(3); }
  40% { filter: contrast(3); }
  60% { filter: contrast(15); }
  100% { filter: contrast(15); }
}

@keyframes ai-colorize {
  0% { filter: hue-rotate(0deg); }
  20% { filter: hue-rotate(-30deg); }
  40% { filter: hue-rotate(-60deg); }
  60% { filter: hue-rotate(-90deg); }
  80% { filter: hue-rotate(-45deg); }
  100% { filter: hue-rotate(0deg); }
}
</style>
