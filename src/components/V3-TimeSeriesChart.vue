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
        const result = []

        // 方便测试，我们只处理第一个选中的国家
        // const targetISO = store.selectedCountries[0]
        // 优先使用用户选中的，没有则默认显示 ARM
        // 注意有些国家并没有Carbon stocks in forests这个指标，比如AFG
        const targetISO = (store.selectedCountries[0] || 'ARM').trim();

        // 提取森林碳储量趋势数据
        const forestRow = store.forestData.find(d => d.ISO3 === targetISO)
        const carbonValues = years.map(y => ({
            year: y,
            value: (forestRow && forestRow[y]) ? +forestRow[y] : 0,
            type: 'Carbon Stock'
        }));
        result.push({ type: 'Carbon', values: carbonValues });
        // console.log('result: ', result)

        // 提取灾难频率趋势数据（Indicator包括TOTAL）
        const disasterRow = store.disasterData.find(d => 
            d.ISO3 === targetISO && d.Indicator.includes('TOTAL')
        )

        if(disasterRow) {
            const values = years.map(y => ({
                year: y,
                value: +disasterRow[y] || 0,
                type: 'Disasters'
            }))
            result.push({type: 'Disasters', values})
        }

        // console.log('result: ', result)

        return result
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

        const yScaleCarbon = d3.scaleLinear()
            .domain([d3.min(data[0].values, d => d.value) * 0.95, d3.max(data[0].values, d => d.value) * 1.05])
            .range([height, 0]);

        const yScaleDisaster = d3.scaleLinear()
            .domain([0, d3.max(data[1]?.values || [], d => d.value) || 10])
            .range([height, 0]);


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

        // 绘制碳储量线
        g.append("path")
            .datum(data[0].values)
            .attr("class", "line carbon-line")
            .attr("d", lineGenCarbon)
            .attr("fill", "none")
            .attr("stroke", "green")
            .attr("stroke-width", 2);


        // 灾难数量 Disasters
        // 没有显示，这里的数据有问题
        if (data[1]) {
            g.append("path")
            .datum(data[1].values)
            .attr("class", "line disaster-line")
            .attr("d", lineGenDisaster)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2);
        }else{
            console.log('没有disaster')
        }

        
        
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