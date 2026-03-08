# Code Summary: `src/views/visual/layers/layers`

> 基于 `src/views/visual/layers/layers` 目录的通用技术要点与设计点总结，侧重可迁移思路与经验，非业务细节。

---

## 1. 不常见语法与用法

### 1.1 AccessiblePromise：可外部解析的 Promise

**位置**: 图层生命周期 `afterCreate`、`created`、`_renderCompleted` 等。

**要点**:
- 标准 `Promise` 的 resolve/reject 只能在构造回调里调用；`AccessiblePromise` 把 resolve/reject 暴露为实例方法，可在任意时机从外部“完成” Promise。
- 常用于“先返回一个 Promise，等异步流程到某一步再 resolve”的场景，例如：`show()` 里先 `this.afterCreate.resolve()`，再 `await createPromise`，最后 `this.created.resolve()`。
- 支持 `status`、`isPending`、`resolve()`、`reject()`，且实现 `Promise` 接口，可直接 `await` 或 `.then()`。
- **注意**: 同一实例多次 `resolve`/`reject` 应做幂等（如判断 `status !== pending` 则直接 return），避免重复触发。

### 1.2 方法装饰器 `@record`（methodCallRecord）

**位置**: `base.ts`、`labeling/base.ts`、`controller.ts` 等。

**要点**:
- 对类方法做包装：在开发环境下记录入参、调用栈、耗时等，生产环境直接返回原 descriptor，无运行时成本。
- 用法：先 `const record = methodCallRecord(logger)`，再在方法上 `@record`。
- 适合对“关键流程入口”做统一可观测（如 `show`、`hide`、`activateLasso`、`createLayerManagers`），便于排查问题且不侵入业务逻辑。

### 1.3 `declare` 做类型收窄而不改运行时

**位置**: `labeling/base.ts` 的 `layerManagers`、`multiColor.ts` 的 `layerSource`、`sourceData`、`layerManagers`。

**要点**:
- `declare layerManagers: BinClusterSpatialLayerManager[]` 等：只告诉 TypeScript 更具体的类型，不生成任何 JS 代码。
- 用于子类中“父类属性在子类里类型更具体”的场景，避免用类型断言或重复声明同名字段。

### 1.4 抽象类 + Mixin 组合（`@LayerManagerSplitMixin`）

**位置**: `labeling/base.ts`、`helpers/split/layerManager.mixin.ts`。

**要点**:
- `LayerManagerSplitMixin(Base)` 是函数式 mixin：接收基类，返回一个 `abstract class SplitLayerManager extends Base`，并实现 `ISplitLayerManager`。
- 使用方式：`@LayerManagerSplitMixin` 装饰在 `StereoLabelingLayerManager` 上，使所有 labeling 图层具备 `enableSplitMode`/`disableSplitMode` 且不重复写实现。
- 与下面的 `mixinWith` 装饰器不同：这里是“继承式”mixin（返回新子类），后者是“实例组合式”（在构造函数里混入方法）。

### 1.5 带类型约束的 Mixin 基类 `BaseMixin<T>()`

**位置**: `base/mixin.ts`、各 `labeling/mixins/*.ts`。

**要点**:
- `BaseMixin<IHeatmap>()` 返回一个“空实现”的类，类型为 `new () => TConstraint`，Mixin 内部可直接用 `this.properties`、`this.layerManager` 等，由泛型 `TConstraint` 保证类型安全。
- 约定：约束类型 `IHeatmap` 等由人工保证在“被装饰的类”上存在对应属性，否则运行时报错；同时用 `implements HeatMapLayerMethods` 保证 Mixin 实现了约定接口，便于 TS 检查漏加方法。

### 1.6 `mixinWith` 装饰器：多 Mixin 组合到类上

**位置**: `base/mixin.ts`、`labeling/binCluster.ts`、`labeling/binHeatmap.ts`、`labeling/cellCluster.ts`。

