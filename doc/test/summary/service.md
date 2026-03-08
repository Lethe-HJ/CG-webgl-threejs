# Code Summary: src/service 技术要点与设计总结

> 基于 `src/service/` 目录的通用技术要点、设计模式与可迁移经验整理，侧重思路与可复用实践。

---

## 1. 不常见或特殊的语法与用法

### 1.1 AccessiblePromise：可外部解析的 Promise

**位置**: 依赖 `@/utils/promise`，在 config、language、permission 等 Service 中用于 `ready` 状态。

**要点**:
- 标准 Promise 的 resolve/reject 只能在 executor 内部调用；`AccessiblePromise` 把 resolve/reject 暴露为实例方法，可在任意时机从外部完成 Promise。
- 支持 `isPending` / `isFulfilled` / `isRejected` 状态查询，便于“是否已就绪”判断，而不必依赖 then/catch。
- 实现上内部持有一个原生 Promise，并把其 resolve/reject 存到实例上，同时实现 `then/catch/finally` 和 `Symbol.toStringTag`、`Symbol.asyncIterator` 等，保证与 `await`、`Promise` 链式调用兼容。

**可迁移用法**:
- 模块/服务“就绪”信号：构造函数里 `this.ready = new AccessiblePromise<T>()`，异步初始化完成后在合适位置 `this.ready.resolve(data)`，其它模块 `await xxxService.ready` 再使用。
- 事件驱动的一次性结果：例如 permission 里用 `new AccessiblePromise()` + `ipcRenderer.on` 在收到一次消息时 `resolve(data)`，替代“回调转 Promise”的手写包装。

### 1.2 标签模板函数（Tagged Template）用于日志参数

**位置**: `log/index.ts` 中 `innerTagFormat`。

```ts
function innerTagFormat(strings: TemplateStringsArray, ...args: any[]) {
  const list = [];
  for (let i = 0; i < strings.length; i++) {
    list.push(strings[i]);
    if (args[i]) list.push(args[i]);
  }
  return list;
}
// 使用: innerTagFormat`args:${args} id:${id}`
```

