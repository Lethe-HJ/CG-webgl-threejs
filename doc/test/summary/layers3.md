# Code Summary: `src/views/visual/layers/source/layers`

> 基于对图层数据源（LayerSource）模块的阅读，提炼可迁移的通用技术要点与设计经验。  
> 生成时间：2025-03-07

---

## 1. 不常见或值得注意的语法与用法

### 1.1 AccessiblePromise：可外部 resolve/reject 的 Promise 封装

`base.ts` 中 `LayerSource.initial()` 使用 `AccessiblePromise` 而非原生 `Promise`，以实现：

- **单次初始化、多次复用**：同一生命周期内重复调用 `initial()` 时复用同一组 Promise，避免重复请求。
- **外部控制完成时机**：在 `forEach` 的 async 回调里根据请求结果调用 `promise.resolve(precomputedUrl)` 或 `promise.reject(error)`，调用方只拿到 `promise.promise` 做 `await`。

可迁移经验：当需要「一次创建、多处等待、在异步回调中统一完成」时，可用此类封装替代「返回新 Promise 并在内部 resolve」的写法，便于做防重复请求与状态共享。

### 1.2 子类用 `declare` 收窄继承属性类型

`image.ts` 中：

```ts
export class MultiColorImageLayerSource extends LayerSource {
  declare initialPromise: AccessiblePromise<PrecomputedUrl>[] | null;  // 基类为单元素数组
  declare sourceData: MultiColorImageSourceDataItem;                   // 收窄为具体 Source 类型
}
```

`declare` 仅改变类型，不生成运行时代码。用于在子类中把基类的联合类型或宽类型收窄为当前子类使用的具体类型，既满足类型安全，又避免重复初始化或破坏基类行为。

可迁移经验：子类若「语义上」确定某属性是更具体的类型，用 `declare` 收窄即可，无需再写 `this.xxx = ...`。

### 1.3 基于「别名字符串结构」的类型守卫

`common/index.ts` 中通过 alias 的 `split('__')` 结果判断类型，例如：

- `isBin(alias)` / `isCell(alias)`：看第二段是否为 cell。
- `isHeatMap(alias)` / `isCluster(alias)`：看第四段。
- `isSpatial(alias)` / `isUmap(alias)`：看第四或第五段（兼容跨 ROI 的 7 段 alias）。

`manager.ts` 的 `matchLayerSource(alias)` 根据这些守卫返回对应的 LayerSource 构造函数，实现「字符串约定 → 类型/类」的映射。

可迁移经验：当实体类型由结构化字符串（如 `sid__binsize__omics__...`）编码时，可集中维护一套纯函数守卫（isXxx），再在工厂或策略里用 if-else/表驱动选择具体实现类，保证类型与实现一致。

### 1.4 泛型约束与构造函数类型

```ts
type LayerSourceCls = new (...args: any[]) => LayerSource;
// ...
const layerSource = new matchedLayerSourceCls(alias, sourceData);
```

用「构造函数类型」表示「任意 LayerSource 子类的 new」，便于在 Map 或工厂里统一「存类、取类、实例化」而不写重复类型断言。

可迁移经验：工厂方法若根据运行时条件返回不同子类实例，可先定义 `type XxxCls = new (...args: any[]) => Base`，再在分支里赋值为具体类，最后统一 `new cls(...)`。

### 1.5 类型断言用于字面量 target

```ts
target: <NormalInitialTargetParam>`${sid}/${binSizeStr}/${projection}`,
source: <InitialSourceParam>`v:${visualTaskId}`,
```

这里用类型断言把模板字符串字面量标成接口要求的 `NormalInitialTargetParam` / `InitialSourceParam`，在「格式由前端约定、类型由接口定义」的场景下很常见。

注意：若后端实际接受更多格式，更稳妥的做法是定义联合类型或泛型，避免断言过度收窄。

---

## 2. 比较优秀的思路与设计模式

### 2.1 策略 + 工厂：用 alias 驱动 LayerSource 子类选择

