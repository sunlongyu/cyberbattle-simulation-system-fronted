import { createRouter, createWebHistory } from 'vue-router'
import reportWindow from '@/components/report_components/ReportWindow.vue'
import EnvStatusWindow from '@/components/env_components/EnvStatusWindow.vue'
import EnvironmentSetup from '@/components/attack_defense/EnvironmentSetup.vue'
import RealTimeSimulation from '@/components/attack_defense/RealTimeSimulation.vue'
import StrategyIntegration from '@/components/attack_defense/StrategyIntegration.vue'
import MultiDimAnalysis from '@/components/attack_defense/MultiDimAnalysis.vue'

const routes = [
  {
    path: '/environment-setup',
    name: 'environmentSetup',
    component: EnvironmentSetup,
    alias: '/',
    meta: {
      title: '攻防环境设置',
      description: '配置环境、拓扑和攻防参数',
      navOrder: 1,
      showInNav: true
    }
  },
  {
    path: '/strategy-integration',
    name: 'strategyIntegration',
    component: StrategyIntegration,
    meta: {
      title: '智能策略集成',
      description: '训练、导入和激活策略模型',
      navOrder: 2,
      showInNav: true
    }
  },
  {
    path: '/real-time-simulation',
    name: 'realTimeSimulation',
    component: RealTimeSimulation,
    meta: {
      title: '攻防实时推演',
      description: '基于场景和模型运行实时推演',
      navOrder: 3,
      showInNav: true
    }
  },
  {
    path: '/multi-dim-analysis',
    name: 'multiDimAnalysis',
    component: MultiDimAnalysis,
    meta: {
      title: '多维可视分析',
      description: '查看曲线、指标和实验产出',
      navOrder: 4,
      showInNav: true
    }
  },
  { path: '/reportWindow', name: 'reportWindow', component: reportWindow },
  { path: '/envStatusWindow/:player/:statusName', name: 'envStatusWindow', component: EnvStatusWindow },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
