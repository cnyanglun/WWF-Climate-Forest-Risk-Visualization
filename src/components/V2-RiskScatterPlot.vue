<template>
    <div class="view-container">
        <h3>V2: Habitat Degradation vs. Climate Risk Acceleration</h3>
        <div ref="chartRef" class="chart-area"></div>
        <div class="tooltip" ref="tooltipRef"></div>
    </div>
</template>

<script setup>
    import {ref, onMounted, watch, computed} from 'vue'
    import { useStore } from '@/stores/store';
    import * as d3 from 'd3'

    const store = useStore()
    const chartRef = ref(null)
    const tooltipRef = ref(null)


    // ============================================
    // ============================================ Process Data ============================================

    const scatterData = computed(() => {
        if (!store.forestData.length || !store.disasterData.length) return []
        const [startYear, endYear] = store.timeRange
        
        const midYear = Math.floor((startYear + endYear) / 2)
        const earlyYears = d3.range(startYear, midYear + 1).map(String)
        const lateYears = d3.range(midYear + 1, endYear + 1).map(String)
        
        const dataMap = new Map()

        // x axis: Carbon loss rate (which mean how many extent forest be destroy)
        store.forestData
            .filter(d => d.Indicator === 'Carbon stocks in forests')
            .forEach(d => {
                const valStart = +d[startYear]
                const valEnd = +d[endYear]
                if (valStart > 0) {
                    const lossRate = ((valStart - valEnd) / valStart) * 100
                    dataMap.set(d.ISO3, {
                        iso3: d.ISO3,
                        name: d.Country,
                        carbonLossRate: lossRate,
                        earlyAvgDisaster: 0,
                        lateAvgDisaster: 0
                    })
                }
            })

        // Y Axis: Disaster frequency rate (Which mean if the disaster more worse)
        store.disasterData
            .filter(d => d.Indicator.includes('TOTAL'))
            .forEach(d => {
                if (dataMap.has(d.ISO3)) {
                    const earlyAvg = d3.sum(earlyYears, y => +d[y] || 0) / earlyYears.length
                    const lateAvg = d3.sum(lateYears, y => +d[y] || 0) / lateYears.length
                    
                    const item = dataMap.get(d.ISO3)
                    
                    // 使用对称增长率公式，避免分母为 0 或过小
                    const denominator = (earlyAvg + lateAvg) / 2
                    
                    if (denominator > 0) {
                        item.disasterSymmetricGrowth = ((lateAvg - earlyAvg) / denominator) * 100
                    } else {
                        item.disasterSymmetricGrowth = 0
                    }
                }
            })

        // Filter: only show the country who change data
        return Array.from(dataMap.values()).filter(d => d.disasterSymmetricGrowth !== undefined)
    })



    // Test Data
    // console.log('scatterData: ', scatterData.value)

    // ============================================ Draw Chart ============================================
    let svg, g
     /** @type {d3.ScaleLinear<number, number>} */
    let xScale, yScale

    const margin = {top: 20, right:30, bottom: 30, left: 80}

    const initChart = () => {
        if(!chartRef.value) return

        const width = chartRef.value.clientWidth
        const height = chartRef.value.clientHeight

        // Clear Container
        d3.select(chartRef.value).selectAll('*').remove()
        svg = d3.select(chartRef.value)
            .append('svg')
            .attr('width', width)
            .attr('height', height)

        g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`)

        // Set Scale
        xScale = d3.scaleLinear()
        yScale = d3.scaleLinear()

        updateChart()
    }

    // ============================================

    const updateChart = () => {
        const data = scatterData.value
        if(!data.length) return

        // Calculate width and height
        const innerWidth = chartRef.value.clientWidth - margin.left - margin.right
        const innerHeight = chartRef.value.clientHeight - margin.top - margin.bottom

        // ============================================ Brush tool
        const brush = d3.brush()
            .extent([[0,0], [innerWidth, innerHeight]])
            .on("start brush end", brushed);
        
        // Create Brush Container
        const brushG = g.selectAll('.brush').data([null]).join('g')
            .attr('class', 'brush')
            .call(brush)

        function brushed(event) {
            const { selection } = event;
            
            if (selection) {
                // 1. Get the pixel range selected by the box
                const [[x0, y0], [x1, y1]] = selection;

                // 2. Look for which points are within the range
                const selected = data.filter(d => {
                const cx = xScale(d.carbonLossRate);
                const cy = yScale(d.disasterSymmetricGrowth);
                return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
                }).map(d => d.iso3);

                // 3. Only update the Store at the "end" stage to avoid it being too laggy when swiping
                if (event.type === "end") {
                store.setSelectedCountries(selected);
                }
                
                // 4. Highlight selected points
                g.selectAll(".dot")
                .attr("stroke", d => selected.includes(d.iso3) ? "#000" : "#fff")
                .attr("stroke-width", d => selected.includes(d.iso3) ? 2 : 1)
                .attr("opacity", d => selected.includes(d.iso3) ? 1 : 0.3);
                
            } else {
                // If the box is unselected (click on the blank area)
                if (event.type === "end") {
                    store.setSelectedCountries([]); // Clear
                }
                g.selectAll(".dot").attr("opacity", 0.6).attr("stroke", "#fff");
            }
        }

        // Update Scale
        // X axis show scale clearly， show the percentage
        xScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.carbonLossRate))
            .range([0, innerWidth]).nice()
        yScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.disasterSymmetricGrowth))
            .range([innerHeight, 0]).nice()



        // Draw X Axis
        g.selectAll('.x-axis').remove()
        g.append('g')
            .attr('class', 'x-axis')
            .attr('transform', `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale).tickArguments(5))
            .append('text')
            .attr('x', innerWidth)
            .attr('y', -10)
            .attr('fill', 'black')
            .attr('text-anchor', 'end')
            .style('font-weight', 'bold')
            .text('Annual Carbon Loss Rate (%)')



        // Draw Y Axis
        g.selectAll(".y-axis").remove();
        g.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("x", 10)
            .attr("y", 10)
            .attr("fill", "black")
            .attr("text-anchor", "start")
            .style("font-weight", "bold")
            .text("Disaster Frequency Growth (%)");


        // Dot line, in order to reference
        g.selectAll(".ref-line").remove();
        // X = 0 line of reference
        g.append("line").attr("class", "ref-line")
            .attr("x1", xScale(0)).attr("y1", 0).attr("x2", xScale(0)).attr("y2", innerHeight)
            .attr("stroke", "#ccc").attr("stroke-dasharray", "4");
        // Y = 0 line of reference
        g.append("line").attr("class", "ref-line")
            .attr("x1", 0).attr("y1", yScale(0)).attr("x2", innerWidth).attr("y2", yScale(0))
            .attr("stroke", "#ccc").attr("stroke-dasharray", "4");


        // Draw Scatter
        g.selectAll('.dot')
            .data(data, d => d.iso3)        // ISO3 is country id
            .join('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.carbonLossRate))
            .attr('cy', d => yScale(d.disasterSymmetricGrowth))
            .attr('r', 6)
            .attr('fill', '#e74c3c')
            .attr('opacity', 0.6)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .on('mouseover', (event, d) => {
                const content = `
                    <div style="font-weight:bold; border-bottom:1px solid #ddd; margin-bottom:5px;">
                        ${d.name} (${d.iso3})
                    </div>
                    <div style="color:${d.disasterSymmetricGrowth > 0 ? '#e74c3c' : '#27ae60'};">
                        <strong>Disaster Freq Rate:</strong> ${d.disasterSymmetricGrowth.toFixed(1)}%
                    </div>
                    <div style="color:${d.carbonLossRate > 0 ? '#e67e22' : '#2980b9'};">
                        <strong>Carbon Loss Rate:</strong> ${d.carbonLossRate.toFixed(2)}%
                    </div>
                    <div style="font-size:10px; color:#666; margin-top:5px;">
                        (Avg value)
                    </div>
                `;
                store.showTooltip(event.pageX + 10, event.pageY - 10, content)
            })
            .on('mousemove', event => {
                store.showTooltip(event.pageX + 10, event.pageY - 10, store.tooltip.content);
            })
            .on('mouseout', (event) => {
                store.hideTooltip()
            })

        // console.log('Draw Succefully')


    }

    // ============================================


    onMounted(() => {
        initChart()
    })

    // ============================================
    const watchData = [
        () => store.forestData,
        () => store.disasterData,
        () => store.timeRange
    ]
    const watchProcess = () => {
            // If it has already been initialized, then update
            if(svg) updateChart()
            else initChart()
    }

    watch(watchData, watchProcess, {deep: true})


    // Connect the update of selectedCountries, highlight dots when selected countries update
    watch(() => store.selectedCountries, (newSelected) => {
        if (!g) return;

        const dots = g.selectAll('.dot');

        // No selected countries, semitransparent
        if (newSelected.length === 0) {
            dots.transition()
                .duration(300)
                .attr('opacity', 0.6)
                .attr('stroke', '#fff')
                .attr('stroke-width', 1)
                .attr('r', 6);
        } else {
            // Highlight selected countries
            dots.transition()
                .duration(300)
                .attr('opacity', d => newSelected.includes(d.iso3) ? 1 : 0.1)
                .attr('stroke', d => newSelected.includes(d.iso3) ? "#000" : "#fff")
                .attr('stroke-width', d => newSelected.includes(d.iso3) ? 2.5 : 0.5)
                .attr('r', d => newSelected.includes(d.iso3) ? 9 : 5); // 选中点放大，增强视觉反馈

            // Move the selected dots to upper layer, avoid to be hidden
            dots.filter(d => newSelected.includes(d.iso3)).raise();
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
    .chart-area { flex: 1; position: relative; }
    h3 { margin: 5px; font-size: 1rem; text-align: center; }

    .dot {
    transition: all 0.3s;
    }
</style>
