# Code Summary: `src/views/visual/layers/helpers/group`

> 基于对 `group` 目录（LabelingManager 及配套 mixin、readme）的阅读，提炼**通用技术要点与可迁移经验**，侧重思路与实现模式，而非业务细节。

---

## 1. 不常见或值得注意的语法与用法

### 1.1 Brand  nominal typing（名义类型）

- **位置**：`GroupId = Brand<string>`、`LabelId = Brand<number>`（`index.ts`）；工具定义在 `@/utils/type.ts`。
- **含义**：在 TypeScript 结构类型体系下，用 `Brand<T> = T & { readonly __brand: unique symbol }` 给基础类型加上“名义”，使 `GroupId` 与普通 `string`、`LabelId` 与普通 `number` 在类型上不可互换，避免传参顺序或语义混淆。
- **可迁移点**：所有“语义不同的同底层类型”（如 UserId / OrderId 都是 string）都可抽成 Brand，提升类型安全，无需运行时开销。

### 1.2 AccessiblePromise（可外部 resolve 的 Promise）

- **位置**：`render()` 返回值、`tempHighligh` / `customHighlight` 的 `ready` 参数（`index.ts`）；实现见 `@/utils/promise.ts`。
- **含义**：Promise 的增强实现，支持在外部调用 `resolve/reject`，并可查状态；`AccessiblePromise.resolved()` 表示“已完成的空 Promise”。
- **用法示例**：
  - **先返回再完成**：`render()` 先处理 `inCoordsMap` 并立即返回一个 `AccessiblePromise<number>`，再在 `requestIdleCallback` 里处理 `outCoordsMap` 后 `accessiblePromise.resolve(coordsLength)`，调用方可以马上拿到“句柄”并选择 await 或稍后再取结果。
  - **流程门控**：`tempHighligh(alias, options, ready)` 中 `ready` 默认为 `AccessiblePromise.resolved()`；若传入未 resolve 的实例，则高亮逻辑会 `await ready` 再发请求，从而与 `enableFilterMode()`、`clearFilter()` 等异步步骤串行。
- **可迁移点**：需要“先返回再在别处完成”的异步 API、或需要由外部控制“何时开始”的流程时，可用 AccessiblePromise 做门控或延迟完成。

### 1.3 从函数类型推导“取消回调”类型

- **位置**：`_prevWatchCancelCallback: Awaited<ReturnType<typeof visualLayersManager.onVisibleChunksChanged>> | undefined`。
- **含义**：不手写订阅返回类型，而是用 `ReturnType<typeof ...>` 取返回值类型，再用 `Awaited<>` 得到 Promise 的完成类型（即取消函数类型），与实现保持同步。
- **可迁移点**：事件/订阅 API 返回 Promise<Unsubscribe> 时，用同样方式推导 Unsubscribe 类型，减少重复声明和与实现不一致的风险。

### 1.4 requestIdleCallback 做非关键路径延后执行

- **位置**：`render()` 内对 `outCoordsMap` 的处理、`renderTempLabel()` / `renderCustomLabels()` 里对 `enableFilterMode()`、`clearFilter()` 的调用。
- **含义**：主路径先完成“首屏/关键”逻辑并返回，把非关键、耗时的工作放到 `requestIdleCallback`，在浏览器空闲时执行，平衡响应与完整性。
- **可迁移点**：凡“必须尽快返回”但又有多段可延后工作的场景，可拆成“同步/首帧 + requestIdleCallback”，并注意兼容性（无则降级为 `setTimeout(..., 0)` 等）。

### 1.5 类 Mixin 的 TypeScript 写法

- **位置**：`LabelingManagerSplitMixin`（`../split/labelingManager.mixin.ts`）。
- **形态**：`function LabelingManagerSplitMixin<TBase extends { new (...args: any[]): LabelingManager }>(Base: TBase)` 返回一个新类，该新类继承 `Base` 并实现 `ILabelingManagerSplit`，在子类中可 `override` 基类方法（如 `appendLassoCondition`），并调用 `super.appendLassoCondition(...)`。
- **可迁移点**：在 TS 里做“可组合的类增强”且需要保留类型信息时，用泛型 `TBase extends new (...args: any[]) => Base` + 返回 `class ... extends Base` 是常见且类型友好的 mixin 模式；业务上可用来做“按功能拆分的横向能力”（如 split 模式）而不改核心类接口。

