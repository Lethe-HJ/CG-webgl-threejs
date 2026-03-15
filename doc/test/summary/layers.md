# Code Summary: layers/helpers 技术要点与可迁移经验

> 基于 `src/views/visual/layers/helpers/layers.ts` 及关联的 `engine.ts`、`common` 等模块整理，侧重通用思路与可迁移经验。

---

## 1. 不常见或值得注意的语法与用法

### 1.1 以「构造函数」为键的单例 Map

`BaseSingletonManager` 使用**构造函数引用**作为 Map 的 key，而不是字符串类名：

```ts
private static instances = new Map<
  new () => BaseSingletonManager,
  BaseSingletonManager
>();
// 使用
const constructor = this.constructor as new () => BaseSingletonManager;
BaseSingletonManager.instances.set(constructor, this);
```

**可迁移点**：在打包压缩后类名可能被混淆，用「构造函数引用」作为 key 能保证同一子类只对应一个实例，避免类名重复或变化导致的问题。

### 1.2 静态方法中的 `this` 类型（this 参数）

`getInstance` 通过 `this` 参数约束调用上下文，使返回类型与「当前类」一致：

```ts
static getInstance<T extends BaseSingletonManager>(this: { new (): T }): T {
  if (!BaseSingletonManager.instances.has(this)) {
    new this();
  }
  return BaseSingletonManager.instances.get(this) as T;
}
```

**可迁移点**：在静态方法里用 `this: { new (): T }` 可以让子类调用 `SubClass.getInstance()` 时得到 `SubClass` 类型，而不是基类类型，无需在每个子类里重写 `getInstance`。

### 1.3 带依赖注入的「单例」Helper

`LayersHelper` / `EngineHelper` 继承自 `BaseSingletonManager`，但**由外部传入依赖**（如 `VisualLayersManager`），并由父模块 `new LayersHelper(this)` 创建，而不是通过 `getInstance()` 无参构造。

**可迁移点**：单例基类可只保证「每个子类一个实例」的注册逻辑；若子类需要构造函数参数，可由上层在合适生命周期里 `new` 一次并持有引用，实现「在某一作用域内唯一」的用法。

### 1.4 类型守卫 + 断言的分层使用

`layers.ts` 中先做「业务类型」校验，再取层、再断言为具体层类型：

```ts
if (!isHeatMap(alias)) throw new Error(`${alias} 不是热图图层`);
if (!targetLayerManager) throw new Error(`${alias} 不存在`);
const heatmapLayerManager =
  targetLayerManager as AllHeatMapStereoLabelingLayerManager;
heatmapLayerManager.setColorScaleTheme(heatMapColorTheme);
```

**可迁移点**：用纯函数类型守卫（如 `isHeatMap(alias)`）在运行时和类型上同时收窄；在「已通过守卫」的前提下再用 `as` 断言到具体接口，既保证运行时安全，又让 TypeScript 推断到正确类型。

### 1.5 可选参数的默认值与联合类型

方法签名中可选参数带默认值，并与联合类型搭配：

```ts
setClusterColor(
  alias: Alias,
  clusterId: number,
  color: vec3 | HexColorString | [number, number, number],
  visible = true,  // 默认 true
) { ... }
```

**可迁移点**：对「可选且语义明确」的参数用默认值可减少调用方书写；若参数有多重合法类型（如多种颜色表示），用联合类型并在实现里分支处理，比滥用 `any` 更安全。

### 1.6 通过 getter 暴露异步依赖（ready）

`EngineHelper` 不把 engine 放在构造函数里，而是用 getter 暴露 Promise：

```ts
get ready(): Promise<EngineManager> {
  return this.visualLayersManager.engineManager;
}
```

**可迁移点**：依赖尚未就绪时，用「返回 Promise 的 getter」统一入口；调用方用 `this.ready.then(...)` 或 `await this.ready`，避免在构造函数里写异步逻辑，也便于在测试或不同初始化顺序下复用。

---

## 2. 比较优秀的思路与设计模式

### 2.1 Helper 与 Manager 的职责划分

