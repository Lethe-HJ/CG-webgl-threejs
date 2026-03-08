# Code Summary: engine.ts 与 Helpers 层技术要点

> 基于 `src/views/visual/layers/helpers/engine.ts` 及周边 helpers 的通用技术沉淀，侧重可迁移思路与易踩坑点。

---

## 1. 不常见或值得注意的语法与用法

### 1.1 将 resolve 存为实例属性，用于延迟完成 Promise

```typescript
this.layersInitCompletePromise = new Promise((resolve) => {
  this.resolveLayersInitComplete = resolve;
});
```

**要点**：在构造函数里创建 Promise，把 `resolve` 存到 `this.resolveLayersInitComplete`，便于在异步回调（如 `handleLayersChanged`）里在“合适时机”再调用，从而让“首帧加载并 fitView 完成”这一事件可被外部 `await`。这是典型的 **Deferred Promise** 用法，在需要“由外部/回调决定完成时机”时很有用。

### 1.2 getter 返回 Promise，统一“就绪”入口

```typescript
get ready(): Promise<EngineManager> {
  return this.visualLayersManager.engineManager;
}
```

**要点**：对外只暴露一个 `ready`，所有依赖引擎的逻辑都通过 `this.ready.then(...)` 或 `await this.ready` 执行，避免在 Helper 内部到处写“等 engine 再干活”的重复逻辑。注意每次访问 `ready` 都会拿到**同一个** Promise（来自 `engineManager`），不会重复创建。

### 1.3 基类单例：用构造函数名做 key 的 Map 单例

```typescript
// BaseSingletonManager
const className = this.constructor.name;
if (BaseSingletonManager.instances.has(className)) {
  throw new Error(`${className} is a singleton class`);
}
BaseSingletonManager.instances.set(className, this);
```

**要点**：单例不是“全局唯一实例”，而是“每个子类一个实例”；用 `constructor.name` 做 key，子类无需写 `getInstance` 即可由基类统一管理。注意在压缩后 `constructor.name` 可能被改写，若需上线需确认或改用显式类名。

### 1.4 事件监听的一次性自注销

```typescript
engine.viewer.layerManager.layersChanged.add(handleLayersChanged);
// 在 handleLayersChanged 里条件满足后：
engine.viewer.layerManager.layersChanged.remove(handleLayersChanged);
```

**要点**：在回调内部在满足条件后移除自身，实现“只响应一次”的监听，避免重复执行和泄漏。配合 `setTimeout` 做防抖，避免首帧未稳定时多次触发。

---

## 2. 值得借鉴的设计思路与模式

### 2.1 “引擎就绪”与 API 分层：同步 vs 异步

- **异步封装**：大部分“设置类”方法（如 `setTissueMaskVisible`、`fitView`、`setScaleBarOptions`）内部用 `this.ready.then((engine) => { ... })`，不抛错，调用方无需关心引擎是否已就绪。
- **同步 + 守卫**：对性能敏感、调用频繁的接口（如 `project`、`unProject`、`getViewerZoom`、`setViewerZoom`）采用同步实现，并在方法开头 `if (!this.engine) throw new Error('engine not ready')`，把“必须在就绪后调用”的契约交给调用方。

**可迁移经验**：同一模块内可同时提供“异步安全”的封装与“同步高性能”的底层 API，在注释或类型上明确约定使用场景（如注释中“需要等引擎加载完成后再调用”），避免混用导致竞态或误用。

### 2.2 Helper 作为“引擎能力门面”

`EngineHelper` 不持有引擎的创建逻辑，只依赖 `VisualLayersManager` 的 `engineManager` Promise，对外提供：

- 视口（fitView、zoom、坐标变换）
- 组织轮廓（tissue mask）
- 比例尺（scale bar）
- HTTP 头、缩放监听等

其他 helpers（如 split、group、lasso）通过 `engineHelper` 使用这些能力，而不是直接依赖 `EngineManager`。这样“引擎能力”的入口统一、易 mock、易替换。

### 2.3 生命周期与资源注销（Disposable）

