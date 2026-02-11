<template>
  <div class="app-layout">
    <header class="top-nav">
      <div class="brand">
        <span class="brand-title">网络攻防博弈仿真平台</span>
        <span class="brand-subtitle"></span>
      </div>
      <div class="top-actions">
        <span class="status-pill">  </span>
      </div>
    </header>
    <div class="layout-body">
      <aside class="side-nav">
        <router-link
          to="/environment-setup"
          :class="currentRouteName === 'environmentSetup' ? 'router-active' : ''"
        >
          攻防环境设置
        </router-link>
        <router-link
          to="/strategy-integration"
          :class="currentRouteName === 'strategyIntegration' ? 'router-active' : ''"
        >
          智能策略集成
        </router-link>
        <router-link
          to="/real-time-simulation"
          :class="currentRouteName === 'realTimeSimulation' ? 'router-active' : ''"
        >
          攻防实时推演
        </router-link>
        <router-link
          to="/multi-dim-analysis"
          :class="currentRouteName === 'multiDimAnalysis' ? 'router-active' : ''"
        >
          多维可视分析
        </router-link>
      </aside>
      <main class="main-container">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  title:'攻防博弈', 
  data() {
    return {
      currentRouteName:'environmentSetup'
    }
  },
  computed: {
    
  },
  created(){
    
  },
  mounted() {
  
  },
  watch:{
    '$route.name'(newVal,oldVal){
      this.currentRouteName = newVal
    },
    '$store.state.global.message'(newVal,oldVal){
      if(newVal['message']=='')return

      if(newVal['type']=='success'){
        this.$message.success(newVal['message'])
      }else if(newVal['type']=='error'){
        this.$message.error(newVal['message'])
      }else{
        this.$message.info(newVal['message'])
      }
    }

  },
  methods: {
    
  }

}
</script>

<style>
html,body{
  height: 100%;
  width: 100%;
  margin: 0;
  
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
}
body::-webkit-scrollbar {
    width: 8px; /* 设置滚动条宽度 */
}

.app-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.top-nav {
  height: 60px;
  background: #0f2c4c;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(15, 44, 76, 0.2);
}

.brand {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.brand-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
}

.brand-subtitle {
  font-size: 12px;
  color: #c9d6e8;
}

.top-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.status-pill {
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
}

.layout-body {
  flex: 1;
  display: flex;
  min-height: 0;
  background: #f5f7fb;
}

.side-nav{
  width: 180px;
  background: #ffffff;
  border-right: 1px solid #e6ebf2;
  display: flex;
  flex-direction: column;
  padding: 16px 8px;
  gap: 6px;
}

.side-nav a{
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #2c3e50;
  text-decoration: none;
  transition: all 0.2s ease;
}

.side-nav a:hover{
  color: #fff;
  background-color: #2f6ed6;
}

.main-container{
  flex: 1;
  min-width: 500px;
  display: flex;
  align-items: stretch;
  justify-content: center;
  padding: 16px;
  overflow: auto;
}

a{text-decoration: none;color:#333;}

.router-link-active{
  color: white;
  background-color: #2f6ed6;
}
</style>
