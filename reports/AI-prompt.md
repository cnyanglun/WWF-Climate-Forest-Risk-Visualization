# A5 AI-prompt

## Project Structure
```
.
├── LICENSE
├── README.md
├── index.html
├── jsconfig.json
├── package-lock.json
├── package.json
├── public
│   ├── 13_Forest_and_Carbon.csv
│   ├── 14_Climate-related_Disasters_Frequency.csv
│   └── favicon.ico
├── reports
│   ├── A5-Introduction.md
│   └── AI-prompt.md
├── src
│   ├── App.vue
│   ├── assets
│   │   ├── main.css
│   │   └── world-countries.json
│   ├── components
│   │   ├── V1-GlobalMap.vue
│   │   ├── V2-RiskScatterPlot.vue
│   │   ├── V3-TimeSeriesChart.vue
│   │   └── V4-DisasterComposition.vue
│   ├── main.js
│   └── stores
│       └── store.js
└── vite.config.js
```

## 数据
### 13_Forest_and_Carbon.csv
数据的结构样例
```
Header: Country,ISO2,ISO3,Indicator,Unit,Source,CTS Code,CTS Name,CTS Full 


Category,Fields & Specific Metadata
Geographic Scope,"Country (e.g., Advanced Economies), ISO3 (e.g., AETMP)"
Indicators,"Carbon stocks in forests, Forest area, Index of carbon stocks in forests"
Measurement Units,"Million tonnes, 1000 HA, Index"
Taxonomy (CTS),"CTS Code, CTS Name, CTS Full Descriptor (Mitigation > Forest and Carbon)"
Metadata,"Source (FAO, IMF staff calculations)"
Temporal Range,1992 to 2023 (Annual time series)
```



### 14_Climate-related_Disasters_Frequency
```
Header: Country,ISO2,ISO3,Indicator,Unit,Source,CTS Code,CTS Name,CTS Full 



Category,Fields & Specific Metadata
Geographic Scope,"Country (e.g., Afghanistan, Islamic Rep. of), ISO2 (AF), ISO3 (AFG)"
Indicators,"Climate related disasters frequency (Specific types: Drought, Extreme temperature, Flood, etc.)"
Measurement Units,Number of
Taxonomy (CTS),"CTS Code, CTS Name, CTS Full Descriptor (Adaptation > Climate Related Disasters Frequency)"
Metadata,"Source (EM-DAT, CRED / UCLouvain)"
Temporal Range,1980 to 2024 (Annual time series)
```





-------------



# 项目细节描述
WWF：
制定全球保护战略，目标是识别高风险区域，观察环境变化，灾难统计，确定敢于策略的类型和优先级。
关联分析，栖息地健康 vs 环境压力，追踪长时间序列趋势、定位地理热点和极值

#13 Forest and Carbon： 
包含 Carbon stocks in forests, Forest area 等指标。
这是评估栖息地健康状态的关键指标。
缺失值：1. 时间序列数据（1992-2023年）存在少量缺失值，但整体缺失率极低。 2. 针对 CTS Name 列（100% 缺失值）

#14 Climate-related Disasters Frequency： 
包含 Total Number of Disasters 以及如 Flood, Storm, Drought, Extreme temperature, Landslide, Wildfire 等详细灾害类型。
这是评估环境压力最直接的指标。数据可按灾害类型和年度聚合，但历史早期的记录可能不完整。
缺失值：时间序列的灾难次数缺失代表着灾难在此年为0，即没有发生


详细任务分析 (Detailed Task Analysis)
A. 用户组 1: WWF 活动家 (WWF Activists)
WWF 的任务集中在**发现（Discover）气候影响与栖息地健康的关联，以及定位（Target）**保护资源的投放优先级。

T1：调查气候变化对世界不同地区自然栖息地的相对影响。调查相关性。 
目的：搞清楚栖息地变差（如森林减少）和气候灾难增多之间是不是有关系，在哪儿关系最密切。
重要性：帮助 WWF 科学地证明气候变化对自然栖息地的具体危害，为制定长期保护计划提供数据基础

T2：识别气候灾害总数最多且森林碳储量减少最快的几个国家/地区。
目的：定位全球面临“双重压力”（高风险、高损失）的热点地区。
重要性：这些极值国家代表了最紧急、最需要资源的保护区，确定哪些国家或地区最紧急、最需要资金和人力投入，确保保护资源用在刀刃上。

T3：分析在某一时间段，所选国家哪种灾难最频发。
目的：明确对比所选热点国家（如 T2 识别出的国家）各自面临的主要灾难威胁类型，以便对每个国家制定针对性的保护和应对策略。
重要性：帮助 WWF 选择正确的干预措施，可以观察出每个国家最严重的气候灾害是什么，例如是侧重于建立洪水屏障，还是侧重于野火预警系统。