`LayerSourceManager.matchLayerSource(alias)` 根据 alias 的语义（image / template / heatmap / cluster × spatial / umap × bin / cell）选择具体 LayerSource 子类，调用方只需 `getSource(sourceData)`，无需关心具体类名。

可迁移经验：当「类型很多、分支很多」时，用一组 isXxx(alias) 配合单一 match 函数（或表驱动）集中维护「标识 → 实现类」的映射，避免调用方到处写 if-else 或重复分支。

### 2.2 数据源「借用」与 alias 解析

`getSource(sourceData)` 中：

- 若 `sourceData` 带 `origin`（借用坐标），则用 `origin.alias` 查 LayerSource，实现「逻辑图层用 A 的坐标」。
- 否则用 `sourceData.alias`。

这样「一个 sourceData 对应一个 LayerSource 实例」的键是「实际提供数据的 alias」，而不是当前图层的 alias，避免同一底层数据被重复创建。

可迁移经验：当存在「引用/借用」关系时，缓存键应基于「实际资源标识」（如 origin），而不是「当前业务对象标识」，以便复用同一资源实例。

### 2.3 初始化请求的幂等与复用

`LayerSource.initial()`：

- 若已有 `initialPromise`（进行中或已完成），直接返回现有 promise 数组，不再发新请求。
- 否则创建新的 `AccessiblePromise` 并只创建一次，后续调用都返回同一批 promise。

这样「短时间多次调用 initial」只会触发一次请求，结果被多处 await 共享。

可迁移经验：对「每个实例只应执行一次」的异步初始化，用「实例上挂一个 promise 引用 + 判空」做幂等，既避免重复请求，又保持 API 简单（调用方无需关心是否已初始化）。

### 2.4 抽象基类 + 模板方法

`LayerSource` 定义：

- `initial()`：模板流程（创建/复用 promise → 调 `_requestInitial()` → resolve/reject）。
- `_requestInitial()`：依赖 `getInitialParams()` 组参数并发请求。
- `getInitialParams()`：抽象方法，由子类按自身类型返回不同参数结构。

子类（SpotLayerSource、ImageLayerSource、MultiColorImageLayerSource、TemplateLayerSource 等）只实现 `getInitialParams()`，必要时重写 `initial()`（如多基因图）或 `destroy()`（如清理 LOD、多 taskId）。

可迁移经验：把「通用流程」放在基类，把「与类型相关的参数与副作用」留给子类实现，便于扩展新图层类型且不破坏现有调用方式。

### 2.5 销毁链：dispose 与 destroy 分工

- `Disposable`：`dispose()` 只做「取消注册的回调、清空列表」，与具体业务无关。
- `LayerSource.destroy()`：先做业务清理（如调 `layerDestroyPostRequest`），再 `this.dispose()`。
- 子类（如 BinHeatMapSpatialLayerSource）在 `destroy()` 中先做自己的清理（如 `clearDownSample`），再 `super.destroy()`。

形成「子类 → 基类 → Disposable」的清理链，资源与订阅不会漏掉。

可迁移经验：基类提供 `dispose()` 做通用清理（事件、订阅），业务类实现 `destroy()` 并在其中先做业务清理再调 `super.destroy()`，便于统一回收与测试。

### 2.6 多子任务源：先 reject 再重建 Promise 列表

`MultiColorImageLayerSource.initial()` 在「已有 initialPromise」时，会先对现有 promise 统一 `reject(InitialRejectReason.RECOVERED_REJECT)`，再置空并创建新的 Promise 数组。这样之前所有 await 方会收到「被取消」的语义，而不是挂在一个已过期的旧请求上。

可迁移经验：当「重新初始化」会使之前的等待失效时，应显式 reject 旧 promise，再创建新 promise，避免旧调用者一直等待或拿到过期结果。

---

## 3. 容易踩坑的地方

### 3.1 initialPromise 的类型在基类与子类不一致

