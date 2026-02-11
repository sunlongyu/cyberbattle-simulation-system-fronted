<template>
    <div class="network-topo">
        <!--顶部固定菜单-->
        <div class="network-top-box">
            <div class="network-info">
                <div class="network-info-item">
                    网络模式:{{ networkConfigData['currentNetworkMode']['value'] }}
                </div>
                <div class="network-info-item">
                     <el-button type="primary" size="small" @click="showNetworkModeConfig = true">设置</el-button>
                </div>
            </div>
            <div v-if="showPlayerStatus" class="gaming-status-box">
                <div class="gaming-status-item">
                    当前player
                </div>
                <div class="gaming-status-item">
                    <el-tag :type="currentPlayer=='attacker'?'danger':'info'" effect="dark" >
                        攻击者
                    </el-tag>
                    <el-tag :type="currentPlayer=='defender'?'primary':'info'" effect="dark" >
                        防御者
                    </el-tag>
                </div>
            </div>
        </div>
        <div  class="network-container" @contextmenu.prevent="topoMenuHandle" @click.prevent="topoMenuStopHandle">
            <div id="network-topo-container"></div>
            <!--自定义右键按钮-->
            <div v-if="isShowTopoMenu" class="menu_box" :style="{'left': topoMenuLeft + 'px', 'top': topoMenuTop + 'px'}">
                <div class="menu">
                    <div class="menu_item item_text" @click.stop="menuItemClick(0)">复制输入</div>
                    <div class="menu_item item_text" @click.stop="menuItemClick(1)">复制名称</div>
                </div>
            </div>
        
        </div>
        <div v-if="showLargeScreen" class="large-screen-monitor" @click="openlargeScreenMonitor">
            大屏监控
        </div>
         <!--网络配置-->
        <el-dialog v-model="showNetworkModeConfig" 
          :modal="false" 
          :close-on-click-modal="false"
          title="网络配置"
          width="400" 
          modal-class="dialog_class"
          draggable
          append-to-body
          >
        <el-form :model="networkConfigData">
          <el-form-item v-for="(item,key,index) in networkConfigData" :label="item.title" label-width="100">
            <el-select v-if="item.formType=='select'"  v-model="networkConfigData[key]['value']" >
                <el-option
                    v-for="select_item in item.selectOptions"
                    :key="select_item"
                    :label="select_item"
                    :value ="select_item">
                    </el-option>
            </el-select>
            <el-input v-if="item.formType=='input'" v-model="networkConfigData[key]['value']" autocomplete="off" />
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="showNetworkModeConfig = false">取消</el-button>
            <el-button type="primary" @click="updateNetworkConfigData">
              确认
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
    
</template>

