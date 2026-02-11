<template>
    <div class="reportTemplate">
      <div class="report-header">
        <div class="report-title">{{report.title}}</div>
        <div class="report-create-time">{{report.create_time}}</div>
        <div class="report-description">{{report.description}}</div>
      </div>
      <div class="report-body">
        <div class="report-item" v-for="(item,index) in report.report_data" :key="index">
          <div class="report-item-title">{{item.title}}</div>
          <div class="report-item-description">{{item.description}}</div>
          <div class="report-item-table" v-if="item.has_table" v-for="(table,t_index) in item.table_data">
            <table class="report-item-table-body">
              <tr>
                <th v-for="(name,k_index) in table.keys">{{ name }}</th>
              </tr>
              <tr v-for="(values,d_index) in table.data">
                <td v-for="(value,v_index) in values">{{value}}</td>
              </tr>
            </table>
            <div class="report-item-table-title">{{table.table_title}}</div>
          </div>
          <div class="report-item-chart" v-if="item.has_chart" v-for="(chart,c_index) in item.chart_data">
            <div class="report-item-chart-body" style="width: 100%;height: 300px;">
               <!-- <EchartToBase64 :chartId = "'mychart'+index+'_'+c_index" :option="chart.echart_option"></EchartToBase64>
               <img :src="chart.chart_base64_content"> -->
               <networkTopo v-if="chart.echart_name=='networkDynamicFlyMap'"></networkTopo>
               </div> 
            <div class="report-item-chart-title">{{chart.chart_title}}</div>
          </div>
        </div>
      </div>
    </div>
</template>
  
<script>
import {deepCopy} from "@/util/index.js";
import {generate_report_data} from '@/core/report.js'
import EchartToBase64 from './EchartToBase64.vue'
import networkTopo from '../network_components/NetworkTopo.vue'
export default {
  name: 'ReportPdfTemplate',
  components: {
    EchartToBase64,
    networkTopo
  },
  data() {
    return {
      report:{}
    }
  },
  watch:{
    '$store.state.environmentMonitor.taskHistoryData'(newVal,oldVal){
      console.log("taskHistoryData:",newVal)
      if(newVal!=undefined&&newVal.length>0){
        this.getReportData()
      }
    }
  },
  mounted() {
  },
  created() {
    //等待dom加载完成后加载
    this.$nextTick(()=>{
      this.getReportData()
    })
  },
  methods: {
    getReportData(){
      let report = generate_report_data()
      this.report = deepCopy(report)
    }
  }
}
  </script>
  <!-- Add "scoped" attribute to limit CSS to this component only -->
  <style >
  html,body{
    background-color: transparent;
    width: 100%;
    height: 100%;
  }
  
  .reportTemplate{
    width: 600px;
    min-height: 610px;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .header-box .window-close:hover{
    cursor: pointer;
  }
  .reportTemplate  .report-header{
    width: 100%;
    margin-bottom: 10px;
  }
  .report-title{
    font-size: 30px;
    width: 100%;
    text-align: center;
    font-weight: bold;
    color:  #9cc0ef;
  }
  .report-create-time, .report-description{
    font-size: 18px;
  }
  .reportTemplate .body-box{
    background-color: white;
    height: 100%;
    width: 100%;
  }
  .report-body{
    width: 100%;
    text-align: left;
  }
  
  .report-body .report-item{
    width: 100%;
    margin-bottom: 10px;
    border:#9cc0ef solid 1px;
    padding: 5px
  }
  .report-item div{
    margin-bottom: 5px;
  }
  .report-item .report-item-title{
    font-size: 25px;
    font-weight: bold;
  }
  .report-item table{
    width: 100%;
  }
  .report-item tr{
    border: gray 1px solid;
    background: rgb(245, 245, 245);
  }
  .report-item th{
    background-color: #9cc0ef;
    color: white;
    font-size: 15px;
    padding: 4px 0;
    text-align: center;
  }
  .report-item td{
    font-size: 13px;
    padding: 4px 0;
    text-align: center;
  }
  .report-item-table-title,.report-item-chart-title{
    margin-top: 5px;
    width: 100%;
    text-align: center;
  }
  .report-item-chart-body{
    display: flex;
    align-items: center;
    justify-content: center;
  }
  </style>
  