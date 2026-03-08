# Code Summary: multiTask 模块技术要点

> 分析范围: `src/views/visual/layers/helpers/multiTask`  
> 侧重通用思路与可迁移经验，非业务细节。

---

## 1. 不常见或特殊的语法与用法

### 1.1 Brand  nominal typing（名义类型）

```typescript
type ExpiredTime = Brand<number>;
```

- **作用**：在类型层面区分「普通 number」与「表示过期时间戳的 number」，避免误传普通毫秒数。
- **实现**：`Brand<T> = T & { readonly __brand: unique symbol }`，通过 `unique symbol` 在编译期区分，运行时无额外字段。
- **可迁移场景**：ID 类型（UserId / OrderId）、带单位的数值、语义不同的同基类型（如 `Meters` vs `Pixels`）。

### 1.2 AccessiblePromise 用于「可外部 resolve 的 Promise」

```typescript
public initialed = new AccessiblePromise<void>();
// 别处: await multipleVisualTaskManager.initialed;
// 初始化完成后: this.initialed.resolve();
```

- **作用**：把「初始化完成」做成一个可被外部在任意时机 `resolve` 的 Promise，供 DBCacher 等依赖方 `await initialed`，实现「等 Manager 就绪再建库」。
- **与普通 Promise 区别**：创建时不必传入 executor，后续在业务代码里调用 `resolve()`/`reject()`，适合跨模块、延迟完成的就绪信号。
- **可迁移场景**：模块/服务就绪门、延迟授权、多步流程的「阶段完成」信号。

### 1.3 编译时常量 __DEV__ 控制静态配置

```typescript
static expiredInterval = (__DEV__ ? 1 : 30) * 60 * 1000;
static interval = (__DEV__ ? 10 : 60) * 1000;
```

- **作用**：开发环境缩短过期与轮询间隔，便于调试；生产环境使用正常业务值。
- **注意**：这是静态字段，打包时按当前环境写死，不会在运行时切换；若需运行时配置，应改为实例/配置注入。

### 1.4 localforage.createInstance 多实例隔离

```typescript
this.commonCache = localforage.createInstance({
  name: 'common',
  version: 1.0,
  storeName: 'cache',
});
```

- **作用**：在同一个 IndexedDB 的 `name` 下，通过不同 `createInstance` 配置（或不同 storeName）做逻辑隔离；此处 `commonCache` 存「任务 ID → 过期时间」的元数据，与各任务自己的 DB 分离。
- **可迁移**：多租户、多任务、多环境共用同一「元信息库」而数据隔离时，可用多实例或不同 storeName 区分。

---

## 2. 比较优秀的思路与设计模式

### 2.1 单例 + 显式 init(taskId) 的 lifecycle

- **模式**：`getInstance()` 单例 + `init(visualTaskId)` 注入当前任务上下文，`destroy()` 清空 instance 与定时器。
- **好处**：全局唯一 Manager，但当前任务 ID 在 init 时确定，便于「一个 common 存储 + 多任务过期清理」；destroy 后下次可重新 getInstance 并 init 新任务，避免状态残留。
- **可迁移**：任何「全局唯一、但每次会话/任务要绑定不同上下文」的 Manager（如当前项目、当前用户会话）。

### 2.2 基于「过期时间戳表」的定时清理

- **思路**：在 common 存储中维护 `visualTaskIds: Record<VisualTaskId, ExpiredTime>`，定时轮询时用当前时间与表中时间比较，过期则删记录并执行 `clearVisualTask(id)`（清 IndexedDB + 调后端清理接口）。
- **优点**：逻辑清晰（谁过期谁删）、可扩展（新任务只需写一条记录）、与「当前任务」解耦（通过 `currentVisualTaskId` 排除自己）。
- **可迁移**：多任务/多会话的过期回收、临时资源按 TTL 回收、分布式场景下的本地过期表（需再考虑一致性）。

### 2.3 轮询用 setTimeout 自递归而非 setInterval

```typescript
run(taskId: VisualTaskId) {
  this.timer = setTimeout(async () => {
    if (!this.timer) return;
    this.doClear();
    clearTimeout(this.timer);
    this.run(taskId);
  }, MultipleVisualTaskManager.interval);
}
```

