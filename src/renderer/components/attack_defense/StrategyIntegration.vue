<template>
  <div class="module-page">
    <div class="module-header">
      <div>
        <h2>智能策略集成</h2>
        <p>管理算法模型，绑定实验场景并完成训练与推演切换。</p>
      </div>
      <el-button type="primary" @click="showUploadDialog = true">导入模型</el-button>
    </div>
    <div class="module-body">
      <el-card shadow="never" class="config-card">
        <template #header>
          <div class="card-header">
            <span>模型列表</span>
            <el-tag type="info" effect="plain">算法模型</el-tag>
          </div>
        </template>
        <el-table :data="filteredModels" style="width: 100%">
          <el-table-column prop="name" label="模型名称" />
          <el-table-column label="适配场景" min-width="240">
            <template #default="{ row }">
              <el-select
                :model-value="row.scenarioId || ''"
                placeholder="选择已配置场景"
                clearable
                @change="(value) => assignScenario(row, value)"
              >
                <el-option
                  v-for="config in scenarioConfigs"
                  :key="config.id"
                  :label="config.name"
                  :value="config.id"
                />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                :disabled="!row.scenarioId || row.status === 'training' || row.access !== 'backend'"
                @click="openTrainingPanel(row)"
              >
                {{ row.access === 'backend' ? (row.status === 'training' ? '训练中' : '训练') : '即将开放' }}
              </el-button>
              <el-button
                type="success"
                link
                :disabled="row.status !== 'ready' || row.access !== 'backend'"
                @click="activateRowModel(row)"
              >
                激活
              </el-button>
              <el-button type="danger" link @click="deleteModel(row)">删除</el-button>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="modelStatusTagType(row)">
                {{ modelStatusLabel(row) }}
              </el-tag>
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
    </div>

    <el-dialog v-model="showUploadDialog" title="导入模型" width="420px">
      <el-form label-width="96px">
        <el-form-item label="模型名称">
          <el-input v-model="uploadForm.name" placeholder="例如：SG-MAPPO-电网防御" />
        </el-form-item>
        <el-form-item label="算法类型">
          <el-select v-model="uploadForm.algorithmType" placeholder="选择算法">
            <el-option label="MAPPO" value="MAPPO" />
            <el-option label="PPO" value="PPO" />
            <el-option label="DQN" value="DQN" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本号">
          <el-input v-model="uploadForm.version" placeholder="例如：v1.0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!uploadForm.name || !uploadForm.algorithmType" @click="importLocalModel">
          导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import {
  getScenarioConfigs,
  getActiveScenarioConfig,
  setActiveScenarioConfigId,
  getStrategyModels,
  replaceStrategyModels,
  saveStrategyModel,
  setActiveStrategyModelId
} from '@/core/configStore'
import {
  activateModel as activateModelRequest,
  fetchModels,
  importModel as importModelRequest,
  normalizeDisplayModel,
  reconcileModels,
  trainModel as trainModelRequest
} from '@/core/modelService'

