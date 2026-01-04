<template>
    <div class="view-container">
        <div class="header-row">
            <h3>V3: 趋势关联分析 (时间序列)</h3>
            <div class="controls">
                <label class="checkbox-label">
                    <input type="checkbox" v-model="showCarbon"> 
                    <span style="color: #2ecc71; font-weight: bold;">—</span> Carbon Stock
                </label>
                <label class="checkbox-label">
                    <input type="checkbox" v-model="showDisaster"> 
                    <span style="color: #e74c3c; font-weight: bold;">- -</span> Disaster Count
                </label>
            </div>
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

    // 新增显隐控制状态
    const showCarbon = ref(true);
    const showDisaster = ref(true);

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


        g.selectAll(".line-carbon").remove();
        g.selectAll(".line-disaster").remove();
        g.selectAll(".axis").remove();

        g.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format("d")));


        // ============================================ 绘制两种线

        if (showCarbon.value) {
            const allCarbonValues = data.flatMap(d => d.carbon.map(v => v.value));
            const yScaleCarbon = d3.scaleLinear()
                .domain([d3.min(allCarbonValues) * 0.95, d3.max(allCarbonValues) * 1.05])
                .range([height, 0]);

            g.append("g")
                .attr("class", "axis y-axis-left")
                .call(d3.axisLeft(yScaleCarbon))
                .append("text").attr("fill", "green").attr("y", -10).text("Carbon (MT)");

            const lineGenCarbon = d3.line().x(d => xScale(d.year)).y(d => yScaleCarbon(d.value));

            // 绘制 Carbon 线
            g.selectAll(".line-carbon")
                .data(data)
                .join("path")
                .attr("class", "line-carbon")
                .attr("d", d => lineGenCarbon(d.carbon))
                .attr("fill", "none")
                .attr("stroke", '#2ecc71')
                .attr("stroke-width", 2);
        }

        if (showDisaster.value) {
            const allDisasterValues = data.flatMap(d => d.disasters ? d.disasters.map(v => v.value) : [0]);
            const yScaleDisaster = d3.scaleLinear()
                .domain([0, d3.max(allDisasterValues) || 10])
                .range([height, 0]);

            g.append("g")
                .attr("class", "axis y-axis-right")
                .attr("transform", `translate(${width}, 0)`)
                .call(d3.axisRight(yScaleDisaster))
                .append("text").attr("fill", "red").attr("y", -10).text("Disasters");

            const lineGenDisaster = d3.line().x(d => xScale(d.year)).y(d => yScaleDisaster(d.value));

            // 绘制 Disaster 线 (虚线)
            g.selectAll(".line-disaster")
                .data(data.filter(d => d.disasters))
                .join("path")
                .attr("class", "line-disaster")
                .attr("d", d => lineGenDisaster(d.disasters))
                .attr("fill", "none")
                .attr("stroke", '#e74c3c')
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4,2");
        }



        // ============================================ Brushing Tool
        const brush = d3.brushX()
            .extent([[0, 0], [width, height]])
            .on("brush", (event) => {
                // 【优化 1】仅在 V3 内部提供即时反馈（可选）
                // 如果你希望拖动时 V3 的线变色或者有个预览效果，写在这里
            })
            .on("end", (event) => {
                // 【优化 2】只有用户松开鼠标，且确实有选区变化时才更新全局状态
                if (!event.sourceEvent) return; // 忽略由程序触发的事件
                
                if (event.selection) {
                    const [x0, x1] = event.selection.map(xScale.invert);
                    const roundedRange = [Math.round(x0), Math.round(x1)];
                    
                    // 确保年份有效且发生了变化
                    if (roundedRange[0] !== store.timeRange[0] || roundedRange[1] !== store.timeRange[1]) {
                        // 只有年份跨度大于 0 才更新，防止点选（click）导致的错误
                        if (roundedRange[1] > roundedRange[0]) {
                            store.updateTimeRange(roundedRange);
                        }
                    }
                } else {
                    // 如果用户双击背景取消选区，恢复默认范围
                    store.updateTimeRange([1992, 2023]);
                }
            });

        // 创建或选择 brush 容器
        const brushG = g.selectAll(".brush-container")
            .data([null])
            .join("g")
            .attr("class", "brush-container")
            .call(brush);

        // 默认设置初始位置（可选：根据 store.timeRange 反向绘制矩形）
        if (store.timeRange) {
            brushG.call(brush.move, [xScale(store.timeRange[0]), xScale(store.timeRange[1])]);
        }

        
        
    }



    onMounted(() => {
        initChart()
    });


    // 监听选中国家及数据变化
    watch(
        [
            () => store.selectedCountries, 
            () => store.isLoading, 
            () => store.timeRange,
            showCarbon, // 新增监听
            showDisaster // 新增监听
        ], 
        () => {
            if (!store.isLoading) {
                if (!svg) initChart();
                else updateChart();
            }
        }, 
        { deep: true }
    );


</script>

<style scoped>
.view-container { 
  width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; 
}
.header-row {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
}
.controls {
  display: flex; gap: 15px; font-size: 0.85rem;
}
.checkbox-label {
  display: flex; align-items: center; gap: 5px; cursor: pointer;
}
.chart-area { flex: 1; position: relative; }
h3 { margin: 0; font-size: 1rem; }


:deep(.selection) {
    fill: #3498db;
    fill-opacity: 0.1;
    stroke: #2980b9;
    stroke-dasharray: 4;
}

:deep(.handle) {
    fill: #2980b9;
}
</style>