**要点**:
- `@mixinWith(ClusterLayerMixin, SquareSpotMixin)`：在子类构造函数里依次实例化各 Mixin，并把其**原型上的方法**复制到当前实例，且 `value?.bind(this)` 保证方法内 `this` 指向图层实例。
- 同时会 `Object.assign(this, mixinInstance)` 复制实例属性。
- 类型上通过 `MixinArrayToIntersection<TMixins>` 把多个 Mixin 的实例类型做交集，得到装饰后的类实例类型；被装饰类需用 `interface Xxx extends SquareSpotsLayerMethods, ClusterLayerLayerMethods` 显式声明“混入的方法”，否则调用方拿不到类型提示。

### 1.7 轮询“稳定一段时间即视为完成”（polling）

**位置**: `base.ts` 的 `watchChunksCompleted`。

**要点**:
- 需求：不能等“所有 chunk 加载完”的单一事件，而是“最近一段时间没有新 chunk 到来就认为渲染完成”。
- 实现：监听 `visibleChunksChanged` 每次触发都刷新 `lastChunkReachTime`，再用 `polling(() => Date.now() - lastChunkReachTime > completedTime, 200)` 每 200ms 检查一次，条件满足即 resolve。
- 可迁移到任何“基于时间窗口的完成判定”场景（如连续 N 秒无新数据则视为稳定）。

### 1.8 节流中“累积并集”再交给 handler

**位置**: `labeling/base.ts` 的 `_registerThrottledHandler`。

**要点**:
- 节流期间多次触发，每次的 `chunkIds` 不同；若直接对每次入参做 throttle，会丢 chunk。
- 做法：用 `sectionTimeSummaryChunkIds` 在节流窗口内做**并集累积**，throttle 的回调执行时传入该并集，执行完后 `clear()`，下一轮再累积。
- 且 throttle 回调里先 `const currentChunkIds = new Set([..._currentChunkIds])` 浅拷贝再传给 async handler，避免 handler 执行时 `clear()` 导致拿到空集合。
- 可迁移到“节流但不想丢增量数据”的类似场景。

---

## 2. 较好的思路与设计模式

### 2.1 图层生命周期用 Promise/Signal 分阶段暴露

**位置**: `layers/base.ts` 注释与实现。

**要点**:
- 明确阶段：`afterCreate`（引擎创建流程已开始）→ `created`（引擎图层创建完毕）→ `layerShowed`（状态已应用、已 show、开始渲染）→ `renderCompleted`（可视区 chunk 基本渲染完）。
- 上层可 `await this.created` 再操作引擎图层，或 `onLayerCreated(callback)` 拿取消函数；需要“渲染完成”时用 `config.waitCompleted` 或 `this.renderCompleted`。
- 把“创建中/已创建/已显示/渲染完成”拆成可等待的节点，避免到处写 `setTimeout` 或不可靠的 ad-hoc 事件。

### 2.2 业务图层与引擎图层分离（Manager 双轨）

**要点**:
- `StereoMapLayerManager`（业务）持有 `layerManagers: (StereovLayerManager | StereoMapLayerManager)[]`（引擎或子业务图层），通过 `layerManager` getter 取第一个。
- 业务层只关心 alias、visible、opacity、displayMode、lasso、filter 等；引擎层关心 chunk、渲染、pick、坐标。职责清晰，便于测试与替换引擎实现。

### 2.3 用接口 + Mixin 声明“能力”而非继承树过深

**要点**:
- `ISplitLayerManager`、`SquareSpotsLayerMethods`、`ClusterLayerLayerMethods` 等接口描述“能做什么”；具体类通过 `@mixinWith` 或 `@LayerManagerSplitMixin` 获得实现。
- 子类只需 `extends StereoLabelingLayerManager<Xxx>` 并 `@mixinWith(A, B)`，不必为每种组合写一层继承，避免类爆炸。

### 2.4 子图层/复合图层的统一管理方式

**位置**: `image/multiColor.ts`（MultiColorImageVisualLayerManager）。

**要点**:
- 一个 Manager 对应多个子图层（`layerManagers: MultiColorSubImageVisualLayerManager[]`），每个子图层仍是完整的一层 Manager。
- 顶层 `show/hide` 时遍历子图层并考虑“顶层可见 × 子层可见”（如 `visible && subVisible`）；`setOpacity` 等状态可统一下发给所有子图层。
- 子图层可见性用 `Map<alias, boolean>` 维护，便于按别名开关，可迁移到任何“一组子实体 + 独立可见性”的 UI/渲染结构。

