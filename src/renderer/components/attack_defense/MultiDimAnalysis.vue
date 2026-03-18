<template>
  <div class="module-page">
    <div class="module-header">
      <div>
        <h2>多维可视分析</h2>
        <p>展示推演结果中的信念变化、收益曲线、动作分布与报告内容。</p>
      </div>
    </div>
    <div class="module-body">
      <div class="result-bar">
        <div class="result-select">
          <span class="result-label">选择推演结果</span>
          <el-select
            v-model="selectedResultId"
            placeholder="请选择已完成推演"
            :disabled="resultsLoading || resultOptions.length === 0"
            @change="applyResult"
          >
            <el-option v-for="item in resultOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </div>
        <div class="result-meta">
          <div class="meta-item">结果总数：{{ results.length }}</div>
          <div class="meta-item">完成时间：{{ selectedResult?.completedAt || '-' }}</div>
          <div class="meta-item">环境：{{ selectedResult?.scenarioName || selectedResult?.scenarioId || '-' }}</div>
          <div class="meta-item">模型：{{ selectedResult?.modelName || selectedResult?.modelId || '-' }}</div>
          <el-button
            size="small"
            type="primary"
            :disabled="!selectedResult"
            @click="downloadResult"
          >
            导出结果
          </el-button>
        </div>
      </div>

      <el-alert
        v-if="loadError"
        class="status-alert"
        type="warning"
        :title="loadError"
        show-icon
      />

      <el-empty
        v-if="!resultsLoading && !selectedResult"
        description="暂无分析结果。先到“攻防实时推演”完成推演并生成实验报告。"
      />

      <template v-else-if="selectedResult">
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-title">攻击成功率</div>
            <div class="summary-value">{{ successRateLabel }}</div>
            <div class="summary-subtext">
              {{ analysisData.attackSuccessRate.success }} / {{ analysisData.attackSuccessRate.total }} 次成功
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-title">累计收益差</div>
            <div class="summary-value">{{ rewardGapLabel }}</div>
            <div class="summary-subtext">
              攻击 {{ analysisData.cumulativeRewards.attacker }} / 防御 {{ analysisData.cumulativeRewards.defender }}
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-title">峰值信念</div>
            <div class="summary-value">{{ peakBeliefLabel }}</div>
            <div class="summary-subtext">信念曲线中的最大值</div>
          </div>
          <div class="summary-card">
            <div class="summary-title">事件规模</div>
            <div class="summary-value">{{ analysisData.eventCount }}</div>
            <div class="summary-subtext">本次推演产生的日志事件数</div>
          </div>
        </div>

        <div class="charts-grid">
          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>攻击者信念变化曲线</span>
                <el-tag type="success" effect="plain">趋势</el-tag>
              </div>
            </template>
            <div ref="beliefChart" class="chart-container"></div>
          </el-card>

          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>双方累计收益</span>
                <el-tag type="success" effect="plain">趋势</el-tag>
              </div>
            </template>
            <div ref="rewardChart" class="chart-container"></div>
          </el-card>

          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>攻防策略分布</span>
                <el-tag type="warning" effect="plain">对比</el-tag>
              </div>
            </template>
            <div ref="strategyChart" class="chart-container"></div>
          </el-card>

          <el-card shadow="never" class="chart-card">
            <template #header>
              <div class="card-header">
                <span>攻击成功率评估</span>
                <el-tag type="danger" effect="plain">核心指标</el-tag>
              </div>
            </template>
            <div class="success-panel">
              <div ref="successChart" class="chart-container small"></div>
              <div class="success-summary">
                <div class="summary-item">
                  <span class="label">总攻击次数</span>
                  <span class="value">{{ analysisData.attackSuccessRate.total }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">成功次数</span>
                  <span class="value">{{ analysisData.attackSuccessRate.success }}</span>
                </div>
                <div class="summary-item highlight">
                  <span class="label">成功率</span>
                  <span class="value">{{ successRateLabel }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </div>

        <div class="detail-grid">
          <el-card shadow="never" class="detail-card">
            <template #header>
              <div class="card-header">
                <span>结果摘要</span>
              </div>
            </template>
            <div class="insight-list">
              <div class="insight-item">
                <span class="insight-label">优势方</span>
                <span class="insight-value">{{ dominantSideLabel }}</span>
              </div>
              <div class="insight-item">
                <span class="insight-label">主导动作</span>
                <span class="insight-value">{{ dominantActionLabel }}</span>
              </div>
              <div class="insight-item">
                <span class="insight-label">结果判定</span>
                <span class="insight-value">{{ conclusionLabel }}</span>
              </div>
            </div>
          </el-card>

          <el-card shadow="never" class="detail-card">
            <template #header>
              <div class="card-header">
                <span>实验报告内容</span>
                <el-button
                  size="small"
                  type="primary"
                  text
                  :disabled="reportLoading"
                  @click="exportReport"
                >
                  刷新报告
                </el-button>
              </div>
            </template>
            <div class="report-preview">{{ reportPreview }}</div>
          </el-card>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { fetchModels, getDisplayModelName, normalizeDisplayModel } from '@/core/modelService'
import { fetchReportContent, fetchResults } from '@/core/resultsService'
import { fetchScenarioConfigs } from '@/core/scenarioService'

const EMPTY_ANALYSIS = {
  beliefCurve: [],
  rewardCurve: [],
  cumulativeRewards: { attacker: 0, defender: 0 },
  strategyDistribution: [],
  attackSuccessRate: { total: 0, success: 0, rate: 0 },
  eventCount: 0
}

export default {
  name: 'MultiDimAnalysis',
  data() {
    return {
      resultsLoading: false,
      reportLoading: false,
      loadError: '',
      analysisData: { ...EMPTY_ANALYSIS },
      charts: {},
      results: [],
      scenarios: [],
      models: [],
      selectedResultId: '',
      reportPreview: '暂无报告内容'
    }
  },
  computed: {
    resultOptions() {
      return this.results.map((item) => ({
        id: item.id,
        name: `${item.scenarioName || item.scenarioId} · ${item.modelName || item.modelId || '默认策略'} · ${item.completedAt || '-'}`
      }))
    },
    selectedResult() {
      return this.results.find((item) => item.id === this.selectedResultId) || null
    },
    successRateLabel() {
      return `${Math.round((this.analysisData.attackSuccessRate.rate || 0) * 100)}%`
    },
    rewardGapLabel() {
      const attacker = this.analysisData.cumulativeRewards.attacker || 0
      const defender = this.analysisData.cumulativeRewards.defender || 0
      const gap = Number((defender - attacker).toFixed(2))
      return gap >= 0 ? `防御 +${gap}` : `攻击 +${Math.abs(gap)}`
    },
    peakBeliefLabel() {
      if (this.analysisData.beliefCurve.length === 0) return '0.00'
      const peak = Math.max(...this.analysisData.beliefCurve.map((item) => item.belief || 0))
      return peak.toFixed(2)
    },
    dominantSideLabel() {
      const attacker = this.analysisData.cumulativeRewards.attacker || 0
      const defender = this.analysisData.cumulativeRewards.defender || 0
      if (attacker === defender) return '双方均衡'
      return defender > attacker ? '防御方占优' : '攻击方占优'
    },
    dominantActionLabel() {
      if (this.analysisData.strategyDistribution.length === 0) return '无有效动作'
      const [topAction] = [...this.analysisData.strategyDistribution].sort(
        (left, right) => (right.attacker + right.defender) - (left.attacker + left.defender)
      )
      return `${topAction.action}（A ${topAction.attacker} / D ${topAction.defender}）`
    },
    conclusionLabel() {
      const rate = this.analysisData.attackSuccessRate.rate || 0
      if (rate >= 0.6) return '攻击方成功率较高'
      if (rate >= 0.3) return '攻防双方处于拉锯状态'
      return '防御方保持优势'
    }
  },
  async mounted() {
    await this.loadBaseData()
    this.initCharts()
    this.renderCharts()
    window.addEventListener('resize', this.resizeCharts)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.resizeCharts)
    this.disposeCharts()
  },
  methods: {
    async loadBaseData() {
      this.resultsLoading = true
      this.loadError = ''
      try {
        const [results, scenarios, models] = await Promise.all([
          fetchResults(),
          fetchScenarioConfigs().catch(() => []),
          fetchModels().catch(() => [])
        ])

        this.scenarios = scenarios
        this.models = models.map((model) => normalizeDisplayModel(model))
        this.results = results
          .map((item) => ({
            ...item,
            scenarioName: this.resolveScenarioName(item.scenarioId, scenarios),
            modelName: this.resolveModelName(item.modelId, this.models)
          }))
          .sort((left, right) => new Date(right.completedAt || 0).getTime() - new Date(left.completedAt || 0).getTime())

        this.selectedResultId = this.results[0]?.id || ''
        if (this.selectedResultId) {
          await this.applyResult(this.selectedResultId)
        }
      } catch (error) {
        this.loadError = `结果加载失败：${error.message}`
      } finally {
        this.resultsLoading = false
      }
    },
    resolveScenarioName(scenarioId, scenarios = this.scenarios) {
      return scenarios.find((item) => item.id === scenarioId)?.name || ''
    },
    resolveModelName(modelId, models = this.models) {
      if (!modelId) return '默认策略'
      const model = models.find((item) => item.id === modelId)
      return model ? getDisplayModelName(model) : ''
    },
    initCharts() {
      if (!this.$refs.beliefChart || !this.$refs.rewardChart || !this.$refs.strategyChart || !this.$refs.successChart) {
        return
      }
      this.disposeCharts()
      this.charts = {
        belief: echarts.init(this.$refs.beliefChart),
        reward: echarts.init(this.$refs.rewardChart),
        strategy: echarts.init(this.$refs.strategyChart),
        success: echarts.init(this.$refs.successChart)
      }
    },
    renderCharts() {
      if (Object.keys(this.charts).length === 0) return
      this.renderBeliefChart()
      this.renderRewardChart()
      this.renderStrategyChart()
      this.renderSuccessChart()
    },
    renderBeliefChart() {
      const rounds = this.analysisData.beliefCurve.map((item) => item.round)
      const values = this.analysisData.beliefCurve.map((item) => item.belief)
      this.charts.belief.setOption({
        grid: { left: 36, right: 24, top: 32, bottom: 32 },
        xAxis: { type: 'category', data: rounds },
        yAxis: { type: 'value', min: 0, max: 1 },
        tooltip: { trigger: 'axis' },
        series: [
          {
            name: '信念',
            type: 'line',
            smooth: true,
            data: values,
            areaStyle: { opacity: 0.15 },
            itemStyle: { color: '#2f6ed6' }
          }
        ]
      }, true)
    },
    renderRewardChart() {
      const rounds = this.analysisData.rewardCurve.map((item) => item.round)
      const attacker = this.analysisData.rewardCurve.map((item) => item.attacker)
      const defender = this.analysisData.rewardCurve.map((item) => item.defender)
      this.charts.reward.setOption({
        grid: { left: 36, right: 24, top: 32, bottom: 32 },
        tooltip: { trigger: 'axis' },
        legend: { top: 4 },
        xAxis: { type: 'category', data: rounds },
        yAxis: { type: 'value' },
        series: [
          {
            name: '攻击者收益',
            type: 'line',
            smooth: true,
            data: attacker,
            itemStyle: { color: '#f97316' }
          },
          {
            name: '防御者收益',
            type: 'line',
            smooth: true,
            data: defender,
            itemStyle: { color: '#10b981' }
          }
        ]
      }, true)
    },
    renderStrategyChart() {
      const categories = this.analysisData.strategyDistribution.map((item) => item.action)
      this.charts.strategy.setOption({
        grid: { left: 48, right: 24, top: 32, bottom: 32 },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { top: 4 },
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: categories },
        series: [
          {
            name: '攻击动作',
            type: 'bar',
            data: this.analysisData.strategyDistribution.map((item) => item.attacker),
            itemStyle: { color: '#f97316' }
          },
          {
            name: '防御动作',
            type: 'bar',
            data: this.analysisData.strategyDistribution.map((item) => item.defender),
            itemStyle: { color: '#10b981' }
          }
        ]
      }, true)
    },
    renderSuccessChart() {
      this.charts.success.setOption({
        series: [
          {
            type: 'gauge',
            startAngle: 180,
            endAngle: 0,
            radius: '90%',
            min: 0,
            max: 100,
            progress: {
              show: true,
              width: 14
            },
            axisLine: {
              lineStyle: {
                width: 14
              }
            },
            pointer: { show: false },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            detail: {
              valueAnimation: true,
              formatter: '{value}%',
              color: '#0f172a',
              fontSize: 18
            },
            data: [
              {
                value: Math.round((this.analysisData.attackSuccessRate.rate || 0) * 100)
              }
            ]
          }
        ]
      }, true)
    },
    resizeCharts() {
      Object.values(this.charts).forEach((chart) => chart && chart.resize())
    },
    disposeCharts() {
      Object.values(this.charts).forEach((chart) => chart && chart.dispose())
      this.charts = {}
    },
    async applyResult(resultId = this.selectedResultId) {
      this.selectedResultId = resultId
      const result = this.results.find((item) => item.id === resultId)
      if (!result) {
        this.analysisData = { ...EMPTY_ANALYSIS }
        this.reportPreview = '暂无报告内容'
        return
      }

      this.analysisData = result.metrics
      await this.loadReportPreview(result.id)
      this.$nextTick(() => {
        this.initCharts()
        this.renderCharts()
      })
    },
    async loadReportPreview(resultId) {
      this.reportLoading = true
      try {
        const response = await fetchReportContent(resultId)
        this.reportPreview = response.content || '报告为空'
      } catch (error) {
        this.reportPreview = `报告读取失败：${error.message}`
      } finally {
        this.reportLoading = false
      }
    },
    async exportReport() {
      if (!this.selectedResultId) return
      await this.loadReportPreview(this.selectedResultId)
      this.$message.success('实验报告已刷新')
    },
    downloadResult() {
      if (!this.selectedResult) return
      const payload = {
        result: this.selectedResult,
        report: this.reportPreview
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `result-${this.selectedResult.id}.json`
      link.click()
      URL.revokeObjectURL(link.href)
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

.module-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-alert {
  margin-bottom: 0;
}

.result-bar {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #eef1f6;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.result-select {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-label {
  font-size: 13px;
  color: #64748b;
}

.result-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6b7a90;
  flex-wrap: wrap;
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
}

.summary-title {
  font-size: 13px;
  color: #64748b;
}

.summary-value {
  margin-top: 10px;
  font-size: 28px;
  font-weight: 700;
  color: #0f172a;
}

.summary-subtext {
  margin-top: 8px;
  font-size: 12px;
  color: #64748b;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-card,
.detail-card {
  border-radius: 12px;
  border: 1px solid #eef1f6;
}

.chart-card {
  min-height: 320px;
}

.chart-container {
  width: 100%;
  height: 260px;
}

.chart-container.small {
  height: 180px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  gap: 12px;
}

.success-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: center;
}

.success-summary,
.insight-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item,
.insight-item {
  background: #f5f7fb;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
}

.summary-item.highlight {
  background: #e0f2fe;
  font-weight: 600;
  color: #0f172a;
}

.summary-item .label,
.insight-label {
  color: #64748b;
}

.insight-value {
  font-weight: 600;
  color: #0f172a;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 16px;
}

.report-preview {
  max-height: 240px;
  overflow-y: auto;
  white-space: pre-wrap;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 12px;
  line-height: 1.6;
  background: #0f172a;
  border-radius: 10px;
  padding: 14px;
  color: #e2e8f0;
}

@media (max-width: 1200px) {
  .summary-grid,
  .charts-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .result-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
