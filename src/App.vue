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

        </section>

        <section class="view-v3">

        </section>

        <section class="view-v4">

        </section>

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
    overflow: hidden; /* 禁止滚动 */
    font-family: sans-serif;
  }

  .dashboard-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 10px;
    box-sizing: border-box;
    background-color: #f5f5f5;
  }

  .dashboard-header {
    height: 60px;
    text-align: center;
  }

  /* 4视图布局设计 */
  .dashboard-content {
    flex: 1;
    display: grid;
    grid-template-columns: 1.2fr 1fr; /* 左边地图宽一点 */
    grid-template-rows: 1fr 1fr 0.8fr; /* 底部折线图稍微窄一点 */
    grid-gap: 15px;
    overflow: hidden;
  }

  .view-v1 {
    grid-row: span 2; /* 地图跨两行 */
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }

  .view-v2, .view-v4, .view-v3 {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }

  .view-v3 {
    grid-column: span 2; /* 折线图跨两列 */
  }

  .loading-overlay {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 2rem;
  }
</style>
