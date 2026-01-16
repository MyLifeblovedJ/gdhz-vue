/**
 * 广东省海洋灾害综合决策系统 - 路由配置
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '../stores/app'

// 页面组件 (懒加载)
const Overview = () => import('../views/Overview.vue')
const Surge = () => import('../views/Surge.vue')
const Wave = () => import('../views/Wave.vue')
const Placeholder = () => import('../views/Placeholder.vue')

const routes = [
    {
        path: '/',
        name: 'Overview',
        component: Overview,
        meta: {
            title: '态势感知',
            pageKey: 'overview',
            showBanner: true,
            bannerDefaultCollapsed: false,  // 主页横幅默认展开
        }
    },
    {
        path: '/surge',
        name: 'Surge',
        component: Surge,
        meta: {
            title: '风暴潮',
            pageKey: 'surge',
            showBanner: true,
            bannerDefaultCollapsed: true,  // 默认关闭横幅
        }
    },
    {
        path: '/wave',
        name: 'Wave',
        component: Wave,
        meta: {
            title: '海浪',
            pageKey: 'wave',
            showBanner: true,
        }
    },
    {
        path: '/redtide',
        name: 'Redtide',
        component: Placeholder,
        meta: { title: '赤潮', pageKey: 'redtide', showBanner: true }
    },
    {
        path: '/tsunami',
        name: 'Tsunami',
        component: Placeholder,
        meta: { title: '海啸', pageKey: 'tsunami', showBanner: true }
    },
    {
        path: '/saltwater',
        name: 'Saltwater',
        component: Placeholder,
        meta: { title: '咸潮入侵', pageKey: 'saltwater', showBanner: false }
    },
    {
        path: '/seawater',
        name: 'Seawater',
        component: Placeholder,
        meta: { title: '海水入侵', pageKey: 'seawater', showBanner: false }
    },
    {
        path: '/sealevel',
        name: 'Sealevel',
        component: Placeholder,
        meta: { title: '海平面上升', pageKey: 'sealevel', showBanner: false }
    },
    {
        path: '/erosion',
        name: 'Erosion',
        component: Placeholder,
        meta: { title: '海岸侵蚀', pageKey: 'erosion', showBanner: false }
    },
    {
        path: '/oilspill',
        name: 'Oilspill',
        component: Placeholder,
        meta: { title: '溢油', pageKey: 'oilspill', showBanner: false }
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
    // 更新页面标题
    document.title = `${to.meta.title} - 广东省海洋灾害综合决策系统`
    next()
})

router.afterEach((to) => {
    // 更新当前页面状态
    const store = useAppStore()
    store.setCurrentPage(to.meta.pageKey)

    // 处理横幅状态
    if (to.meta.bannerDefaultCollapsed) {
        // 页面要求默认关闭横幅，触发动画
        store.isBannerCollapsed = false  // 先展开
        setTimeout(() => {
            store.collapseBannerWithAnimation()  // 然后播放关闭动画
        }, 300)
    }
})

export default router
