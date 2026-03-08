# split 模块技术总结

> 基于 `src/views/visual/layers/helpers/split/` 的代码分析，提炼可复用的语法、设计模式与易错点，用于技术沉淀与编码水平提升。侧重通用思路与可迁移经验，而非业务细节。

---

## 1. 不常见的特殊语法与用法

### 1.1 泛型 Mixin 函数：约束基类为「可 new 的类」

`LabelingManagerSplitMixin` 和 `LayerManagerSplitMixin` 使用「泛型 + 构造函数类型」约束被混入的基类，保证返回的类既继承 Base 又实现新接口：

```typescript
// 普通类：要求 Base 是「可 new 的、实例为 LabelingManager 的类」
export function LabelingManagerSplitMixin<
  TBase extends { new (...args: any[]): LabelingManager },
>(Base: TBase) {
  class LabelingManagerSplit extends Base implements ILabelingManagerSplit {
    constructor(...args: any[]) {
      super(...args);
    }
    // ...
  }
  return LabelingManagerSplit;
}

// 抽象类：用 AbstractConstructor 约束抽象基类
type AbstractConstructor<T = object> = abstract new (...args: any[]) => T;
export function LayerManagerSplitMixin<
  LayerManager extends BaseLayerManager,
  TBase extends AbstractConstructor<StereoMapLayerManager<LayerManager>>,
>(Base: TBase) {
  abstract class SplitLayerManager extends Base implements ISplitLayerManager {
    // ...
  }
  return SplitLayerManager;
}
```

要点：  
- 普通 Mixin 用 `new (...args: any[]): InstanceType` 约束；  
- 若基类本身是 `abstract class`，需用 `abstract new (...args: any[]): T`，否则无法 `extends`。  
这样 Mixin 既可被装饰器风格使用（如 `@LabelingManagerSplitMixin`），又保证类型正确。

### 1.2 AccessiblePromise + requestIdleCallback + register 清理

在需要「先返回 Promise，在空闲时再完成」的场景里，把「可外部 resolve 的 Promise」和「空闲回调」结合，并用基类的 `register` 做取消清理：

```typescript
const accessiblePromise = new AccessiblePromise<number>();
const idleId = requestIdleCallback(async () => {
  const coords = await offsetRenderFunc(outCoordsMap);
  coordsLength += coords.length;
  accessiblePromise.resolve(coordsLength);
});
this.register(() => cancelIdleCallback(idleId));
return accessiblePromise;
```

要点：  
- 调用方立刻拿到 Promise，不阻塞主流程；  
- 实际工作在 requestIdleCallback 中执行，避免阻塞交互；  
- `register` 在 dispose 时统一执行 `cancelIdleCallback`，避免组件销毁后仍执行或泄漏。  
可迁移到任何「延迟执行 + 需在销毁时取消」的逻辑（如延迟统计、延迟上报）。

### 1.3 Pinia storeToRefs 解构重命名

从 store 的 refs 中取多个字段并重命名，便于在模块内使用语义化名称：

```typescript
const { splitMode: splitByGroup, projectionState } = storeToRefs(visualMapStore);
```

这样 `splitByGroup` 与业务含义一致，且保持响应式。若同时需要 store 上的方法，可再解构：`const { isCustomGroup, getVisualTaskId } = visualMapStore;`。

### 1.4 联合类型分支的类型断言

在「同一字段在不同分支类型不同」时，用类型断言缩小到具体类型再传给接口，而不是把整个联合塞进泛型：

```typescript
const source = this.isSplitByCustomGroup ? <GroupId>id : <Sid>sid;
const params: VisualizationCategoryPostRequestParams = {
  // ...
  source,
  // ...
};
```

要点：先通过分支判定，再对 `id`/`sid` 做断言，保证 `source` 在类型上满足 `VisualizationCategoryPostRequestParams`，避免联合类型导致的类型错误。

