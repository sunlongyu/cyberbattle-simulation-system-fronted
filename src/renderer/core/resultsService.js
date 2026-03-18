import {
  request_get_async,
  request_post_async
} from '@/util/request'

function normalizeBeliefCurve(items = []) {
  return items.map((item) => ({
    round: item.round || 0,
    belief: item.belief ?? item.value ?? 0
  }))
}

function normalizeRewardCurve(items = []) {
  return items.map((item) => {
    const cumulative = item.cumulative || {}
    return {
      round: item.round || 0,
      attacker: cumulative.attacker ?? item.attacker ?? 0,
      defender: cumulative.defender ?? item.defender ?? 0
    }
  })
}

function normalizeStrategyDistribution(distribution = {}) {
  const attacker = distribution.attacker || {}
  const defender = distribution.defender || {}
  const actions = Array.from(new Set([...Object.keys(attacker), ...Object.keys(defender)]))

  return actions.map((action) => ({
    action,
    attacker: attacker[action] || 0,
    defender: defender[action] || 0
  }))
}

function mapResultFromApi(result) {
  const metrics = result.metrics || {}
  return {
    id: result.id,
    scenarioId: result.scenarioId,
    modelId: result.modelId || '',
    reportPath: result.reportPath || '',
    completedAt: result.completedAt || '',
    metrics: {
      beliefCurve: normalizeBeliefCurve(metrics.beliefCurve || []),
      rewardCurve: normalizeRewardCurve(metrics.rewardCurve || []),
      cumulativeRewards: metrics.cumulativeRewards || { attacker: 0, defender: 0 },
      strategyDistribution: normalizeStrategyDistribution(metrics.strategyDistribution || {}),
      attackSuccessRate: metrics.attackSuccessRate || { total: 0, success: 0, rate: 0 },
      eventCount: metrics.eventCount || 0
    }
  }
}

async function fetchResults() {
  const response = await request_get_async('api/v1/results')
  return response.map(mapResultFromApi)
}

async function createReport(simulationId) {
  const response = await request_post_async(`api/v1/results/${simulationId}/report`, {})
  return mapResultFromApi(response)
}

async function fetchReportContent(resultId) {
  return request_get_async(`api/v1/results/${resultId}/report-content`)
}

export {
  createReport,
  fetchReportContent,
  fetchResults
}
