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
          v-for="item in navigationItems"
          :key="item.name"
          :to="item.path"
          :class="currentRouteName === item.name ? 'router-active' : ''"
        >
          <span>{{ item.meta.title }}</span>
          <small>{{ item.meta.description }}</small>
        </router-link>
      </aside>
      <main class="main-container">
        <router-view :key="$route.fullPath"></router-view>
      </main>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App',
  title:'攻防博弈', 
  computed: {
    currentRouteName() {
      return this.$route.name
    },
    navigationItems() {
      const routes = this.$router
        .getRoutes()
        .filter((route) => route.meta && route.meta.showInNav && !route.aliasOf)
        .sort((a, b) => (a.meta.navOrder || 0) - (b.meta.navOrder || 0))

      const seen = new Set()
      return routes.filter((route) => {
        const key = route.name || route.meta?.title || route.path
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    }
  },
  watch:{
    '$store.state.global.message'(newVal){
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
  methods: {}
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
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.side-nav a:hover{
  color: #fff;
  background-color: #2f6ed6;
}

.side-nav a small{
  color: #7c8aa5;
  font-size: 11px;
  line-height: 1.4;
}

.side-nav a:hover small,
.router-link-active small{
  color: rgba(255,255,255,0.82);
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