`EngineHelper` 继承 `BaseSingletonManager` → `BaseManager` → `Disposable`。`Disposable` 提供 `register(...events: CancelCallback[])` 和 `dispose()`，用于统一登记和取消监听/订阅。在需要“随视图或 Helper 销毁而清理”的逻辑里，应把取消函数 `register` 进去，避免泄漏。当前 `engine.ts` 内未直接使用 `register`，但 `firstLoadLayersAndFitView` 里对 `layersChanged` 的监听在回调里做了 `remove`，属于手动生命周期管理；若类有 `dispose`，更稳妥的做法是把 `remove` 封装成 `register(cancel)` 以便统一在 `dispose` 时执行。

### 2.4 防抖与“首次稳定”逻辑

`firstLoadLayersAndFitView` 中：

- 监听 `layersChanged`，当存在可见且非 "new layer" 的图层时，`clearTimeout(timer)` + `setTimeout(..., 100)` 再执行 `containAllLayers` 和 `resolveLayersInitComplete`。
- 既防抖又保证在“有实质内容”后再 fit 和 resolve，避免首帧空白或多次无意义 fit。

这种“事件 + 条件判断 + 防抖 + 单次 resolve”的模式，在“等待某个异步状态稳定”的场景里可复用。

---

## 3. 容易踩坑的地方

### 3.1 同步 API 在引擎未就绪时抛错

`project`、`unProject`、`getViewerZoom`、`setViewerZoom` 等是同步的，若在 `engine` 尚未赋值时调用会直接 `throw new Error('engine not ready')`。调用方若在页面初始化或路由刚切到可视化时立刻调用（例如 `enableHandTool` 里直接使用 `engineHelper.engine`），可能遇到未就绪。建议：要么在调用路径上保证在 `layersInitCompletePromise` 或 `ready` 之后再调，要么在业务侧做一次 `await this.engineHelper.ready` 再使用同步 API。

### 3.2 直接使用 engineHelper.engine 的竞态

例如 `enableHandTool()` 中：

```typescript
const engine = engineHelper.engine;
if (!engine) throw Error('engine not found');
```

这里没有通过 `ready` 或 `layersInitCompletePromise` 等待，若在引擎尚未注入前调用会抛错。与 3.1 一致：凡是用到 `engineHelper.engine` 的地方，应确保在“引擎已就绪”之后调用，或改为 `const engine = await this.engineHelper.ready` 再使用。

### 3.3 @ts-ignore 与类型安全

`firstLoadLayersAndFitView` 里对 `engine.viewer.layerManager` 的访问使用了 `//@ts-ignore`，说明 stereov 的类型未暴露或与当前用法不一致。长期更稳妥的方式是：在 stereov 侧补充类型声明，或在本项目中用 `.d.ts` 扩展接口，避免大面积 ts-ignore 掩盖后续类型变更带来的错误。

### 3.4 同步与异步方法命名与约定

当前存在“同名能力”的同步版与异步版，例如：

- `getViewerZoom()` 同步，可能抛错；
- `getEngineScale()` 为 async，内部 `await this.ready` 再取 zoom。

若命名或注释不区分“必须就绪后调用”与“内部自等待”，容易让调用方误用。建议在 JSDoc 或命名上区分（如 `getViewerZoomWhenReady()` 或明确写“仅可在 engine 就绪后调用”），并在文档中说明推荐使用场景。

### 3.5 单例与 destroy

`BaseSingletonManager.destroy()` 里调用了 `BaseSingletonManager.clearInstances()`，会清空**所有**子类的实例 Map。若存在多个 SingletonManager 子类，销毁其中某一个就会导致其它单例的 Map 被清空，但已持有引用仍可能被使用，造成状态错乱。若需要“按类销毁”，应改为按 className 只删除当前类实例，而不是 `clearInstances()` 全清。

---

## 4. 小结表

| 类别           | 要点 |
|----------------|------|
| 语法/用法      | Deferred Promise（resolve 存实例属性）；getter 返回 Promise 作统一就绪入口；构造函数名单例；事件回调内自注销 |
| 设计模式       | 就绪态分层（异步封装 vs 同步高性能 API）；Helper 作为引擎门面；Disposable 统一注销；防抖 + 条件 + 单次 resolve |
| 易踩坑         | 同步 API 未就绪抛错；直接使用 `engine` 的竞态；@ts-ignore 弱化类型安全；同步/异步 API 约定不清；单例 destroy 全清 Map 的影响 |

以上内容基于对 `engine.ts` 及其在 `VisualLayersManager`、split helper 中的使用方式分析整理，侧重通用思路与可迁移经验，便于在其他模块（如其他 helpers 或新视图）中复用和避坑。
