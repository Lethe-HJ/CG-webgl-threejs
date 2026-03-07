# multiGene 模块技术总结

> 基于 `src/views/visual/layers/helpers/multiGene/` 的代码分析，提炼可复用的语法、设计模式与易错点，用于技术沉淀与编码水平提升。

---

## 1. 不常见的特殊语法与用法

### 1.1 模板字面量类型（Template Literal Types）用于存储键

`MidCountKey` 使用 TypeScript 模板字面量类型约束 IndexDB 的 key 形态，避免运行时拼错或形态不一致：

```typescript
export type MidCountKey =
  | `${typeof MAX_MID_VALUE_STORE_KEY_PREFIX}_${Alias}_${GeneKey}`
  | `${typeof MAX_MID_VALUE_STORE_KEY_PREFIX}_${Sid}_${BinSize}_${Omics}_${ColoringType}_${GeneKey}`;
```

要点：用 `typeof 常量` 参与模板类型，既保证前缀一致，又保留“全片 / 多片”两种 key 形态的联合类型，便于类型安全地生成和校验 key。

### 1.2 可外部 resolve/reject 的 Promise（AccessiblePromise）

模块中大量使用 `AccessiblePromise`：在异步流程中先创建 Promise，在“稍后”的某个回调或请求返回后再 `resolve`/`reject`，用于：

- 在 `forEach` 等非 async 友好结构中收集多个“未完成”的 Promise，再统一 `Promise.all(allDone)` 等待；
- 请求合并场景下，为每个“乘客”请求挂一个 `_arrival` Promise，巴士“到站”后按请求拆分结果并分别 resolve。

典型用法：创建 → 放入数组 → 在异步回调中 `done.resolve()`，调用方 `await Promise.all(allDone)`。

### 1.3 交叉类型 + 可选扩展字段（Activatable）

通过交叉类型给请求参数“挂”一个可选的 Promise 字段，既不改原有请求结构，又能把“本次请求的响应”和请求绑定在一起：

```typescript
type Activatable<T> = T & { _arrival?: AccessiblePromise<ArrivalData> };
```

这样 `MergeRequestBusStation.queue(item)` 可以给 `item._arrival` 赋值并返回，调用方 await 的正是自己这份请求对应的结果，适合“多请求合并、单次发车、按请求拆分响应”的模式。

### 1.4 方法调用记录装饰器（@record1 / @record2）

通过 `@record1`、`@record2` 等装饰器对类方法做统一的方法调用日志/埋点，而不在业务逻辑里写满 log：

```typescript
const record1 = methodCallRecord(logger1);
@record1
public async run(alias: Alias) { ... }
```

适合需要追踪“谁在什么时候调了哪些入口”的场景，便于排查和审计。

### 1.5 requestIdleCallback 做非关键写入

IndexDB 的写入放在 `requestIdleCallback` 中，避免阻塞主线程和首屏渲染：

```typescript
return new Promise<void>((resolve, reject) => {
  requestIdleCallback(async () => {
    try {
      await this.dbCacher.set(key, typeArray, geneTypeArraySerializer);
      resolve();
    } catch (e) { reject(e); }
  });
});
```

注意：idle 回调执行时机不确定，若强依赖“写入完成后再读”，需用 Promise 串好顺序；否则适合“可延迟的缓存写入”。

### 1.6 序列化 / 反序列化用 ArrayBuffer 存 TypedArray

Uint32Array 等 TypedArray 存 IndexDB 时，用 `content.buffer` 序列化、`new Uint32Array(serializedContent)` 反序列化，避免直接存对象导致的结构或兼容问题：

```typescript
function geneTypeArraySerializer(content: Uint32Array) {
  return content.buffer;
}
function geneTypeArrayDeserializer(serializedContent: ArrayBuffer) {
  return serializedContent ? new Uint32Array(serializedContent) : undefined;
}
```

---

## 2. 比较优秀的思路与设计模式

### 2.1 “巴士站台”式请求合并（MergeRequestBusStation）

把短时间内的多笔“相同维度”的请求视为“乘客”，凑满一车（点数达到上限）或超时后“发车”一次，后端只处理合并后的一笔请求，返回后再按每笔请求的 `showCoords` 用哈希拆回给各自的 `_arrival` Promise。

要点：

- 用 `taskId + condition.query + binSize` 等生成站台名，同一业务维度的请求进同一站台；
- “满员即发车” + “首客上车后启动定时发车”，兼顾吞吐与延迟；
- 到达逻辑用 `hashCoordinates` 把合并结果中的每个点归到对应请求，保证多请求、多 chunk 下结果正确归属。

适合：高并发、同参数/同查询的短时多请求（如视口内多 chunk 同时要基因数据）。

### 2.2 Manager + Helper 的分层与单例 Manager

- **MultipleGeneManager**：单例，按图层（alias）管理多个 **MultipleGeneHelper**，只暴露当前激活图层的 `update`、`run` 等；
- **MultipleGeneHelper**：每个图层一个实例，负责该图层的缓存、请求、渲染和事件。

这样“多图层”的切换和“单图层内多基因”的细节分离清晰，单例 Manager 便于全局一处注册事件、切换激活图层。

### 2.3 缓存优先 + 按需回源（maxMidValue / chunk 数据）

先按 key 查 IndexDB，命中则直接 resolve；未命中则加入“待请求列表”，统一发一次接口，再把结果写回缓存并 resolve 对应 Promise。这样同一基因、同一 chunk 在多次视口变化中只请求一次，后续都走缓存。

### 2.4 事件与生命周期用“取消函数”集中管理

