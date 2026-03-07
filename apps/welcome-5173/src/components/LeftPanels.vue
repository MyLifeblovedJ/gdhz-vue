<template>
  <aside class="left-panel-wrap">
    <section v-for="panel in panels" :key="panel.key" class="left-panel panel-mask">
      <div class="panel-head">
        <strong>{{ panel.title }}</strong>
        <span>{{ panel.subtitle }}</span>
      </div>

      <div v-if="panel.emphasis" class="panel-emphasis">
        <p class="emphasis-title">{{ panel.emphasis.title }}</p>
        <p class="emphasis-detail">{{ panel.emphasis.detail }}</p>
      </div>

      <table class="panel-table" aria-label="业务数据表格">
        <thead>
          <tr>
            <th v-for="column in panel.columns" :key="column">{{ column }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in panel.rows" :key="`${panel.key}-${rowIndex}`">
            <td v-for="(cell, cellIndex) in row" :key="`${panel.key}-${rowIndex}-${cellIndex}`">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </aside>
</template>

<script setup>
defineProps({
  panels: {
    type: Array,
    default: () => []
  }
})
</script>
