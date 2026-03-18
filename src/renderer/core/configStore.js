import {
  mergeWithDefaultModels,
  normalizeDisplayModel,
  normalizeScenarioDisplay
} from '@/core/displayAdapter'

const SCENARIO_KEY = 'attackDefenseScenarioConfigs'
const ACTIVE_SCENARIO_KEY = 'attackDefenseActiveScenarioId'
const MODEL_KEY = 'attackDefenseStrategyModels'
const ACTIVE_MODEL_KEY = 'attackDefenseActiveModelId'

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch (error) {
    return fallback
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

function getScenarioConfigs() {
  const configs = readJson(SCENARIO_KEY, [])
  const normalized = Array.isArray(configs)
    ? configs.map((config) => normalizeScenarioDisplay(config))
    : []
  if (JSON.stringify(configs) !== JSON.stringify(normalized)) {
    writeJson(SCENARIO_KEY, normalized)
  }
  return normalized
}

function saveScenarioConfig(config) {
  const configs = getScenarioConfigs()
  const normalizedConfig = normalizeScenarioDisplay(config)
  const index = configs.findIndex((item) => item.id === normalizedConfig.id)
  if (index >= 0) {
    configs[index] = normalizedConfig
  } else {
    configs.push(normalizedConfig)
  }
  writeJson(SCENARIO_KEY, configs)
  setActiveScenarioConfigId(normalizedConfig.id)
  return configs
}

function setActiveScenarioConfigId(id) {
  window.localStorage.setItem(ACTIVE_SCENARIO_KEY, id)
}

function getActiveScenarioConfigId() {
  return window.localStorage.getItem(ACTIVE_SCENARIO_KEY)
}

function getActiveScenarioConfig() {
  const configs = getScenarioConfigs()
  const activeId = getActiveScenarioConfigId()
  if (!activeId) return configs[0] || null
  return configs.find((item) => item.id === activeId) || configs[0] || null
}

function getStrategyModels() {
  const models = readJson(MODEL_KEY, [])
  const normalized = mergeWithDefaultModels(Array.isArray(models) ? models : [])
  if (JSON.stringify(models) !== JSON.stringify(normalized)) {
    writeJson(MODEL_KEY, normalized)
  }
  return normalized
}

function saveStrategyModel(model) {
  const models = getStrategyModels()
  const normalizedModel = normalizeDisplayModel(model)
  const index = models.findIndex((item) => item.id === normalizedModel.id || item.name === normalizedModel.name)
  if (index >= 0) {
    models[index] = { ...models[index], ...normalizedModel }
  } else {
    models.push(normalizedModel)
  }
  const merged = mergeWithDefaultModels(models)
  writeJson(MODEL_KEY, merged)
  return merged
}

function replaceStrategyModels(models) {
  const merged = mergeWithDefaultModels(Array.isArray(models) ? models : [])
  writeJson(MODEL_KEY, merged)
  return merged
}

function getStrategyModelsByScenario(scenarioId) {
  return getStrategyModels().filter((item) => item.scenarioId === scenarioId)
}

function setActiveStrategyModelId(modelId) {
  window.localStorage.setItem(ACTIVE_MODEL_KEY, modelId)
}

function getActiveStrategyModelId() {
  return window.localStorage.getItem(ACTIVE_MODEL_KEY)
}

function migrateDisplayCache() {
  getScenarioConfigs()
  getStrategyModels()
}

export {
  getScenarioConfigs,
  saveScenarioConfig,
  setActiveScenarioConfigId,
  getActiveScenarioConfigId,
  getActiveScenarioConfig,
  getStrategyModels,
  saveStrategyModel,
  replaceStrategyModels,
  getStrategyModelsByScenario,
  setActiveStrategyModelId,
  getActiveStrategyModelId,
  migrateDisplayCache
}
