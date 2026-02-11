<template>
  <div class="module-page">
    <div class="module-header">
      <div>
        <h2>智能策略集成</h2>
        <p>面向强化学习的模型训练、管理与推理配置。</p>
      </div>
    </div>
    <div class="module-body">
      <el-card shadow="never" class="config-card">
        <template #header>
          <div class="card-header header-actions">
            <span>模型列表</span>
            <el-button size="small" @click="openUploadDialog">导入模型</el-button>
          </div>
        </template>
        <el-table :data="filteredModels" style="width: 100%">
          <el-table-column prop="name" label="模型名称" />
          <el-table-column prop="scene" label="适用场景" />
          <el-table-column prop="version" label="版本" width="120" />
          <el-table-column label="训练指标" width="200">
            <template #default="{ row }">
              <div v-if="row.metrics" class="metric-cell">
                <span>胜率 {{ row.metrics.winRate }}%</span>
                <span>收益 {{ row.metrics.avgReward }}</span>
              </div>
              <span v-else class="metric-empty">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button
                type="warning"
                link
                :disabled="row.status !== 'untrained'"
                @click="openTrainingPanel(row)"
              >
                训练
              </el-button>
              <el-button type="danger" link @click="deleteModel(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
      <el-card v-if="showTrainingPanel" shadow="never" class="config-card">
        <template #header>
          <div class="card-header">
            <span>训练配置</span>
            <el-tag type="info" effect="plain">模型：{{ activeModel?.name || '-' }}</el-tag>
          </div>
        </template>
        <el-alert
          v-if="showScenarioWarning"
          class="scenario-warning"
          title="当前训练环境与模型绑定场景不一致，建议重新训练"
          type="warning"
          show-icon
        />
        <el-form label-width="120px" class="training-form">
          <el-form-item label="训练环境">
            <el-select v-model="activeScenarioId" placeholder="选择已配置环境" @change="onScenarioChange">
              <el-option v-for="config in scenarioConfigs" :key="config.id" :label="config.name" :value="config.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="训练轮数">
            <el-input-number v-model="trainingForm.epochs" :min="10" :max="5000" />
          </el-form-item>
          <el-form-item label="学习率">
            <el-input-number v-model="trainingForm.learningRate" :step="0.0001" :min="0.0001" :max="0.01" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="trainingForm.notes" type="textarea" rows="2" />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              :disabled="!activeScenarioId || activeModel?.status === 'training'"
              @click="startTraining"
            >
              启动训练
            </el-button>
          </el-form-item>
        </el-form>
        <div v-if="trainingLogs.length" class="training-log">
          <div class="log-title">训练过程</div>
          <div class="log-list">
            <div v-for="(log, index) in trainingLogs" :key="index" class="log-item">
              {{ log }}
            </div>
          </div>
        </div>
        <div v-if="canActivate" class="training-actions">
          <el-button type="success" @click="activateModel">激活模型</el-button>
        </div>
      </el-card>
      <el-card shadow="never" class="config-card">
        <template #header>
          <div class="card-header">
            <span>策略接入说明</span>
            <el-tag type="success" effect="plain">参考流程</el-tag>
          </div>
        </template>
        <div class="guide-list">
          <div class="guide-item">1. 在“攻防环境设置”中配置场景参数与拓扑。</div>
          <div class="guide-item">2. 在本模块选择未训练模型，启动训练。</div>
          <div class="guide-item">3. 训练完成后点击激活，模型状态更新为“已激活”。</div>
          <div class="guide-item">4. 在“攻防实时推演”中选择已激活模型进行推演。</div>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="showUploadDialog" title="导入模型" width="420px">
      <div class="upload-placeholder">
        <el-icon><Upload /></el-icon>
        <p>模型文件上传与校验</p>
      </div>
      <template #footer>
        <el-button @click="showUploadDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { Upload } from '@element-plus/icons-vue'
import {
  getScenarioConfigs,
  getActiveScenarioConfig,
  setActiveScenarioConfigId,
  getStrategyModels,
  saveStrategyModel,
  getStrategyModelsByScenario,
  setActiveStrategyModelId
} from '@/core/configStore'