- **LayersHelper**：对外提供「按 alias 设置图层属性」的粗粒度 API（透明度、颜色、范围等），内部只做「取层 + 类型校验 + 转发」。
- **VisualLayersManager**：负责层的创建、生命周期、数据与渲染；通过 `getLayer(alias)`（或对 Helper 开放的 `getLayerForLayersHelper`）把具体层实例交给 Helper。

**可迁移点**：把「能力聚合与对外 API」放在 Helper，「状态与复杂流程」放在 Manager，符合单一职责；Helper 依赖 Manager 注入，便于测试和替换。

### 2.2 基于字符串约定的类型守卫（alias 体系）

`common` 里通过 alias 的格式约定（如 `sid__binsize__omics__coloring__projection__sliceId`）实现一批 `isXxx(alias)`：

- `isHeatMap`、`isCluster`、`isBin`、`isCell`、`isSpatial`、`isUmap` 等基于 `alias.split('__')` 的段和枚举比较。
- 复合语义用组合守卫，如 `isCell(alias) && isSpatial(alias)` 表示「spatial CellBin 图层」。

**可迁移点**：当业务有很多「类型/模式」且都可由一个标识符（如 alias）推导时，集中维护一组纯函数类型守卫，便于在多个 Helper/Manager 中复用，并统一「先守卫再断言」的写法。

### 2.3 先校验「业务类型」再校验「存在性」

`layers.ts` 中不少方法先判断「是不是某类图层」，再判断「该层是否存在」：

```ts
if (!isCluster(alias)) throw new Error(`${alias} 不是聚类图层`);
const targetLayerManager = this.getLayer(alias);
if (!targetLayerManager) throw new Error(`${alias} 不存在`);
```

**可迁移点**：先校验「是否允许对该类型做此操作」，再校验「对象是否存在」，错误信息更清晰，也避免对不存在的层做无意义的存在性检查。

### 2.4 同步/异步 API 的明确区分（EngineHelper）

- 需要**立刻拿 engine 做计算**的（如坐标转换、取 zoom）：同步方法内 `if (!this.engine) throw new Error('engine not ready')`，保证调用方在 engine 就绪后使用。
- 仅需**把任务挂到 engine 上**的（如设置 tissue、scaleBar、监听器）：用 `this.ready.then((engine) => { ... })`，不阻塞调用方。

**可迁移点**：依赖异步资源的模块可以同时提供「同步调用 + 前置检查」与「基于 Promise 的延迟执行」两种 API，并在注释或命名上区分使用场景（如「需在引擎加载完成后调用」）。

### 2.5 在构造函数中挂载「就绪后的逻辑」

`EngineHelper` 在构造函数里订阅 `this.ready`，在 engine 就绪后执行首次加载与 fitView，并把「首次加载完成」通过 `resolveLayersInitComplete` 暴露给外部：

```ts
this.ready.then((engine: EngineManager) => {
  this.engine = engine;
  this.firstLoadLayersAndFitView();
});
```

**可迁移点**：需要「等某资源就绪再执行一次性初始化」时，在构造函数里订阅 Promise 并解析一个「初始化完成」的 Promise，外部可 `await layersInitCompletePromise` 再执行依赖该状态的逻辑。

### 2.6 事件监听的一次性自注销

`firstLoadLayersAndFitView` 中在条件满足后 `setTimeout` 内执行 `containAllLayers`、resolve、并移除自身监听：

```ts
engine.viewer.layerManager.layersChanged.add(handleLayersChanged);
// 在 handleLayersChanged 内条件满足后：
timer = setTimeout(() => {
  engine.containAllLayers();
  that.resolveLayersInitComplete();
  engine.viewer.layerManager.layersChanged.remove(handleLayersChanged);
}, 100);
```

**可迁移点**：「监听某事件，满足条件后执行一次并不再监听」可写成：在回调里判断条件 → 设短延迟防抖 → 执行逻辑 → 移除当前监听，避免重复执行和泄漏。

---

## 3. 容易踩坑的地方

### 3.1 用 `(xxx as any)` 绕过类型时的边界

