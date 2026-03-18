import {
  request_get_async,
  request_post_async,
  request_put_async
} from '@/util/request'
import { normalizeScenarioDisplay } from '@/core/displayAdapter'

function mapScenarioFromApi(scenario) {
  return normalizeScenarioDisplay({
    id: scenario.id,
    name: scenario.name,
    description: scenario.description || '',
    parameters: scenario.parameters || {},
    topology: scenario.topology || { nodes: [], links: [] },
    attackerConfig: scenario.attackerConfig || {},
    defenseAssets: scenario.defenseAssets || [],
    updatedAt: scenario.updatedAt || ''
  })
}

function buildScenarioPayload(config) {
  return {
    name: config.name,
    description: config.description || '',
    parameters: config.parameters || {},
    topology: config.topology || { nodes: [], links: [] },
    attackerConfig: config.attackerConfig || {},
    defenseAssets: config.defenseAssets || []
  }
}

async function fetchScenarioConfigs() {
  const response = await request_get_async('api/v1/scenarios')
  return response.map(mapScenarioFromApi)
}

async function createScenario(config) {
  const response = await request_post_async('api/v1/scenarios', buildScenarioPayload(config))
  return mapScenarioFromApi(response)
}

async function updateScenario(id, config) {
  const response = await request_put_async(`api/v1/scenarios/${id}`, buildScenarioPayload(config))
  return mapScenarioFromApi(response)
}

export {
  createScenario,
  fetchScenarioConfigs,
  updateScenario
}
