export const navItems = [
  { key: 'home', label: '首页', path: '/home', icon: 'fa-solid fa-house', iconOnly: true },
  {
    key: 'sea-condition',
    label: '风浪潮',
    path: '/sea-condition',
    children: [
      { key: 'overflow-risk', label: '漫堤风险' },
      { key: 'sea-risk', label: '海上风险' },
      { key: 'impact-assessment', label: '决策辅助' },
      { key: 'emergency-evacuation', label: '应急疏散' },
      { key: 'emergency-plan', label: '应急方案' },
    ],
  },
  { key: 'redtide', label: '赤潮', path: '/redtide' },
  {
    key: 'tsunami',
    label: '海啸',
    path: '/tsunami',
    children: [
      { key: 'warning', label: '灾情预警' },
      { key: 'nearshore-3d-simulation', label: '近岸三维模拟' },
      { key: 'disaster-simulation', label: '灾害模拟' },
      { key: 'impact-assessment', label: '影响评估' },
    ],
  },
  {
    key: 'saltwater',
    label: '咸潮入侵',
    path: '/saltwater',
    children: [
      { key: 'salinity-observation', label: '咸潮观测' },
      { key: 'salinity-forecast', label: '咸潮预测' },
    ],
  },
  {
    key: 'seawater',
    label: '海水入侵',
    path: '/seawater',
    children: [
      { key: 'intrusion-status', label: '入侵现状' },
      { key: 'intrusion-forecast', label: '入侵预测' },
    ],
  },
  {
    key: 'sealevel',
    label: '海平面上升',
    path: '/sealevel',
    children: [
      { key: 'tide-overview', label: '潮位及概况' },
      { key: 'disaster-simulation', label: '灾害模拟' },
      { key: 'impact-assessment', label: '影响评估' },
      { key: 'data-forecast', label: '数据预测' },
    ],
  },
  {
    key: 'erosion',
    label: '海岸侵蚀',
    path: '/erosion',
    children: [
      { key: 'erosion-warning', label: '灾害预警' },
      { key: 'imagery-analysis', label: '影像分析' },
      { key: 'erosion-shoreline', label: '侵蚀岸段' },
      { key: 'downcutting-calculation', label: '下蚀计算' },
      { key: 'erosion-analysis', label: '侵蚀分析' },
    ],
  },
  { key: 'oilspill', label: '溢油', path: '/oilspill' },
]

export const navMegaSections = navItems.filter(item => item.children?.length)

export function findSubmenuItem(pageKey, submenuKey) {
  if (!pageKey || !submenuKey) return null
  const section = navMegaSections.find(item => item.key === pageKey)
  if (!section) return null
  return section.children.find(item => item.key === submenuKey) || null
}
