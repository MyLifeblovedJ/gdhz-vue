/**
 * 海洋渊听智能管理系统 - 路由配置
 */

import { createRouter, createWebHistory } from 'vue-router'
import { useAppStore } from '../stores/app'

// 页面组件 (懒加载)
const HomeOverview = () => import('../views/HomeOverview.vue')
const Placeholder = () => import('../views/Placeholder.vue')
const SeaConditionHome = () => import('../views/SeaConditionHome.vue')

const routes = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/home',
        name: 'HomeOverview',
        component: HomeOverview,
        meta: {
            title: '首页',
            pageKey: 'home',
            showBanner: true,
            bannerDefaultCollapsed: false,
        }
    },
    {
        path: '/ocean-geology',
        name: 'OceanGeology',
        component: SeaConditionHome,
        meta: {
            title: '海洋地质',
            pageKey: 'ocean-geology',
            showBanner: false,
        }
    },
    {
        path: '/ocean-survey',
        name: 'OceanSurvey',
        component: Placeholder,
        meta: { title: '海洋测绘', pageKey: 'ocean-survey', showBanner: false }
    },
    {
        path: '/passive-acoustics',
        name: 'PassiveAcoustics',
        component: Placeholder,
        meta: { title: '被动声学', pageKey: 'passive-acoustics', showBanner: false }
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to, from, next) => {
    document.title = `${to.meta.title} - 海洋渊听智能管理系统`
    next()
})

router.afterEach((to) => {
    const store = useAppStore()
    store.setCurrentPage(to.meta.pageKey)

    if (to.meta.bannerDefaultCollapsed) {
        store.isBannerCollapsed = false
        setTimeout(() => {
            store.collapseBannerWithAnimation()
        }, 300)
    }
})

export default router
