# Code Summary: `src/views/visual/layers/helpers/lasso`

> 基于对 lasso 模块的阅读整理，侧重**通用思路与可迁移经验**，便于提升编码水平与知识沉淀。  
> 生成时间：2025-03-07 16:00:00

---

## 1. 不常见或值得留意的语法与用法

### 1.1 可取消订阅的统一抽象：`cancelAble` + `register`

事件/订阅的取消函数被抽象为同一类型并集中管理：

- **类型**：`cancelAble = () => void`（在 `@/base/helpers/event` 中定义）。
- **用法**：`BaseManager` 继承 `Disposable`，提供 `register(...events: cancelAble[])`，在 `dispose()` 时统一执行这些函数，从而取消所有订阅。

要点：无论订阅来自 EventHelper、Signal、定时器还是其他来源，只要返回「无参无返回的取消函数」，都可以 `register()` 进去，生命周期与 Manager 绑定，避免遗漏取消订阅。这是**订阅与生命周期绑定**的通用写法。

### 1.2 Signal 的 `.add()` 返回取消函数

`stereov` 的 `Signal` 使用方式：

- `signal.add(callback)` 返回一个**取消订阅的函数**（即 `cancelAble`），可直接交给 `this.register()`。
- 激活时：`this._deactivateLassoCallbacks = [controller.onPainting(...), controller.onPainted(...)]`，再 `this.register(...this._deactivateLassoCallbacks)`；取消激活时手动执行这些 callback 并清空，同时 `deactivated.dispatch(selectedLayer)`。

可迁移经验：凡「订阅返回取消函数」的 API，都适合与 `register`/Disposable 配合，保证 deactivate/销毁时一致清理。

### 1.3 方法调用记录装饰器 `@record`

`@record` 来自 `methodCallRecord(logger)`，用于在开发环境下对方法做**调用入参 + 调用栈缩进 + 耗时**的日志记录；生产环境通过 `__DEV__` 判断直接返回原 descriptor，无运行时开销。

可迁移点：对关键 Manager 方法使用同一套「可插拔的调用追踪」装饰器，便于排查异步与多图层切换下的调用顺序问题。

### 1.4 `throttle(..., { trailing: true })`

`updateEraserDisabled` 用 `lodash-es` 的 `throttle(fn, 100, { trailing: true })`。`trailing: true` 表示在节流窗口结束后再执行最后一次调用，适合「连续事件结束时要反映最终状态」的场景（如连续切换图层/分组后，最终要更新一次橡皮擦禁用状态）。

注意：若只关心「第一次」或「节流窗口内只执行一次」，用默认或 `leading`；若关心「最后一次」，用 `trailing`。

### 1.5 通过「引用对象」在回调间共享状态：`codeTriggerCloseRef`

保存流程中，`savePointCallBack`（保存成功）会主动关弹窗，而 `closeCallBack` 在「用户点关闭」时需要恢复 lasso 状态，在「代码关弹窗」时不应再恢复。做法是传一个**可变引用对象**：

```ts
const codeTriggerCloseRef = { value: false };
// savePointCallBack 里: codeTriggerCloseRef.value = true; 再 closeDialog
// closeCallBack 里: if (codeTriggerCloseRef.value) { ... return; } else { afterCancel(...); }
```

这样 `closeCallBack` 能区分「用户关」与「代码关」，避免重复执行 afterCancel。可迁移：在多个回调（尤其跨模块的 open/close/save）之间需要共享一个「谁触发了关闭」的标志时，用 `{ value: boolean }` 比全局变量或复杂状态机更清晰、可测。

### 1.6 `requestIdleCallback` 做非关键 UI 更新

多处用 `requestIdleCallback` 把「非关键路径」的 UI 或状态更新延后到空闲时执行，例如：

- 保存后：`requestIdleCallback` 里 emit 自定义分组变更、更新橡皮擦禁用状态；再一个 `requestIdleCallback` 里保存中间态。
- 取消后：`requestIdleCallback` 里检查选中图层、清空筛选、再嵌套一次 `requestIdleCallback` 重绘。

可迁移经验：对不阻塞主流程的 UI 刷新、统计、持久化等，用 `requestIdleCallback` 可降低对交互的干扰；若运行环境可能没有该 API，需做 `typeof requestIdleCallback !== 'undefined'` 判断并 fallback 到 `setTimeout`。

