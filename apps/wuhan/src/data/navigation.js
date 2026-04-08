export const navItems = [
  { key: 'home', label: '首页', path: '/home', icon: 'fa-solid fa-house', iconOnly: true },
  {
    key: 'ocean-geology',
    label: '海洋地质',
    path: '/ocean-geology',
    children: [
      { key: 'geological-sampling', label: '地质采样' },
    ],
  },
  {
    key: 'ocean-survey',
    label: '海洋测绘',
    path: '/ocean-survey',
    placeholder: true,
    children: [
      { key: 'water-column', label: '多波束水柱' },
      { key: 'multibeam-bathymetry', label: '多波束测深' },
    ],
  },
  {
    key: 'passive-acoustics',
    label: '被动声学',
    path: '/passive-acoustics',
    placeholder: true,
    children: [
      { key: 'hydrophone', label: '水听器' },
    ],
  },
]

export const navMegaSections = navItems.filter(item => item.children?.length)

export function findSubmenuItem(pageKey, submenuKey) {
  if (!pageKey || !submenuKey) return null
  const section = navMegaSections.find(item => item.key === pageKey)
  if (!section) return null
  return section.children.find(item => item.key === submenuKey) || null
}