<script>
require("vis-network/dist/dist/vis-network.min.css");
import clipboard from 'clipboard';
import { deepCopy } from '@/util';
import {getObjectHash} from '@/util/crypto.js'
import {getNetworkDynamicMapData,proccessNetworkDynamicMapData} from "@/core/environment.js";
const vis = require("vis-network/dist/vis-network.min");
export default {
     name: 'networkTopo',
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
            currentNetworkMode:'本地',
            oldNetworkTopoData:{},
            networkTopoData: {},
            network:null,
            currentSelectedNode:null,
            currentSelectedLink:null,
            isShowTopoMenu:false,
            topoMenuTop:0,
            topoMenuLeft:0,
            currentPlayer:'defender',
            showNetworkModeConfig:false,
            networkConfigData:{
                'currentNetworkMode':{
                    'title':'网络模式',
                    'formType':'select',
                    'selectOptions':['local','remote'],
                    'value':'local'
                },
                'currentTopoName':{
                    'title':'当前网络拓扑',
                    'formType':'select',
                    'selectOptions':['Aranet','自定义'],
                    'value':'Aranet'
                },
                'backgroundServerUrl':{
                    'title':'后端地址',
                    'formType':'input',
                    'value':'http://172.22.107.94:5000'
                }
            }
         }
     },
     watch: {
        '$store.state.gamingStatus.currentPlayer'(newVal,oldVal){
            if(newVal!=null){
                // console.log("update currentPlayer:",newVal)
                // this.currentPlayer = newVal
            }               
        },
        '$store.state.environmentMonitor.networkDynamicMapData'(newVal,oldVal){
            let data = deepCopy(newVal)
            console.log("update networkDynamicMapData:",data)
            let newNetworkTopoData = deepCopy(proccessNetworkDynamicMapData(data))  
            this.updateNetworkTopo(newNetworkTopoData)              
        },
        '$store.state.global.networkConfigData'(newVal,oldVal){
            if(newVal!=null){
                console.log("update networkConfigData:",newVal)
                this.networkConfigData = newVal
            }               
        },
        topologyData: {
            handler(newVal){
                if(!newVal) return
                const topoData = this.normalizeTopologyData(newVal)
                if(topoData){
                    this.applyExternalTopology(topoData)
                }
            },
            deep: true
        }
     },
     created() {
        this.$nextTick(() => {
            this.loadNetworkTopoData()
            this.initNetworkTopo()
        })
     },
     mounted() {
     },
     methods: {
        updateNetworkConfigData(){
            let networkConfigData = this.networkConfigData
            console.log(networkConfigData)
            const data = {
                'commit_name': 'updateNetworkConfigData',
                'data': JSON.stringify(networkConfigData) //发送给主线程的数据都要统一stringify
            }
            //主进程更新数据
            this.$electron.ipcRenderer.send('send_store_commit_data_to_main', data);
            this.$message.success('更新后端服务器地址')
            this.showNetworkModeConfig = false
        },
        reloadNetworkTopoData(){
            let data = getNetworkDynamicMapData()
            console.log(data)
            let nodes = Object.values(data['nodes'])
            let edges = data['links']
            let topoData = {
                nodes: nodes,
                edges: edges
            }
            this.networkTopoData = {
                nodes: new vis.DataSet(nodes),
                edges: new vis.DataSet(edges)
            }
            this.oldNetworkTopoData =topoData
            this.network.on("oncontext", (e) => {
                this.topoMenuHandle(e)
            });
            return topoData
        },
        updateNetworkTopo(networkTopoData) {
            //遍历所有节点和边逐个更新
            if (this.network!=null){
                let nodes = networkTopoData['nodes']
                let edges = networkTopoData['links']
                let topoData = {
                    nodes: nodes,
                    edges: edges 
                }
                //如果节点数不对则为新的拓扑(重载)
                if(topoData['nodes'].length!= this.oldNetworkTopoData['nodes'].length){
                    this.reloadNetworkTopoData(networkTopoData)
                    return 
                }
                
                //节点信息有更新
                if(getObjectHash(this.oldNetworkTopoData['nodes'])!=getObjectHash(topoData['nodes'])){
                    console.log("update networkTopoData:")
                    console.log(this.networkTopoData)
                    for(let i =0;i<this.oldNetworkTopoData['nodes'].length;i++){
                        for(let j =0;j<topoData['nodes'].length;j++){
                            
                            if(topoData['nodes'][j]['id']==this.oldNetworkTopoData['nodes'][i]['id']){
                                if(getObjectHash(topoData['nodes'][j])!=getObjectHash(this.oldNetworkTopoData['nodes'][i])){
                                    console.log("update node:"+topoData['nodes'][j]['id'])
                                    this.networkTopoData.nodes.update([{ id: topoData['nodes'][j]['id'], image:topoData['nodes'][j]['image'] }]);
                                }
                                
                            }
                        } 

                    }        
                }
                
                //边信息有更新
                if(getObjectHash(this.oldNetworkTopoData['edges'])!=getObjectHash(topoData['edges'])){

                }
                this.oldNetworkTopoData = topoData
            }
            this.network.on("oncontext", (e) => {
                this.topoMenuHandle(e)
            });
        },
        loadNetworkTopoData() {
            let nodes = []
            let edges = []
            if (this.topologyData && this.topologyData.nodes && (this.topologyData.links || this.topologyData.edges)) {
                const topoData = this.normalizeTopologyData(this.topologyData)
                nodes = topoData.nodes
                edges = topoData.edges
            } else {
                let data = getNetworkDynamicMapData()
                console.log(data)
                nodes = Object.values(data['nodes'])
                edges = data['links']
            }
            let topoData = {
                nodes: nodes,
                edges: edges
            }
            this.networkTopoData = {
                nodes: new vis.DataSet(nodes),
                edges: new vis.DataSet(edges)
            }
            this.oldNetworkTopoData =topoData
            return topoData
        },
        normalizeTopologyData(rawData){
            if(!rawData) return null
            const nodes = rawData.nodes || []
            const edges = rawData.links || rawData.edges || []
            return { nodes, edges }
        },
        applyExternalTopology(topoData){
            const nodes = topoData.nodes || []
            const edges = topoData.edges || []
            if (!this.networkTopoData || !this.networkTopoData.nodes || !this.networkTopoData.edges) {
                this.networkTopoData = {
                    nodes: new vis.DataSet(nodes),
                    edges: new vis.DataSet(edges)
                }
            } else {
                this.networkTopoData.nodes.clear()
                this.networkTopoData.edges.clear()
                this.networkTopoData.nodes.add(nodes)
                this.networkTopoData.edges.add(edges)
            }
            this.oldNetworkTopoData = { nodes, edges }
            if (this.network) {
                this.network.setData(this.networkTopoData)
            }
        },
        reloadNetworkTopoData(data){
            let nodes = data['nodes']
            let edges = data['links']
            let topoData = {
                nodes: nodes,
                edges: edges
            }
            this.networkTopoData.nodes.clear()
            this.networkTopoData.edges.clear()  
            this.networkTopoData.nodes.add(nodes)
            this.networkTopoData.edges.add(edges)
            this.oldNetworkTopoData =topoData
            return topoData
        },
        
        initNetworkTopo() {
            let container = document.getElementById("network-topo-container");
            // 5.全局配置
            let options = {
                autoResize: true, //网络将自动检测其容器的大小调整，并相应地重绘自身
                locale: "cn", //语言设置：工具栏显示中文
                physics:{
                    stabilization: {
                        enabled: false,
                        iterations:0,
                        updateInterval:1
                    }
                },
                // 设置节点样式
                nodes: {
                    shape: "ellipse", //节点的外观。为circle时label显示在节点内，为dot时label显示在节点下方
                    size: 30, //节点的大小，
                    shadow: false, //如果为true，则节点使用默认设置投射阴影。
                    font: {
                    //字体配置
                        size: 20,
                        color: "#000",
                        align: "center",
                    },
                    color: {
                        border: "transparent", //节点边框颜色
                        background: "#fd91b7", //节点背景颜色
                        highlight: {
                            //节点选中时状态颜色
                            border: "rgb(117, 218, 167)",
                            background: "rgb(117, 218, 167)",
                        },
                        hover: {
                            //节点鼠标滑过时状态颜色
                            border: "#dff9fb",
                            background: "#88dab1",
                        },
                    },
                    margin: 5, //当形状设置为box、circle、database、icon、text；label的边距
                    widthConstraint: 100, //设置数字，将节点的最小和最大宽度设为该值,当值设为很小的时候，label会换行，节点会保持一个最小值，里边的内容会换行
                    borderWidth: 1, //节点边框宽度，单位为px
                    borderWidthSelected: 3, //节点被选中时边框的宽度，单位为px
                    labelHighlightBold: false, //确定选择节点时标签是否变为粗体
                },
                // 边线配置
                edges: {
                    width: 1,
                    length: 200,
                    color: {
                        color: "#000",
                        highlight: "#ee430f",
                        hover: "#000",
                        inherit: "from",
                        opacity: 1.0,
                    },
                    shadow: false,
                    smooth: {
                        //设置两个节点之前的连线的状态
                        enabled: true, //默认是true，设置为false之后，两个节点之前的连线始终为直线，不会出现贝塞尔曲线
                    }
                
                },
                           
            };
            // 6.初始化网络拓扑图
            var network = new vis.Network(container, this.networkTopoData, options);
            this.network = network

            //订阅network相关的事件
            this.network.on("oncontext", (e) => {
                this.topoMenuHandle(e)
            });
        },
        openlargeScreenMonitor(){
            const data = {
                title: '大屏监控',
                url: 'largeScreenMonitor',
                full_screen:true
            };
            //创建新无边框窗口
            this.$electron.ipcRenderer.send('open-frameless-window-by-local-url', data);
        },
        topoMenuHandle(e){
            this.isShowTopoMenu=true
            console.log(e)
            this.topoMenuTop=e.offsetY
            this.topoMenuLeft=e.offsetX
            //获取鼠标指向的节点，需要dom坐标
            var nodeId = this.network.getNodeAt({
                x:e.offsetX,
                y:e.offsetY
            });
            console.log("currentNodeId:"+nodeId)
            if(nodeId!=undefined){
                this.currentSelectedNode = this.networkTopoData.nodes.get(nodeId)
                console.log("currentSelectedNode:")
            }            
        },
        
        topoMenuStopHandle(e){
            this.isShowTopoMenu=false
            this.currentSelectedNode=null
        },
        menuItemClick(index){
            this.isShowTopoMenu=false
            if(index==0){
                //复制目标IP到剪切板
                if(this.currentSelectedNode!=null&&this.currentSelectedNode!=undefined){
                    let node_type = this.currentSelectedNode['node_type']
                    console.log("currentSelectedNode:",this.currentSelectedNode)
                    if(node_type!=undefined){
                        let dpid = this.currentSelectedNode['dpid']
                        let ip = this.currentSelectedNode['ip']
                        let copy_content = ''
                        let copy_commit = {} 
                        if(node_type=='switch'&&dpid!=undefined){
                            copy_content = dpid
                            copy_commit = {dpid:dpid}
                            this.$message({message: 'DPID复制成功', type:'success'})
                        }
                        if(node_type=='host'&&ip!=undefined){
                            copy_content = ip
                            copy_commit = {client_ip:ip}
                            this.$message({message: 'IP复制成功', type:'success'})
                        }
                        clipboard.copy(copy_content);
                        //复制给全局form输入
                        this.$store.commit('updateCurrentCopyFormData',copy_commit)
                        
                    }
                    
                }
                
            }
            if(index==1){
                //复制节点名称到剪切板
                if(this.currentSelectedNode!=null){
                    let nodeLabel = this.currentSelectedNode.label
                    clipboard.copy(nodeLabel);
                    this.$message({
                        message: '复制成功',
                        type:'success'
                    }) 
                }
            }
            this.currentSelectedNode = null
        },
     }
 }
