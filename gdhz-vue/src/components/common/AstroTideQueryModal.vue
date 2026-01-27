<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="modal-overlay" @click.self="handleClose">
        <div class="modal-container">
          <!-- Header -->
          <div class="modal-header">
            <div class="header-title">
              <i class="fa-solid fa-calendar-days"></i>
              天文潮预测查询
            </div>
            <button class="close-btn" @click="handleClose">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Content -->
          <div class="modal-content">
            <!-- Query Form -->
            <div v-if="!showResults" class="query-form fade-in">
              <div class="form-item">
                <label>选择站点</label>
                <select v-model="selectedStation" class="custom-select">
                  <option v-for="station in stations" :key="station" :value="station">
                    {{ station }}
                  </option>
                </select>
              </div>
  
              <div class="form-item">
                <label>时间范围</label>
                <div class="date-range">
                  <input type="date" v-model="startDate" class="date-input" />
                  <span class="separator">至</span>
                  <input type="date" v-model="endDate" class="date-input" />
                </div>
              </div>
  
              <!-- Chart Placeholder (Instructions) -->
              <div class="query-preview">
                <i class="fa-solid fa-chart-line"></i>
                <p>查询后将展示该时间段的详细天文潮位曲线及数据表</p>
              </div>
            </div>

            <!-- Results View -->
            <div v-else class="results-view fade-in">
              <!-- Chart Section -->
              <div class="result-section">
                  <div class="section-title">潮位曲线 ({{ selectedStation }})</div>
                  <div class="chart-container">
                      <svg viewBox="0 0 380 120" class="chart-svg">
                          <!-- Gradients & Defs -->
                          <defs>
                            <linearGradient id="tideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
                              <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
                            </linearGradient>
                            <linearGradient id="tideAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:0.2" />
                              <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:0.02" />
                            </linearGradient>
                          </defs>
                          <!-- Grid & Axes -->
                          <line x1="30" y1="10" x2="30" y2="100" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
                          <line x1="30" y1="100" x2="380" y2="100" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
                          <!-- Path -->
                          <path :d="resultAreaPath" fill="url(#tideAreaGradient)" />
                          <path :d="resultPath" fill="none" stroke="url(#tideGradient)" stroke-width="2" />
                          <!-- Ticks (Simplified) -->
                          <text x="25" y="20" fill="#666" font-size="8" text-anchor="end">3m</text>
                          <text x="25" y="60" fill="#666" font-size="8" text-anchor="end">1.5m</text>
                          <text x="25" y="100" fill="#666" font-size="8" text-anchor="end">0m</text>
                      </svg>
                  </div>
              </div>

              <!-- Table Section -->
              <div class="result-section">
                  <div class="section-title">详细数据表</div>
                  <div class="table-container">
                      <table>
                          <thead>
                              <tr>
                                  <th>时间</th>
                                  <th>天文潮位 (m)</th>
                                  <th>状态</th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr v-for="(row, idx) in resultTableData" :key="idx">
                                  <td>{{ row.time }}</td>
                                  <td class="mono">{{ row.level }}</td>
                                  <td>
                                      <span class="status-badge" :class="row.statusClass">{{ row.status }}</span>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </div>
            </div>
          </div>
  
          <!-- Footer -->
          <div class="modal-footer">
            <button class="btn secondary" @click="handleClose">关闭</button>
            <button v-if="!showResults" class="btn primary" @click="handleQuery" :disabled="loading">
               <i v-if="loading" class="fa-solid fa-spinner fa-spin"></i>
               <span v-else><i class="fa-solid fa-search"></i> 查询</span>
            </button>
            <button v-else class="btn secondary" @click="showResults = false">返回查询</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible', 'query'])

const selectedStation = ref('珠海站')
const startDate = ref(new Date().toISOString().split('T')[0])
const endDate = ref(new Date(Date.now() + 86400000).toISOString().split('T')[0])

const stations = ['珠海站', '三灶站', '南水站', '赤湾站', '横门站', '黄埔站']

// Logic for Results
const showResults = ref(false)
const loading = ref(false)
const resultData = ref([])

function handleClose() {
  emit('update:visible', false)
  // Reset state after close (optional)
  setTimeout(() => {
      showResults.value = false
      resultData.value = []
  }, 300)
}