### 1.5 方法内局部 interface

在单个方法内使用的小型数据结构，在方法顶部定义为局部 interface，避免污染模块顶部的类型空间：

```typescript
const offsetRenderFunc = async (coordsMap: ChunkCoordsMap) => {
  interface clusterResponseData {
    [labelId: string]: number[];
  }
  const requestPromiseLi: Promise<clusterResponseData>[] = [];
  // ...
};
```

适合仅在本方法或闭包内使用的「响应/中间结构」类型。

### 1.6 通过自定义 attribute 标识与清理 Canvas

Canvas 由业务动态创建并挂到 DOM 上时，用自定义 attribute 标记类型，清理时按类型批量移除，避免残留或误删：

```typescript
static CANVAS_TYPE = 'splitGrid';
// 创建前先清掉同类型旧 canvas
const oldCanvas = this.sliceViewPanel!.element.querySelectorAll(
  `canvas[canvas-type='${SplitGridPainter.CANVAS_TYPE}']`,
);
oldCanvas.forEach((canvas) => canvas.remove());
// ...
canvas.setAttribute('canvas-type', SplitGridPainter.CANVAS_TYPE);
canvas.setAttribute('layerName', this.layerAlias);
```

要点：同一视图可能多次进入/退出模式，先清同类型再创建，避免重复叠加；用 `canvas-type` 而非 class，避免与样式耦合。

### 1.7 方法调用记录装饰器（@record）

对「入口级」异步方法用装饰器做统一日志/埋点，便于排查与审计：

```typescript
const record = methodCallRecord(logger);
@record
async activate() { ... }
@record
async deactivate() { ... }
```

与 multiGene 等模块一致，适合需要追踪「谁在何时调了哪些入口」的场景。

---

## 2. 比较优秀的思路与设计模式

### 2.1 Manager + Helper 职责分离

- **ClusterSplitManager**（index.ts）：单例，负责生命周期（activate/deactivate/update）、事件订阅（split 模式切换、图层切换、自定义组删除等）、以及 prepare/restore 等「全局状态暂存与恢复」。  
- **ClusterSplitHelper**（helper.ts）：每次激活时 new，负责当前图层下的 split 数据（getGridSplitData）、请求与坐标分组（getSplitByClusterData）、渲染调度（render、drawGrid）、以及 fit 视图、getRecoveredPathsMap 等。  

Manager 不关心网格怎么算、怎么画；Helper 不关心何时进入/退出、事件从哪来。可迁移到所有「有明确生命周期、且每轮生命周期内有一块独立业务子域」的场景。

### 2.2 独立 Painter 类：渲染与投影缓存

**SplitGridPainter** 单独负责：  
- Canvas 的创建/挂载/尺寸/显示隐藏；  
- 网格点的世界坐标生成与投影到屏幕坐标；  
- 投影矩阵缓存（`lastViewProjectionMat`）+ 网格线坐标缓存（`gridLinesPoints`）+ 投影结果缓存（`cachedPoints`），仅在投影矩阵变化时重算；  
- 浮点数组比较（`arraysEqual` 带 epsilon）决定是否复用缓存；  
- 监听投影参数与 context 变化，自动 `draw()` 或 `updateCanvasSize()`。  

业务 Helper 只持有 painter 实例并调用 `draw(option)`、`getLinesPaths()` 等，不碰 Canvas API。这样「绘制与坐标变换」集中在一处，易于测试和复用（例如 getScaledImage 在临时 canvas 上重绘）。

### 2.3 批量 stroke 与 Set 去重画线

画网格线时先收集所有端点，用 Set 对坐标去重（toFixed(6) 避免浮点噪声），再按垂直线/水平线批量 moveTo/lineTo，最后**只调用一次** `stroke()`：

