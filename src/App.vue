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
  /* --- Core Layout: Enforce full-screen and disable scrolling (A5 Compliance) --- */
  html, body, #app {
    margin: 0;
    padding: 0;
    height: 100vh;
    width: 100vw;
    overflow: hidden; /* Guideline: Prohibit scrolling for Dashboard-style applications */
    font-family: sans-serif;
  }

  /* --- Main Container: Flexbox structure for header and content separation --- */
  .dashboard-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 15px; /* Added padding for improved aesthetic balance */
    box-sizing: border-box;
    background-color: #f5f5f5;
  }

  /* --- Header: Fixed height for consistent vertical alignment --- */
  .dashboard-header {
    height: 50px; /* Fixed height for title section */
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* --- Dashboard Grid: 2x2 Quadrant Layout (View Management) --- */
  .dashboard-content {
    flex: 1;
    display: grid;
    /* Equal distribution for 2 columns */
    grid-template-columns: 1fr 1fr; 
    /* Equal distribution for 2 rows */
    grid-template-rows: 1fr 1fr; 
    grid-gap: 20px; /* Increased spacing to improve visual breathing room */
    overflow: hidden;
  }

  /* --- View Containers: Card-style design with shadow effects --- */
  .view-v1, .view-v2, .view-v3, .view-v4 {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0,0,0,0.08); /* Enhanced shadow for depth perception */
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Ensure D3 charts do not overflow container boundaries */
  }

  /* --- Feedback: Full-screen loading state overlay --- */
  .loading-overlay {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 2rem;
  }

  /* --- Interactivity: Fixed-position global tooltip (Contextual Details) --- */
  .global-tooltip {
    position: fixed;
    pointer-events: none; /* Crucial: Prevent tooltip from interfering with mouse events */
    background: rgba(255, 255, 255, 0.95);
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 12px;
  }
</style>