# Code Summary: Visual Layers 通用技术要点与设计总结

> 基于 `src/views/visual/layers/common/index.ts` 及周边 layers 体系整理，侧重可迁移的通用思路与经验，非业务细节。

---

## 1. 不常见或值得注意的语法与用法

### 1.1 TypeScript 函数重载 + 单实现（参数长度区分）

`common/index.ts` 中 `getAlias` 通过**多组重载签名 + 一个实现**，用「参数个数」区分多种调用形态，实现上再用可选参数和分支判断：

- 重载 1：6 参数 → spots 场景  
- 重载 2：7 参数 → 跨 ROI 聚类  
- 重载 3：4 参数（含 `SquareBinSize` + `AliasSuffix`）→ multi image  
- 重载 4：4 参数（含 `StainType` + `ImageType`）→ normal image  

实现函数签名用 `param2..param7` 的联合类型 + 可选，在函数体内用 `param4/5/6/7` 的 `undefined` 与 `param3 === AliasSuffix.multiColor` 等条件分支决定走哪条逻辑。  

**可迁移点**：需要「同一函数名、多套语义」且难以用单一联合参数表达时，可用「重载声明 + 单实现 + 参数长度/类型分支」；注意实现签名要兼容所有重载，且分支顺序要严格（先判断 7 参数，再 6，再 4 参数等），避免误判。

### 1.2 品牌类型（Brand Type）强化语义与类型安全

`type.ts` 中大量使用 `Brand<T>`（如 `Sid`、`SliceId`、`SquareBinSize`、`CellBinSize`），将「字符串/数字」细分为不同语义类型，避免传错参数：

- `Sid = \`v${'h'|'g'|'r'|'u'}-${number}\``  
- `SliceId = Brand<string>`  
- `BinSize = SquareBinSize | CellBinSize`，其中 `CellBinSize = Brand<'cell'> | KnownBinSize.cell`  

**可迁移点**：对 ID、枚举式字符串、有格式约束的原始类型，用 Brand 或模板字面量类型可提高可读性和编译期安全；需在边界处做 `as Brand<T>` 或 `brand(x)` 转换。

### 1.3 模板字面量类型描述 Alias 结构

`Alias` 由 `SpotsAlias | ImageAlias | MultiColorImageAlias | ...` 等组成，其中例如：

