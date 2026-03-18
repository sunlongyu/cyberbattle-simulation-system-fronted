<template>
  <div class="module-page">
    <div class="module-header">
      <div>
        <h2>攻防实时推演</h2>
        <p>回合制“探测-伪装-信念更新-攻击决策”流程的实时推演、关键指标与结果生成。</p>
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

    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-label">推演进度</div>
        <div class="summary-value">{{ progressPercent }}%</div>
        <el-progress :percentage="progressPercent" :stroke-width="8" :show-text="false" />
      </div>
      <div class="summary-card">
        <div class="summary-label">攻击者信念</div>
        <div class="summary-value">{{ beliefLabel }}</div>
        <div class="summary-subtext">当前回合的信念值</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">累计收益</div>
        <div class="summary-value">A {{ cumulativePayoff.attacker }} / D {{ cumulativePayoff.defender }}</div>
        <div class="summary-subtext">当前累计对抗结果</div>
      </div>
      <div class="summary-card action-card">
        <div class="summary-label">结果产出</div>
        <el-button
          type="success"
          :disabled="!canGenerateReport"
          :loading="reportGenerating"
          @click="generateAnalysisResult"
        >
          生成分析结果
        </el-button>
        <div class="summary-subtext">{{ reportStatusText }}</div>
      </div>
    </div>

    <div class="module-body">
      <section class="topology-panel">
        <NetworkTopo
          :show-player-status="false"
          :show-large-screen="false"
          :topology-data="activeScenario ? activeScenario.topology : null"
        />
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
              <el-tag type="info" effect="plain">{{ simulationStatusLabel }}</el-tag>
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
              <div class="status-value">{{ nodeTypeLabel }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">最大回合</div>
              <div class="status-value">{{ maxRounds }}</div>
            </div>
            <div class="status-item">
              <div class="status-label">策略模型</div>
              <div class="status-value">{{ activeModelName }}</div>
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
            <div class="status-item wide-item">
              <div class="status-label">攻击动作</div>
              <div class="status-value">{{ currentRound.attackerAction }}</div>
            </div>
            <div class="status-item wide-item">
              <div class="status-label">防御动作</div>
              <div class="status-value">{{ currentRound.defenderAction }}</div>
            </div>
            <div class="status-item full-item">
              <div class="status-label">观测信号</div>
              <div class="status-value">{{ currentRound.signal }}</div>
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
              <span>单步控制</span>
            </div>
          </template>
          <div class="advanced-body">
            <div class="advanced-tip">逐回合查看动作、收益与观测变化。</div>
            <el-button :disabled="!canRunSimulation" @click="stepSimulation">单步执行</el-button>
          </div>
        </el-card>
      </section>
    </div>
  </div>
</template>

<script>
import NetworkTopo from '@/components/network_components/NetworkTopo.vue'
import {
  getActiveScenarioConfigId,
  getScenarioConfigs,
  getStrategyModels,
  getActiveStrategyModelId
} from '@/core/configStore'
import {
  saveScenarioConfig,
  saveStrategyModel,
  setActiveScenarioConfigId,
  setActiveStrategyModelId
} from '@/core/configStore'
import { fetchScenarioConfigs } from '@/core/scenarioService'
import { fetchModels, normalizeDisplayModel, reconcileModels } from '@/core/modelService'
import { createReport } from '@/core/resultsService'
import {
  pauseSimulation as pauseSimulationRequest,
  resetSimulation as resetSimulationRequest,
  startSimulation as startSimulationRequest,
  stepSimulation as stepSimulationRequest
} from '@/core/simulationService'

const EMPTY_ROUND = {
  round: 0,
  phase: 'probe',
  attackerAction: '等待开始',
  defenderAction: '等待开始',
  attackerBelief: 0,
  signal: '等待仿真启动',
  payoff: { attacker: 0, defender: 0 }
}

const EMPTY_SIMULATION = {
  id: '',
  status: 'idle',
  currentRound: 0,
  phase: 'probe',
  runtimeState: {},
  currentStep: { ...EMPTY_ROUND }
}

export default {
  name: 'RealTimeSimulation',
  components: {
    NetworkTopo
  },
  data() {
    return {
      simulationId: '',
      simulationState: { ...EMPTY_SIMULATION },
      currentRoundData: { ...EMPTY_ROUND },
      isPlaying: false,
      timer: null,
      logStream: [],
      scenarioConfigs: [],
      activeScenarioId: '',
      activeScenario: null,
      models: [],
      activeModelId: '',
      reportGenerating: false,
      lastGeneratedResultId: ''
    }
  },
  computed: {
    currentRound() {
      return this.currentRoundData
    },
    canRunSimulation() {
      return Boolean(this.activeScenario && this.activeModelId && this.activeModel?.access === 'backend')
    },
    canGenerateReport() {
      return Boolean(this.simulationId && this.currentRound.round > 0 && !this.reportGenerating)
    },
    activeModels() {
      return this.models.filter((item) => item.status === 'active')
    },
    activeModel() {
      if (!this.activeModelId) return null
      return this.models.find((item) => item.id === this.activeModelId) || null
    },
    activeModelName() {
      return this.activeModel ? normalizeDisplayModel(this.activeModel).name : '未选择'
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
      return params.nodeCount || this.activeScenario.topology?.nodes?.length || 0
    },
    nodeTypeLabel() {
      const nodeTypes = this.activeScenario?.parameters?.nodeTypes || []
      return nodeTypes.length ? nodeTypes.join(' / ') : '未配置'
    },
    maxRounds() {
      if (!this.activeScenario) return this.currentRound.round || 0
      return this.activeScenario.parameters.maxRounds || 0
    },
    progressPercent() {
      if (!this.maxRounds) return 0
      return Math.min(100, Math.round((this.currentRound.round / this.maxRounds) * 100))
    },
    currentRuntimeState() {
      return this.simulationState.runtimeState || {}
    },
    cumulativePayoff() {
      return this.currentRuntimeState.cumulative_payoff || { attacker: 0, defender: 0 }
    },
    beliefLabel() {
      const belief = Number(this.currentRound.attackerBelief || 0)
      return belief.toFixed(2)
    },
    simulationStatusLabel() {
      const map = {
        idle: '待机',
        starting: '初始化',
        running: '运行中',
        paused: '已暂停',
        completed: '已完成'
      }
      return map[this.simulationState.status] || '待机'
    },
    reportStatusText() {
      if (this.lastGeneratedResultId) {
        return `结果已生成，可前往“多维可视分析”查看（${this.lastGeneratedResultId.slice(0, 8)}）`
      }
      if (!this.simulationId) return '先启动一次推演'
      return '完成至少 1 个回合后即可生成'
    }
  },
  async mounted() {
    await this.loadScenarioConfigs()
    await this.resetSimulation()
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
    applySimulationState(simulation) {
      this.simulationState = simulation
      this.simulationId = simulation.id || ''
      this.currentRoundData = simulation.currentStep || { ...EMPTY_ROUND }
    },
    async startSimulation() {
      if (this.isPlaying) return
      if (this.activeModel?.access !== 'backend') {
        this.$message.warning('当前模型未接入真实推演后端')
        return
      }
      if (!this.simulationId) {
        try {
          const simulation = await startSimulationRequest({
            scenarioId: this.activeScenarioId,
            modelId: this.activeModelId
          })
          this.applySimulationState(simulation)
          this.logStream = []
          this.lastGeneratedResultId = ''
        } catch (error) {
          this.$message.error(`启动失败：${error.message}`)
          return
        }
      }
      this.isPlaying = true
      this.timer = setInterval(() => {
        this.stepSimulation()
      }, 1500)
    },
    async pauseSimulation() {
      this.isPlaying = false
      this.clearTimer()
      if (!this.simulationId) return
      try {
        const simulation = await pauseSimulationRequest(this.simulationId)
        this.applySimulationState(simulation)
      } catch (error) {
        this.$message.warning(`暂停接口失败：${error.message}`)
      }
    },
    async stepSimulation() {
      if (this.activeModel?.access !== 'backend') {
        this.$message.warning('当前模型未接入真实推演后端')
        return
      }
      if (!this.simulationId) {
        try {
          const simulation = await startSimulationRequest({
            scenarioId: this.activeScenarioId,
            modelId: this.activeModelId
          })
          this.applySimulationState(simulation)
          this.lastGeneratedResultId = ''
        } catch (error) {
          this.$message.error(`启动失败：${error.message}`)
          return
        }
      }
      try {
        const response = await stepSimulationRequest(this.simulationId)
        this.applySimulationState(response.simulation)
        this.logStream = [...this.logStream, ...response.latestEvents]
        if (this.currentRoundData.round >= this.maxRounds) {
          this.isPlaying = false
          this.clearTimer()
        }
      } catch (error) {
        this.isPlaying = false
        this.clearTimer()
        this.$message.error(`单步推演失败：${error.message}`)
      }
    },
    async resetSimulation() {
      this.isPlaying = false
      this.clearTimer()
      this.lastGeneratedResultId = ''
      if (this.simulationId) {
        try {
          const simulation = await resetSimulationRequest(this.simulationId)
          this.applySimulationState(simulation)
          this.logStream = []
          return
        } catch (error) {
          this.$message.warning(`重置接口失败，已执行本地重置：${error.message}`)
        }
      }
      this.simulationId = ''
      this.simulationState = { ...EMPTY_SIMULATION }
      this.currentRoundData = { ...EMPTY_ROUND }
      this.logStream = []
    },
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },
    async generateAnalysisResult() {
      if (!this.canGenerateReport) return
      this.reportGenerating = true
      try {
        const result = await createReport(this.simulationId)
        this.lastGeneratedResultId = result.id
        this.$message.success('分析结果已生成，正在跳转到多维分析页面')
        this.$router.push({ name: 'multiDimAnalysis' })
      } catch (error) {
        this.$message.error(`结果生成失败：${error.message}`)
      } finally {
        this.reportGenerating = false
      }
    },
    async loadScenarioConfigs() {
      let scenarios = getScenarioConfigs()
      try {
        scenarios = await fetchScenarioConfigs()
        scenarios.forEach((scenario) => saveScenarioConfig(scenario))
      } catch (error) {
        scenarios = getScenarioConfigs()
      }
      this.scenarioConfigs = scenarios
      const preferredScenarioId = getActiveScenarioConfigId()
      const selectedScenario = scenarios.find((item) => item.id === preferredScenarioId) || scenarios[0] || null
      this.activeScenario = selectedScenario
      this.activeScenarioId = selectedScenario ? selectedScenario.id : ''
      if (selectedScenario) {
        setActiveScenarioConfigId(selectedScenario.id)
      }
      await this.loadModels()
    },
    async loadModels() {
      const storedModels = getStrategyModels()
      let models = storedModels
      try {
        const remoteModels = await fetchModels()
        models = reconcileModels(remoteModels, storedModels).map((model) => normalizeDisplayModel(model))
        models.forEach((model) => saveStrategyModel(model))
      } catch (error) {
        models = storedModels.map((model) => normalizeDisplayModel(model))
      }
      this.models = models
      const activeModelId = getActiveStrategyModelId()
      const selectedModel = models.find((item) => item.id === activeModelId && item.status === 'active') ||
        models.find((item) => item.status === 'active') ||
        null
      this.activeModelId = selectedModel ? selectedModel.id : ''
      if (selectedModel) {
        setActiveStrategyModelId(selectedModel.id)
      }
    },
    onModelChange(modelId) {
      this.activeModelId = modelId
      this.lastGeneratedResultId = ''
      setActiveStrategyModelId(modelId)
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
  gap: 16px;
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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.scenario-select {
  width: 220px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-card {
  background: linear-gradient(135deg, #f8fbff 0%, #eef6ff 100%);
  border: 1px solid #d8e6fb;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-label {
  font-size: 13px;
  color: #64748b;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.summary-subtext {
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.action-card {
  justify-content: space-between;
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

.wide-item {
  grid-column: span 1;
}

.full-item {
  grid-column: 1 / -1;
}

.status-label {
  color: #6b7a90;
  font-size: 12px;
}

.status-value {
  font-size: 16px;
  margin-top: 6px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.5;
  word-break: break-word;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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

@media (max-width: 1400px) {
  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 1200px) {
  .module-header,
  .module-body {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .module-header {
    align-items: flex-start;
  }

  .topology-panel {
    min-height: 420px;
  }
}

@media (max-width: 768px) {
  .summary-grid,
  .status-grid {
    grid-template-columns: 1fr;
  }

  .scenario-select {
    width: 100%;
  }

  .header-actions {
    width: 100%;
  }
}
</style>