```typescript
const xCoords = new Set<string>();
const yCoords = new Set<string>();
for (let i = 0; i < points.length; i++) {
  xCoords.add(points[i][0].toFixed(6));
  yCoords.add(points[i][1].toFixed(6));
}
this.context.beginPath();
for (let x of xCoords) {
  this.context.moveTo(Number(x), 0);
  this.context.lineTo(Number(x), this.canvas!.height);
}
for (let y of yCoords) {
  this.context.moveTo(0, Number(y));
  this.context.lineTo(this.canvas!.width, Number(y));
}
this.context.stroke();
```

避免在循环里多次 `stroke()` 造成多余绘制与主线程阻塞，可迁移到所有「大量平行/垂直线段」的 2D 绘制。

### 2.4 prepare / restore 模式

进入 split 模式前，把与当前功能冲突的 UI 状态保存并关闭；退出时按保存值恢复：

```typescript
private _preMiniMap: { visible: boolean; disabled: boolean };
private _preTemplate: { visible: boolean; disabled: boolean };
prepare() {
  this._preMiniMap = cloneDeep(tools.value.miniMap);
  this._preTemplate = cloneDeep(tools.value.template);
  tools.value.miniMap.visible = false;
  tools.value.miniMap.disabled = true;
  // ...
}
restore() {
  tools.value.miniMap.visible = this._preMiniMap.visible;
  // ...
}
```

适合「独占式」功能（如全屏、某种编辑模式），避免在业务里散落 if/else。

### 2.5 事件节流：leading: false, trailing: true

对「模式切换」类事件使用 throttle，且只保留最后一次：

```typescript
commonEventCenter.on(
  COMMON_EVENTS.VISUAL_SPLIT_CHANGED,
  throttle(
    (data) => { /* activate / update / deactivate */ },
    200,
    { leading: false, trailing: true },
  ),
);
```

在短时间内多次切换时，只执行最后一次状态，避免中间态闪烁或重复请求。可迁移到所有「连续触发、只关心最终状态」的 UI 事件。

### 2.6 Mixin 只扩展「切面」能力

- **LayerManagerSplitMixin**：仅增加 `isSplitMode`、`enableSplitMode()`、`disableSplitMode()`，与底层 layerManager 的 split 开关一一对应。  
- **LabelingManagerSplitMixin**：增加 `getCustomGroupQuery`、`getCLusterGroupQuery`、`getSplitPolygonCondition`，并**重写** `appendLassoCondition`：在 split 激活时用 `getRecoveredPathsMap()` 生成条件并追加，否则走 `super.appendLassoCondition`。  

Mixin 不承载主流程，只在不改原类主流程的前提下，插入或改写少数「切面」方法，便于多套能力组合（如 group + split 同时存在）。

### 2.7 网格线 path 的「带 gap 矩形」与布尔运算

网格线参与选中（lasso）时，用「线段 + gap 扩展成的矩形 path」做合并与差集，避免网格交点被「偶数次选中」导致布尔运算错误取消选中：

```typescript
// 并集合并所有网格线 path，再与选中区域做差集
const solutionPaths = painter.mergePaths(
  [],
  this.painter?.getLinesPaths(),
  PolyFillType.pftNonZero,
);
const diffPaths = painter.diffPaths(
  selectPaths,
  solutionPaths,
  PolyFillType.pftEvenOdd,
);
```

getLinesPaths 里每条线用 `getHorizontalLinePath` / `getVerticalLinePath` 生成带 gap 的 A→B→C→D 矩形 path，这样交点区域在拓扑上一致，布尔结果稳定。可迁移到所有「线状几何参与选区运算」的场景。

### 2.8 浮点数组相等比较（带 epsilon）

投影矩阵等 Float32Array 是否变化，不用 `===`，而用逐元素 epsilon 比较：

```typescript
private arraysEqual(a: Float32Array, b: Float32Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Math.abs(a[i] - b[i]) > 0.000001) return false;
  }
  return true;
}
```

避免浮点误差导致缓存失效、重复计算。可抽成公共 util，在各类「矩阵/向量比较」中复用。

