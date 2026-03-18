import {
  request_get_async,
  request_post_async
} from '@/util/request'

function mapSimulationState(state) {
  const runtimeState = state.runtimeState || {}
  const lastStep = runtimeState.lastStep || {}
  return {
    id: state.id,
    scenarioId: state.scenarioId,
    modelId: state.modelId,
    status: state.status,
    currentRound: state.currentRound || 0,
    phase: state.phase || 'probe',
    runtimeState,
    currentStep: {
      round: state.currentRound || 0,
      phase: state.phase || 'probe',
      attackerAction: lastStep.attackerAction || '等待开始',
      defenderAction: lastStep.defenderAction || '等待开始',
      attackerBelief: lastStep.attackerBelief || runtimeState.belief || 0,
      signal: lastStep.signal || '等待仿真启动',
      payoff: lastStep.payoff || { attacker: 0, defender: 0 }
    }
  }
}

function mapSimulationEvents(events) {
  return events.map((event) => ({
    id: event.id,
    roundIndex: event.roundIndex,
    actor: event.actor === 'system' ? '系统' : event.actor,
    level: event.level || 'info',
    message: event.message,
    time: event.eventTime ? new Date(event.eventTime).toLocaleTimeString() : '--:--:--'
  }))
}

async function startSimulation(payload) {
  const response = await request_post_async('api/v1/simulation/start', payload)
  return mapSimulationState(response)
}

async function stepSimulation(simulationId) {
  const response = await request_post_async(`api/v1/simulation/${simulationId}/step`, {})
  return {
    simulation: mapSimulationState(response.simulation),
    latestEvents: mapSimulationEvents(response.latestEvents || [])
  }
}

async function pauseSimulation(simulationId) {
  const response = await request_post_async(`api/v1/simulation/${simulationId}/pause`, {})
  return mapSimulationState(response)
}

async function resetSimulation(simulationId) {
  const response = await request_post_async(`api/v1/simulation/${simulationId}/reset`, {})
  return mapSimulationState(response)
}

async function fetchSimulationState(simulationId) {
  const response = await request_get_async(`api/v1/simulation/${simulationId}/state`)
  return mapSimulationState(response)
}

async function fetchSimulationEvents(simulationId) {
  const response = await request_get_async(`api/v1/simulation/${simulationId}/events`)
  return mapSimulationEvents(response)
}

export {
  fetchSimulationEvents,
  fetchSimulationState,
  pauseSimulation,
  resetSimulation,
  startSimulation,
  stepSimulation
}