function handleQuery() {
  loading.value = true
  // Mock API delay
  setTimeout(() => {
      generateMockData()
      loading.value = false
      showResults.value = true
      emit('query', {
        station: selectedStation.value,
        start: startDate.value,
        end: endDate.value
      })
  }, 800)
}

// Mock Data Generation
function generateMockData() {
    const data = []
    // Generate 24 hourly points for demonstration
    for (let i = 0; i < 24; i++) {
        // Create a sine wave-like tide
        const t = i / 24 * Math.PI * 4 // two cycles
        const level = 1.5 + Math.sin(t) * 1.2 + (Math.random() * 0.1)
        data.push({
            time: `${leadingZero(i)}:00`,
            level: level.toFixed(2),
            status: level > 2.5 ? '高潮' : (level < 0.5 ? '低潮' : '正常'),
            statusClass: level > 2.5 ? 'high' : (level < 0.5 ? 'low' : 'normal')
        })
    }
    resultData.value = data
}

function leadingZero(num) {
    return num < 10 ? '0' + num : num
}

// Chart Path Computation
const resultPath = computed(() => {
    if (resultData.value.length === 0) return ''
    const width = 350 // (380 - 30 margin)
    const height = 90 // (100 - 10 margin, Y axis mapped 0-3m)
    
    return resultData.value.map((pt, i) => {
        const x = 30 + (i / (resultData.value.length - 1)) * width
        const y = 100 - (parseFloat(pt.level) / 3.0) * height
        return `${i===0?'M':'L'}${x},${y}`
    }).join(' ')
})

const resultAreaPath = computed(() => {
    if (!resultPath.value) return ''
    const lastX = 30 + 350 // end x
    return `${resultPath.value} L${lastX},100 L30,100 Z`
})

const resultTableData = computed(() => resultData.value)

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-container {
  width: 420px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid var(--border-normal);
  border-radius: 8px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

/* Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title i {
  color: var(--accent-cyan);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--text-primary);
}

/* Content */
.modal-content {
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 12px;
  color: var(--text-secondary);
}

.custom-select, .date-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 8px 12px;
  color: var(--text-primary);
  outline: none;
  font-size: 13px;
}

.custom-select:focus, .date-input:focus {
  border-color: var(--accent-cyan);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 10px;
}

.separator {
  color: var(--text-muted);
  font-size: 12px;
}

.date-input {
  flex: 1;
}

.query-preview {
  margin-top: 10px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px dashed var(--border-subtle);
  border-radius: 6px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* Footer */
.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.btn.secondary {
  background: transparent;
  border-color: var(--border-subtle);
  color: var(--text-secondary);
}

.btn.secondary:hover {
  background: rgba(255, 255, 255, 0.05);
}

.btn.primary {
  background: var(--accent-cyan);
  color: #0f172a;
  font-weight: 600;
}

.btn.primary:hover {
  filter: brightness(1.1);
}

/* Transitions */
/* Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.fade-in {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Results Styles */
.results-view {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 420px; /* Fixed height for results to prevent jumping */
}

.result-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1; 
    min-height: 0; /* Enable scrolling in flex child */
}

.section-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--accent-cyan);
    padding-left: 4px;
    border-left: 2px solid var(--accent-cyan);
    line-height: 1;
}

.chart-container {
    height: 120px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 6px;
    padding: 10px;
    border: 1px solid var(--border-subtle);
}

.chart-svg {
    width: 100%;
    height: 100%;
}

.table-container {
    flex: 1;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid var(--border-subtle);
    border-radius: 6px;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}

th {
    position: sticky;
    top: 0;
    background: rgba(30, 41, 59, 0.95);
    padding: 8px;
    text-align: left;
    color: var(--text-muted);
    font-weight: 500;
    z-index: 10;
}

td {
    padding: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: var(--text-secondary);
}

.mono {
    font-family: var(--font-mono);
    color: var(--text-primary);
}

.status-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
}
.status-badge.high { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
.status-badge.low { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
.status-badge.normal { background: rgba(16, 185, 129, 0.15); color: #10b981; }

/* Scrollbar for table */
.table-container::-webkit-scrollbar {
    width: 4px;
}
.table-container::-webkit-scrollbar-thumb {
    background: var(--border-subtle);
    border-radius: 2px;
}
</style>
