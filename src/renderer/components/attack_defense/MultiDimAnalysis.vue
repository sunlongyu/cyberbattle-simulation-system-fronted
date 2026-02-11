<template>
  <div class="module-page">
    <div class="module-header">
      <div>
        <h2>多维可视分析</h2>
        <p>实时展示信念变化、收益趋势、策略分布与攻击成功率评估。</p>
      </div>
    </div>
    <div class="module-body">
      <div class="result-bar">
        <div class="result-select">
          <span class="result-label">选择推演结果</span>
          <el-select v-model="selectedResultId" placeholder="请选择已完成推演" @change="applyResult">
            <el-option v-for="item in resultOptions" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </div>
        <div class="result-meta">
          <div class="meta-item">完成时间：{{ selectedResult?.completedAt || '-' }}</div>
          <div class="meta-item">环境：{{ selectedResult?.scenarioName || '-' }}</div>
          <div class="meta-item">模型：{{ selectedResult?.modelName || '-' }}</div>
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
              <span>策略分布统计</span>
              <el-tag type="warning" effect="plain">占比</el-tag>
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
                <span class="value">{{ Math.round(analysisData.attackSuccessRate.rate * 100) }}%</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>
      <div class="page-actions">
        <el-button type="primary" :disabled="!selectedResultId" @click="exportReport">生成实验报告</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { getMockAnalysisData } from '@/core/mockData'

export default {
  name: 'MultiDimAnalysis',
  data() {
    return {
      analysisData: getMockAnalysisData(),
      charts: [],
      resultOptions: [
        {
          id: 'result-001',
          name: '电网控制区推演 - 回合12',
          completedAt: '2026-02-10 21:40',
          scenarioName: '电网控制区场景',
          modelName: 'SG-MAPPO-Base'
        },
        {
          id: 'result-002',
          name: '企业内网推演 - 回合15',
          completedAt: '2026-02-11 09:18',
          scenarioName: '企业内网场景',
          modelName: 'PPO-Defense'
        }
      ],
      selectedResultId: 'result-002'
    }
  },
  computed: {
    selectedResult() {
      return this.resultOptions.find((item) => item.id === this.selectedResultId)
    }
  },
  mounted() {
    this.initCharts()
    window.addEventListener('resize', this.resizeCharts)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.resizeCharts)
    this.charts.forEach((chart) => chart.dispose())
  },
  methods: {
    initCharts() {
      this.initBeliefChart()
      this.initRewardChart()
      this.initStrategyChart()
      this.initSuccessChart()
    },
    initBeliefChart() {
      const dom = this.$refs.beliefChart
      const chart = echarts.init(dom)
      const rounds = this.analysisData.beliefCurve.map((item) => item.round)
      const values = this.analysisData.beliefCurve.map((item) => item.belief)
      chart.setOption({
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
      })
      this.charts.push(chart)
    },
    initRewardChart() {
      const dom = this.$refs.rewardChart
      const chart = echarts.init(dom)
      const rounds = this.analysisData.cumulativeRewards.map((item) => item.round)
      const attacker = this.analysisData.cumulativeRewards.map((item) => item.attacker)
      const defender = this.analysisData.cumulativeRewards.map((item) => item.defender)
      chart.setOption({
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
      })
      this.charts.push(chart)
    },
    initStrategyChart() {
      const dom = this.$refs.strategyChart
      const chart = echarts.init(dom)
      chart.setOption({
        tooltip: { trigger: 'item' },
        legend: { bottom: 0 },
        series: [
          {
            type: 'pie',
            radius: ['35%', '65%'],
            center: ['50%', '45%'],
            data: this.analysisData.strategyDistribution,
            itemStyle: {
              borderRadius: 6,
              borderColor: '#fff',
              borderWidth: 2
            }
          }
        ]
      })
      this.charts.push(chart)
    },
    initSuccessChart() {
      const dom = this.$refs.successChart
      const chart = echarts.init(dom)
      chart.setOption({
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
                value: Math.round(this.analysisData.attackSuccessRate.rate * 100)
              }
            ]
          }
        ]
      })
      this.charts.push(chart)
    },
    resizeCharts() {
      this.charts.forEach((chart) => chart.resize())
    },
    applyResult() {
      this.analysisData = getMockAnalysisData()
      this.charts.forEach((chart) => chart.dispose())
      this.charts = []
      this.$nextTick(() => {
        this.initCharts()
      })
    },
    exportReport() {
      this.$message.success('已生成实验报告（Mock）')
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

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.chart-card {
  border-radius: 12px;
  border: 1px solid #eef1f6;
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
}

.success-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: center;
}

.success-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-item {
  background: #f5f7fb;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.summary-item.highlight {
  background: #e0f2fe;
  font-weight: 600;
  color: #0f172a;
}

.summary-item .label {
  color: #64748b;
}

.page-actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .result-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