export default {
  name: 'StrategyIntegration',
  components: {
    Upload
  },
  data() {
    return {
      showUploadDialog: false,
      scenarioConfigs: [],
      activeScenarioId: '',
      trainingModelId: '',
      trainingForm: {
        epochs: 1200,
        learningRate: 0.0005,
        notes: ''
      },
      modelList: [],
      activeModelId: '',
      trainingLogs: []
    }
  },
  computed: {
    filteredModels() {
      if (!this.activeScenarioId) return this.modelList
      return this.modelList.filter((item) => !item.scenarioId || item.scenarioId === this.activeScenarioId)
    },
    activeModel() {
      const modelId = this.trainingModelId || this.activeModelId
      return this.modelList.find((item) => item.id === modelId)
    },
    showTrainingPanel() {
      return Boolean(this.trainingModelId)
    },
    canActivate() {
      return this.activeModel && this.activeModel.status === 'ready'
    },
    showScenarioWarning() {
      if (!this.activeModel) return false
      if (!this.activeScenarioId) return false
      if (!this.activeModel.scenarioId) return false
      return this.activeModel.scenarioId !== this.activeScenarioId
    }
  },
  created() {
    this.loadScenarioConfigs()
    this.loadModels()
  },
  methods: {
    openUploadDialog() {
      this.showUploadDialog = true
    },
    startTraining() {
      const scenario = this.scenarioConfigs.find((item) => item.id === this.activeScenarioId)
      if (!this.trainingModelId) return
      this.updateModelStatus(this.trainingModelId, 'training', {
        scenarioId: scenario ? scenario.id : '',
        scene: scenario ? scenario.name : '未命名环境'
      })
      this.trainingLogs = [
        `已选择训练环境：${scenario ? scenario.name : '未命名环境'}`,
        `训练轮数：${this.trainingForm.epochs}，学习率：${this.trainingForm.learningRate}`,
        '训练任务已启动，正在初始化环境...'
      ]
      setTimeout(() => {
        this.trainingLogs.push('训练完成，已生成策略权重（Mock）')
        this.updateModelStatus(this.trainingModelId, 'ready', {
          metrics: this.generateMockMetrics(),
          lastTrainedAt: new Date().toLocaleString()
        })
      }, 800)
      this.$message.success('训练已启动（Mock）')
    },
    openTrainingPanel(row) {
      if (row.status !== 'untrained') return
      this.trainingModelId = row.id
      this.trainingLogs = []
      if (this.activeScenarioId) return
      const active = getActiveScenarioConfig()
      if (active) {
        this.activeScenarioId = active.id
      }
    },
    deleteModel(row) {
      this.modelList = this.modelList.filter((item) => item.id !== row.id)
      if (this.activeModelId === row.id) {
        this.activeModelId = ''
        this.trainingLogs = []
      }
      if (this.trainingModelId === row.id) {
        this.trainingModelId = ''
        this.trainingLogs = []
      }
      this.$message.success(`已删除模型：${row.name}`)
    },
    activateModel() {
      if (!this.activeModel) return
      if (this.activeModel.status !== 'ready') return
      this.activeModelId = this.activeModel.id
      this.updateModelStatus(this.activeModel.id, 'active')
      setActiveStrategyModelId(this.activeModel.id)
      this.$message.success(`已激活模型：${this.activeModel.name}`)
    },
    loadScenarioConfigs() {
      this.scenarioConfigs = getScenarioConfigs()
      const active = getActiveScenarioConfig()
      if (active) {
        this.activeScenarioId = active.id
      }
    },
    onScenarioChange(configId) {
      const selected = this.scenarioConfigs.find((item) => item.id === configId)
      if (selected) {
        setActiveScenarioConfigId(selected.id)
      }
    },
    loadModels() {
      const stored = getStrategyModels()
      if (stored && stored.length) {
        const seeds = [
          {
            id: 'model-dqn-004',
            name: 'DQN-Defense',
            scene: '通用拓扑',
            version: 'v0.7',
            status: 'untrained',
            scenarioId: '',
            metrics: null,
            lastTrainedAt: '-'
          }
        ]
        const existingIds = new Set(stored.map((item) => item.id))
        const merged = [...stored]
        seeds.forEach((seed) => {
          if (!existingIds.has(seed.id)) {
            merged.push(seed)
            saveStrategyModel(seed)
          }
        })
        this.modelList = merged
      } else {
        this.modelList = [
          {
            id: 'model-sg-mappo-001',
            name: 'SG-MAPPO-Base',
            scene: '通用拓扑',
            version: 'v1.0',
            status: 'untrained',
            scenarioId: '',
            metrics: null,
            lastTrainedAt: '-'
          },
          {
            id: 'model-dqn-004',
            name: 'DQN-Defense',
            scene: '通用拓扑',
            version: 'v0.7',
            status: 'untrained',
            scenarioId: '',
            metrics: null,
            lastTrainedAt: '-'
          },
          {
            id: 'model-ppo-002',
            name: 'PPO-Defense',
            scene: '企业内网',
            version: 'v0.9',
            status: 'ready',
            scenarioId: '',
            metrics: { winRate: 58, avgReward: 1.4 },
            lastTrainedAt: '2026-02-08'
          },
          {
            id: 'model-a2c-003',
            name: 'A2C-Baseline',
            scene: '电网控制区',
            version: 'v0.8',
            status: 'training',
            scenarioId: '',
            metrics: null,
            lastTrainedAt: '-'
          }
        ]
        this.modelList.forEach((model) => saveStrategyModel(model))
      }
    },
    updateModelStatus(modelId, status, overrides = {}) {
      this.modelList = this.modelList.map((item) => {
        if (item.id === modelId) {
          const updated = { ...item, status, ...overrides }
          saveStrategyModel(updated)
          return updated
        }
        if (status === 'active' && item.status === 'active') {
          const updated = { ...item, status: 'ready' }
          saveStrategyModel(updated)
          return updated
        }
        return item
      })
    },
    generateMockMetrics() {
      const winRate = Math.floor(50 + Math.random() * 40)
      const avgReward = Number((1 + Math.random() * 2).toFixed(2))
      return { winRate, avgReward }
    },
    statusLabel(status) {
      if (status === 'untrained') return '未训练'
      if (status === 'active') return '已激活'
      if (status === 'ready') return '已训练'
      return '训练中'
    },
    statusTagType(status) {
      if (status === 'untrained') return 'info'
      if (status === 'active') return 'success'
      if (status === 'ready') return 'info'
      return 'warning'
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

.scenario-select {
  width: 220px;
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

.module-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-card {
  border-radius: 12px;
  border: 1px solid #eef1f6;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.header-actions {
  width: 100%;
}

.training-form .el-form-item {
  max-width: 560px;
}

.training-log {
  margin-top: 16px;
  background: #f5f7fb;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 13px;
  color: #41516a;
}

.training-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.metric-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #475569;
}

.metric-empty {
  color: #94a3b8;
}

.scenario-warning {
  margin-bottom: 12px;
}

.log-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.guide-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 14px;
  color: #41516a;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  color: #6b7a90;
}

@media (max-width: 1200px) {
  .module-body {
    grid-template-columns: 1fr;
  }
}
</style>
