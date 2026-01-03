<template>
  <div class="view-container">
    <div class="header-row">
      <h3>V1: Global Risk Map</h3>
      <div class="legend-container" ref="legendRef"></div>
    </div>

    <div ref="chartRef" class="chart-area"></div>
    <div class="tooltip" ref="tooltipRef"></div>

  </div>
</template>

<script setup>
  import { ref, onMounted, watch, computed } from 'vue';
  import { useStore } from '@/stores/store.js';
  import * as d3 from 'd3';

  const store = useStore();
  const chartRef = ref(null);
  const tooltipRef = ref(null)
  const legendRef = ref(null)

  // 1. Prepare Data, 计算当前时间范围内的碳储量变化
  const countryMetrics = computed(() => {
    const [start, end] = store.timeRange
    const metrics = new Map()

    store.forestData.forEach(d => {
      const valStart = +d[start]
      const valEnd = +d[end]
      if(!isNaN(valStart) && !isNaN(valEnd)){
        metrics.set(d.ISO3, valEnd - valStart)      // end - start
      }
    })

    return metrics
  })

  // 2. Draw
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

    // 使用自然地球投影
    projection = d3.geoNaturalEarth1()
      .scale(width / 1.6 / Math.PI)
      .translate([width/2, height/2])
    
    path = d3.geoPath().projection(projection)

    // Draw Map
    updateMap()
  }


  const updateMap = () => {
    const metrics = countryMetrics.value
    const values = Array.from(metrics.values())

    const minValue = d3.min(values);
    const maxValue = d3.max(values);

    // 定义颜色比例尺，红色（减少/风险） -> 黄色 -> 绿色（增加）
    const colorScale = d3.scaleDiverging()
      .domain([minValue, 0, maxValue])
      .interpolator(d3.interpolateRdYlGn)

    const conutries = g.selectAll('.country')
      .data(store.geoData.features)
      .join('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('fill', d => {
        const iso3 = d.id || d.properties.ISO_A3
        const val = metrics.get(iso3)
        return val !== undefined ? colorScale(val) : '#eee' // 没有定义的显示灰色
      })
      .attr('stroke', d => {
        const iso3 = d.id || d.properties.ISO_A3
        const val = metrics.get(iso3)
        return store.selectedCountries.includes(iso3) ? "#333" : "#fff";
      })
      .attr("stroke-width", d => {
        const iso3 = d.id || d.properties.ISO_A3;
        return store.selectedCountries.includes(iso3) ? 2 : 0.5;
      })
      .on('click', (event, d) => {
        const iso3 = d.id || d.properties.ISO_A3;
        store.toggleCountry(iso3); // 触发联动
      })
      .on('mouseover', (event, d) => {
        const iso3 = d.id || d.properties.ISO_A3;
        const val = metrics.get(iso3);
        const name = d.properties.NAME || iso3;
      
        d3.select(tooltipRef.value)
        .style("opacity", 1)
        .html(`
          <strong>${name}</strong><br/>
          Δ Carbon: ${val ? val.toFixed(2) : 'No Data'} MT
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
      })
      .on('mouseout', () => {
        d3.select(tooltipRef.value).style('opacity', 0)
      })

      drawLegend(colorScale)
  }


  // 绘制简单的颜色图例
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
    // 基础 D3 初始化逻辑将在这里编写
    console.log("Map component mounted");
    if (store.geoData) initMap();
  });

  // 监听 store 变化进行重绘
  watch([() => store.isLoading, () => store.timeRange, () => store.selectedCountries], () => {
    if (!store.isLoading) {
      if (!svg) initMap();
      else updateMap();
    }
  }, { deep: true });
</script>

<style scoped>
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

.chart-area { 
  flex: 1; 
  position: relative; 
  cursor: crosshair;
  background: #fff;
}

.country {
  transition: opacity 0.2s;
}

.country:hover {
  opacity: 0.8;
}

.tooltip {
  position: absolute;
  background: rgba(255, 255, 255, 0.95);
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  pointer-events: none;
  opacity: 0;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  z-index: 1000;
}

.legend-container {
  font-size: 10px;
}
</style>