`layers.ts` 中 `getLayer` 使用 `(this.visualLayersManager as any).getLayer(alias)`，因为 `getLayer` 可能未在 `VisualLayersManager` 的公共类型上暴露给 Helper。

**坑点**：一旦 `getLayer` 的签名或语义变更，调用方不会得到类型报错，容易漏改。更稳妥的做法是：在 Manager 上显式提供窄接口（如 `getLayerForLayersHelper(alias): SomeLayerType | undefined`），让 Helper 只依赖该接口，避免 `as any`。

### 3.2 类型守卫与断言顺序不一致导致的逻辑 bug

若先 `getLayer` 再根据层类型做不同操作，但守卫与「取层」顺序不一致，可能出现「通过了 isXxx 但拿到的是别的层」的情况。当前实现是「先 isXxx(alias) 再 getLayer」，逻辑一致。

**可迁移点**：凡是用「类型守卫 + getX + 断言」的模式，建议统一顺序：先守卫（业务类型）→ 再取对象（存在性）→ 再断言并调用，避免守卫和实际对象不对应。

### 3.3 同步方法在「资源未就绪」时的行为

`project` / `unProject` / `getViewerZoom` / `setViewerZoom` 等依赖 `this.engine`。若在 engine 未就绪时调用会直接 throw。

**坑点**：调用方若在「引擎尚未 ready」的路径（如首屏、快速切换）调用这些同步 API，会抛错。需要在业务层保证：要么先 `await engineHelper.ready`（或 `layersInitCompletePromise`），要么只在确定已就绪的 UI/流程里调用。

### 3.4 Promise 在构造函数里只 then 不 await

`EngineHelper` 里大量 `this.ready.then(...)` 不会阻塞构造，若在「ready 未 resolve」时调用依赖 engine 的同步方法会报错。

**可迁移点**：文档或注释中应写清：哪些方法必须等 `ready`（或等价 Promise）resolve 后再用；对需要「等就绪」的调用方，统一提供并推荐使用 `await this.ready` 或 `await layersInitCompletePromise`。

### 3.5 热图相关方法中「类型检查」与「存在性检查」顺序

例如 `setColorScaleTheme` 中先取层再 `isHeatMap`，若 alias 不是热图，`targetLayerManager` 仍可能是别的层，语义上应先拒绝「非热图」再谈存在性。当前实现是：

```ts
const targetLayerManager = this.getLayer(alias);
if (!isHeatMap(alias)) throw ...
if (!targetLayerManager) throw ...
```

**建议**：与其它方法统一为「先 isHeatMap(alias)，再 getLayer，再判空」，可读性和一致性更好，也避免对非热图 alias 做无意义的 getLayer。

### 3.6 单例与「带参构造」的兼容

当前 BaseSingletonManager 的 `getInstance()` 是无参的 `new this()`，而 `LayersHelper`/`EngineHelper` 需要传入 `VisualLayersManager`，因此不能通过 `getInstance()` 创建，而是由父模块 `new` 并持有。

**可迁移点**：若希望某 Helper 既是单例又需要依赖注入，可以考虑：  
- 要么用「单例工厂」：如 `getInstance(visualLayersManager: VisualLayersManager)`，在 Map 里用 `visualLayersManager` 或某 id 作 key；  
- 要么明确约定「该 Helper 由父模块构造并唯一持有」，不再通过 getInstance 获取，避免误用无参 getInstance 导致依赖缺失。

---

## 4. 小结表

| 类别           | 要点简述                                                                 |
|----------------|--------------------------------------------------------------------------|
| 语法/用法      | 构造函数作 Map key；静态方法 `this` 参数；类型守卫 + 断言；ready getter |
| 设计模式       | Helper/Manager 职责分离；alias 类型守卫体系；同步/异步 API 区分；一次性监听 |
| 易踩坑         | `as any` 隐藏类型变更；守卫与取层顺序；engine 未就绪时同步调用；热图校验顺序 |

以上内容均从 `layers.ts` 及其直接关联的 `engine.ts`、`common`、`BaseSingletonManager` 中提炼，可直接应用到类似「多类型实体 + 统一标识符 + 异步依赖」的模块设计中。
