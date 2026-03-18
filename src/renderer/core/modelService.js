import {
  request_delete_async,
  request_get_async,
  request_post_async
} from '@/util/request'
import {
  getDisplayModelName,
  getModelAccess,
  inferAlgorithmType,
  mergeWithDefaultModels,
  normalizeDisplayModel
} from '@/core/displayAdapter'

function mapModelFromApi(model) {
  const algorithmType =
    model.algorithmType ||
    model.runtimeConfig?.algorithmType ||
    inferAlgorithmType(model.name)
  const access = getModelAccess(model)

  return {
    id: model.id,
    name: getDisplayModelName(model),
    algorithmType,
    access,
    scene: model.scene || '',
    version: model.version || 'v1',
    status: model.status || 'untrained',
    scenarioId: model.scenarioId || '',
    metrics: model.metrics && Object.keys(model.metrics).length > 0
      ? {
          winRate: model.metrics.winRate,
          avgReward: model.metrics.avgReward
        }
      : null,
    lastTrainedAt: model.lastTrainedAt || '-',
    notes: model.notes || '',
    runtimeConfig: model.runtimeConfig || {}
  }
}

function reconcileModels(remoteModels = [], localModels = []) {
  const merged = []
  const indexByKey = new Map()

  const upsert = (model, source = 'remote') => {
    const key = getDisplayModelName(model) || model.id || model.name
    const existingIndex = indexByKey.get(key)
    if (existingIndex === undefined) {
      indexByKey.set(key, merged.length)
      merged.push(normalizeDisplayModel(model))
      return
    }

    const existing = merged[existingIndex]
    const normalized = normalizeDisplayModel(model)
    merged[existingIndex] = source === 'local'
      ? {
          ...existing,
          scene: existing.scene || normalized.scene,
          scenarioId: existing.scenarioId || normalized.scenarioId,
          notes: existing.notes || normalized.notes,
          runtimeConfig: {
            ...(normalized.runtimeConfig || {}),
            ...(existing.runtimeConfig || {})
          }
        }
      : {
          ...existing,
          ...normalized,
          runtimeConfig: {
            ...(existing.runtimeConfig || {}),
            ...(normalized.runtimeConfig || {})
          }
        }
  }

  remoteModels.forEach((model) => upsert(model, 'remote'))
  localModels.forEach((model) => upsert(model, 'local'))

  return mergeWithDefaultModels(merged)
}

async function fetchModels() {
  const response = await request_get_async('api/v1/models')
  return response.map(mapModelFromApi)
}

async function importModel(payload) {
  const response = await request_post_async('api/v1/models/import', payload)
  return mapModelFromApi(response)
}

async function trainModel(modelId, payload) {
  const response = await request_post_async(`api/v1/models/${modelId}/train`, payload)
  return mapModelFromApi(response)
}

async function activateModel(modelId) {
  return request_post_async(`api/v1/models/${modelId}/activate`, {})
}

async function deleteModelById(modelId) {
  return request_delete_async(`api/v1/models/${modelId}`)
}

export {
  activateModel,
  deleteModelById,
  getDisplayModelName,
  fetchModels,
  getModelAccess,
  mergeWithDefaultModels,
  normalizeDisplayModel,
  reconcileModels,
  importModel,
  trainModel
}
