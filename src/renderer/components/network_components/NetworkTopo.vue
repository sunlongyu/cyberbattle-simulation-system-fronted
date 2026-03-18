<template>
  <div class="network-topo">
    <div v-if="showPlayerStatus" class="network-top-box">
      <div class="gaming-status-box">
        <div class="gaming-status-item">当前 player</div>
        <div class="gaming-status-item">
          <el-tag :type="currentPlayer === 'attacker' ? 'danger' : 'info'" effect="dark">攻击者</el-tag>
          <el-tag :type="currentPlayer === 'defender' ? 'primary' : 'info'" effect="dark">防御者</el-tag>
        </div>
      </div>
    </div>

    <div class="network-container">
      <div v-if="normalizedNodes.length === 0" class="empty-state">
        暂无拓扑数据
      </div>
      <div v-else class="topology-stage">
        <div class="link-layer">
          <div
            v-for="link in positionedLinks"
            :key="link.id"
            class="link-item"
            :style="link.style"
          ></div>
        </div>
        <div class="node-layer">
          <div
            v-for="node in positionedNodes"
            :key="node.id"
            class="node-card"
            :style="node.style"
          >
            <div class="node-icon">
              <img v-if="node.image" :src="node.image" :alt="node.label" />
              <div v-else class="node-fallback">{{ node.shortLabel }}</div>
            </div>
            <div class="node-label">{{ node.label }}</div>
            <div class="node-meta">{{ zoneLabel(node.zone) }}</div>
          </div>
        </div>
      </div>

      <div v-if="showLargeScreen" class="large-screen-monitor" @click="openlargeScreenMonitor">
        大屏监控
      </div>
    </div>
  </div>
</template>

<script>
const DEFAULT_NODE_IMAGE = require('@/assets/server.png')

export default {
  name: 'NetworkTopo',
  props: {
    showLargeScreen: {
      type: Boolean,
      default: true
    },
    topologyData: {
      type: Object,
      default: null
    },
    showPlayerStatus: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      currentPlayer: 'defender'
    }
  },
  computed: {
    normalizedTopology() {
      const topology = this.topologyData || {}
      return {
        nodes: Array.isArray(topology.nodes) ? topology.nodes : [],
        links: Array.isArray(topology.links) ? topology.links : Array.isArray(topology.edges) ? topology.edges : []
      }
    },
    normalizedNodes() {
      return this.normalizedTopology.nodes.map((node, index) => ({
        id: node.id || `node-${index}`,
        label: node.label || node.id || `节点-${index + 1}`,
        image: node.image || DEFAULT_NODE_IMAGE,
        zone: node.zone || 'core',
        shortLabel: (node.label || node.id || `N${index + 1}`).slice(0, 2)
      }))
    },
    positionedNodes() {
      const columns = Math.min(4, Math.max(1, this.normalizedNodes.length))
      return this.normalizedNodes.map((node, index) => {
        const row = Math.floor(index / columns)
        const column = index % columns
        const left = 10 + column * (78 / Math.max(1, columns - 1 || 1))
        const top = 18 + row * 28
        return {
          ...node,
          style: {
            left: `${left}%`,
            top: `${top}%`
          }
        }
      })
    },
    positionedLinks() {
      const nodeMap = Object.fromEntries(this.positionedNodes.map((node) => [node.id, node]))
      return this.normalizedTopology.links
        .map((link, index) => {
          const from = nodeMap[link.from]
          const to = nodeMap[link.to]
          if (!from || !to) return null
          const fromLeft = Number.parseFloat(from.style.left)
          const fromTop = Number.parseFloat(from.style.top)
          const toLeft = Number.parseFloat(to.style.left)
          const toTop = Number.parseFloat(to.style.top)
          const deltaX = toLeft - fromLeft
          const deltaY = toTop - fromTop
          const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
          const angle = Math.atan2(deltaY, deltaX)
          return {
            id: link.id || `link-${index}`,
            style: {
              left: `${fromLeft}%`,
              top: `${fromTop}%`,
              width: `${length}%`,
              transform: `rotate(${angle}rad)`
            }
          }
        })
        .filter(Boolean)
    }
  },
  methods: {
    zoneLabel(zone) {
      const map = {
        core: '核心区',
        dmz: 'DMZ',
        field: '现场区'
      }
      return map[zone] || zone || '未分区'
    },
    openlargeScreenMonitor() {
      this.$message.info('当前演示版本未启用大屏监控窗口')
    }
  }
}
</script>

<style scoped>
.network-topo {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 360px;
}

.network-top-box {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
}

.gaming-status-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(173, 224, 248, 0.95);
  border-radius: 0 0 10px 0;
  box-shadow: 0 6px 16px rgba(15, 44, 76, 0.12);
}

.gaming-status-box {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(156, 192, 239, 0.95);
  border-radius: 0 0 0 10px;
  box-shadow: 0 6px 16px rgba(15, 44, 76, 0.12);
}

.gaming-status-item {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: #16324f;
}

.network-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 360px;
  border-radius: 12px;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.14), transparent 24%),
    radial-gradient(circle at 80% 30%, rgba(14, 165, 233, 0.12), transparent 20%),
    linear-gradient(180deg, #f7fbff 0%, #eef5fb 100%);
}

.topology-stage {
  position: absolute;
  inset: 0;
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7c8aa5;
  font-size: 14px;
}

.link-layer,
.node-layer {
  position: absolute;
  inset: 0;
}

.link-item {
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, rgba(47, 110, 214, 0.75), rgba(14, 165, 233, 0.35));
  transform-origin: left center;
  box-shadow: 0 0 10px rgba(47, 110, 214, 0.18);
}

.node-card {
  position: absolute;
  width: 128px;
  margin-left: -64px;
  margin-top: -32px;
  border-radius: 14px;
  border: 1px solid rgba(191, 219, 254, 0.9);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 10px 22px rgba(15, 44, 76, 0.1);
  padding: 10px 12px;
  text-align: center;
}

.node-icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.node-icon img {
  width: 28px;
  height: 28px;
  object-fit: contain;
}

.node-fallback {
  font-size: 16px;
  font-weight: 700;
  color: #1d4ed8;
}

.node-label {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  line-height: 1.4;
  word-break: break-word;
}

.node-meta {
  margin-top: 4px;
  font-size: 11px;
  color: #64748b;
}

.large-screen-monitor {
  position: absolute;
  top: 36%;
  right: 0;
  width: 30px;
  height: 110px;
  padding: 0 4px;
  border-radius: 6px 0 0 6px;
  background: rgba(156, 192, 239, 0.95);
  box-shadow: 0 8px 16px rgba(15, 44, 76, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #102a43;
  cursor: pointer;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.large-screen-monitor:hover {
  background: #60a5fa;
  color: #ffffff;
}
</style>