A. 用户组 1: WWF 活动家 (WWF Activists)
T1	调查不同地区森林面积变化与气候灾害频率之间的相关性。
Analyze (Correlation, Trend): 比较两个属性（森林健康 vs. 灾害频率）随时间变化的趋势。

T2	识别气候灾害总数最多且森林碳储量减少最快的前 5 个国家/地区。
Identify (Rank, Extremes): 找出在两个聚合指标上排名最高的项目（国家）。

T3	分析在某一时间段，展示每个所选国家哪种灾难最频发。
Compare (Distribution): 对比所选目标集合中，每个项目（国家）在特定属性（灾害类型）上的分布构成。



设计两个仪表板：

仪表板 A：WWF 活动家仪表板 (Dashboard for WWF Activists)
概览 (V1) → 筛选/排名 (V2) → 详细趋势 (V3) → 构成细节 (V4)

A. 视图设计与任务支持
仪表盘包含4个视图，4种不同的可视化类型（地图、散点图、折线图、饼图）

V1	全球/区域概览地图，(Choropleth Map)
支持任务：T1, T2
有效性 (Effectiveness)地图是表示地理数据的最有效方式。
使用颜色深度通道编码聚合指标（如碳损失率），可以快速利用人类的空间感知能力。

V2	森林与灾害双重指标排名	散点图 (Scatter Plot)
支持任务：T2
表达性 (Expressiveness)利用位置通道识别复合风险最高的极值国家。
X 轴 (Position): 栖息地退化（聚合碳损失量 - 不能简单使用Carbon stocks in forests参数，而是ΔCarbon stocks=期末值−期初值，比如 ΔCarbon stocks = 2000年的碳储量 - 1999的碳储量）
Y 轴 (Position): 灾害总数量（聚合总频率 - Total Number of Disasters
每个散点代表一个国家

V3	时间序列对比图	折线图 (Line Chart)
支持任务：T1, T3
有效性 (Effectiveness)利用位置通道的斜率识别趋势，用于 Analyze 两个指标的相关性。
X 轴 (Position): 时间 / 年份 （Year）。
Y 轴 (Position): 定量指标（Carbon stocks in forests / Total Number of Disasters）。
颜色 (Color): 区分不同的国家/指标
多选框： 有Carbon stock/ Disaster count 两个选项，勾选他们来展示信息，可以只展示一个，也可以展示全部


V4	灾害类型分布	堆叠条形图	
支持任务：T3
有效性 (Effectiveness): 采用堆叠条形图，通过长度通道精确编码每个国家每种灾难的贡献和总次数。这使 WWF 可以对比 (Compare) 热点国家（T2 选出的）。
X 轴 (Position): 国家/地区
Y 轴 (Length): 灾害总次数（聚合总数）。
颜色 (Color): 区分不同的灾害类型（如Flood, Storm）。





B. 核心交互与联动机制 (Linking and Functionality)

V1 (地图)	V2, V3, V4	筛选 (Filtering)
用户通过点击一个或多个国家，立即将分析焦点筛选到特定的国家集合，以进行详细分析。

V2 (散点图)	V1, V3, V4	筛选 (Filtering) / 高亮(Highlighting)
用户通过 Brushing 框选 T2 识别出的高风险热点国家。这些国家将立即在 V3 和 V4 中被筛选，并在 V1 中被高亮，实现属性到细节的快速钻取。

V3 (折线图)	V1, V2, V4	时间刷选 (Time Brushing) / 全局过滤
用户在 V3 上使用Brush拖动选取一个时间段（例如 2010-2020），该时间段将作为全局聚合过滤器。V1、V2 和 V4 中的所有数据将基于此时间段进行重新聚合和展示。这是解决聚合数据（如 V2 散点图的坐标）时间依赖的关键。V3还有两个多选框。有Carbon stock/ Disaster count 两个选项，勾选他们来展示信息，可以只展示一个，也可以展示全部。勾选后只刷新V3的图。




C. 可用性与功能性总结 (Usability and Functionality Summary)
功能性 (Functionality): 仪表板 A 通过 V2（散点图）直接支持 T2 的复合排名，通过 V3（折线图）直接支持 T1 的趋势关联分析，并通过 V4（堆叠条形图）支持 T3 的灾害构成总结。所有任务都能通过直观的筛选和联动操作实现。

可用性 (Usability): 
设计上使用了高表达性和有效性的视觉通道：位置通道 (V2 散点图, V3 折线图) 用于编码定量数据和趋势；长度通道 (V4 堆叠条形图) 用于编码定量数据的构成和总量，确保对 T3 的 Summarize 动作具备高准确性。V3 作为时间控制中心，概览与细节的平衡性良好，通过强大的联动提高了分析效率。




4.1 仪表板 A：WWF 活动家
Pros: 
WWF 用户可以非常高效地完成 T2（识别热点）。V2 散点图使用位置通道编码两个关键聚合指标，是发现复合极值最准确的方式，避免了逐个国家排序的低效。T1 (相关性) 通过 V3 折线图的对比实现，其趋势分析利用了人类对斜率的最佳感知能力。

