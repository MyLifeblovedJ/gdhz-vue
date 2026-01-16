<template>
  <div class="model-integration">
    <div class="model-grid">
      <div 
        v-for="model in models" 
        :key="model.id"
        class="model-card"
        :class="{ active: activeModel === model.id }"
        @click="handleModelClick(model)"
      >
        <div class="model-icon" :style="{ '--model-color': model.color }">
          <i :class="'fa-solid ' + model.icon"></i>
        </div>
        <div class="model-name">{{ model.name }}</div>
        <div class="model-status" :class="model.status">
          {{ model.statusText }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['model-click'])

const activeModel = ref(null)

// 模型列表
const models = computed(() => [
  {
    id: 'drift',
    name: '应急漂移扩散',
    icon: 'fa-droplet',
    color: '#3b82f6',
    status: 'ready',
    statusText: '就绪'
  },
  {
    id: 'surge',
    name: '风暴潮预报',
    icon: 'fa-water',
    color: '#06b6d4',
    status: 'ready',
    statusText: '就绪'
  },
  {
    id: 'wave',
    name: '海浪数值预报',
    icon: 'fa-wind',
    color: '#10b981',
    status: 'ready',
    statusText: '就绪'
  },
  {
    id: 'tsp',
    name: '温盐流数值预报',
    icon: 'fa-temperature-half',
    color: '#f59e0b',
    status: 'ready',
    statusText: '就绪'
  },
  {
    id: 'tsunami',
    name: '海啸模型',
    icon: 'fa-house-tsunami',
    color: '#ef4444',
    status: 'ready',
    statusText: '就绪'
  }
])

function handleModelClick(model) {
  activeModel.value = activeModel.value === model.id ? null : model.id
  emit('model-click', model)
}
</script>

<style scoped>
.model-integration {
  padding: 4px 0;
}

.model-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.model-card:hover {
  border-color: var(--model-color);
  background: linear-gradient(135deg, 
    color-mix(in srgb, var(--model-color) 10%, transparent),
    transparent
  );
  transform: translateX(4px);
}

.model-card.active {
  border-color: var(--model-color);
  background: linear-gradient(135deg, 
    color-mix(in srgb, var(--model-color) 15%, transparent),
    color-mix(in srgb, var(--model-color) 5%, transparent)
  );
  box-shadow: 0 0 15px color-mix(in srgb, var(--model-color) 20%, transparent);
}

.model-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: linear-gradient(135deg, var(--model-color), color-mix(in srgb, var(--model-color) 60%, black));
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--model-color) 30%, transparent);
}

.model-name {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.model-status {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.model-status.running {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  animation: pulse-status 1.5s infinite;
}

.model-status.error {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

@keyframes pulse-status {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
