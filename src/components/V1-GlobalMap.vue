<template>
  <div class="view-container">
    <div class="header-row">
      <h3>V1: Global Carbon Sink Risk</h3>
      <div class="legend-container" ref="legendRef"></div>

      <!-- <div class="controls">
        <button @click="resetZoom" class="reset-btn">Reset View</button>
        <div class="legend-container" ref="legendRef"></div>
      </div> -->
    </div>

    <div ref="chartRef" class="chart-area"></div>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch, computed } from 'vue';
  import { useStore } from '@/stores/store.js';
  import * as d3 from 'd3';

  const store = useStore();
  const chartRef = ref(null)
  const legendRef = ref(null)

  // ============================================ Process Data ============================================
  // Calculate the change in carbon storage within the current time range
  const countryMetrics = computed(() => {
    const [start, end] = store.timeRange
    const metrics = new Map()

    store.forestData
      .filter(d => d.Indicator === 'Carbon stocks in forests')
      .forEach(d => {
        const valStart = +d[start]
        const valEnd = +d[end]
        if(!isNaN(valStart) && !isNaN(valEnd)){
          metrics.set(d.ISO3, valEnd - valStart)      // end - start
        }
      })

    return metrics
  })

  // ============================================ Process Data ============================================
  let svg, g, projection, path

  const initMap = () => {
    if(!store.geoData || !chartRef.value) return

    const width = chartRef.value.clientWidth
    const height = chartRef.value.clientHeight

    // clear current content
    d3.select(chartRef.value).selectAll('*').remove()

    svg = d3.select(chartRef.value)
      .append('svg')
      .attr('width', width)
      .attr('height', height)


    g = svg.append('g')

    const zoom = d3.zoom()
      .scaleExtent([1,8])   // max 8 times， min 1 time
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      })

    // 使用缩放器
    svg.call(zoom)

    // Use the natural Earth projection
    projection = d3.geoNaturalEarth1()
      .fitSize([width, height], store.geoData);
    
    path = d3.geoPath().projection(projection)

    // Draw Map
    updateMap()
  }


  const updateMap = () => {
    const metrics = countryMetrics.value
    const values = Array.from(metrics.values())

    const minValue = d3.min(values);
    const maxValue = d3.max(values);

    // Define the color scale, red (decrease/risk) -> yellow -> green (increase)
    const colorScale = d3.scaleDiverging()
      .domain([minValue, 0, maxValue])
      .interpolator(d3.interpolateRdYlGn)

    // In GeoJson，country is ISO3166-1-Alpha-3 instead of ISO3
    const conutries = g.selectAll('.country')
      .data(store.geoData.features)
      .join('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('fill', d => {
        // The key names here must be consistent with those printed in your Console
        const iso3 = d.properties['ISO3166-1-Alpha-3']; 
        const val = metrics.get(iso3);
        return val !== undefined ? colorScale(val) : '#eee';
      })
      .attr('stroke', d => {
        const iso3 = d.properties['ISO3166-1-Alpha-3'];
        return store.selectedCountries.includes(iso3) ? "#000" : "#fff";
      })
      .attr("stroke-width", d => {
        const iso3 = d.properties['ISO3166-1-Alpha-3'];
        return store.selectedCountries.includes(iso3) ? 2 : 0.5;
      })
      .on('click', (event, d) => {
        const iso3 = d.properties['ISO3166-1-Alpha-3'];
        console.log("Confirmed ISO3:", iso3); 
        if (iso3) store.toggleCountry(iso3);
      })

      .on('mouseover', (event, d) => {
        // 1. Country ID, IOS
        const iso3 = d.properties['ISO3166-1-Alpha-3'];
        // 2. Country name
        const countryName = d.properties.name || d.properties.NAME || iso3;
        // 3. Obtain the corresponding carbon storage change value from the calculated attribute
        const val = metrics.get(iso3);
      
        const content = `
          <div style="font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 5px;">
            ${countryName}
          </div>
          <div style="color: ${val < 0 ? '#e74c3c' : '#27ae60'}">
            Δ Carbon: ${val !== undefined ? val.toFixed(2) + ' MT' : 'No Data'}
          </div>
        `
        store.showTooltip(event.pageX + 15, event.pageY - 15, content)
      })
      .on('mousemove', () => {
        // Update the location in real time and keep the content unchanged
        store.showTooltip(event.pageX + 15, event.pageY - 15, store.tooltip.content);
      })
      .on('mouseout', () => {
        store.hideTooltip()
      })

      drawLegend(colorScale)
  }


  // Draw simple color legends
  const drawLegend = (colorScale) => {
    const legendWidth = 200;
    const legendHeight = 10;
    d3.select(legendRef.value).selectAll("*").remove();
    
    const canvas = d3.select(legendRef.value)
      .append("canvas")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .node();

    const ctx = canvas.getContext("2d");
    for (let i = 0; i < legendWidth; ++i) {
      ctx.fillStyle = colorScale(colorScale.domain()[0] + (i / legendWidth) * (colorScale.domain()[2] - colorScale.domain()[0]));
      ctx.fillRect(i, 0, 1, legendHeight);
    }
  };






  onMounted(() => {
    // Active when add into App.vue
    console.log("Map component mounted");
    if(!store.isLoading && store.geoData) initMap();
  });

  // Only watch time and basic data change
  watch([
    () => store.timeRange, () => store.isLoading], 
    () => {
      if (!store.isLoading) updateMap();
    }, 
    { deep: true });

  // When only the selected country changes, only update the stroke
  watch(() => store.selectedCountries, (newSelected) => {
    if (!g) return;

    // Get all countries' path 
    const countries = g.selectAll('.country');

    // Place the selected country layer at the top to prevent its bold border from being blocked by adjacent countries
    countries
      .filter(d => {
        const iso3 = d.properties['ISO3166-1-Alpha-3'];
        return newSelected.includes(iso3);
      })
      .raise();

    // Highlight feedback by changing the border color and width through smooth transition animations
    countries
      .transition()
      .duration(300)
      .attr('stroke', d => {
        const iso3 = d.properties['ISO3166-1-Alpha-3'];
        return newSelected.includes(iso3) ? "#000" : "#fff";
      })
      .attr('stroke-width', d => {
        const iso3 = d.properties['ISO3166-1-Alpha-3'];
        return newSelected.includes(iso3) ? 2.5 : 0.5;
      });
  }, { deep: true });


