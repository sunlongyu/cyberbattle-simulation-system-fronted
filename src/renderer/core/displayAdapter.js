const DEFAULT_SCENARIO_NAME = '工控网络攻防测试场景v1'
const DEFAULT_SCENARIO_DESCRIPTION = '默认工业内网攻防实验场景。'

const DEFAULT_FRONTEND_MODELS = [
  {
    id: 'model-seed-mappo',
    name: 'SG-MAPPO',
    algorithmType: 'MAPPO',
    access: 'backend',
    version: 'v1.0',
    status: 'untrained',
    scenarioId: '',
    scene: '',
    metrics: null,
    lastTrainedAt: '-',
    notes: '主展示模型'
  },
  {
    id: 'model-seed-dqn',
    name: 'DQN-Defense',
    algorithmType: 'DQN',
    access: 'placeholder',
    version: 'v1.0',
    status: 'untrained',
    scenarioId: '',
    scene: '',
    metrics: null,
    lastTrainedAt: '-',
    notes: '前端展示占位模型'
  },
  {
    id: 'model-seed-ppo',
    name: 'PPO-Defense',
    algorithmType: 'PPO',
    access: 'placeholder',
    version: 'v1.0',
    status: 'untrained',
    scenarioId: '',
    scene: '',
    metrics: null,
    lastTrainedAt: '-',
    notes: '前端展示占位模型'
  },
  {
    id: 'model-seed-a2c',
    name: 'A2C-Defense',
    algorithmType: 'A2C',
    access: 'placeholder',
    version: 'v1.0',
    status: 'untrained',
    scenarioId: '',
    scene: '',
    metrics: null,
    lastTrainedAt: '-',
    notes: '前端展示占位模型'
  }
]

function isDemoScenarioName(name = '') {
  const normalized = String(name).trim().toLowerCase()
  return normalized.includes('cyborg drone swarm')
}

function normalizeScenarioName(name = '') {
  return isDemoScenarioName(name) ? DEFAULT_SCENARIO_NAME : String(name || '')
}

function normalizeScenarioDescription(description = '') {
  const normalized = String(description || '').trim().toLowerCase()
  if (!normalized) return ''
  if (normalized.includes('minimal real cyborg scenario')) {
    return DEFAULT_SCENARIO_DESCRIPTION
  }
  return String(description || '')
}

function normalizeScenarioDisplay(scenario = {}) {
  return {
    ...scenario,
    name: normalizeScenarioName(scenario.name),
    description: normalizeScenarioDescription(scenario.description)
  }
}

function inferAlgorithmType(name = '') {
  const normalized = String(name || '').toUpperCase()
  if (normalized.includes('MAPPO')) return 'MAPPO'
  if (normalized.includes('PPO')) return 'PPO'
  if (normalized.includes('DQN')) return 'DQN'
  if (normalized.includes('A2C')) return 'A2C'
  if (normalized.includes('QMIX')) return 'QMIX'
  return 'RL'
}

function getModelAccess(model = {}) {
  const name = String(model.name || '').toLowerCase()
  const algorithmType = String(model.algorithmType || model.runtimeConfig?.algorithm || '').toUpperCase()
  if (algorithmType === 'MAPPO' || name.includes('mappo')) {
    return 'backend'
  }
  if (name.includes('demo blue policy') || name.includes('cyborg drone swarm')) {
    return 'backend'
  }
  return model.access || 'placeholder'
}

function getDisplayModelName(model = {}) {
  const rawName = String(model.name || '')
  const normalized = rawName.toLowerCase()
  if (
    normalized.includes('demo blue policy') ||
    normalized.includes('cyborg drone swarm') ||
    normalized.includes('mappo策略模型') ||
    normalized === 'mappo'
  ) {
    return 'SG-MAPPO'
  }
  return rawName
}

function normalizeDisplayModel(model = {}) {
  return {
    ...model,
    name: getDisplayModelName(model),
    algorithmType: model.algorithmType || inferAlgorithmType(model.name),
    access: getModelAccess(model)
  }
}

function getDefaultFrontendModels() {
  return DEFAULT_FRONTEND_MODELS.map((model) => ({ ...model }))
}

function mergeWithDefaultModels(models = []) {
  const merged = []
  const indexByName = new Map()

  const upsert = (model) => {
    const normalized = normalizeDisplayModel(model)
    const key = normalized.name || normalized.id
    const existingIndex = indexByName.get(key)
    if (existingIndex === undefined) {
      indexByName.set(key, merged.length)
      merged.push(normalized)
      return
    }

    const existing = merged[existingIndex]
    merged[existingIndex] = {
      ...existing,
      ...normalized,
      id: normalized.id || existing.id,
      name: normalized.name || existing.name
    }
  }

  getDefaultFrontendModels().forEach(upsert)
  models.forEach(upsert)

  return merged
}

export {
  getDefaultFrontendModels,
  getDisplayModelName,
  getModelAccess,
  inferAlgorithmType,
  mergeWithDefaultModels,
  normalizeDisplayModel,
  normalizeScenarioDescription,
  normalizeScenarioDisplay,
  normalizeScenarioName
}
