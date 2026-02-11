// src/renderer/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
// 移除引用
// import largeScreenMonitor from '@/components/large_screen_components/LargeScreenMonitor.vue'
import reportWindow from '@/components/report_components/ReportWindow.vue'
import EnvStatusWindow from '@/components/env_components/EnvStatusWindow.vue'
import EnvironmentSetup from '@/components/attack_defense/EnvironmentSetup.vue'
import RealTimeSimulation from '@/components/attack_defense/RealTimeSimulation.vue'
import StrategyIntegration from '@/components/attack_defense/StrategyIntegration.vue'
import MultiDimAnalysis from '@/components/attack_defense/MultiDimAnalysis.vue'

const routes = [
    { path: '/environment-setup', name: 'environmentSetup', component: EnvironmentSetup, alias: '/' },
    { path: '/real-time-simulation', name: 'realTimeSimulation', component: RealTimeSimulation },
    { path: '/strategy-integration', name: 'strategyIntegration', component: StrategyIntegration },
    { path: '/multi-dim-analysis', name: 'multiDimAnalysis', component: MultiDimAnalysis },
    // 移除路由
    // { path: '/largeScreenMonitor', name: 'largeScreenMonitor', component: largeScreenMonitor },
    { path: '/reportWindow', name: 'reportWindow', component: reportWindow },
    { path: '/envStatusWindow/:player/:statusName', name: 'envStatusWindow', component: EnvStatusWindow },
]

const router = createRouter({
  mode:'history',
  history: createWebHistory(),
  routes,
})

export default router