通过 `onVisibleChunksChanged` 等返回的 cancel 函数，以及 `this.register(cancel)`，在 `deactivate`/`destroy` 时统一 `this.dispose()`，避免重复监听和泄漏。例如“全基因可见 chunk 变化”和“多基因当前图层可见 chunk 变化”都通过 register 登记，便于在 Manager/Helper 销毁时一次性清理。

### 2.5 全基因 / 多基因模式与“避免重复全基因”的守卫

用 `geneMode`（all / multi）和 `isTargetAllGene` 区分全基因与多基因；在 `update` 里若当前已是全基因且目标仍是全基因则直接 return，避免无意义的重复渲染和请求。类似“状态机”的守卫在入口处统一写，逻辑清晰。

### 2.6 进度条与“可手动控制”的进度状态

通过 `engineLoadingProgress` 和 `engineProgressManualControl` 在 `beforeUpdate` 时打开手动控制、在 `afterUpdate` 时关闭并设 100%；在 `activateProgress(promiseList)` 里根据 promise 完成数按比例更新 progress。这样进度条与多 chunk 的异步加载一一对应，且不会和别的自动进度逻辑冲突。

### 2.7 坐标哈希按投影类型选择

根据 UMAP / 空间投影选择 float 或 uint 的哈希函数，保证同一套“请求合并 + 结果拆分”逻辑在两种坐标下都正确：

```typescript
function getHashCoordinatesFunc(projection: ProjectionType) {
  const coordsType = projection === ProjectionType.umap
    ? CoordsNumberTypeEnum.float
    : CoordsNumberTypeEnum.uint;
  return getHashCoordinatesFuncFromType(coordsType);
}
```

---

## 3. 容易踩坑的地方

### 3.1 forEach + async 回调不会等待

多处使用 `coordsMap.forEach(async (coords, chunkId) => { ... })` 或 `geneItems.forEach(async (geneItem) => { ... })`。`forEach` 不会等待 async 回调，因此：

- 若依赖“所有 chunk 都处理完”再执行后续逻辑，不能依赖 forEach 后的代码“自然等待”；
- 本模块通过“在回调内把 Promise  push 到 allDone，外部再 `await Promise.all(allDone)`”规避了这一点，但若有人把 forEach 改成“以为会等待”的写法，就会变成“先执行完 forEach 再立刻执行后面的 await”，导致时序错误。

建议：需要“并发执行并等待全部完成”时，用 `for...of` + `Promise.all` 或显式 `allDone.push(promise)` + `await Promise.all(allDone)`，避免误以为 forEach 会等 async。

### 3.2 发车时 pointsCount 未在“满员即发”分支更新

`MergeRequestBusStation.queue()` 中：

- 若“满员即发车”，会调用 `this.departure()`，内部会 `clear()` 把 `pointsCount` 置 0，因此不更新 `this.pointsCount = newPointsCount` 在逻辑上是对的；
- 但存在一行无意义的 `this.pointsCount;`（仅读取未赋值），容易让人误以为漏写了赋值，或误改逻辑。

建议：删掉该行或加注释说明“发车分支由 clear() 重置，此处不更新”，避免后续维护误解。

### 3.3 合并请求前 unset 扩展字段防止下发给后端

发车时对合并后的请求做了 `mergedData = { ...mergedData, _arrival: undefined }`，避免把前端扩展的 `_arrival` 等字段带给后端。若将来在请求体上挂更多“仅前端用”的字段，要记得在真正发请求前同样去掉，否则可能引发后端校验或序列化问题。

### 3.4 IndexDB 的“有则跳过”与幂等

当前存储逻辑是“若 key 已存在则不再写入”。在“同一 key 可能被多次触发写入”的场景下这是幂等的，但若业务变为“同一 key 需要更新为最新值”，就需要改成“存在则覆盖”或先删后写，否则会一直读到旧数据。

### 3.5 全基因监听用 Set 防重复，但取消时要 delete

`allGeneWatchRecords` / `multiGeneWatchRecords` 用 Set 保证同一 alias 只注册一次可见 chunk 监听；取消函数里需要 `delete(alias)`，否则销毁后再次创建同 alias 的 Helper 时可能因 Set 里仍存在而误判为已监听，导致不再注册。当前实现已在 cancel 中 delete，后续若复制类似模式要注意“注册/取消”成对并更新 Set。

### 3.6 多基因时 getGeneChunkGeneKeys 的 geneKey 默认值

`getGeneChunkGeneKeys(alias, chunkId, geneKey = 'all')` 在“全基因”和“多基因单基因”两种 key 形态下复用。全基因时用 `'all'`，多基因时传入具体 geneKey。调用方若漏传第三个参数，会错误地走到 `'all'` 的 key，导致多基因数据写到全基因的 key 或读错 key，需保证多基因路径始终传入正确的 geneKey。

---

## 4. 小结

| 类别 | 要点 |
|------|------|
| 语法/类型 | 模板字面量类型约束 key、AccessiblePromise、Activatable 交叉类型、方法装饰器、requestIdleCallback、TypedArray 的 buffer 序列化 |
| 设计模式 | 巴士站台请求合并、Manager+Helper 分层、缓存优先回源、取消函数+register/dispose、全/多基因状态守卫、按投影选坐标哈希 |
| 易错点 | forEach 不等待 async、queue 中多余语句易误解、请求体扩展字段需在发请求前去掉、IndexDB 存在则跳过与更新策略、监听 Set 与 cancel 成对、geneKey 默认值在多基因下的使用 |

以上内容可直接用于 code review、新人培训或重构时的检查清单，也可推广到其他“多请求合并、大范围缓存、多图层/多模式”的前端模块。