### 1.7 `delay(ms).then(...)` 与「防火盾」标志

`shieldPolygonReuse` 在保存后置为 `true`，避免图层切换触发的 `reuseLassoPolygon`；约 1 秒后用 `delay(1000).then(() => { this.shieldPolygonReuse = false; })` 恢复。这里有意不用 `await delay(1000)`，因为不阻塞主流程，仅「延迟恢复」某个开关。

可迁移：用布尔标志 + 延迟恢复，可以在一段时间内屏蔽某类事件或复用逻辑，避免「保存后立刻切图层」导致的错误复用；注意延迟时间要结合业务（如弹窗关闭动画、接口返回时间）设定，避免过长或过短。

### 1.8 纯函数式坐标变换：`transformPolygons`

`transformPolygons(polygonPaths, offset, scale)` 为纯函数：输入 `Paths`，输出 `number[][]`，内部不依赖 this 或闭包。这种写法利于单测和在其他模块（如导出、统计）中复用，与 Manager 内部状态解耦，是**可迁移的工具函数**写法。

---

## 2. 比较优秀的思路与设计模式

### 2.1 按「能力」区分的图层获取 API

`visualLayersManager` 提供语义化方法：`getLayerForLassoManager(alias)` 与 `getLayerForGroupManager(alias)`。当前实现都是 `getLayer(alias)`，但命名区分了**使用场景**（lasso vs group），后续若不同能力对应不同图层类型或过滤逻辑，只需改这两处实现，调用方不变。可迁移：对同一底层资源按「使用意图」暴露不同入口，便于扩展和阅读。

### 2.2 激活/取消激活的双向信号

- `activated = new Signal<(alias: Alias) => void>()`：激活 lasso 时 `dispatch(selectedLayer)`。
- `deactivated = new Signal<(alias: Alias) => void>()`：取消激活时 `dispatch(selectedLayer)`。

外部通过 `onLassoDeactivated(callback)` 订阅取消激活；内部在 deactivate 时先执行 `_deactivateLassoCallbacks` 再 `deactivated.dispatch`。这样「状态变化」与「谁在用这个状态」解耦，Store/UI 只监听信号即可更新按钮、提示等。可迁移：对「开关型」能力，用成对的 activated/deactivated 信号，比散落的布尔 setter 更清晰、可扩展。

### 2.3 回调列表的「注册即返回取消注册」

`onLassoEnd(callback)` 把 callback 推进 `lassoEndCallbacks`，并返回一个函数，执行时从列表中移除该 callback。这是典型的「订阅返回取消订阅」模式，调用方拿到返回值即可在组件 unmount 或业务结束时取消，避免重复执行或内存泄漏。与 1.1、1.2 一致：**订阅即返回 cancel 函数** 是通用模式。

### 2.4 图层切换时的「防御性 early return」

`syncLassoPainterMode` 里在 `await currentLabelingLayerManager.created` 之后有一行：

```ts
if (this.labelingLayerManager.alias !== current) return;
```

因为存在异步，频繁切换图层时当前选中的可能已经不是 `current`，再继续激活 lasso 会错配。用「当前 manager 的 alias 是否仍等于传入的 current」做一次校验，避免竞态。可迁移：**异步 + 可能被新操作覆盖** 的场景，在 await 后加「当前仍是我要处理的对象」的校验，再继续后续逻辑。

### 2.5 复用前的多条件提前 return

`reuseLassoPolygon` 里通过一系列条件提前 return（无 prev、屏蔽复用、前图层非 spatial、当前非 spatial、无 painter 数据、当前图层不可用等），最后才做真正的复用和 `setPainterData`。逻辑读起来是「先排除所有不能复用的情形，再执行唯一路径」，可读性和维护性都好。可迁移：复杂流程用「早退 + 单一路径」代替深层 if-else 嵌套。

### 2.6 用 `pick` 做选项的「部分恢复」

切换图层复用 lasso 时，只恢复与绘制相关的选项：`pick(prevPainterOption, ['outlineDash', 'brushWidth', 'paintMode'])`，避免把不该跨图层复用的配置带过去。取消保存时同样用 `pick` 恢复这三项。可迁移：从「上一状态」恢复时，用 `pick`/白名单明确只恢复哪些字段，避免隐式依赖或误恢复。

### 2.7 工具方法委托给当前图层，保持单一数据源