</script>

<style scoped>
  /* --- Layout & Container Scaling --- */
  .view-container { 
    width: 100%; 
    height: 100%; 
    display: flex; 
    flex-direction: column; 
    padding: 10px;
    box-sizing: border-box;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
  }

  /* --- D3 Drawing Area --- */
  .chart-area { 
    flex: 1; 
    position: relative; 
    cursor: crosshair;
    background: #fff;
  }

  /* --- Map Path & Interaction States --- */
  .country {
    transition: fill 0.2s, opacity 0.2s;
  }

  .country:hover {
    opacity: 0.8;
    filter: brightness(1.1);
    cursor: pointer;
  }

  /* --- Components: Legend & Selections --- */
  .legend-container {
    font-size: 10px;
  }

  /* Optional: visual effect for selected country paths */
  .country-selected {
    filter: drop-shadow(0px 0px 2px rgba(0,0,0,0.5));
  }

  .country {
    transition: fill 0.2s, opacity 0.2s;
    /* Make sure the border line not change even zoom in */
    vector-effect: non-scaling-stroke;
  }

  /* 使用 :deep 穿透，确保动态生成的 D3 元素能应用样式 */
  .chart-area :deep(.country) {
    transition: fill 0.2s, opacity 0.2s;
    vector-effect: non-scaling-stroke; /* 关键：缩放时线宽固定 */
  }

  .chart-area :deep(.country:hover) {
    opacity: 0.8;
    filter: brightness(1.1);
    cursor: pointer;
  }

  
</style>