export default {
  name: 'StrategyIntegration',
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
      trainingLogs: [],
      uploadForm: {
        name: '',
        algorithmType: 'MAPPO',
        version: 'v1.0'
      }
    }
  },
  computed: {
    filteredModels() {
      return this.modelList.map((item) => ({
        ...normalizeDisplayModel(item),
        scene: this.resolveScenarioName(item.scenarioId)
      }))
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
    async startTraining() {
      const scenario = this.scenarioConfigs.find((item) => item.id === this.activeScenarioId)
      if (!this.trainingModelId) return
      if (this.activeModel?.access !== 'backend') {
        this.$message.warning('当前模型未接入后端训练能力，请切换到已接入模型')
        return
      }
      this.trainingLogs = [
        `已选择训练环境：${scenario ? scenario.name : '未命名环境'}`,
        `算法类型：${this.activeModel?.algorithmType || '-'}`,
        `训练轮数：${this.trainingForm.epochs}，学习率：${this.trainingForm.learningRate}`,
        '训练任务已启动，正在初始化环境'
      ]
      try {
        this.updateModelStatus(this.trainingModelId, 'training', {
          scenarioId: scenario ? scenario.id : '',
          scene: scenario ? scenario.name : '未命名环境'
        })
        const trained = await trainModelRequest(this.trainingModelId, {
          scenarioId: this.activeScenarioId,
          epochs: this.trainingForm.epochs,
          learningRate: this.trainingForm.learningRate,
          notes: this.trainingForm.notes
        })
        this.trainingLogs.push('训练完成，策略参数已更新')
        this.upsertModel(trained)
        this.$message.success('训练完成')
      } catch (error) {
        this.updateModelStatus(this.trainingModelId, 'untrained')
        this.trainingLogs.push(`训练失败：${error.message}`)
        this.$message.error(`训练失败：${error.message}`)
      }
    },
    openTrainingPanel(row) {
      this.trainingModelId = row.id
      this.trainingLogs = []
      this.activeScenarioId = row.scenarioId || this.activeScenarioId
    },
    async activateModel() {
      if (!this.activeModel) return
      if (this.activeModel.status !== 'ready') return
      try {
        await activateModelRequest(this.activeModel.id)
        this.activeModelId = this.activeModel.id
        this.updateModelStatus(this.activeModel.id, 'active')
        setActiveStrategyModelId(this.activeModel.id)
        this.$message.success(`已激活模型：${this.activeModel.name}`)
      } catch (error) {
        this.$message.error(`激活失败：${error.message}`)
      }
    },
    activateRowModel(row) {
      this.activeModelId = row.id
      this.trainingModelId = row.id
      this.activeScenarioId = row.scenarioId || this.activeScenarioId
      this.activateModel()
    },
    async deleteModel(row) {
      this.modelList = this.modelList.filter((item) => item.id !== row.id)
      this.modelList = replaceStrategyModels(this.modelList)
      if (this.activeModelId === row.id) {
        this.activeModelId = ''
        setActiveStrategyModelId('')
      }
      if (this.trainingModelId === row.id) {
        this.trainingModelId = ''
        this.trainingLogs = []
      }
      this.$message.success(`已删除模型：${row.name}`)
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
      if (this.trainingModelId) {
        this.assignScenario({ id: this.trainingModelId }, configId, false)
      }
    },
    async loadModels() {
      const stored = getStrategyModels()
      try {
        const remoteModels = await fetchModels()
        const merged = reconcileModels(remoteModels, stored)
        if (merged.length > 0) {
          const normalized = merged.map((model) => normalizeDisplayModel(model))
          normalized.forEach((model) => saveStrategyModel(model))
          this.modelList = normalized
          return
        }
      } catch (error) {
        this.$message.warning(`模型列表加载失败，已使用本地缓存：${error.message}`)
      }

      if (stored && stored.length) {
        this.modelList = stored.map((model) => normalizeDisplayModel(model))
        return
      }

      const seeds = [
        {
          name: 'SG-MAPPO',
          algorithmType: 'MAPPO',
          version: 'v1.0',
          notes: '主展示模型',
          access: 'backend'
        },
        {
          name: 'PPO-Defense',
          algorithmType: 'PPO',
          version: 'v1.0',
          notes: '单智能体防御策略基线模型'
        },
        {
          name: 'DQN-Defense',
          algorithmType: 'DQN',
          version: 'v0.9',
          notes: '离散动作快速响应模型'
        },
        {
          name: 'A2C-Defense',
          algorithmType: 'A2C',
          version: 'v0.8',
          notes: '轻量占位模型'
        }
      ]

      const createdModels = []
      for (const seed of seeds) {
        const fallback = normalizeDisplayModel({
          id: `model-${Date.now()}-${createdModels.length}`,
          name: seed.name,
          algorithmType: seed.algorithmType,
          access: seed.access || 'placeholder',
          scene: '',
          version: seed.version,
          status: 'untrained',
          scenarioId: '',
          metrics: null,
          lastTrainedAt: '-'
        })
        createdModels.push(fallback)
        saveStrategyModel(fallback)
      }
      this.modelList = createdModels
    },
    async importLocalModel() {
      const payload = {
        name: this.uploadForm.name.trim(),
        algorithmType: this.uploadForm.algorithmType,
        version: this.uploadForm.version || 'v1.0'
      }
      if (!payload.name) return
      try {
        const created = await importModelRequest(payload)
        this.upsertModel(created)
      } catch (error) {
        const fallback = normalizeDisplayModel({
          id: `model-${Date.now()}`,
          name: payload.name,
          algorithmType: payload.algorithmType,
          access: 'placeholder',
          scene: '',
          version: payload.version,
          status: 'untrained',
          scenarioId: '',
          metrics: null,
          lastTrainedAt: '-'
        })
        this.upsertModel(fallback)
      }
      this.showUploadDialog = false
      this.uploadForm = {
        name: '',
        algorithmType: 'MAPPO',
        version: 'v1.0'
      }
      this.$message.success('模型已导入')
    },
    assignScenario(row, scenarioId, syncActive = true) {
      const selected = this.scenarioConfigs.find((item) => item.id === scenarioId)
      const nextScenarioId = scenarioId || ''
      const scene = selected ? selected.name : ''
      this.modelList = this.modelList.map((item) => {
        if (item.id !== row.id) return item
        const updated = {
          ...item,
          scenarioId: nextScenarioId,
          scene
        }
        saveStrategyModel(updated)
        return updated
      })
      if (syncActive && nextScenarioId) {
        this.activeScenarioId = nextScenarioId
        setActiveScenarioConfigId(nextScenarioId)
      }
    },
    upsertModel(model) {
      const existingIndex = this.modelList.findIndex((item) => item.id === model.id)
      if (existingIndex >= 0) {
        this.modelList.splice(existingIndex, 1, model)
      } else {
        this.modelList.push(model)
      }
      saveStrategyModel(model)
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
    resolveScenarioName(scenarioId) {
      if (!scenarioId) return '未绑定'
      const selected = this.scenarioConfigs.find((item) => item.id === scenarioId)
      return selected ? selected.name : '未绑定'
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
    },
    modelStatusLabel(model) {
      if (model.access !== 'backend') return '待开放'
      return this.statusLabel(model.status)
    },
    modelStatusTagType(model) {
      if (model.access !== 'backend') return 'info'
      return this.statusTagType(model.status)
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

</style>