- `SpotsAlias` 为 \`${Sid}__${BinSize}__...\` 的模板字面量联合  
- 将「约定好的字符串格式」直接写进类型，利于与 `getAlias` 生成结果、`alias.split('__')` 的解析一致  

**可迁移点**：凡是有固定分隔符、固定段数的标识符（如复合主键、缓存 key），都可以用模板字面量类型 + 解析函数（如按 `__` split）保持「生成 ↔ 解析」类型一致。

### 1.4 AccessiblePromise：可外部 resolve 的 Promise

`DataSourceManager` 中 `getHeatmapMaxMidcount`、`getClusterMsg` 等返回「异步函数」，该函数内部创建 `AccessiblePromise`，在首次调用时发起请求，并在请求完成后 `result.resolve(...)`，后续调用通过 `result.isFulfilled` 或直接复用已 resolve 的 result 避免重复请求。  

**可迁移点**：需要「懒加载 + 只请求一次 + 多处 await 同一结果」时，可用 AccessiblePromise 封装；同时用 `isInRequest` 防止并发重复请求，用 `Map<key, AccessiblePromise>` 做按 key 的缓存（如 `_clusterMsgMap`）。

### 1.5 全局 Window 扩展与类型声明

`global.ts` 中通过 `declare global { interface Window { ... } }` 挂载大量单例（如 `visualLayersManager`、`layersHelper`、`dataSourceManager`），并单独声明同名全局变量（如 `const visualLayersManager: typeof window.visualLayersManager`），使在任意模块中可直接使用这些变量且类型正确。  

**可迁移点**：在非 React/Vue 依赖注入、又需要全局访问单例时，可在入口挂到 `window` 并在 `global.d.ts` 或同一文件的 `declare global` 里声明类型，避免到处 `(window as any).xxx`。

---

## 2. 比较优秀的思路与设计模式

### 2.1 基于 Alias 的「标识 + 类型谓词」分层

- **统一标识**：所有图层用 `Alias` 字符串唯一标识，由 `getAlias(...)` 根据场景生成，保证「同一种图层配置 → 同一 alias」。  
- **类型谓词**：`common/index.ts` 提供 `isSpots`、`isCell`、`isBin`、`isHeatMap`、`isCluster`、`isSpatial`、`isUmap`、`isImage`、`isNormalImage`、`isMultiImage` 以及组合谓词（如 `isBinHeatMapSpatial`）。  
- **Helper 按谓词分支**：`LayersHelper` 里先 `isHeatMap(alias)`、`isCluster(alias)` 等再转成对应 `*StereoLabelingLayerManager` 调接口，避免把「图层类型」散落在业务里。  

**可迁移点**：任何「多态实体用字符串 ID 标识」的体系，都可以采用「集中生成 ID + 一组 isXxx 谓词 + 根据谓词分支」的方式，把类型判断收敛到一层，便于扩展新类型（加新谓词和新分支即可）。

### 2.2 BaseManager / BaseSingletonManager 角色划分

- **BaseManager**：普通可销毁对象，如 `LassoManager`、`LayersHelper` 里的逻辑封装。  
- **BaseSingletonManager**：通过 `getInstance()` 取单例，构造时用 `constructor.name` 登记到静态 `Map`，禁止同一类被 `new` 两次。  

单例基类还统一了 `destroy()`（内部 `dispose()` + 清空静态 Map），与 `Disposable` 结合形成「创建 → 使用 → 销毁」的闭环。  

**可迁移点**：需要「全局唯一 + 可销毁」的服务时，可采用「单例基类 + 类名 Map」；需要多实例的控制器/Helper 则用非单例 BaseManager，便于测试与多上下文。

### 2.3 依赖注入式的 Helper 构造

`EngineHelper`、`LayersHelper` 的构造函数接收 `VisualLayersManager`，不自己在内部 `getInstance(VisualLayersManager)`，便于测试时注入 mock。  

**可迁移点**：Helper/Service 若依赖其它 Manager，优先通过构造函数注入引用，而不是在内部读全局单例，方便单测和替换实现。

### 2.4 通用筛选抽象：FilterCondition + 操作符

`source/type.ts` 中 `FilterCondition` 为「字段名 → 值或 FilterConditionValue」的映射；`FilterConditionValue<T>` 为 `{ operator, value? }`，支持 `in`、`notIn`、`exists`、`notExists`、`equals`、`contains`、`startsWith`、`endsWith` 等。  

`DataSourceManager` 的 `_filterData`、`_matchesConditions`、`_matchesValue` 对 bin/cell/image 做统一筛选，并提供 `filterBySid`、`filterByOmics`、`filterByFieldExists` 等便捷方法。  

**可迁移点**：列表/数据源筛选若条件会持续增加，可抽象成「字段 + 操作符 + 值」的通用层，再在业务层封装 `filterByXxx`，避免到处写重复的 filter 逻辑。

### 2.5 方法重载表达「多数据源初始化」

`DataSourceManager.init` 用重载区分两种入参：  
- `init(visualLayersGetResponseData)` → 首次初始化  
- `init(historyList: HistoryItem[])` → 从历史恢复  

实现里通过 `Array.isArray(...)` 区分并分别调用 `firstInit` / `initHistory`，对外一个 `init` 入口，语义清晰。  

**可迁移点**：当「同一语义操作、多种输入形态」时，用重载 + 实现内类型区分，比多个 `initFromXxx` 方法更简洁。

### 2.6 Mixin 扩展单例类能力

`LabelingManager` 使用 `@LabelingManagerSplitMixin` 混入与 split 相关的能力，在保持单例类继承关系清晰的前提下，把可选能力拆到 mixin。  

**可迁移点**：若单例类需要按功能模块横向扩展，且不想堆叠多层继承，可用 TypeScript mixin（或装饰器 + 原型方法）按能力维度拆分。

### 2.7 引擎未就绪时的 API 设计

`EngineHelper` 中部分方法（如 `project`、`unProject`、`getViewerZoom`）在 `this.engine` 未就绪时直接 `throw new Error('engine not ready')`；另一些（如 `fitView`、`setTissueMaskVisible`）则通过 `this.ready.then(engine => { ... })` 延后执行。  

**可迁移点**：对「强依赖外部就绪」的 API，要么同步检查并抛错（调用方必须 await ready），要么统一走「ready.then」异步执行，避免混用导致难以理解的时序问题。

---

## 3. 容易踩坑的地方

### 3.1 getAlias 分支顺序与可选参数

实现里必须按「参数最多 → 最少」的顺序判断（先 7 再 6 再 4），否则 6 参数场景可能被 4 参数分支误匹配（例如把 `param4` 当 SliceId）。同时要注意「4 参数」有两种（multi image 与 normal image），需用 `param3 === AliasSuffix.multiColor` 等进一步区分。  

**建议**：重载实现的分支顺序和注释（如「识别特征：参数长度为 6」）保持一致，新增重载时先写清判定条件再写分支。

### 3.2 Alias 解析与 segments 下标

`isSpatial`、`isUmap` 等依赖 `parts[4]`、`parts[5]`，而跨 ROI 的 alias 为 7 段，spatial/umap 所在下标不同。当前通过 `parts[4] === ... || parts[5] === ...` 兼容两种长度。  

**建议**：任何新增「按 segments 下标」的逻辑都要同时考虑 6 段与 7 段，或抽象成 `getProjection(parts)` 等小函数，避免重复写错下标。

### 3.3 单例 clearInstances 的全局性

`BaseSingletonManager.destroy()` 里调用 `BaseSingletonManager.clearInstances()`，会清空**所有**已注册单例的 Map，而不是只移除当前实例。  

**建议**：若只希望销毁当前类实例，需要在基类或子类中提供「只移除当前类」的销毁逻辑，否则一次 destroy 会影响其它单例的生命周期。

### 3.4 @ts-ignore 与引擎内部 API

`engine.ts` 中 `firstLoadLayersAndFitView` 里对 `engine.viewer.layerManager.managedLayers`、`layersChanged` 使用了 `@ts-ignore`，说明依赖了 stereov 内部或未暴露的类型。  

**建议**：在 stereov 侧补充类型声明或扩展接口，减少 @ts-ignore；若短期无法改库，可在本仓库用 `declare module 'stereov'` 扩展类型，便于后续替换为正确类型。

### 3.5 LayersHelper 的 getLayer 与类型断言

`LayersHelper` 通过 `(this.visualLayersManager as any).getLayer(alias)` 取层，再根据 `isHeatMap`、`isCluster` 等断言为具体 Manager 类型。若 `getLayer` 返回 undefined，后面 `targetLayerManager.setXxx()` 会抛错。  

**建议**：在 `getLayer` 后统一做存在性检查（已有 `if (!targetLayerManager) throw ...`），并考虑在类型上让 `getLayer` 的返回与 alias 谓词对应，减少运行时断言。

### 3.6 异步初始化与同步使用

`DataSourceManager` 的 `layersSourceData` 等要在 `init()` 完成后才有值；若在未 `init` 或 `init` 未完成时访问，会得到 undefined 或旧数据。  

**建议**：对外提供 `ready: Promise<void>` 或 `getLayersSourceData()` 在未就绪时抛错/返回 Promise，避免调用方在未初始化时误用。

---

## 4. 小结

- **类型与标识**：Brand、模板字面量、重载 + 单实现、Alias + isXxx 谓词，一起把「图层种类」和「调用方式」表达清楚并集中维护。  
- **架构**：BaseManager/BaseSingletonManager 区分单例与普通实例；Helper 依赖注入、筛选层抽象、Mixin 扩展，便于测试和扩展。  
- **异步与缓存**：AccessiblePromise + 按 key 缓存、ready.then 与同步抛错区分，适合「懒加载、单次请求、多消费者」的场景。  
- **坑点**：重载分支顺序、alias 段数差异、单例全局 clear、@ts-ignore 与类型断言、异步初始化与同步使用，需要在新增功能时特别注意。

以上内容均从当前仓库代码归纳，可直接作为后续迭代与其它项目（如其它可视化或数据管理模块）的参考。
