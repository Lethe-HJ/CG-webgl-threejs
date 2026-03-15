# Code Summary: middleState 模块

> 基于 `src/views/visual/components/middleState` 整理的通用技术要点与可迁移经验。  
> 生成时间：2025-03-07

---

## 1. 不常见或值得注意的语法与用法

### 1.1 在模块顶层使用 Pinia store 与 storeToRefs

```ts
const visualMapStore = useVisualMapStore();
const { projectionState, visualMiddleStatesData } = storeToRefs(visualMapStore);
```

在非组件的 `.ts` 模块顶层直接调用 `useXxxStore()` 和 `storeToRefs()`，依赖应用已挂载后 Pinia 的注入上下文。适合单例 Manager 类需要长期持有响应式引用时使用。注意：该模块若在应用挂载前被加载并访问 store，可能拿不到正确上下文。

### 1.2 泛型回调类型与可选元数据

```ts
type TAfterEnqueueCallback<MetaData> = (
  item: TMiddleStateItem,
  metaData: MetaData,
) => Promise<void>;
```

用泛型把「入队项」和「元数据」一起传给回调，使队列只存轻量 item（如 name、storeKey），重数据（如图片 base64、paths）在回调中按 key 持久化。这种「项 + 元数据」分离在「有容量限制且需旁路存储」的队列场景里很常用。

### 1.3 继承内置数据结构并包装内部方法

`MiddleStateQueue` 继承 `Queue<T>`，对外暴露 `enqueue(item, metaData)` 和 `dequeue()`，内部调用 `super._enqueue` / `super._dequeue`，并在前后挂上 `afterEnqueueCallback` / `afterDequeueCallback`，实现「入队/出队时自动持久化或清理存储」。这是典型的用组合/钩子扩展数据结构行为的方式，无需改基类。

### 1.4 Getter 内按外部状态做缓存失效

```ts
get queue() {
  if (this._queue && projectionState.value.value !== this._queue.name) {
    this._queue = undefined;
  }
  if (!this._queue) {
    // ... 根据当前 projection 创建 queue
  }
  return this._queue;
}
```

queue 依赖当前投影（projection），getter 内根据 `projectionState` 判断「是否仍属于当前投影」，不属于则清空缓存并重建。这样单例 Manager 可以按「当前上下文」返回不同队列实例，避免跨投影共用一个 queue。

### 1.5 requestIdleCallback 延后非关键写入

```ts
return new Promise<void>((resolve) => {
  requestIdleCallback(() => {
    this.dbCacher.set(key, paths, (content: Paths) => serializePaths(content));
    resolve();
  });
});
```

将 IndexedDB 写入放到空闲时段执行，减轻对主线程和首屏的冲击。注意：`requestIdleCallback` 在部分浏览器可能不支持，需要 polyfill 或降级为 `setTimeout`。

### 1.6 IPC 用 once + Promise 封装“单次回复”

```ts
const savePathPromise = new Promise<string>((resolve) => {
  ipcRenderer.removeAllListeners(ipcEventsOffline.openSaveFileDialog);
  const openSaveFileDialogHandler = async (_: any, savePath: string) => {
    resolve(savePath);
  };
  ipcRenderer.once(ipcEventsOffline.openSaveFileDialog, openSaveFileDialogHandler);
});
ipcRenderer.send(ipcEventsOffline.openSaveFileDialog, { defaultPath });
const savePath = await savePathPromise;
```

先注册 `once` 的 listener 再 send，用 Promise 把「主进程一次回调」变成 async/await，避免回调嵌套。适合「打开保存对话框、选路径、只等一次结果」这类流程。

### 1.7 自定义二进制序列化格式（Paths ↔ ArrayBuffer）

`serializePaths` / `deserializePaths` 约定：`[1 个 P, P 条长度, 所有点的 X,Y]` 用 `Int32Array` 存。这样存 IndexedDB 比直接存 JSON 更省空间、解析更可控。可迁移点：任何「结构化数据要持久化且希望控制体积」时，可定义类似的紧凑二进制格式。

### 1.8 markRaw 用于 MessageBox 的 Vue 组件 icon

```ts
icon: markRaw(StereomapMessageBoxError),
```

Element Plus 的 MessageBox 若传入 Vue 组件作为 icon，会被当作响应式对象；用 `markRaw` 标记后，Vue 不再对其做响应式处理，避免不必要的深度观测和性能问题。

### 1.9 El-Popconfirm 的 virtual-ref + virtual-triggering

```vue
<SvgIcons ref="deleteButtonRef" ... />
<el-popconfirm
  :virtual-ref="deleteButtonRef"
  virtual-triggering
  @confirm="onItemDelete"
>
</el-popconfirm>
```

通过 `virtual-ref` 把触发元素指定为另一个组件（这里是图标），点击该图标即可弹出 Popconfirm，而不必把按钮包在 Popconfirm 内部，便于布局和样式控制。

### 1.10 命名编辑：v-show 切换展示/输入

列表项用 `v-show="!isRename"` 显示名称，`v-show="isRename"` 显示 input；进入编辑时 `isRename = true` 并 `nextTick` 后 focus/select。名称与输入框互斥展示，避免 DOM 上同时存在两个可编辑区域带来的焦点与校验复杂度。

---

## 2. 较好的思路与设计模式

### 2.1 事件总线解耦“存储重置”与队列生命周期

```ts
handleEvents() {
  eventBus.on('after-store-updated', () => {
    this._queue?.clear();
    this._queue = undefined;
  });
}
```

