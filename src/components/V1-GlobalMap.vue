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

    // 定义颜色比例尺，红色（减少/风险） -> 黄色 -> 绿色（增加）
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
        // 这里的键名必须与你 Console 打印的一致
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
    if(!store.isLoading && store.geoData) initMap();
  });

  // 监听 store 变化进行重绘
  // 1. 只有当时间范围或基础数据变化时，才全量重绘地图颜色（耗时操作）
  watch([
    () => store.timeRange, () => store.isLoading], 
    () => {
      if (!store.isLoading) updateMap();
    }, 
    { deep: true });

  // 2. 当仅仅是选中的国家变化时，只更新描边
  watch(() => store.selectedCountries, (newSelected) => {
    if (!g) return;

    // 获取所有国家路径的选择集
    const countries = g.selectAll('.country');

    // 【步骤 1】 立即将选中的国家置顶 (raise)，这样边框才不会被邻国遮挡
    // 我们先过滤出选中的元素，然后调用 raise
    countries
      .filter(d => {
        const iso3 = d.properties['ISO3166-1-Alpha-3'];
        return newSelected.includes(iso3);
      })
      .raise();

    // 【步骤 2】 执行平滑的描边动画
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

.country {
  transition: fill 0.2s, opacity 0.2s; /* 让颜色填充更丝滑 */
}

/* 鼠标悬停时的即时反馈 */
.country:hover {
  opacity: 0.8;
  filter: brightness(1.1);
  cursor: pointer;
}

/* 只有选中的国家路径会应用这个 CSS 效果（可选） */
.country-selected {
  filter: drop-shadow(0px 0px 2px rgba(0,0,0,0.5));
}
</style>