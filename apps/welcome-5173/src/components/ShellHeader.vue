<template>
  <header class="shell-header panel-mask">
    <h1 class="system-title">{{ title }}</h1>
    <nav class="nav-list" aria-label="主功能导航">
      <button
        v-for="item in navItems"
        :key="item.key"
        type="button"
        class="nav-item"
        :class="{ active: item.key === activeKey }"
        @click="$emit('switch-nav', item.key)"
      >
        {{ item.label }}
      </button>
    </nav>
  </header>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  navItems: {
    type: Array,
    default: () => []
  },
  activeKey: {
    type: String,
    default: ''
  }
})

defineEmits(['switch-nav'])
</script>