交互权衡与局限性:
1. 采用了时间刷选 (V3) 来驱动聚合计算。虽然使用聚合可能会损失细节，但支持了对 T2 的“复合风险”的长期定义（例如：定义过去 20 年的复合风险），比只看单一年份更具价值。
2. V2 散点图的坐标是聚合值，如果用户在 V3 中选择的时间段过短，数据可能因缺失值而不够稳定。


视觉编码平衡:
设计平衡了有效性和属性数量：将最关键的定量数据（碳损失率、灾害频率、时间趋势）映射到最有效的位置和长度通道（V2, V3, V4）。V4 采用堆叠条形图而非饼图，牺牲了部分整体感，但换来了长度通道对 T3（灾难构成）的准确比较。

视图角色: 
V1 (地图) 是概览 (Overview) 和地理选择视图。V2 (散点图) 是筛选/热点识别视图。V3 (折线图) 是时间概览和细节视图（时间维度），同时作为全局控制。V4 (堆叠条形图) 是细节 (Detail) 视图，用于构成分析。

视图联动：
高度联动： 采用经典的 Filtering & Brushing 模式。地理选择 (V1/V2) → 筛选数据；时间选择 (V3) → 全局聚合过滤。V3 的时间刷选功能是保持 V1, V2, V4 数据一致性和意义的关键。

A (WWF)
分析价值高。 支持复杂的多指标相关性分析 (T1) 和复合风险定位 (T2)。设计挑战在于多个指标的同步对比和聚合逻辑。
理由：
首选实施。 WWF 仪表板的设计在技术实现上更具挑战性，因为它需要精确处理两个不同数据集（森林/灾害）的时间同步和相关性可视化。实现 V3 (折线图) 的双指标趋势分析和 V2 (散点图) 的双指标聚合，能更好地展示 D3.js 和 Vue.js 在复杂数据处理和联动上的能力。








# 项目要求描述
A5 作业指南

## 技术栈
D3.js
Vue.js
使用pinia.js 作为store
禁止使用Plotly、Highcharts和其他不准许的非D3库


## 指导方向
1.  选择一个主题，在A4 中选择 WWF Activists Dashboard实现
2. 根据feedback中的建议修改设计并实现
3. 使用技术栈实现图标
4. 写一个报告，记录了你实现代码的国政
5. 在一月15号演讲

## Report细节
最多5页，最多包括一个截图
1. 简介总体问题，展示你使用了A4中的哪个设计，为什么
2. Prototyping/ Design process
    1. 在你的可视化中可以发现哪些数据。
    2. 描述你根据原型将其变成网页可视化。
    3. 你的可视化有没有在数据方面出问题（我感觉应该是一些空值或者其他原因导致），如果有，为什么。
    4. 如果在原型设计过程中出现了变化，请描述初始可视化设计的变化。
3. 执行细节
    1. 描述你的最终实现，截图你实现的可视化
    2. 列举每个子图的描述和功能，对应可视化的哪个部分
    3. 描述你如何执行解决定义的任务，你是如何实现相对应的任务的
4. Discussion
    1. 你学到了什么
    2. 下次你会怎么做，怎么升级
    3. 你的用户能够解决你一开始定义的任务吗。为什么能解决，或者为什么解决不了
5. 总结并且写Report

## Grading
### Report（40Point）
* Motivation (2.5 points)
* Prototyping / Design process (20 points)
* Implementation Details (10 points)
* Discussion (5 points)
* Conclusion (2.5 points)

### Visualization Dashboard（60Point）

#### Functionality
the planned user tasks can be executed using the system (35 points)
#### Usability
the system is intuitive for the users, the tasks can be executed with ease of use: effectively, efficiently, and satisfactorily (25 points)

You will get points for the report only when you submit a working implementation. Failure to submit according to the instructions will result in a grade of 0. The final implementation must be submitted in addition to the report and should work as described in the report. Any serious discrepancies between the report and the final implementation will result in a grade of 0, such as when your report mentions features that your final dashboard implementation is lacking. Important: Please be aware that you will need to reach a minimum of 25% of the points on this assignment since this is one of the requirements to pass this course successfully.


## Use of AI
在你的Report中加上你使用了什么AI，用来干什么


## Common Pitfalls

* making the user scroll up/down
* making the user switch between tabs
* use of pop-up views (without strong justification)
* use of drop-down menus (without strong justification)
* use of sliders (without strong justification)
* use of inappropriate color schemes
* unreadable labels
* using "_" in labels
* missing axis labels
* human unreadable numbers
* if NULL/missing values are shown as zero
* missing interactivity between charts
* animation that is not well justified (detailing alternatives that were considered and rejected and for what reasons)


## 时间节点与提交
截止日期：2026年1月7日 23:55。
现场演示：2026年1月15日进行 Mandatory Presentation（强制性演示）