### 1.6 方法调用记录装饰器（仅开发环境）

- **位置**：`@record` 修饰多个 public/private 方法；`record = methodCallRecord(logger)`，实现见 `@/service/log`。
- **含义**：装饰器在非 `__DEV__` 下直接返回原 descriptor，不包装；在开发环境下记录入参、调用栈缩进、耗时等，便于调试与排查调用顺序。
- **可迁移点**：对“入口级”或“流程关键”方法做轻量调用追踪时，可采用类似“开发环境装饰器 + 生产无开销”的方式，避免影响生产包体与性能。

---

## 2. 比较优秀的思路与设计模式

### 2.1 高阶函数：先闭包配置，再返回“执行函数”

- **位置**：`tempHighligh(alias, options?, ready?)`、`customHighlight(alias, labelsMsg, ready?)` 返回 `(coordsMap: ChunkCoordsMap) => Promise<...>`。
- **思路**：一次配置（alias、options、labelsMsg、ready），得到一个只依赖 `coordsMap` 的异步函数，便于传给 `render(highlightRenderFunc)` 统一调度；同时 `ready` 把“何时开始”交给调用方，便于与其它异步步骤组合。
- **可迁移点**：凡“同一套配置、多次执行”或“配置 + 执行两阶段”的流程，可用“高阶函数返回闭包”的方式，使调用处简洁、组合灵活。

### 2.2 “先同步返回，再在空闲时完成”的异步拆分

- **位置**：`render()` 内对 `inCoordsMap` 立即执行 `highlightRenderFunc`，对 `outCoordsMap` 放入 `requestIdleCallback`，并返回 `AccessiblePromise<number>`，在空闲回调里 resolve。
- **思路**：保证调用方尽快拿到 Promise 和首屏结果，再在后台补全剩余数据并更新 Promise 状态，兼顾响应时间与数据完整。
- **可迁移点**：大列表/大范围渲染、多阶段加载等，可显式区分“首屏必需”与“可延后”的两部分，用同一 Promise 或状态把“最终结果”暴露给上层。

### 2.3 订阅生命周期：取消上一次 + 统一 register

- **位置**：`render()` 开头 `if (this._prevWatchCancelCallback) this._prevWatchCancelCallback();`，然后重新订阅并 `this.register(this._prevWatchCancelCallback)`；`layerHidden.add` 时也调用该取消回调。
- **思路**：同一时刻只保留“最新一次”的订阅；取消函数交给基类 `Disposable#register`，在 `dispose()` 时统一执行，避免重复监听与泄漏。
- **可迁移点**：任何“可重复触发的订阅”（如视图重绘、筛选条件变化）都应考虑“先取消旧订阅再建新订阅”，并把取消句柄纳入统一的生命周期管理（如 Disposable/AbortController）。

### 2.4 条件合并与一次计算、缓存

- **位置**：`getTempMergedCondition()` 使用 `_tempMergedCondition` 缓存；`mergeConditions()` 用 `lodash.merge` 合并 `alias`，用 ` and ` 拼接各 `query`。
- **思路**：同一流程内条件不变时，合并与序列化只做一次，避免重复计算和重复请求；条件结构统一为 `{ alias, query }`，便于扩展多种条件类型。
- **可迁移点**：复杂查询/过滤条件在“流程内不变”时，可做一次合并并缓存；若条件会随用户操作变化，需在合适时机清空缓存（见下文易踩坑）。

### 2.5 防御性校验集中在一处

- **位置**：`_checkLabelingLayer(alias)` 统一校验图层存在、可见、可标注，不通过则 throw，通过则返回类型收窄后的 layerManager。
- **思路**：所有依赖“当前可选图层”的 public 方法都通过这一处校验，错误信息一致，类型也更安全。
- **可迁移点**：对“可选资源”的依赖（当前选中项、当前用户等），可集中在一个 protected 方法里做存在性与权限校验，避免在多个入口重复写相同判断。

### 2.6 单例 + Disposable 的资源管理

