<template>
  <div class="module-page">
    <div class="module-header">
      <div>
        <h2>攻防实时推演</h2>
        <p>回合制“探测-伪装-信念更新-攻击决策”流程的实时推演与日志记录。</p>
      </div>
      <div class="header-actions">
        <el-select
          v-model="activeScenarioId"
          placeholder="选择场景配置"
          class="scenario-select"
          @change="onScenarioChange"
        >
          <el-option v-for="config in scenarioConfigs" :key="config.id" :label="config.name" :value="config.id" />
        </el-select>
        <el-select
          v-model="activeModelId"
          placeholder="选择已激活模型"
          class="scenario-select"
          @change="onModelChange"
        >
          <el-option v-for="model in activeModels" :key="model.id" :label="model.name" :value="model.id" />
        </el-select>
        <el-button type="primary" :disabled="!canRunSimulation || isPlaying" @click="startSimulation">开始</el-button>
        <el-button :disabled="!isPlaying" @click="pauseSimulation">暂停</el-button>
        <el-button type="warning" :disabled="!canRunSimulation" @click="resetSimulation">重置</el-button>
      </div>
    </div>
    <div class="module-body">
      <section class="topology-panel">
        <NetworkTopo :show-player-status="false" :show-large-screen="false" />
      </section>
      <section class="control-panel">
        <el-alert
          v-if="activeModels.length === 0"
          class="status-card warning-card"
          title="尚未激活模型，请先在“智能策略集成”中训练并激活模型"
          type="warning"
          show-icon
        />
        <el-card shadow="never" class="status-card">
          <template #header>
            <div class="card-header">
              <span>推演配置摘要</span>
             
            </div>
          </template>
          <div v-if="activeScenario" class="status-grid">
            <div class="status-item">
              <div class="status-label">场景名称</div>
              <div class="status-value">{{ activeScenario.name }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">节点规模</div>
              <div class="status-value">{{ nodeScaleLabel }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">节点类型</div>
              <div class="status-value">{{ activeScenario.parameters.nodeTypes.join(' / ') }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">最大回合</div>
              <div class="status-value">{{ activeScenario.parameters.maxRounds }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">策略模型</div>
              <div class="status-value">{{ activeModelName }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">模型指标</div>
              <div class="status-value">{{ activeModelMetric }}</div>
            </div>
          </div>
          <el-empty v-else description="尚未选择配置，请先在左侧选择场景" />
        </el-card>
        <el-card shadow="never" class="status-card">
          <template #header>
            <div class="card-header">
              <span>运行状态</span>
              <el-tag :type="isPlaying ? 'success' : 'info'" effect="plain">
                {{ isPlaying ? '运行中' : '暂停' }}
              </el-tag>
            </div>
          </template>
          <div class="status-grid">
            <div class="status-item">
              <div class="status-label">当前回合</div>
              <div class="status-value">{{ currentRound.round }} / {{ maxRounds }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">阶段</div>
              <div class="status-value">{{ phaseLabel(currentRound.phase) }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">攻击者信念</div>
              <div class="status-value">{{ currentRound.attackerBelief }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">本回合收益</div>
              <div class="status-value">
                A {{ currentRound.payoff.attacker }} / D {{ currentRound.payoff.defender }}
              </div>
            </div>
          </div>
        </el-card>
        <el-card shadow="never" class="status-card log-card">
          <template #header>
            <div class="card-header">
              <span>对抗日志流</span>
              <span class="log-meta">{{ logMeta }}</span>
              
            </div>
          </template>
          <div class="log-list">
            <div v-for="(log, index) in logStream" :key="`${log.time}-${index}`" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-actor">{{ log.actor }}</span>
              <span class="log-message" :class="`log-${log.level}`">{{ log.message }}</span>
            </div>
          </div>
        </el-card>
        <el-card shadow="never" class="status-card">
          <template #header>
            <div class="card-header">
              <span>高级控制</span>
            </div>
          </template>
          <el-collapse v-model="advancedPanel">
            <el-collapse-item name="step">
              <template #title>
                单步推演
              </template>
              <div class="advanced-body">
                <div class="advanced-tip">适用于分析每个回合的动作与状态变化。</div>
                <el-button :disabled="!canRunSimulation" @click="stepSimulation">单步执行</el-button>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </section>
    </div>
  </div>
</template>

<script>
import NetworkTopo from '@/components/network_components/NetworkTopo.vue'
import { getMockSimulationRounds } from '@/core/mockData'
import {
  getScenarioConfigs,
  getActiveScenarioConfig,
  setActiveScenarioConfigId,
  getStrategyModels,
  getActiveStrategyModelId
} from '@/core/configStore'

export default {
  name: 'RealTimeSimulation',
  components: {
    NetworkTopo
  },
  data() {
    return {
      rounds: getMockSimulationRounds(),
      currentRoundIndex: 0,
      isPlaying: false,
      timer: null,
      logStream: [],
      scenarioConfigs: [],
      activeScenarioId: '',
      activeScenario: null,
      activeModelId: '',
      advancedPanel: []
    }
  },
  computed: {
    currentRound() {
      return this.rounds[this.currentRoundIndex]
    },
    canRunSimulation() {
      return Boolean(this.activeScenario && this.activeModelId)
    },
    activeModels() {
      return getStrategyModels().filter((item) => item.status === 'active')
    },
    activeModel() {
      if (!this.activeModelId) return null
      return getStrategyModels().find((item) => item.id === this.activeModelId) || null
    },
    activeModelName() {
      return this.activeModel ? this.activeModel.name : '未选择'
    },
    activeModelMetric() {
      if (!this.activeModel || !this.activeModel.metrics) return '-'
      return `胜率 ${this.activeModel.metrics.winRate}% / 收益 ${this.activeModel.metrics.avgReward}`
    },
    logMeta() {
      if (!this.activeModel) return '模型未选择'
      const version = this.activeModel.version || '-'
      const trainedAt = this.activeModel.lastTrainedAt || '-'
      return `版本 ${version} · 训练 ${trainedAt}`
    },
    nodeScaleLabel() {
      if (!this.activeScenario) return '-'
      const params = this.activeScenario.parameters || {}
      const realCount = params.realNodeCount
      const honeypotCount = params.honeypotNodeCount
      if (realCount !== undefined || honeypotCount !== undefined) {
        return `真实 ${realCount || 0} / 蜜罐 ${honeypotCount || 0}`
      }
      return params.nodeCount
    },
    maxRounds() {
      if (!this.activeScenario) return this.currentRound.round
      return this.activeScenario.parameters.maxRounds
    }
  },
  mounted() {
    this.loadScenarioConfigs()
    this.resetSimulation()
    this.advancedPanel = []
  },
  beforeUnmount() {
    this.clearTimer()
  },
  methods: {
    phaseLabel(phase) {
      const map = {
        probe: '探测',
        deception: '伪装',
        belief_update: '信念更新',
        attack: '攻击'
      }
      return map[phase] || phase
    },
    startSimulation() {
      if (this.isPlaying) return
      this.isPlaying = true
      this.timer = setInterval(() => {
        this.stepSimulation()
      }, 1500)
    },
    pauseSimulation() {
      this.isPlaying = false
      this.clearTimer()
    },
    stepSimulation() {
      if (this.currentRoundIndex < this.rounds.length - 1) {
        this.currentRoundIndex += 1
      } else {
        this.isPlaying = false
        this.clearTimer()
      }
      this.appendLogs()
    },
    resetSimulation() {
      this.pauseSimulation()
      this.currentRoundIndex = 0
      this.logStream = []
      this.appendLogs()
    },
    appendLogs() {
      const currentEvents = this.currentRound.events || []
      this.logStream = [...this.logStream, ...currentEvents]
    },
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    loadScenarioConfigs() {
      this.scenarioConfigs = getScenarioConfigs()
      const active = getActiveScenarioConfig()
      if (active) {
        this.activeScenarioId = active.id
        this.activeScenario = active
      }
      this.activeModelId = getActiveStrategyModelId() || ''
    },
    onModelChange(modelId) {
      this.activeModelId = modelId
    },
    onScenarioChange(configId) {
      const selected = this.scenarioConfigs.find((item) => item.id === configId)
      this.activeScenario = selected || null
      if (selected) {
        setActiveScenarioConfigId(selected.id)
      }
      this.resetSimulation()
    }
  }
}
</script>

<style scoped>
.module-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  gap: 16px;
}

.module-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 6px rgba(15, 44, 76, 0.06);
}

.module-header h2 {
  margin: 0 0 4px;
  font-size: 20px;
}

.module-header p {
  margin: 0;
  color: #6b7a90;
  font-size: 13px;
}

.scenario-select {
  width: 220px;
}

.module-body {
  flex: 1;
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  min-height: 0;
}

.topology-panel {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(15, 44, 76, 0.06);
  overflow: hidden;
  min-height: 520px;
}

.control-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-card {
  border-radius: 12px;
  border: 1px solid #eef1f6;
}

.warning-card {
  margin-bottom: 0;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.status-item {
  background: #f5f7fb;
  border-radius: 10px;
  padding: 12px;
}

.status-label {
  color: #6b7a90;
  font-size: 12px;
}

.status-value {
  font-size: 16px;
  margin-top: 6px;
  font-weight: 600;
}

.log-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.log-meta {
  font-size: 12px;
  color: #94a3b8;
}

.log-list {
  max-height: 260px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 6px 8px;
  background: #f9fbff;
  border-radius: 6px;
}

.log-time {
  color: #97a3b6;
  min-width: 60px;
}

.log-actor {
  font-weight: 600;
  color: #2f6ed6;
  min-width: 60px;
}

.log-message {
  flex: 1;
}

.log-info {
  color: #2f6ed6;
}

.log-warning {
  color: #d97706;
}

.log-success {
  color: #16a34a;
}

.log-danger {
  color: #dc2626;
}

.advanced-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
}

.advanced-tip {
  font-size: 12px;
  color: #64748b;
}

@media (max-width: 1200px) {
  .module-body {
    grid-template-columns: 1fr;
  }
  .topology-panel {
    min-height: 420px;
  }
}
</style>
