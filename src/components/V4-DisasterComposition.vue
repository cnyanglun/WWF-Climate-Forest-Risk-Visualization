<template>
    <div class="view-container">
        <div class="header-row">
            <h3>V4: Disaster Type Distribution</h3>
        </div>
        <div ref="chartRef" class="chart-area"></div>
    </div>
</template>

<script setup>
    // ============================================
    import { ref, onMounted, watch, computed } from 'vue'
    import { useStore } from '@/stores/store';
    import * as d3 from 'd3'

    const store = useStore()
    const chartRef = ref(null)

    // ============================================ Data Process ============================================
    /**
     * Return Data Structure
     * {
     *   data: Array<Object>,
     *   keys: Array<string>
     * }
     * 
     * keys = [
        "Drought",
        "Extreme temperature",
        "Flood",
        "Landslide",
        "Storm",
        "Wildfire"
        ]
        data = [
            {
                iso: "CHN",
                Drought: 12,
                "Extreme temperature": 5,
                Flood: 20,
                Landslide: 3,
                Storm: 15,
                Wildfire: 2
            },
            {
                iso: "USA",
                Drought: 8,
                "Extreme temperature": 10,
                Flood: 18,
                Landslide: 1,
                Storm: 22,
                Wildfire: 7
            },
            ....
        ]
     */
    const stackedData = computed(() => {
        if (!store.selectedCountries.length || !store.disasterData.length) return []

        const [startYear, endYear] = store.timeRange
        const years = d3.range(startYear, endYear+1).map(String)

        // Disaster Type
        const disasterTypes = ["Drought", "Extreme temperature", "Flood", "Landslide", "Storm", "Wildfire"];

        // Each Country has a record
        const result = store.selectedCountries.map(iso3 => {
            const countryRow = store.forestData.find(d => d.ISO3 === iso3 && d.Indicator === 'Carbon stocks in forests');
            const countryName = countryRow ? countryRow.Country : iso3;

            const entry = {iso: iso3, name: countryName}

            disasterTypes.forEach(type => {
            // Search for the corresponding row in the dataset: 
            // matching the ISO3 of the country and the indicator containing this type of disaster
            const row = store.disasterData.find(d => 
                d.ISO3.trim() === iso3 && 
                d.Indicator.includes(`Number of Disasters: ${type}`)
            );
            
            // Total disaster count
            let sum = 0;
            if (row) {
                years.forEach(y => { sum += (+row[y] || 0); });
            }
            entry[type] = sum;
            });

            return entry
        })

        return {data: result, keys: disasterTypes}
    })

    // console.log('stackedData: ', stackedData.value)

    // ============================================ Draw Chart ============================================
    let svg, g
    const margin = {top:20, bottom: 40, right: 30, left:50}

    const initChart = () => {
        if (!chartRef.value) return;

        const width = chartRef.value.clientWidth
        const height = chartRef.value.clientHeight

        // Clear element
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
        const {data, keys} = stackedData.value
        
        // if No selected Countries
        if (!data || data.length === 0) {
            // clear all bars, axis, chart, make sure the chart no elements
            g.selectAll('.layer').remove();
            // g.selectAll('.axis').remove();
            // g.selectAll('.legend').remove();
            return; 
        }

        const width = chartRef.value.clientWidth - margin.left - margin.right;
        const height = chartRef.value.clientHeight - margin.top - margin.bottom;

        // Prepare to stack data
        const stack = d3.stack().keys(keys)
        const layers = stack(data)

        // scale set
        const xScale = d3.scaleBand()
            .domain(data.map(d => d.name))
            .range([0, width])
            .padding(0.3)

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(layers, layer => d3.max(layer, d => d[1])) || 10])
            .range([height, 0])

        // Each disaster has different color
        const colorScale = d3.scaleOrdinal()
            .domain(keys)
            .range(d3.schemeTableau10)
        
        // x axis
        g.selectAll('.axis').remove()
        g.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))

        g.append('g')
            .attr('class', 'axis y-axis')
            .call(d3.axisLeft(yScale).ticks(5))

        // Draw stack bars
        g.selectAll(".layer").remove();

        const layerGroups = g.selectAll('.layer')
            .data(layers)
            .join('g')
            .attr('class', 'layer')
            .attr('fill', d=> colorScale(d.key))

        layerGroups.selectAll('rect')
            .data(d => d)
            .join('rect')
            .attr('x', d => xScale(d.data.name))
            .attr('y', d => yScale(d[1]))
            .attr('height', d => yScale(d[0]) - yScale(d[1]))
            .attr('width', xScale.bandwidth())
            .attr('stroke', '#fff') // Boarder is white
            .attr('stroke-width', 0.5)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                const disasterType = d3.select(event.currentTarget.parentNode).datum().key;
                const countryName = d.data.name;
                const value = d[1] - d[0];

                const content = `
                    <div style="font-weight:bold; border-bottom:1px solid #ddd; margin-bottom:5px;">
                        ${countryName}
                    </div>
                    <div>Disaster: <span style="font-weight:bold;">${disasterType}</span></div>
                    <div style="color:#e74c3c">Frequency: <strong>${value}</strong></div>
                `;
                store.showTooltip(event.pageX + 10, event.pageY - 10, content);
                d3.select(event.currentTarget).attr('opacity', 0.8);
            })
            .on('mousemove', (event) => {
                store.showTooltip(event.pageX + 10, event.pageY - 10, store.tooltip.content);
            })
            .on('mouseout', (event) => {
                store.hideTooltip();
                d3.select(event.currentTarget).attr('opacity', 1);
            });


        // ================== Add Legend (Legend) ==================
        // The colors of different disasters are displayed at the top of chart for easy comparison
        const legend = g.selectAll(".legend").remove(); // Clear old legend
        
        // Create a new legend container group
        const legendGroup = g.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(0, -15)`); // Place it above the drawing area

        const legendItemWidth = width / keys.length;

        const legendItems = legendGroup.selectAll(".legend-item")
            .data(keys)
            .join("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(${i * legendItemWidth}, 0)`);

        // Draw color cubes
        legendItems.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", d => colorScale(d));

        // Add text beside it
        legendItems.append("text")
            .attr("x", 15)
            .attr("y", 10)
            .style("font-size", "10px")
            .text(d => d);
    }

    onMounted(() => {
        initChart()
    })

    
    watch([() => store.selectedCountries, () => store.timeRange, () => store.isLoading], () => {
    if (!store.isLoading) {
        if (!svg) initChart();
        else updateChart();
    }
    }, { deep: true });


</script>

<style scoped>
.view-container { 
  width: 100%; height: 100%; display: flex; flex-direction: column; padding: 10px; box-sizing: border-box; 
}
.chart-area { flex: 1; position: relative; }
h3 { margin: 5px; font-size: 1rem; text-align: center; }
</style>