### 2.5 控制器与图层解耦（Controller 只依赖引擎）

**位置**: `labeling/controller.ts`（BaseLabelingController）。

**要点**:
- Controller 只依赖 `EngineManager` 和底层 `BaseLayerManager`，负责创建/绑定 painter、激活/停用、getPainterData/setPainterData 等；不直接依赖业务 LayerManager 的 UI 或状态。
- 业务 LayerManager 在需要时 `createLabelingController()` 并 `bindLayer(this.layerManager)`，lasso 的开启/关闭、多边形数据的上报由业务层协调，Controller 只做“画布与引擎”的桥接。便于单测和复用 Controller。

### 2.6 显示模式与“借用”状态分离

**位置**: `labeling/base.ts` 的 `displayMode`、`isGroupBorrowed`、`isSourceBorrowedLayer`。

**要点**:
- `displayMode`（Origin/Filter）决定是否走 filter 着色；`isGroupBorrowed`/`isSourceBorrowedLayer` 表示数据或 group 是否来自“借用”。
- 禁用 filter 时：若 `isSourceBorrowedLayer || isGroupBorrowed` 则直接 return，不执行 `disableFilterMode`，避免把借用图层的逻辑关掉。逻辑清晰，边界情况集中在一处判断。

### 2.7 大数组分片上传/处理（MERGED_POINTS_MAX_COUNT）

**位置**: `labeling/base.ts` 的 `getCoordsMapEntriesSlices`、`highlight`。

**要点**:
- 按 chunk 的 coords 总长度分片，每片不超过 `2 * MERGED_POINTS_MAX_COUNT`（约 20 万坐标），避免单次请求或单次 GPU 上传过大。
- 分片后对每片做 `requestHandler(mergedPoints)`，再在 `responseHandler` 里按 chunk 写回颜色等；模式可复用到“大列表分批请求/渲染”的场景。

### 2.8 增量式“可见 chunk 变化”回调

**位置**: `labeling/base.ts` 的 `onVisibleChunksChanged`、`_createVisibleChunksHandler`。

**要点**:
- 回调收到的是“相对上次的增量”（diffCoordsMap 或 diffChunkIds），而不是全量，减少重复处理。
- 用 `prevCoordsMapKeysSetRef = { value: Set }` 存上一轮 key 集合，避免闭包拿到过期引用；可选节流 + 并集累积，见上文 1.8。
- 文档里写清 `onlyIds`、`interval`、节流 leading/trailing 行为，便于后续维护和复用到其他“增量订阅”场景。

### 2.9 工厂式颜色策略（getImageColor）

**位置**: `layers/image/image.ts`。

**要点**:
- `getImageColor()` 返回一个闭包函数，根据 `isMultiChannel`、`stainType`、`imageType` 决定颜色；多通道用固定色，DAPI/IF 等用预定义数组并 `shift` 分配，避免散落 if/else。
- 颜色策略集中、可测，新增类型只需改这一处。

### 2.10 toJSON / fromJSON 与 __class__ 做序列化分发

**位置**: `template.ts`、`labeling/base.ts`、`labeling/binCluster.ts`、`labeling/cellCluster.ts`。

**要点**:
- 每个 Manager 的 `toJSON()` 都带上 `__class__: 'XxxLabelingLayerManager'`；反序列化时根据 `__class__` 分支到对应类的 `fromJSON`，再构造实例并挂回 `layerManagers`、`labelingController` 等。
- 便于持久化/恢复或跨进程传图层树，模式可迁移到任何需要“类型名 + 实例数据”的序列化场景。

---

## 3. 容易踩坑的地方

### 3.1 同一 AccessiblePromise 实例的重复 resolve/reject

- 若多处逻辑都可能调用 `this.created.resolve()` 或 `this.afterCreate.reject()`，必须做状态判断（如 `if (this.status !== PromiseStatus.pending) return`），否则可能触发已 settled 的 Promise，导致未定义行为或重复回调。

