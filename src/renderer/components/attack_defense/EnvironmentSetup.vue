<template>
  <div class="module-page">
    <div class="module-header">
      <div>
        <h2>攻防环境设置</h2>
        <p>配置攻防双方环境与行动策略，预览拓扑后保存实验场景。</p>
      </div>
    </div>
    <div class="module-body">
      <section class="config-panel">
        <el-card shadow="never" class="config-card">
          <template #header>
            <div class="card-header">
              <span>配置方案管理</span>
            </div>
          </template>
          <div class="config-manager">
            <el-select v-model="selectedPresetId" placeholder="选择预设配置">
              <el-option
                v-for="preset in presetOptions"
                :key="preset.id"
                :label="preset.name"
                :value="preset.id"
              />
            </el-select>
            <el-button type="primary" :disabled="!selectedPresetId" @click="applyPresetConfig">应用配置</el-button>
            <el-button @click="enableCustomConfig">自定义配置</el-button>
          </div>
          <div class="config-meta" v-if="activeConfigMeta">
            <span>最近更新：{{ activeConfigMeta.updatedAt }}</span>
          </div>
        </el-card>
        <el-card shadow="never" class="config-card">
          <template #header>
            <div class="card-header">
              <span>防御者环境配置</span>
              <el-tag type="success" effect="plain">环境</el-tag>
            </div>
          </template>
          <el-form :model="scenarioConfig" label-width="120px">
            <el-form-item label="场景名称">
              <el-input v-model="scenarioConfig.name" placeholder="例如：电网控制区场景" />
            </el-form-item>
            <el-form-item label="场景说明">
              <el-input v-model="scenarioConfig.description" type="textarea" rows="2" />
            </el-form-item>
            <el-form-item label="真实节点数量">
              <el-input-number v-model="scenarioConfig.parameters.realNodeCount" :min="1" :max="50" />
              <span class="form-tip">建议与右侧拓扑同步</span>
            </el-form-item>
            <el-form-item label="蜜罐节点数量">
              <el-input-number v-model="scenarioConfig.parameters.honeypotNodeCount" :min="0" :max="20" />
            </el-form-item>
            <el-form-item label="节点类型">
              <el-select v-model="selectedNodeType" placeholder="选择类型">
                <el-option v-for="option in nodeTypeOptions" :key="option.value" :label="option.label" :value="option.value" />
              </el-select>
              <el-button type="primary" link @click="addNodeType">添加</el-button>
            </el-form-item>
            <div class="chip-list">
              <el-tag
                v-for="(type, index) in scenarioConfig.parameters.nodeTypes"
                :key="`${type}-${index}`"
                closable
                @close="removeNodeType(index)"
              >
                {{ type }}
              </el-tag>
            </div>
            <el-form-item label="博弈回合">
              <el-input-number v-model="scenarioConfig.parameters.maxRounds" :min="1" :max="50" />
            </el-form-item>
            <el-form-item label="信号噪声">
              <el-slider v-model="scenarioConfig.parameters.signalNoise" :min="0" :max="1" :step="0.05" />
            </el-form-item>
            <el-divider content-position="left">防御收益参数</el-divider>
            <el-form-item label="防御成功收益">
              <el-input-number v-model="scenarioConfig.parameters.rewardMatrix.defenderSuccess" :min="-5" :max="5" />
            </el-form-item>
            <el-form-item label="防御失败收益">
              <el-input-number v-model="scenarioConfig.parameters.rewardMatrix.defenderFail" :min="-5" :max="5" />
            </el-form-item>
          </el-form>
          <el-divider content-position="left">防御资源清单（可选）</el-divider>
          <el-switch v-model="showDefenseAssets" active-text="展示" inactive-text="隐藏" />
          <el-table v-if="showDefenseAssets" :data="defenseAssets" size="small" border>
            <el-table-column prop="name" label="节点名称" />
            <el-table-column prop="type" label="系统类型" />
            <el-table-column prop="role" label="角色" />
            <el-table-column prop="status" label="状态" />
          </el-table>
        </el-card>
        <el-card shadow="never" class="config-card">
          <template #header>
            <div class="card-header">
              <span>攻击者行动配置</span>
              <el-tag type="warning" effect="plain">行动</el-tag>
            </div>
          </template>
          <el-form :model="attackerConfig" label-width="120px">
            <el-form-item label="攻击目标">
              <el-select v-model="attackerConfig.targetZone" placeholder="选择目标区域">
                <el-option label="核心区" value="core" />
                <el-option label="现场区" value="field" />
                <el-option label="DMZ" value="dmz" />
              </el-select>
            </el-form-item>
            <el-form-item label="攻击风格">
              <el-select v-model="attackerConfig.attackStyle">
                <el-option label="隐蔽渗透" value="stealth" />
                <el-option label="持续压制" value="pressure" />
                <el-option label="快速破坏" value="fast" />
              </el-select>
            </el-form-item>
            <el-form-item label="可用动作">
              <el-checkbox-group v-model="attackerConfig.allowedActions">
                <el-checkbox label="主机探测" />
                <el-checkbox label="链路探测" />
                <el-checkbox label="密码尝试" />
                <el-checkbox label="漏洞利用" />
                <el-checkbox label="DDoS 攻击" />
              </el-checkbox-group>
            </el-form-item>
            <el-divider content-position="left">攻击收益参数</el-divider>
            <el-form-item label="攻击成功收益">
              <el-input-number v-model="scenarioConfig.parameters.rewardMatrix.attackerSuccess" :min="-5" :max="5" />
            </el-form-item>
            <el-form-item label="攻击失败收益">
              <el-input-number v-model="scenarioConfig.parameters.rewardMatrix.attackerFail" :min="-5" :max="5" />
            </el-form-item>
          </el-form>
        </el-card>
        <div class="config-actions">
          <el-button type="primary" :disabled="!canPreview" @click="openConfigPreview">配置预览</el-button>
          <el-button :disabled="!isConfigComplete" @click="saveScenario">保存配置</el-button>
        </div>
      </section>
      <section class="topology-panel">
        <div class="topology-header">
          <div>
            <h3>拓扑展示</h3>
            <p>环境配置完成后可查看拓扑结构与节点状态。</p>
          </div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">节点数</div>
              <div class="summary-value">{{ scenarioConfig.topology.nodes.length }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">链路数</div>
              <div class="summary-value">{{ scenarioConfig.topology.links.length }}</div>
            </div>
          </div>
        </div>
        <div v-if="!showTopologyPreview" class="topology-empty">
          点击左侧“配置预览”后展示拓扑结构。
        </div>
        <NetworkTopo
          v-else
          :show-large-screen="false"
          :show-player-status="false"
          :topology-data="scenarioConfig.topology"
        />
      </section>
    </div>
  </div>
</template>

<script>
import NetworkTopo from '@/components/network_components/NetworkTopo.vue'
import { getMockScenarioConfig } from '@/core/mockData'
import {
  getScenarioConfigs,
  saveScenarioConfig,
  setActiveScenarioConfigId,
  getActiveScenarioConfig
} from '@/core/configStore'

const iconMap = {
  switch: require('@/assets/switch.png'),
  router: require('@/assets/router.png'),
  server: require('@/assets/server.png'),
  host: require('@/assets/host.png'),
  honeypot: require('@/assets/server_defend.png')
}

export default {
  name: 'EnvironmentSetup',
  components: {
    NetworkTopo
  },
  data() {
    return {
      scenarioConfig: this.buildScenarioConfig(),
      showTopologyPreview: false,
      canPreview: false,
      selectedNodeType: '',
      selectedPresetId: '',
      isCustomConfig: false,
      showDefenseAssets: false,
      attackerConfig: {
        targetZone: 'core',
        attackStyle: 'stealth',
        allowedActions: ['主机探测', '链路探测']
      },
      defenseAssets: [
        { name: 'SCADA 主站', type: '真实系统', role: '核心节点', status: '稳定' },
        { name: 'RTU-1', type: '真实系统', role: '现场控制', status: '稳定' },
        { name: '蜜罐-1', type: '蜜罐', role: '诱捕', status: '激活' }
      ],
      nodeTypeOptions: [
        { label: '控制中心', value: '控制中心' },
        { label: 'SCADA', value: 'SCADA' },
        { label: 'RTU', value: 'RTU' },
        { label: 'PLC', value: 'PLC' },
        { label: '蜜罐', value: '蜜罐' }
      ],
      presetOptions: [
        { id: 'preset-electric-grid', name: '电网中心典型拓扑' },
        { id: 'preset-enterprise-lan', name: '企业内网典型拓扑' }
      ],
      savedConfigs: [],
      activeConfigId: ''
    }
  },
  computed: {
    formattedScenario() {
      return JSON.stringify(
        {
          scenario: this.scenarioConfig,
          attacker: this.attackerConfig,
          defenderAssets: this.defenseAssets
        },
        null,
        2
      )
    },
    isConfigComplete() {
      const hasName = this.scenarioConfig.name && this.scenarioConfig.name.trim().length > 0
      const hasTopology =
        this.scenarioConfig.parameters.realNodeCount > 0 ||
        this.scenarioConfig.parameters.honeypotNodeCount > 0
      const hasTypes = this.scenarioConfig.parameters.nodeTypes.length > 0
      return hasName && hasTopology && hasTypes
    },
    activeConfigMeta() {
      if (!this.activeConfigId) return null
      return this.savedConfigs.find((item) => item.id === this.activeConfigId)
    }
  },
  created() {
    this.loadScenarioConfigs()
  },
  watch: {
    'scenarioConfig.parameters.realNodeCount'() {
      this.syncTopologyFromCounts()
    },
    'scenarioConfig.parameters.honeypotNodeCount'() {
      this.syncTopologyFromCounts()
    },
    'scenarioConfig.parameters.nodeTypes': {
      handler() {
        this.syncTopologyFromCounts()
      },
      deep: true
    }
  },
  methods: {
    buildScenarioConfig() {
      const base = getMockScenarioConfig()
      return {
        ...base,
        id: `scenario-${Date.now()}`,
        parameters: {
          ...base.parameters,
          nodeCount: 8,
          realNodeCount: 6,
          honeypotNodeCount: 2,
          nodeTypes: ['控制中心', 'SCADA', 'RTU', '蜜罐']
        },
        topology: this.decorateTopology(base.topology)
      }
    },
    addNodeType() {
      if (!this.selectedNodeType) return
      if (!this.scenarioConfig.parameters.nodeTypes.includes(this.selectedNodeType)) {
        this.scenarioConfig.parameters.nodeTypes.push(this.selectedNodeType)
      }
      this.selectedNodeType = ''
    },
    removeNodeType(index) {
      this.scenarioConfig.parameters.nodeTypes.splice(index, 1)
    },
    openConfigPreview() {
      if (!this.canPreview) return
      this.showTopologyPreview = true
    },
    saveScenario() {
      if (!this.isConfigComplete) {
        this.$message.warning('请先完善环境配置')
        return
      }
      const payload = {
        id: this.scenarioConfig.id || `scenario-${Date.now()}`,
        name: this.scenarioConfig.name,
        description: this.scenarioConfig.description,
        parameters: this.scenarioConfig.parameters,
        topology: this.scenarioConfig.topology,
        attackerConfig: this.attackerConfig,
        defenseAssets: this.defenseAssets,
        updatedAt: new Date().toLocaleString()
      }
      this.savedConfigs = saveScenarioConfig(payload)
      this.activeConfigId = payload.id
      this.canPreview = true
      this.$message.success('已保存场景配置')
    },
    enableCustomConfig() {
      this.isCustomConfig = true
      this.scenarioConfig = this.buildScenarioConfig()
      this.attackerConfig = {
        targetZone: 'core',
        attackStyle: 'stealth',
        allowedActions: ['主机探测', '链路探测']
      }
      this.defenseAssets = [
        { name: 'SCADA 主站', type: '真实系统', role: '核心节点', status: '稳定' },
        { name: 'RTU-1', type: '真实系统', role: '现场控制', status: '稳定' },
        { name: '蜜罐-1', type: '蜜罐', role: '诱捕', status: '激活' }
      ]
      this.activeConfigId = ''
      this.selectedPresetId = ''
      this.canPreview = false
      this.showTopologyPreview = false
    },
    applyPresetConfig() {
      const preset = this.getPresetById(this.selectedPresetId)
      if (!preset) return
      this.applyPresetData(preset)
      this.isCustomConfig = false
      this.canPreview = true
      this.showTopologyPreview = true
      this.activeConfigId = ''
    },
    loadScenarioConfigs() {
      this.savedConfigs = getScenarioConfigs()
      const active = getActiveScenarioConfig()
      if (active) {
        this.isCustomConfig = true
        this.activeConfigId = active.id
        this.applyScenarioConfig(active.id)
      }
    },
    applyScenarioConfig(configId) {
      const config = this.savedConfigs.find((item) => item.id === configId)
      if (!config) return
      this.activeConfigId = config.id
      setActiveScenarioConfigId(config.id)
      this.scenarioConfig = {
        ...this.scenarioConfig,
        id: config.id,
        name: config.name,
        description: config.description,
        parameters: config.parameters,
        topology: config.topology
      }
      this.attackerConfig = config.attackerConfig || this.attackerConfig
      this.defenseAssets = config.defenseAssets || this.defenseAssets
      this.canPreview = true
    }
    ,
    syncTopologyFromCounts() {
      if (!this.isCustomConfig) return
      const realCount = Number(this.scenarioConfig.parameters.realNodeCount || 0)
      const honeypotCount = Number(this.scenarioConfig.parameters.honeypotNodeCount || 0)
      const allTypes = Array.isArray(this.scenarioConfig.parameters.nodeTypes)
        ? this.scenarioConfig.parameters.nodeTypes
        : []
      const realTypes = allTypes.filter((type) => type !== '蜜罐')
      const realTypePool = realTypes.length > 0 ? realTypes : ['业务节点']
      const nodes = []
      const links = []
      for (let i = 1; i <= realCount; i += 1) {
        const typeName = realTypePool[(i - 1) % realTypePool.length]
        nodes.push({
          id: `real-${i}`,
          label: `${typeName}-${i}`,
          type: typeName,
          shape: 'image',
          image: this.resolveNodeIcon(typeName),
          zone: 'core'
        })
        if (i > 1) {
          links.push({
            id: `link-real-${i - 1}-${i}`,
            from: `real-${i - 1}`,
            to: `real-${i}`,
            type: 'core'
          })
        }
      }
      for (let i = 1; i <= honeypotCount; i += 1) {
        nodes.push({
          id: `honeypot-${i}`,
          label: `蜜罐-${i}`,
          type: 'honeypot',
          shape: 'image',
          image: this.resolveNodeIcon('honeypot'),
          zone: 'dmz'
        })
        if (realCount > 0) {
          links.push({
            id: `link-honeypot-${i}`,
            from: 'real-1',
            to: `honeypot-${i}`,
            type: 'honeypot'
          })
        }
      }
      this.scenarioConfig = {
        ...this.scenarioConfig,
        topology: {
          nodes,
          links
        }
      }
    },
    getPresetById(presetId) {
      if (!presetId) return null
      if (presetId === 'preset-electric-grid') {
        const base = getMockScenarioConfig()
        return {
          id: presetId,
          name: '电网中心典型拓扑',
          description: '电网调度中心典型攻防拓扑预设',
          topology: base.topology,
          parameters: {
            ...base.parameters,
            nodeCount: 8,
            realNodeCount: 6,
            honeypotNodeCount: 2,
            nodeTypes: ['控制中心', 'SCADA', 'RTU', '蜜罐']
          },
          attackerConfig: {
            targetZone: 'core',
            attackStyle: 'stealth',
            allowedActions: ['主机探测', '链路探测', '漏洞利用']
          },
          defenseAssets: [
            { name: '调度中心', type: '真实系统', role: '核心节点', status: '稳定' },
            { name: 'SCADA 主站', type: '真实系统', role: '控制节点', status: '稳定' },
            { name: '蜜罐-1', type: '蜜罐', role: '诱捕', status: '激活' }
          ]
        }
      }
      if (presetId === 'preset-enterprise-lan') {
        return {
          id: presetId,
          name: '企业内网典型拓扑',
          description: '企业办公内网与业务区典型攻防拓扑预设',
          topology: {
            nodes: [
              { id: 'core', label: '核心交换', type: 'core', zone: 'core' },
              { id: 'dmz', label: 'DMZ 网关', type: 'gateway', zone: 'dmz' },
              { id: 'app', label: '应用服务器', type: 'app', zone: 'core' },
              { id: 'db', label: '数据库服务器', type: 'db', zone: 'core' },
              { id: 'pc-1', label: '办公终端-1', type: 'pc', zone: 'field' },
              { id: 'pc-2', label: '办公终端-2', type: 'pc', zone: 'field' },
              { id: 'honeypot', label: '蜜罐-1', type: 'honeypot', zone: 'dmz' }
            ],
            links: [
              { id: 'link-core-dmz', from: 'core', to: 'dmz', type: 'gateway' },
              { id: 'link-core-app', from: 'core', to: 'app', type: 'service' },
              { id: 'link-core-db', from: 'core', to: 'db', type: 'service' },
              { id: 'link-core-pc1', from: 'core', to: 'pc-1', type: 'office' },
              { id: 'link-core-pc2', from: 'core', to: 'pc-2', type: 'office' },
              { id: 'link-dmz-hp', from: 'dmz', to: 'honeypot', type: 'honeypot' }
            ]
          },
          parameters: {
            ...this.scenarioConfig.parameters,
            nodeCount: 7,
            realNodeCount: 6,
            honeypotNodeCount: 1,
            nodeTypes: ['核心交换', '应用服务器', '数据库', '办公终端', '蜜罐']
          },
          attackerConfig: {
            targetZone: 'core',
            attackStyle: 'pressure',
            allowedActions: ['主机探测', '漏洞利用', 'DDoS 攻击']
          },
          defenseAssets: [
            { name: '核心交换', type: '真实系统', role: '网络核心', status: '稳定' },
            { name: '应用服务器', type: '真实系统', role: '业务节点', status: '稳定' },
            { name: '蜜罐-1', type: '蜜罐', role: '诱捕', status: '激活' }
          ]
        }
      }
      return null
    },
    applyPresetData(preset) {
      this.scenarioConfig = {
        ...this.scenarioConfig,
        id: `scenario-${Date.now()}`,
        name: preset.name,
        description: preset.description,
        parameters: preset.parameters,
        topology: this.decorateTopology(preset.topology)
      }
      this.attackerConfig = preset.attackerConfig || this.attackerConfig
      this.defenseAssets = preset.defenseAssets || this.defenseAssets
    },
    resolveNodeIcon(typeName) {
      const key = (typeName || '').toString()
      if (['控制中心', '核心交换', '交换机', 'switch'].includes(key)) return iconMap.switch
      if (['路由器', '路由', 'router'].includes(key)) return iconMap.router
      if (['SCADA', '应用服务器', '数据库', 'server', 'app', 'db'].includes(key)) return iconMap.server
      if (['RTU', 'PLC', '办公终端', '终端', 'host', 'pc'].includes(key)) return iconMap.host
      if (['蜜罐', 'honeypot'].includes(key)) return iconMap.honeypot
      if (['control-center', 'core'].includes(key)) return iconMap.switch
      return iconMap.server
    },
    decorateTopology(topology) {
      if (!topology || !Array.isArray(topology.nodes)) return topology
      const nodes = topology.nodes.map((node) => {
        if (node.image) return node
        const image = this.resolveNodeIcon(node.type || node.label)
        return {
          ...node,
          shape: 'image',
          image
        }
      })
      return {
        ...topology,
        nodes
      }
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
  flex: 1;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
  min-height: 0;
}

.config-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.topology-panel {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(15, 44, 76, 0.06);
  overflow: hidden;
  min-height: 520px;
  display: flex;
  flex-direction: column;
}

.config-card {
  border-radius: 12px;
  border: 1px solid #eef1f6;
}

.config-manager {
  display: flex;
  gap: 12px;
  align-items: center;
}

.config-manager .el-select {
  flex: 1;
}

.config-meta {
  margin-top: 8px;
  color: #94a3b8;
  font-size: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.summary-item {
  background: #f5f7fb;
  border-radius: 10px;
  padding: 12px;
}

.summary-label {
  color: #6b7a90;
  font-size: 12px;
}

.summary-value {
  font-size: 16px;
  margin-top: 6px;
  font-weight: 600;
}

.topology-header {
  padding: 16px 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.topology-header h3 {
  margin: 0;
  font-size: 16px;
}

.topology-header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7a90;
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: -8px 0 12px;
}

.form-tip {
  margin-left: 8px;
  color: #94a3b8;
  font-size: 12px;
}

.config-preview {
  background: #0f172a;
  color: #d6e4ff;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  max-height: 380px;
  overflow: auto;
}

.config-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.topology-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
  padding: 24px;
}

@media (max-width: 1200px) {
  .module-body {
    grid-template-columns: 1fr;
  }
  .topology-panel {
    min-height: 420px;
  }
}
</style>