</script>

<style>
.network-topo{
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0;
    margin-top: -5px;
}
.network-top-box{
    position: absolute;
    top: 0;
    right: 0;
    background: transparent;
    z-index: 1000;
    height: 60px;
    width: 100%;
}
.large-screen-monitor{
    position: absolute;
    top: 30%;
    right: 0;
    box-shadow: #e7eff3 2px 2px 2px;
    background-color: #9cc0ef;
    opacity: 0.8;
    z-index: 1000;
    height: 60px;
    width: 25px;
    padding: 0 5px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: black;
    border-radius: 3px 0 0 3px;
}
.large-screen-monitor:hover{
    background: #3b85e4;
    color: white;
    cursor: pointer;
}
.network-top-box .network-info{
    position: absolute;
    left: 0;
    width: 165px;
    height: 50%;
    font-size: 15px;
    
    display: flex;
    align-items: center;
    justify-content: flex-start;
    box-shadow: #e7eff3 2px 2px 2px;
    background-color: #ade0f8;
    opacity: 0.9;
    padding: 4px 0;
    padding-left:6px;
    border-radius: 0 0 5px 0;
}
.network-info .network-info-item{
    padding-right: 10px;
}
.network-top-box .gaming-status-box{
    position: absolute;
    right: 0;
    width: 120px;
    height: 100%;
    font-size: 15px;
    background-color: #9cc0ef;
    opacity: 0.9;
    border-radius: 0 0 0 5px;
    box-shadow: #e7eff3 2px 2px 2px;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: flex-start;

}
.gaming-status-box .gaming-status-item{
    color: white;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    width: 50%;
    opacity: 1;
}
.gaming-status-item .el-tag {
    margin-top: 3px;
}
.network-container{
    width: 100%;
    height: 100%;
    position: relative;
}
#network-topo-container{
    width:100%;
    height: 100%;
}
.menu_box {
  position: absolute;
  z-index: 1004;
  background-color: #fff;
  border-radius: 5px;
  
}
.menu{
    border-radius: 5px;
    width: 120px;
    text-align: left;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

.menu .menu_item{
    height: 24px;
  
}
.item_text{
    color: #171A1D;
    cursor: pointer;
    padding: 4px 20px;
    border-radius: 5px;
    transition: all .1s ease-in;
}
.item_text:hover {
    background-color: #E9EAEC;
}
.test{
    color:#ee430f;
    color:#42bef0;
}
.dialog_class{
  pointer-events: none;
}
.dialog_class .el-overlay-dialog{
  pointer-events: none;
}
</style>