- **优点**：下一次调度在上一次回调执行完后再排，避免 doClear 执行过长导致重叠；且便于在回调内统一 `clearTimeout(this.timer)` 再递归，stop 时只清一次 timer 即可。
- **可迁移**：需要「固定间隔但保证不重叠」的轮询、或需要在每轮内根据结果决定是否继续的定时逻辑。

### 2.4 清理策略的参数化（force / deleteSelf）

- **设计**：`doClear(force?, deleteSelf?)` 在强制清理（如初始化时）可传 `force=true`，并通过 `deleteSelf` 控制是否连当前任务一起清。
- **好处**：同一套清理逻辑兼顾「按过期时间清理」与「上线/初始化时强制清理部分或全部任务」，减少重复代码。

---

## 3. 容易踩坑的地方

### 3.1 setTimeout 回调中使用 async 且未 catch

- **问题**：`setTimeout(async () => { ... this.doClear(); ... })` 中若 `doClear()` 抛错，会变成未处理的 Promise rejection，且不会阻止 `this.run(taskId)` 被调用，可能掩盖错误并继续轮询。
- **建议**：在回调内对 `doClear()` 包一层 `try/catch`，或 `.catch()` 并打日志/上报，必要时在失败时不再调用 `this.run(taskId)`。

### 3.2 init 未完成时使用 currentVisualTaskId

- **问题**：其他模块（如 DBCacher）在 `await multipleVisualTaskManager.initialed` 之后才应使用 `currentVisualTaskId`；若在 init 完成前访问，可能为 `undefined`。当前 DBCacher 在 createDBInstance 里已 await initialed，此处用法正确，但若将来有其他地方直接读 `currentVisualTaskId`，需要保证在 initialed 之后。
- **建议**：对「依赖 init 结果」的 API 在文档或类型上说明「需在 initialed 之后调用」，或封装成方法而非直接暴露属性。

### 3.3 doClear 中先改内存对象再 setItem

- **问题**：`Object.keys(visualTaskIds).forEach` 里对 `visualTaskIds` 做 `delete`，然后 `this.commonCache.setItem('visualTaskIds', visualTaskIds)`。若在 forEach 中误用异步（如某处改成 async 回调），可能出现并发写或读到中间状态。
- **建议**：保持 forEach 同步；若未来在循环内加入异步逻辑，应改为先算出新的 `visualTaskIds` 对象，再一次性 setItem。

### 3.4 destroy 只置空 instance，不清理 commonCache

- **问题**：`destroy()` 仅 `stop()` 和 `instance = null`，未关闭或清理 `this.commonCache`。若单例被 destroy 后再次 getInstance 并 init，会新建 commonCache 实例，旧实例持有的引用仍存在，一般不会立刻出错，但长期可能增加资源占用。
- **建议**：若 localforage 实例有关闭/销毁接口，在 destroy 时调用；否则至少在注释中说明「common 库为持久化，不随 destroy 关闭」。

### 3.5 静态配置与测试/多环境

- **问题**：`expiredInterval`、`interval` 为静态字段且依赖 `__DEV__`，单测或多环境构建若未正确设置 __DEV__，可能拿到非预期的间隔。
- **建议**：对这类「环境相关」的常量集中到配置模块或通过构造函数/options 注入，便于单测覆盖和不同构建目标切换。

---

## 4. 小结

| 维度         | 要点摘要 |
|--------------|----------|
| 类型与语法   | Brand 名义类型、AccessiblePromise 就绪门、__DEV__ 静态配置、localforage 多实例 |
| 设计模式     | 单例 + init 生命周期、过期时间表 + 定时清理、setTimeout 自递归轮询、force/deleteSelf 参数化 |
| 注意点       | async setTimeout 错误处理、init 完成前勿依赖 currentVisualTaskId、forEach 内勿异步改同一对象、destroy 与 commonCache 生命周期、静态配置与测试/多环境 |

以上内容均从 `multiTask` 模块归纳，侧重可复用的思路与在其它模块/项目中的迁移方式。
