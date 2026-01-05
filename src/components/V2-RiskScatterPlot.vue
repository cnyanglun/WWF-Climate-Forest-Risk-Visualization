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
                // 1. 获取框选的像素范围
                const [[x0, y0], [x1, y1]] = selection;

                // 2. 寻找哪些点在范围内
                const selected = data.filter(d => {
                const cx = xScale(d.deltaCarbon);
                const cy = yScale(d.totalDisasters);
                return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
                }).map(d => d.iso3);

                // 3. 只有在 "end" 阶段才更新 Store，避免滑动时太卡
                if (event.type === "end") {
                store.setSelectedCountries(selected);
                }
                
                // 4. 视觉反馈：即时高亮当前选中的点
                g.selectAll(".dot")
                .attr("stroke", d => selected.includes(d.iso3) ? "#000" : "#fff")
                .attr("stroke-width", d => selected.includes(d.iso3) ? 2 : 1)
                .attr("opacity", d => selected.includes(d.iso3) ? 1 : 0.3);
                
            } else {
                // 如果取消框选（点击空白处）
                if (event.type === "end") {
                store.setSelectedCountries([]); // 清空
                }
                g.selectAll(".dot").attr("opacity", 0.6).attr("stroke", "#fff");
            }
        }

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
            .on('mouseover', (event, d) => {
                const content = `
                        <div style="font-weight:bold">${d.name} (${d.iso3})</div>
                        <div style="color:#e74c3c">灾害总数: ${d.totalDisasters}</div>
                        <div style="color:#27ae60">碳储量变化: ${d.deltaCarbon.toFixed(2)} MT</div>
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