### 3.2 Mixin 方法内 this 必须绑定到目标实例

- `mixinWith` 里用 `descriptor.value?.bind(this)` 把方法绑到当前实例；若 Mixin 里有异步回调或传给外部（如 `setTimeout(fn)`），需确保 fn 里用的仍是“当前图层实例”，否则可能访问到错误上下文。必要时在 Mixin 方法内显式保存 `const self = this` 再在回调里用 `self`。

### 3.3 节流回调内对“引用类型”的修改

- `_registerThrottledHandler` 里若把 `sectionTimeSummaryChunkIds` 直接传给 async handler，handler 里 await 后再执行 `sectionTimeSummaryChunkIds.clear()`，可能影响同一节流窗口内下一次触发。当前通过“先浅拷贝 Set 再传入”规避，其它类似场景也要注意“谁在何时清空/修改共享引用”。

### 3.4 子类 declare 与父类泛型不一致

- 父类 `layerManagers: (StereovLayerManager | StereoMapLayerManager)[]`，子类 `declare layerManagers: BinClusterSpatialLayerManager[]` 是合法收窄；若子类误写成无关类型，编译可能通过但运行时报错。新增子类时确认 `declare` 的类型是父类类型的子类型。

### 3.5 LOD/借源图层的分支

- `getLayerLodFlag` 通过轮询 `info` 接口判断是否 LOD；`origin` 存在时表示借用数据源，会走 Filter 模式或热图配色等不同分支。新增图层类型或数据源时要考虑“是否有 origin”“是否 LOD”，否则容易漏分支或表现不一致。

### 3.6 created / enginReady 未就绪时访问 layerManager

- 多处有 `if (!this.layerManager) throw LError('layerManager not created')` 或 `await this.created`。调用方在 `show()` 或其它异步流程未完成时就调用 `setOpacity`、`enableFilterMode` 等，可能抛错或无效。对外 API 若可能被早调用，应约定“需在 created 之后”或在内部做 `await this.created` 再操作。

### 3.7 fromJSON 只恢复引用、不重建引擎状态

- 当前 `fromJSON` 多为 `layerManager.layerManagers = json.layerManagers` 等直接赋值，若引擎需要重新创建图层或重新请求数据，仅恢复引用可能不够。持久化方案若包含“完全恢复可交互状态”，需要评估是否要重建引擎图层或在 fromJSON 里触发一次“重新创建”流程。

### 3.8 onlyInFrustum 当前强制为 false 的注释

- `_parseVisibleChunksChangedOptions` 里把 `onlyInFrustum` 强制覆盖为 `false`，注释说明某方向 chunk 提前加载完时，继续该方向平移不会触发 visibleChunksChanged，导致无法感知“新进视口”的 chunk。若以后要支持 onlyInFrustum，需要解决该边界条件（例如用视口与 chunk 的几何关系单独计算增量）。

---

## 4. 小结

| 类别 | 可迁移点 |
|------|----------|
| **异步与生命周期** | AccessiblePromise 做“可外部完成”的 Promise；用多阶段 Promise/Signal 描述生命周期；polling + 时间窗口判定“稳定完成”。 |
| **可观测与调试** | methodCallRecord 对关键方法做入参/调用记录，生产环境零成本。 |
| **类型与组合** | `declare` 收窄子类类型；BaseMixin\<T\> + mixinWith 做类型安全的 Mixin 组合；接口描述能力，Mixin 提供实现。 |
| **性能与数据量** | 节流时用并集累积避免丢增量；大 coords 按片拆分处理；增量回调只传 diff。 |
| **架构** | 业务 Manager 与引擎 Manager 分离；Controller 只依赖引擎；子图层用 Map 维护可见性；toJSON/__class__ 做序列化分发。 |
| **易错点** | AccessiblePromise 幂等；Mixin 内 this/闭包；节流内共享引用；created 未就绪即访问 layerManager；LOD/借源分支。 |

---

*文档生成时间: 2025-03-07 16:00:00*
