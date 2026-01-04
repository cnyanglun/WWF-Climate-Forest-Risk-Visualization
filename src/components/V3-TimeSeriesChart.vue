<template>
    <div class="view-container">
        <div class="header-row">
            <h3>V3: 趋势关联分析 (时间序列)</h3>
        </div>
        <div ref="chartRef" class="chart-area"></div>
    </div>
</template>

<script setup>
    // ============================================
    import { ref, onMounted, watch, computed } from 'vue'
    import { useStore } from '@/stores/store'
    import * as d3 from 'd3'

    const store = useStore()
    const chartRef = ref(null)

    // ============================================ Process Data ============================================
    // 将宽格式转换为折线图所需要的长格式
    const lineData = computed(() => {
        // 守卫：如果数据还没准备好，直接返回空，避免报错
        if (!store.forestData.length || !store.disasterData.length) return [];

        const years = d3.range(1992, 2023)

        return store.selectedCountries.map(iso => {
            const targetISO = iso.trim();
            const countryResult = { iso: targetISO, carbon: null, disasters: null };

            // 1. 提取碳储量
            const forestRow = store.forestData.find(d => d.ISO3 === targetISO);
            countryResult.carbon = years.map(y => ({
                year: y,
                value: (forestRow && forestRow[y]) ? +forestRow[y] : 0
            }));

            // 2. 提取灾难总数
            const disasterRow = store.disasterData.find(d => 
                d.ISO3 === targetISO && d.Indicator.includes('TOTAL')
            );
            if (disasterRow) {
                countryResult.disasters = years.map(y => ({
                    year: y,
                    value: +disasterRow[y] || 0
                }));
            }
            
            return countryResult;
        });
    })

    // console.log('11111111')
    // console.log(lineData.value)


    // ============================================ Process Data ============================================
    let svg, g
    const margin = {top: 20, right: 50, bottom: 30, left: 50}

    const initChart = () => {
        if(!chartRef.value) return

        const width = chartRef.value.clientWidth
        const height = chartRef.value.clientHeight

        d3.select(chartRef.value).selectAll('*').remove()

        svg = d3.select(chartRef.value)
            .append('svg')
            .attr('width', width)
            .attr('height', height)

        g = svg.append('g')
            .attr("transform", `translate(${margin.left},${margin.top})`);

        updateChart()
    }

    const updateChart = () => {
        const data = lineData.value;
        if(data.length === 0) return 

        const width = chartRef.value.clientWidth - margin.left - margin.right;
        const height = chartRef.value.clientHeight - margin.top - margin.bottom;

        const xScale = d3.scaleLinear()
            .domain([1992, 2023])
            .range([0, width])

            
        // 获取所有选中数据中的 Carbon 最大/最小值
        const allCarbonValues = data.flatMap(d => d.carbon.map(v => v.value));
        const yScaleCarbon = d3.scaleLinear()
            .domain([d3.min(allCarbonValues) * 0.95, d3.max(allCarbonValues) * 1.05])
            .range([height, 0]);

        // 获取所有选中数据中的 Disaster 最大值
        const allDisasterValues = data.flatMap(d => d.disasters ? d.disasters.map(v => v.value) : [0]);
        const yScaleDisaster = d3.scaleLinear()
            .domain([0, d3.max(allDisasterValues) || 10])
            .range([height, 0]);

        // 颜色比例尺，每个国家一个颜色
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(store.selectedCountries);


        g.selectAll(".axis").remove();

        g.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format("d")));

        g.append("g")
            .attr("class", "axis y-axis-left")
            .call(d3.axisLeft(yScaleCarbon))
            .append("text")
            .attr("fill", "green")
            .attr("y", -10)
            .text("Carbon (MT)");

        g.append("g")
            .attr("class", "axis y-axis-right")
            .attr("transform", `translate(${width}, 0)`)
            .call(d3.axisRight(yScaleDisaster))
            .append("text")
            .attr("fill", "red")
            .attr("y", -10)
            .text("Disasters");


        // 折线生成器
        const lineGenCarbon = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScaleCarbon(d.value));

        const lineGenDisaster = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScaleDisaster(d.value));

        // 绘制折线
        g.selectAll(".line").remove();

        // 为每个国家绘制一个容器
        const countryGroups = g.selectAll('.line-group')
            .data(data)
            .join('g')
            .attr('class', 'line-group')

        // 绘制 Carbon 线 (实线)
        countryGroups.append("path")
            .attr("d", d => lineGenCarbon(d.carbon))
            .attr("fill", "none")
            .attr("stroke", d => colorScale(d.iso))
            .attr("stroke-width", 2);

        // 绘制 Disaster 线 (虚线，用于区分)
        countryGroups.filter(d => d.disasters)
            .append("path")
            .attr("d", d => lineGenDisaster(d.disasters))
            .attr("fill", "none")
            .attr("stroke", d => colorScale(d.iso))
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,2");

        
        
    }



    onMounted(() => {
        initChart()
    });


    // 监听选中国家及数据变化
    watch([() => store.selectedCountries, () => store.isLoading], () => {
    if (!store.isLoading) {
        if (!svg) initChart();
        else updateChart();
    }
    }, { deep: true });


</script>

<style>
    .view-container { 
    width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; 
    }
    .chart-area { flex: 1; position: relative; }
    h3 { margin: 5px; font-size: 1rem; text-align: center; }
    .line { transition: all 0.3s ease; }
</style>