`getSelectPolygons()`、`getPainterData()`、`labelingController`、`labelingLayerManager` 等均通过当前选中的 `labelingLayerManager` 委托出去，而不是在 LassoManager 里再存一份路径或控制器。这样「当前选中的图层」是唯一数据源，避免双源不一致。可迁移：Manager 作为协调层时，状态尽量只保存在最底层的「资源」上，Manager 只做转发和编排。

---

## 3. 容易踩坑的地方

### 3.1 异步与「当前图层」的竞态

`syncLassoPainterMode`、`reuseLassoPolygon` 都依赖 `await currentLabelingLayerManager.created`，若用户在这期间切换图层，必须用 `this.labelingLayerManager.alias !== current` 或等效方式做校验，否则会把 lasso 状态应用到错误的图层。同类场景（如弹窗关闭后再切图层）也要考虑「异步完成时上下文是否仍有效」。

### 3.2 保存后关弹窗的「两条路径」

保存成功时由 `afterSave` 里调用 `closeStatisticsDialog`，会触发 `closeCallBack`。若不用 `codeTriggerCloseRef` 区分，`closeCallBack` 会再执行 `afterCancel`，导致刚保存完又被恢复成未保存状态。凡是「代码关弹窗」与「用户关弹窗」都会走到同一个 close 回调时，必须用标志位区分，避免重复执行取消逻辑。

### 3.3 `getLayerForGroupManager` 与 `getLayerForLassoManager` 的混用

`_checkLabelingLayer`、`deactivateLasso` 里用 `getLayerForGroupManager`，而 `syncLassoPainterMode`、`reuseLassoPolygon` 用 `getLayerForLassoManager`。当前两者实现相同，但语义不同；若以后分支（例如按图层类型过滤），需要统一约定：**校验/禁用**用哪一类、**复用/同步**用哪一类，避免漏判或误判「是否支持 lasso」。

### 3.4 `updateEraserDisabled` 的节流与调用时机

该函数被多处调用（图层选中、分组/标签选中变化、激活/取消激活 lasso 等）。若不用 throttle，快速连续操作会重复执行；若只用默认 throttle 而不用 `trailing: true`，最后一次状态可能不更新。需要根据「是否必须在最后一次操作后更新」选择 leading/trailing 或 debounce。

### 3.5 在回调中再调 `requestIdleCallback`

`afterCancel` 里先 `requestIdleCallback(async () => { ...; requestIdleCallback(() => { ... }); })`，即嵌套的 idle。嵌套可以接受，但要清楚：内层会在「下一次」空闲执行，整体完成时间不可控，若有强顺序依赖（例如必须先清筛选再重绘），要保证顺序在代码里写清楚，必要时用 async/await 串行而不是仅依赖两次 idle。

### 3.6 类型断言与运行时检查

多处使用 `as AllStereoLabelingLayerManager`，说明类型系统无法从 `getLayer` 推断出「支持 lasso 的图层」。运行时仍依赖 `isLabelAble`、`labelingController` 等检查。可迁移：在类型上尽量用泛型或窄类型表达「支持 lasso 的图层」，减少 as；同时保留运行时的 guard，避免误把不支持 lasso 的图层当支持用。

---

## 4. 小结

| 类别         | 要点摘要 |
|--------------|----------|
| 订阅与生命周期 | `cancelAble` + `register` + Signal `.add()` 统一管理取消；订阅函数返回取消函数便于与 Disposable 配合。 |
| 异步与竞态   | await 后校验「当前仍是要处理的对象」；用布尔标志 + 延迟恢复屏蔽短时间内的重复逻辑。 |
| 回调间共享   | 用 `{ value: boolean }` 在 open/close/save 多个回调间区分触发源，避免重复执行。 |
| 性能与体验   | 非关键更新用 `requestIdleCallback`；需要「最后一次」的节流用 `throttle(..., { trailing: true })`。 |
| 状态与恢复   | 用 `pick` 白名单做部分选项恢复；状态只存在底层资源，Manager 做委托与编排。 |
| 可测试与复用 | 纯函数（如 `transformPolygons`）与「订阅返回取消」的 API 便于单测和复用。 |

以上内容均从 lasso 模块归纳，并抽象为可迁移的写法与注意点，便于在其他模块（如 group、split、多图层交互）中复用和避坑。