- 基类 `LayerSource`：`initialPromise: AccessiblePromise<PrecomputedUrl>[] | null`，且 `initial()` 里赋值为单元素数组 `[promise]`。
- `MultiColorImageLayerSource`：同一属性语义为「每个基因一个 promise」的数组，且会先 reject 再重建。

若不清楚子类重写了 `initial()` 并改变了「数组长度」的语义，容易误以为 `initialPromise` 长度始终为 1，在遍历或 Promise.all 时出错。建议在基类或文档中明确「单源返回单元素数组，多子任务源返回多元素数组」的约定。

### 3.2 destroy 与 dispose 的调用关系

- `destroy()` 是业务入口，内部应调用 `this.dispose()`。
- 若只调 `dispose()` 不调 `destroy()`，则不会发 `layerDestroyPostRequest` 等后端/资源清理，可能造成服务端任务泄漏。

建议：对外只暴露 `destroy()`，在文档中说明「销毁必须调用 destroy，不要只调 dispose」。

### 3.3 origin 与 relative 互斥

`SpotLayerSource.getInitialParams()` 中明确：`if (origin && relative) throw new Error('origin and relative cannot be both true')`。readme 中也说明「origin 借坐标，relative/select 借非坐标数据」。若上游构造 sourceData 时同时传了二者，会直接抛错。

在构造或校验 `BaseSpotsSourceDataItem` 时，应在一处统一做「至多一个 of origin / relative / select」的校验或类型约束，避免错误数据流到 LayerSource。

### 3.4 未初始化过的 LayerSource 调用 destroy

`LayerSource.destroy()` 中有判断：`if (!this.taskId) { this.dispose(); return; }`，避免在从未成功 initial 的情况下去调 `layerDestroyPostRequest`。这是合理的防御式写法。

若其他子类重写 `destroy()` 且没有先判断「是否已初始化」，可能对未初始化的状态做访问（如 `this.sourceData.properties.taskIdList`），存在运行时错误风险。重写 `destroy()` 时建议保留「未初始化则只 dispose」的逻辑。

### 3.5 getSource 返回 null 的约定

`LayerSourceManager.getSource(sourceData)` 在「没有已缓存且 matchLayerSource 找不到对应类」时返回 `null`。调用方若未做 null 判断就直接用返回值，会报错。当前 `matchLayerSource` 在未匹配时会 `throw new Error(...)`，因此只有「alias 匹配但尚未创建」时才会走到「创建并 set」；若 alias 不符合任何分支，会先抛错，不会返回 null。但若以后改为「未知 alias 返回 null」，调用方就必须做 null 判断。建议在类型或文档中明确：getSource 可能为 null 的时机及调用方义务。

### 3.6 类型断言与后端约定

多处把字符串断言为 `InitialSourceParam`、`NormalInitialTargetParam` 等。若后端后来放宽或修改格式，前端类型会与真实契约不一致。可考虑用 branded type 或少量运行时校验（如格式正则）在开发期发现问题。

---

## 4. 小结

| 维度         | 要点摘要 |
|--------------|----------|
| 异步与复用   | AccessiblePromise 做「单次初始化、多处等待」；initial 通过实例 promise 引用实现幂等。 |
| 类型与扩展   | 用 declare 在子类收窄属性类型；用 alias 结构 + isXxx 守卫驱动工厂选择子类。 |
| 生命周期     | dispose 做通用清理，destroy 做业务清理并调用 dispose；子类重写 destroy 时先做本类清理再 super.destroy。 |
| 数据与缓存   | getSource 用「实际数据来源」（如 origin.alias）做键，避免重复创建；多子任务源在重新 initial 时先 reject 旧 promise。 |
| 易错点       | initialPromise 在单源/多子任务源下语义不同；origin/relative 互斥需在数据层保证；destroy 与 dispose 的职责不要混用。 |

以上内容侧重通用思路与可迁移经验，可直接用于类似「多类型数据源 + 异步初始化 + 策略工厂」的场景（如其他模块的 Source/Manager 设计）。