**要点**:
- 使用方式为 **标签模板**：`innerTagFormat`\`args:${args} id:${id}\`，第一个参数是字符串数组，后续是插值，便于把“模板 + 插值”一起传给 logger，统一拼成存储用字符串或 console 参数。
- 与常见 `` `msg: ${x}` `` 不同，这里把“结构化参数”和“占位符”拆开，方便 logger 对 args 做 stringify/脱敏（如大对象只打类型和长度），而不必在业务侧拼接字符串。

**可迁移用法**:
- 需要“模板 + 多个插值且插值要统一处理（序列化、脱敏、截断）”的日志或监控上报，可用标签模板统一收口。

### 1.3 方法/函数调用记录装饰器（含 Promise 分支）

**位置**: `log/index.ts` 中 `methodCallRecord`、`functionCallRecord`。

**要点**:
- **方法装饰器**：替换 `descriptor.value`，在调用前后打 debug（入参、返回值、耗时），并用 `funcCallStack` 维护调用栈层级，输出缩进；若原方法返回 Promise，会在 `.then`/`.catch` 里再打 resolve/reject 和耗时。
- **函数包装**：`functionCallRecord` 返回高阶函数，保留原函数 `name`（`Object.defineProperty(wrappedFunction, 'name', { value: funcName })`），方便调试栈信息。
- 通过 `__DEV__` 判断，非开发环境直接返回原 descriptor/原函数，避免生产包体积和运行时开销。

**可迁移用法**:
- 需要“按方法/函数自动打调用链、入参、返回值、耗时”时，可复用“装饰器 + 调用栈 + Promise 分支”这一套；注意对异步路径要同时处理 resolve/reject 和错误重抛。

### 1.4 类型从“默认数据”推导（typeof defaultX）

**位置**: `permission/index.ts`。

```ts
const defaultPermissionData = { 'home.visualExplore': false, ... };
type PermissionData = typeof defaultPermissionData;
```

**要点**:
- 权限结构以“默认数据”为单源真相，用 `typeof defaultPermissionData` 得到类型，新增/删除键只需改 default，类型自动跟随，避免手写一遍 interface 与数据不同步。

**可迁移用法**:
- 配置、权限、特性开关等“键值结构以默认值为准”的场景，适合用 `typeof defaultX` 推导类型。

### 1.5 递归“叶子属性”批量改写

**位置**: `permission/default.ts` 中 `setAllLeafPermissionsTrue`。

**要点**:
- 递归遍历对象，仅对“叶子”节点（`typeof value !== 'object'` 或 null）赋值为 `true`，用于从 `defaultPermissionData` 生成“本地/开发环境全开”的 `normalPermissionData`。
- 用 `cloneDeep(defaultPermissionData)` 再递归，保证不修改原默认对象。

**可迁移用法**:
- 需要“默认配置 + 一份全开/全关的派生配置”时，可用类似递归叶子改写，保持结构一致、仅改叶子值。

---

## 2. 比较优秀的思路与设计模式

### 2.1 服务“就绪”统一用 ready Promise

**模式**: Config / Language / Permission 等都在实例上暴露 `ready: AccessiblePromise<T>`，依赖方统一 `await configService.ready` 或 `configService.ready.then(...)` 再使用。

**优点**:
- 初始化可能是异步（远程配置、IPC、事件），不阻塞类实例化，又能让调用方明确“何时可用”。
- 多服务依赖可组合：如 Language 的 `handleServiceReady` 里 `configService.ready.then(...)`，再在自身初始化完成后 `this.ready.resolve()`，形成清晰的依赖链。

### 2.2 配置分层：默认 + 远程合并

**位置**: `config/index.ts`。

**做法**: `globalConfig` 作默认；若 `window.needRemote` 则请求远程配置，用 `merge(cloneDeep(globalConfig), remoteConfigData)` 合并（远程覆盖默认），再 `this.ready.resolve(this.config)`。

**优点**:
- 默认值保证无网络或请求失败时仍有可运行配置；merge 顺序明确，便于理解和覆盖策略。

### 2.3 日志：内存队列 + 空闲批量落库

**位置**: `log/queue.ts`、`log/index.ts`。

**做法**:
- `LogStoreQueue` 继承通用 `Queue`，`enqueue` 时只入队并 `scheduleProcess()`；处理用 `requestIdleCallback`（带 timeout）或降级 `setTimeout`，在空闲时批量 `processBatch()`，再调用 `batchProcessor` 写 IndexedDB。
- 提供 `flush()` 立即处理、`clear()` 清空队列并取消未执行的调度。

**优点**:
- 写盘不阻塞主线程；批量写减少 IndexedDB 事务次数；空闲调度对用户交互更友好。

### 2.4 日志内容分级：Console 详细 vs 存储简略

**位置**: `log/logger.ts`、`log/index.ts` 的 `stringify`。

**做法**:
- Console 使用 `processArgsForConsole` 等，尽量保留可读信息（如函数名）。
- 存库前用 `stringify` 把大对象/ArrayBuffer/TypedArray 等只打成类型+长度等简略信息，避免存巨大 JSON 或不可序列化内容。

**优点**:
- 开发时调试信息足，存储体积和序列化风险可控。

### 2.5 固定容量循环队列取“最近 N 条”

**位置**: `log/index.ts` 中 `CircularQueue`、`printLogs(count)`。

**做法**: 固定容量数组 + head/tail，满时覆盖最旧；`printLogs(count)` 时 iterate 全表并往 `CircularQueue(count)` 里 enqueue，最后 `dequeueAll()` 即最近 count 条。

**优点**: 不需要先查总数再排序或跳过，一次遍历即可得到“最新 N 条”，适合日志、监控采样等场景。

### 2.6 权限的“响应式 + 组合式 API”暴露

**位置**: `permission/index.ts`。

**做法**: 使用 `ref<PermissionData>` 存权限；对外提供 `p(name)` 和 `usePermission()`，在 Vue 里 `v-if="p('ve.gohome')"` 等，既保留响应式又给非组件代码统一入口。

**优点**: 权限变更时界面自动更新；TS 侧用 `permission.value[name as keyof PermissionData]` 保持类型安全。

### 2.7 错误与日志结合：createLoggerError

**位置**: `log/error.ts`。

**做法**: `createLoggerError(logger)` 返回一个函数，调用时 `new LoggerError(message, logger)`，在构造函数里 `logger.error(message)`，再 throw。这样业务里 `throw LError('xxx')` 既抛错又记日志。

**优点**: 错误与日志不重复写，且保证“抛出的地方”一定有一条日志，便于排查。

### 2.8 国际化：本地 bundle + 远程按需合并

**位置**: `language/index.ts`。

**做法**: 初始 `createI18n` 用本地 en/cn；若 `window.needRemote`，在 `update()` 里按 `currentLang` 从远程拉对应语言包并 `setLocaleMessage`，用 `_langMap` 缓存已拉取的，避免重复请求。

**优点**: 首屏用本地包即可渲染，后续按需拉远程并合并，兼顾体积与灵活性。

---

## 3. 容易踩坑的地方

### 3.1 远程配置失败时未保证 ready 一定 resolve

**位置**: `config/index.ts` 的 `getRemoteConfig()`。

**问题**: `getRemoteConfig()` 在 catch 里只 `console.error`，没有 `this.ready.resolve(this.config)`。若首次 init 就请求失败，`initConfig` 里在 try/catch 外才 `this.ready.resolve(this.config)`，此时 `this.config` 可能仍是默认值；若某处逻辑误以为“resolve 即代表远程已成功”，会出错。更稳妥的做法是：无论成功失败都在 init 流程末尾 resolve，用“成功取远程 / 失败用默认”的同一套 config。

### 3.2 循环队列的 Stack 构造函数笔误

**位置**: `log/index.ts` 中 `Stack` 的构造函数。

```ts
constructor(maxSize?: number) {
  if (maxSize) this.maxSize;  // 未赋值，应为 this.maxSize = maxSize
}
```

**问题**: `this.maxSize` 只读未写，传入的 `maxSize` 不生效，始终为默认值。应改为 `if (maxSize != null) this.maxSize = maxSize;`。

### 3.3 requestIdleCallback / cancelIdleCallback 类型与兼容

**位置**: `log/queue.ts`。

**问题**: `pendingTimeout` 类型为 `ReturnType<typeof requestIdleCallback> | ReturnType<typeof setTimeout> | null`，而 `cancelIdleCallback` 在部分环境可能不存在，需用 `typeof cancelIdleCallback !== 'undefined'` 分支；且 TypeScript 中 `requestIdleCallback` 的返回值在不同 lib 下可能是 `number` 或 `NodeJS.Timeout`，在 Node/Electron 环境要确认类型一致，避免 clear 错类型。

### 3.4 日志过期清理中的 iterate 与 delete 语义

**位置**: `log/index.ts` 的 `cleanExpiredLog`。

**问题**: 在 `dbStoreInstance.iterate` 回调里对“过期”的 key 调 `this.dbCacher.delete(key)`。若底层实现是“迭代过程中修改 store”，部分 IndexedDB 实现可能有不稳定行为；且注释里用 `return true` 表示“停止迭代”需要和实际 API 约定一致（有的 API 是 return false 停止）。建议确认所用 DBCacher/IndexedDB 封装在 iterate 中 delete 的语义，必要时改为先收集要删的 key，迭代结束后再批量 delete。

### 3.5 多服务依赖顺序与 ready 的时序

**位置**: `language/index.ts` 依赖 `configService.ready`。

**问题**: 若在应用很早的阶段就访问 `languageService.t` 或 `locale`，而此时 `configService.ready` 尚未 resolve，可能拿到的是未按 config 更新过的语言。所有依赖 `xxxService.ready` 的代码应统一在“应用已 await 这些 ready”之后再渲染或执行敏感逻辑，避免隐式依赖“谁先执行谁后执行”。

### 3.6 生产环境仍写入日志的逻辑分支

**位置**: `log/index.ts` 的 `storeLog`。

**问题**: 有 `if (!__DEV__) return;`，生产不写；但若未来在“错误上报”等场景希望生产也写部分日志，需要单独分支或配置项，避免误以为改一处就能同时控制“开发/生产”的写库行为。

### 3.7 权限 p(name) 与类型安全

**位置**: `permission/index.ts` 的 `p(name: string)`。

**问题**: `name` 为 string，实际依赖 `defaultPermissionData` 的键；若传入拼写错误或已删除的 key，只会得到 `undefined ?? false`，不会编译报错。可考虑用 `keyof PermissionData` 约束参数，或封装成 `p(key: keyof PermissionData)`，在调用处获得自动补全和类型检查。

---

## 4. 小结表

| 类别           | 要点简述 |
|----------------|----------|
| 特殊语法/用法  | AccessiblePromise、标签模板日志参数、方法/函数调用装饰器、typeof 默认数据推导、递归叶子改写 |
| 设计模式/思路  | ready Promise 统一就绪、默认+远程配置 merge、日志队列+空闲批量写、Console/存储分级、循环队列取最近 N、权限 ref+usePermission、LoggerError 工厂、i18n 本地+远程按需 |
| 易踩坑         | 远程配置失败也要 resolve ready、Stack 构造函数未赋值、requestIdleCallback 类型与兼容、iterate 中 delete 语义、多服务 ready 时序、生产写日志策略、权限 name 类型约束 |

以上内容均从 `src/service/` 及直接依赖（如 `@/utils/promise`、`@/utils/ds`）归纳，侧重通用思路与可迁移实现方式，便于在其他项目中复用或规避同类问题。