- **位置**：`LabelingManager` 继承 `BaseSingletonManager`，单例通过 `getInstance()` 获取；取消回调用 `this.register(...)` 注册，在 `dispose()` 时统一执行。
- **思路**：单例保证全局唯一入口；Disposable 保证事件、订阅等都在析构时释放，避免泄漏。
- **可迁移点**：全局管理器类适合“单例 + 集中注册可取消句柄”的模式；单例 key 用构造函数本身（如 `Map<new () => BaseSingletonManager, instance>`）可避免压缩后类名变化导致 key 错乱。

---

## 3. 容易踩坑的地方

### 3.1 临时条件缓存的失效时机

- **现象**：`_tempMergedCondition` 在 `getTempMergedCondition()` 内被缓存，但代码中未见在 `sid`/`projection`/`conditions` 变化时清空该缓存。
- **风险**：若同一实例在多次流程中复用，且中间修改了 `setExtraConditions` 或切换了图层/投影，可能仍返回旧的合并条件。
- **建议**：在“条件可能变化”的入口（如切换图层、修改额外条件、开始新的 lasso 流程）显式清空 `_tempMergedCondition`，或改为无缓存、按次计算（若性能允许）。

### 3.2 getter 依赖“当前选中层”的时序

- **现象**：`get labelingLayerManager()` 内部用 `visualLayersManager.getSelectedLayer()` 再取 layer，多次调用可能得到不同结果（例如在异步间隙用户切换了图层）。
- **风险**：长流程中先取得 layer 做一批操作，后面再读 `this.labelingLayerManager` 可能已是另一个图层，导致状态错乱或报错。
- **建议**：在长流程入口处 once 取 `const layer = this.labelingLayerManager`（或 `_checkLabelingLayer(alias)`），后续步骤用同一引用；或对外 API 显式传入 `alias`，避免隐式依赖“当前选中”。

### 3.3 GroupId 的构造方式与类型安全

- **现象**：`tempHighligh` 里用 `Date.now().toString() as GroupId` 仅做类型断言，若后端或其它模块对 GroupId 有格式/语义约束，这里可能不符合。
- **建议**：若 GroupId 有规范，应集中在一个工厂函数（如 `createTempGroupId(): GroupId`）中生成并保证格式，避免各处 `as GroupId`。

### 3.4 requestIdleCallback 的兼容性

- **现象**：未在代码中看到对 `requestIdleCallback` 的 polyfill 或降级。
- **风险**：在不支持的环境中会报错。
- **建议**：在入口或工具层做一次检测，无则用 `setTimeout(fn, 0)` 或 `Promise.resolve().then(fn)` 降级，保证逻辑一致。

### 3.5 稀疏数组与“索引即 id”的 dataList

- **现象**：`getCustomLabelsRenderDataList()` 用 `dataList[i.id] = ...` 构造数组，再 `for` 循环把 `undefined` 槽位填默认值；渲染侧用“索引即 label id”。
- **风险**：若某处误用 `dataList.length`、`filter`、或未填洞的副本，易出现 undefined 访问或显示错位。
- **建议**：在注释或类型中明确“索引与 id 一一对应、空洞已填默认值”；封装时提供按 id 访问的 getter，避免直接按索引使用；若 id 稀疏度大，可考虑 Map 结构而非数组。

### 3.6 异常未在调用方统一处理

- **现象**：多处 `throw new Error(...)`（如未选图层、group/label 不存在），若调用方未 try-catch，会变成未处理的 Promise rejection 或同步异常。
- **建议**：对“可预期的业务错误”（如未选图层、不存在），考虑返回 Result 类型或统一错误事件，由 UI 层统一提示；若保留 throw，应在文档或类型上标明“可能抛出”，并建议调用方 catch。

---

## 4. 小结

| 类别         | 要点摘要                                                                 |
|--------------|--------------------------------------------------------------------------|
| 语法/用法    | Brand 名义类型、AccessiblePromise、ReturnType/Awaited 推导、requestIdleCallback、类 Mixin、仅 DEV 的 @record |
| 设计模式     | 高阶函数返回闭包、先返回再空闲完成、订阅取消+register、条件合并缓存、集中校验、单例+Disposable |
| 易踩坑       | 条件缓存未失效、getter 时序、GroupId 断言、requestIdleCallback 兼容、稀疏 dataList、异常未统一处理 |

以上内容均从 `src/views/visual/layers/helpers/group` 及相关依赖归纳，侧重通用思路与可迁移经验，可直接用于编码规范、代码评审或技术沉淀。
