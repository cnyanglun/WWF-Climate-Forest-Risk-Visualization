<template>
    <div class="view-container">
        <h3>V2: Risk Analysis (Disasters vs. Carbon Change)</h3>
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
        if (!store.forestData || !store.disasterData ) return []

        const [startYear, endYear] = store.timeRange

        // 真实交互数据
        // const years = d3.range(startYear, endYear+1).map(String)
        // 测试数据
        const years = d3.range(1998, 2015).map(String)


        const dataMap = new Map()

        // 1. 提取每个国家的碳储量变化
        store.forestData.forEach(d => {
            const valStart = +d[startYear]
            const valEnd = +d[endYear]

            if(valStart != null && valEnd != null) {
                // ISO3 代表国家代号
                dataMap.set(d.ISO3, {
                    iso3: d.ISO3,
                    name: d.Country,
                    deltaCarbon: valEnd - valStart,
                    totalDisasters: 0,                          // init count, set the value later
                })
            }
        })

        // 2. 处理灾害数据，重要的参数是TOTAL，只选择这个
        const totalDisasterRows = store.disasterData.filter(d => 
            d.Indicator.includes('Number of Disasters: TOTAL')
        )

        totalDisasterRows.forEach(d => {
            // 只处理在森林数据集中也存在的国家
            if(dataMap.has(d.ISO3)){
                let sum = 0
                // 累加选定年份段内所有灾害次数
                years.forEach(y => { sum += (d[y] || 0) })
                dataMap.get(d.ISO3).totalDisasters = sum
            }
        })

        // 将Map转换为数组给D3使用
        // 直接将所有的values存到数组中，方便后续处理
        return Array.from(dataMap.values())
    })
    // Test Data
    // console.log('scatterData: ', scatterData.value)

    // ============================================ Draw Chart ============================================
    let svg, g
     /** @type {d3.ScaleLinear<number, number>} */
    let xScale, yScale

    const margin = {top: 20, right:30, bottom: 30, left: 60}

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

        // 绘制比例尺
        xScale = d3.scaleLinear()
        yScale = d3.scaleLinear()

        updateChart()
    }

    // ============================================

    const updateChart = () => {
        const data = scatterData.value
        if(!data.length) return

        // 计算实际绘图区的宽高
        const innerWidth = chartRef.value.clientWidth - margin.left - margin.right
        const innerHeight = chartRef.value.clientHeight - margin.top - margin.bottom

        // 更新比例尺
        xScale.domain(d3.extent(data, d => d.deltaCarbon)).range([0, innerWidth]).nice()
        yScale.domain([0, d3.max(data, d => d.totalDisasters)]).range([innerHeight, 0]).nice()

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
            .text('Δ 碳储量 (百万吨)')



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
            .text("灾害总频率");


        // Draw Scatter
        g.selectAll('.dot')
            .data(data, d => d.iso3)        // 使用ISO3作为唯一标识符（key）
            .join('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.deltaCarbon))
            .attr('cy', d => yScale(d.totalDisasters))
            .attr('r', 6)
            .attr('fill', '#e74c3c')
            .attr('opacity', 0.6)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)

        // console.log('Draw Succefully')
    }

    // ============================================


    onMounted(() => {
        initChart()
    })

    // ============================================
    // 监控的数据
    const watchData = [
        () => store.forestData,
        () => store.disasterData,
        () => store.timeRange
    ]
    // 数据变化后的操作
    const watchProcess = () => {
            // 如果已经初始化了，那么更新
            if(svg) updateChart()
            else initChart()
    }

    watch(watchData, watchProcess, {deep: true})


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