---

## 3. 容易踩坑的地方

### 3.1 初始化时对「当前选中图层」做空值检查

`ClusterSplitHelper.init()` 里用 `visualLayersManager.getSelectedLayer()`，若未选图层会为 null，后续 `getLayerForClusterSplitManager(layerAlias)` 会出错。必须在入口处显式 throw，避免隐藏的运行时错误：

```typescript
const layerAlias = visualLayersManager.getSelectedLayer();
if (!layerAlias) throw Error('未选择layer');
```

类似地，对 `labelingLayerManager`、`splitData`、`painter` 等依赖在访问前做存在性检查或 throw，便于快速定位。

### 3.2 scale / inverseScale 与 getLinesPaths 的 scaler 必须一致

`getRecoveredPathsMap` 里用 `scale = 10` 把世界坐标放大再参与 path 运算，反向时用 `inverseScale = 1/10` 把网格索引算回。`getLinesPaths` 里同样用 `scaler = 10` 生成网格线 path。两处必须使用同一倍数，否则「path 坐标 ↔ 网格 index」会错位，导致选区落到错误 cluster。修改 scale 时需两处同步。

### 3.3 requestIdleCallback 兼容性

`requestIdleCallback` 在部分浏览器中不存在，若需兼容需做 polyfill 或降级到 `setTimeout(..., 0)`。当前代码未做兼容处理，在目标运行环境需确认。

### 3.4 异步销毁与 delay

`SplitGridPainter.deactivate()` 里会 `this.canvas.remove()` 后 `await delay()` 再 `dispose()`。若外部在 deactivate 未完成时再次激活或访问 painter，可能读到半销毁状态。建议：对外只暴露「异步销毁」语义，并在 Manager 层保证「先 await deactivate 再创建新 helper」。

### 3.5 _helpers 逆序 splice 避免索引错乱

在 `deactivate` 中遍历并销毁多个 helper 时，若正序 `splice(i, 1)` 会改变后续元素下标，容易漏删或错删。从后往前遍历可避免：

```typescript
for (let i = this._helpers.length - 1; i >= 0; i--) {
  const helper = this._helpers[i];
  helper.destroy();
  this._helpers.splice(i, 1);
}
```

可迁移到所有「遍历数组并删除当前项」的逻辑。

### 3.6 splitData 的 offsets 初始化与引用

`getGridSplitData` 里用 `offsets: new Array(gridCount).fill(0)` 初始化，随后在 `splitData.ids.forEach` 里对 `splitData.offsets[index]` 赋值为 `[number, number]`。注意 `fill(0)` 填的是同一引用（若填对象），这里填的是原始值 0，再被覆盖为元组，无问题；若将来改成 `fill([])`，则所有元素会共享同一数组引用，必须改为 `Array.from({ length: gridCount }, () => [])` 之类。

---

## 4. 小结

| 类别         | 要点摘要                                                                 |
|--------------|----------------------------------------------------------------------------|
| 语法/用法    | 泛型 Mixin 约束基类、AccessiblePromise + requestIdleCallback + register、storeToRefs 重命名、方法内 interface、自定义 attribute 标识 Canvas、@record |
| 设计/模式   | Manager/Helper 分离、独立 Painter + 投影与浮点缓存、批量 stroke + Set 去重、prepare/restore、throttle trailing、Mixin 切面扩展、网格 path 布尔运算、Float32 相等用 epsilon |
| 易错点      | 未选图层等空值检查、scale/scaler 两处一致、requestIdleCallback 兼容、异步销毁顺序、逆序 splice 删除、避免 fill([]) 共享引用 |

以上内容均从 `split` 目录下的 `helper.ts`、`painter.ts`、`index.ts`、`labelingManager.mixin.ts`、`layerManager.mixin.ts` 中归纳，侧重可迁移到其他模块的通用写法与注意点。
