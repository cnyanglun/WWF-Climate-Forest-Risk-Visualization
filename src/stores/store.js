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
    selectedCountries: ['BLR', 'ALB', 'BTN'],      // 用户点击地图或散点选中的国家
    timeRange: [1992, 2023],     // 这里的日期可能要写死，规定只展示某个时间段

    isLoading: true
  }),

  actions: {
    async loadData() {
      this.isLoading = true

      try{
        // 并行加载所有数据
        const [forest, disaster, geo] = await Promise.all([
          d3.csv('/13_Forest_and_Carbon.csv'),
          d3.csv('/14_Climate-related_Disasters_Frequency.csv'),
          d3.json('/world-countries.geojson')
        ])

        this.forestData = forest.filter(d => d.Indicator === 'Carbon stocks in forests');

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
    // 切换国家选中状况（Toggle模式）
    toggleCountry(countryName){
      const index = this.selectedCountries.indexOf(countryName)
      // 修复：改为 -1
      if(index > -1){
        this.selectedCountries.splice(index, 1)
      } else {
        this.selectedCountries.push(countryName)
      }
    },

    // 更新时间范围，使用V3中的Brush
    updateTimeRange(newRange) {
      this.timeRange = newRange
    }
  },

  getters: {
    // 获取当前时间范围内，各国的平均森林碳储量
    aggregatedDisasters(state) {
      const yearColumns = d3.range(state.timeRange[0], state.timeRange[1] + 1).map(String);
      
      return d3.rollup(
        state.disasterData.filter(d => d.Indicator.includes("TOTAL")),
        v => {
          // 对选中年份区间求和
          let sum = 0;
          yearColumns.forEach(y => { sum += (v[0][y] || 0); });
          return sum;
        },
        d => d.ISO3
      );
    }

  }
})