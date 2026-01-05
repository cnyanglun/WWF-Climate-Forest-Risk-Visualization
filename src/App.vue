<template>
  <div id="app">
    <div v-if="store.isLoading" class="loading-overlay">Loading Data...</div>

    <div v-else class="dashboard-container">
      <header class="dashboard-header">
        <h1>WWF Climate & Forest Risk Dashboard</h1>
      </header>

      <main class="dashboard-content">
        <section class="view-v1">
          <GlobalMap/>
        </section>

        <section class="view-v2">
          <RiskScatterPlot/>
        </section>

        <section class="view-v3">
          <TimeSeriesChart/>
        </section>

        <section class="view-v4">
          <DisasterComposition/>
        </section>


        <div 
          v-show="store.tooltip.show"
          class="global-tooltip"
          :style="{ left: store.tooltip.x + 'px', top: store.tooltip.y + 'px' }"
          v-html="store.tooltip.content"
        ></div>

      </main>


    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useStore } from '@/stores/store.js';

// Initialize store
const store = useStore();

// Import components
import GlobalMap from '@/components/V1-GlobalMap.vue'
import RiskScatterPlot from '@/components/V2-RiskScatterPlot.vue'
import TimeSeriesChart from '@/components/V3-TimeSeriesChart.vue'
import DisasterComposition from '@/components/V4-DisasterComposition.vue'


// Load data when component is mounted
onMounted(() => {
  store.loadData();
});
</script>


<style>
  /* 核心：强制全屏且无滚动条 */
  html, body, #app {
    margin: 0;
    padding: 0;
    height: 100vh;
    width: 100vw;
    overflow: hidden; /* A5 准则：禁止滚动 */
    font-family: sans-serif;
  }

  .dashboard-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 15px; /* 稍微增加内边距更美观 */
    box-sizing: border-box;
    background-color: #f5f5f5;
  }

  .dashboard-header {
    height: 50px; /* 固定标题高度 */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 4视图均等布局设计 (2x2 田字格) */
  .dashboard-content {
    flex: 1;
    display: grid;
    /* 改为 1fr 1fr 实现等分列宽 */
    grid-template-columns: 1fr 1fr; 
    /* 改为 1fr 1fr 实现等分行高 */
    grid-template-rows: 1fr 1fr; 
    grid-gap: 20px; /* 增加间距增加呼吸感 */
    overflow: hidden;
  }

  /* 移除所有的 span 跨度，让它们各自占据一个格子 */
  .view-v1, .view-v2, .view-v3, .view-v4 {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08); /* 稍微增强阴影让卡片感更强 */
    display: flex;
    flex-direction: column;
    overflow: hidden; /* 确保图表不溢出容器 */
  }

  .loading-overlay {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 2rem;
  }

  .global-tooltip {
    position: fixed;
    pointer-events: none; /* 必须 */
    background: rgba(255, 255, 255, 0.95);
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 12px;
  }
</style>