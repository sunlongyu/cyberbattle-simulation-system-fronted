// src/main.js
import { createApp } from 'vue'
import App from './App.vue'
import router from './router' // 导入刚才创建的路由实例
import store from './store'
import ElementPlus from 'element-plus'
import { ElMessage } from 'element-plus'
import 'element-plus/dist/index.css'
import {setupListener,setupStoreIPC} from './core/store.js'
import { migrateDisplayCache } from './core/configStore'
const SSR = false
// 将Electron和fs绑定到Vue原型链上
const app = createApp(App)
//使用UI库
app.use(router) // 使用路由
app.use(ElementPlus)
app.config.globalProperties.$message = ElMessage

// 首先确保在Vue应用准备阶段获取Electron API
if (SSR === false) { // 非SSR情况下（仅客户端）
  // 注意Vue 3.x使用app.config.globalProperties
  const electron = window.require('electron')
  const { ipcRenderer } = window.require('electron')
  const fs = window.require('fs')
  app.config.globalProperties.$electron = electron
  app.config.globalProperties.$ipcRenderer = ipcRenderer
  app.config.globalProperties.$fs = fs
  app.config.globalProperties.$win = window
  //初始化主进程监听
  setupListener(ipcRenderer)
  setupStoreIPC(ipcRenderer)
}

app.use(store) // 使用store
migrateDisplayCache()
// 挂载Vue应用
app.mount('#app')