当全局状态（如 store 重置）发生时，通过事件通知 Manager 清空队列缓存，避免继续使用已失效的 projection 或数据。事件名语义清晰，Manager 只关心「何时失效」，不依赖具体是谁触发的重置。

### 2.2 有界队列 + 持久化策略

固定容量（如 10）的 FIFO 队列，入队时若满则先出队再入队；入队回调写 IndexedDB，出队回调删对应 key。这样「最近 N 条记录」与「存储占用」都可控，模式可复用到其他“历史记录/草稿”类功能。

### 2.3 线上线下双路径统一入口

```ts
await window.remoteConfigEnabled
  ? this.downloadGeojsonOnline(...)
  : this.downloadGeojsonOffline(...);
```

导出/上传等能力按环境拆成 Online/Offline 两个实现，对外一个入口根据配置选择，便于扩展更多环境（如私有化）时只加分支或策略，而不改调用方。

### 2.4 视图层用 computed 从 store 派生列表

父组件用 `computed` 从 `visualMiddleStatesData` 和 `projectionState` 派生出当前投影的 `middleStateList`，子组件只接收 `modelValue` 和 `@update:modelValue` / `@delete`。数据流单一：store → computed → 列表 → 子组件；修改通过 Manager 方法（如 `renameMiddleState`、`deleteMiddleState`）回写 store，符合“视图只负责展示与事件，业务与持久化在 Manager”的分层。

### 2.5 单例 Manager 挂到 window 便于调试与跨模块使用

```ts
window.visualMiddleStateManager = visualMiddleStateManager;
```

配合全局类型声明，其他模块或控制台可直接访问同一实例，便于调试和在不方便依赖注入的场景下使用，需注意与测试环境的隔离（如测试里可 mock `window.visualMiddleStateManager`）。

---

## 3. 容易踩坑的地方

### 3.1 模块顶层 store 的时机依赖

在 `index.ts` 顶层就执行 `useVisualMapStore()`，若该模块在根组件挂载前被加载，Pinia 可能尚未完成安装，store 可能不可用。建议：要么保证该模块在挂载后才首次被引用，要么把对 store 的访问放到 Manager 的方法或 getter 内部（懒求值），减少对初始化顺序的依赖。

### 3.2 Getter 依赖的响应式来源

`queue` 的 getter 依赖 `projectionState.value`。若在非 Vue 上下文中调用（如纯 Node 或未挂载的脚本），`projectionState` 可能未更新或不可用，导致 queue 与当前投影不一致。在非 UI 路径（如自动化、测试）里需要显式设置或 mock 投影状态。

### 3.3 dequeue 的返回值语义

当前 `dequeue()` 返回的是 `afterDequeueCallback(item)` 的 `Promise`，而不是被出队的 `item`。若调用方需要「拿到出队的项再做逻辑」，需要改设计（例如让 callback 返回 item，或增加 `dequeueSync` 只出队并返回 item）。

### 3.4 异步 watch 的竞态

`item.vue` 里对 `props.modelValue.imgStoreKey` 的 watch 会执行异步 `retrieveImageBase64`。若用户快速切换列表项，可能后发请求先返回，把 `imageSrc` 写成前一项的图。可用「请求前取当前 key，在 resolve 时比对是否仍是当前 key」或 AbortController/防抖 避免旧请求覆盖新状态。

### 3.5 输入框内拦截空格并手动插入

`onSpaceKeyDown` 里用 `event.target.value` 直接拼接空格再 `setSelectionRange`，未通过 `v-model`，在 Vue 中可能和双向绑定不同步。若后续增加校验或格式化，需要同时考虑这段手动修改 value 的逻辑，避免重复处理或状态不一致。

### 3.6 非空断言与调用约定

`item.pathsStoreKey!`、`item.imgStoreKey!` 等使用频繁，依赖「入队时一定写了这两个 key」的约定。若将来有分支未写入就入队，会运行时报错。更稳妥的是在类型上区分「已持久化的 item」（带 key）和「待持久化的 item」，或在 enqueue 前做校验并抛明确错误。

### 3.7 Canvas 与 DOM 清理顺序

`getCanvasScreenShotImage` 末尾先 `tmpCanvas.remove()` 再对 `tmpCanvasCtx` 做 `clearRect`，此时 canvas 已脱离 DOM，部分环境下 clearRect 可能无意义；且 `tmpCanvas = null` 后仍访问 `tmpCanvas.width/height` 会报错（当前代码在 clearRect 用的是 `tmpCanvasCtx.canvas`，若之前已置空需注意）。建议顺序：先 clearRect 释放内容，再 remove，最后置 null，避免重复清理或访问已释放节点。

---

## 4. 小结

| 维度         | 要点摘要 |
|--------------|----------|
| 语法/API     | 顶层 storeToRefs、泛型回调、requestIdleCallback、IPC once+Promise、markRaw、virtual-ref、自定义 ArrayBuffer 序列化 |
| 设计模式     | 有界队列+持久化钩子、Getter 按上下文失效、事件解耦、Online/Offline 双路径、单例挂 window |
| 易踩坑       | 顶层 store 时机、dequeue 返回语义、异步 watch 竞态、非空断言约定、Canvas 清理顺序 |

以上内容侧重通用思路与可迁移经验，可直接用于类似「带容量与持久化的历史记录」「多环境导出/上传」「列表项内联编辑与权限控制」等场景的参考与避坑。
