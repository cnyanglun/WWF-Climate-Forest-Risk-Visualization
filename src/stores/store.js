import {defineStore} from 'pinia'
import * as d3 from 'd3'

export const useStore = defineStore({
  id: 'main',

  state: () => ({
    // Basic Data
    forestData: [],             // #13
    disasterData: [],           // #14
    geoData: null,              // Word Map Json

    // Global Filter
    selectedCountries: ['USA', 'BRA', 'RUS'],      // Default Countries
    // selectedCountries: [], 
    timeRange: [1992, 2023],     // Default time Ranges

    isLoading: true,

    // Common tooltip State
    tooltip: {
      show: false,
      x: 0,
      y: 0,
      content: ''
    }
  }),

  actions: {
    // 最重要的加载数据
    async loadData() {
      this.isLoading = true

      try{
        // 并行加载所有数据
        const [forest, disaster, geo] = await Promise.all([
          d3.csv('/13_Forest_and_Carbon.csv'),
          d3.csv('/14_Climate-related_Disasters_Frequency.csv'),
          d3.json('/world-countries.geojson')
        ])


        const requiredIndicators = [
          'Carbon stocks in forests', 
          'Index of carbon stocks in forests', 
          'Share of forest area',
          'Forest area',
          'Land area',
          'Index of forest extent'
        ];

        this.forestData = forest.filter(d => requiredIndicators.includes(d.Indicator));

        const yearColumns = d3.range(1992, 2024).map(String)
        this.disasterData = disaster.map(d => {
          yearColumns.forEach(year => {
            // 将缺失值设置为0
            d[year] = d[year] === "" ? 0 : +d[year]
          })
          return d
        })

        // Test if load successfully
        // console.log(this.disasterData)
        // console.log(this.forestData)
        // console.log(geo)

        this.geoData = geo
        this.isLoading = false

      }catch(error){
        console.error("Data loading failed:", error);
      }
    },
    // Set the selection table to directly overwrite the old selection list
    setSelectedCountries(iso3List) {
      this.selectedCountries = iso3List;
    },

    // Operations of tooltip
    showTooltip(x, y, content){
      this.tooltip.show = true
      this.tooltip.x = x
      this.tooltip.y = y
      this.tooltip.content = content
    },
    hideTooltip(){
      this.tooltip.show = false
    },

    // Switch the country selection status (Toggle mode)
    toggleCountry(iso3) {
      if (!iso3) return;
      const index = this.selectedCountries.indexOf(iso3);
      if (index > -1) {
        this.selectedCountries.splice(index, 1);
      } else {
        // At most 6 countries be selected
        // if (this.selectedCountries.length < 6) {
        //   this.selectedCountries.push(iso3);
        // } else {
        //   // When the upper limit is reached, remove the first one and add the latest one
        //   this.selectedCountries.shift();
        //   this.selectedCountries.push(iso3);
        // }
        this.selectedCountries.push(iso3);
      }
    },

    // Update the time range using Brush in V3
    updateTimeRange(newRange) {
      this.timeRange = newRange
    }
  },

  getters: {
    // Obtain the average forest carbon storage of various countries within the current time range
    aggregatedDisasters(state) {
      const yearColumns = d3.range(state.timeRange[0], state.timeRange[1] + 1).map(String);
      
      return d3.rollup(
        state.disasterData.filter(d => d.Indicator.includes("TOTAL")),
        v => {
          // Sum up the selected year interval
          let sum = 0;
          yearColumns.forEach(y => { sum += (v[0][y] || 0); });
          return sum;
        },
        d => d.ISO3
      );
    }

  }
})