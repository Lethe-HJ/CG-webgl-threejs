# Code Summary: multiColor Helper

> 基于 `src/views/visual/layers/helpers/multiColor` 的通用技术要点与可迁移经验总结。  
> 生成时间: 2025-03-07

---

## 1. 不常见或特殊的语法与用法

### 1.1 联合类型 + 字面量对象（Discriminated Union 的轻量用法）

`GeneItem` 使用「仅形状不同、无公共 tag」的联合类型，表达「要么只有 geneID，要么只有 geneName」：

```ts
export type GeneItem =
  | { geneID: GeneID; }
  | { geneName: GeneName; };
export type GeneList = GeneItem[];
```

**要点**：不引入 `type: 'id' | 'name'` 也能在类型层面约束「二选一」，调用方必须按字段区分。若后续要区分分支，可改为带 tag 的 discriminated union。

### 1.2 模板字面量类型（Template Literal Types）做别名约束

`type.ts` 中用模板字面量类型约束别名格式，避免手写字符串拼错：

```ts
export type MultiColorImageAlias =
  `${Sid}__${SquareBinSize}__${AliasSuffix.multiColor}`;
export type MultiColorSubImageAlias =
  `${MultiColorImageAlias}__${GeneID | GeneName}`;
```

**可迁移经验**：凡有固定格式的 ID/别名（如 `sid__binsize__suffix`），可用模板字面量类型 + 若干基础类型组合，既保证格式一致又便于重构。

### 1.3 Brand 类型（名义类型）避免裸 number/string 混用

`SquareBinSize` 等使用 `Brand<number>`，在类型上区分「普通 number」与「binsize」：

```ts
export type SquareBinSize =
  | Brand<number>
  | Exclude<KnownBinSize, KnownBinSize.cell>;
```

**要点**：运行时仍是 number/string，但 TypeScript 会阻止把任意 number 当 SquareBinSize 传入，减少参数传错顺序或误用。

### 1.4 方法装饰器：高阶函数返回装饰器（带选项）

`methodCallRecord` 先接收 `logger` 和 `options`，再返回标准方法装饰器，便于按模块/类绑定不同 logger 并统一行为：

```ts
const record = methodCallRecord(logger); // 或 methodCallRecord(logger, { time: true })

export class MultiColorManager extends BaseSingletonManager {
  @record
  async create(...) { ... }
}
```

**可迁移经验**：需要「带参数的装饰器」时，用「高阶函数返回装饰器」；生产环境可在装饰器内直接返回原 descriptor，实现零开销。

### 1.5 getter 内抛错做「延迟校验」

`layerManager` 用 getter 在每次访问时校验 `this.alias` 和 layer 是否存在，并抛错：

```ts
get layerManager() {
  if (!this.alias) throw Error(`伪彩图 ${this.alias} 不存在`);
  const layerManager = visualLayersManager.getMultiImageLayerManager(this.alias);
  if (!layerManager) throw Error(`伪彩图 ${this.alias} 不存在`);
  return layerManager;
}
```

**要点**：不在构造或 create 时缓存 layerManager，避免「先 create 后 destroy 再误用」的陈旧引用；代价是每次访问都有一次查找和校验。

---

## 2. 比较优秀的思路与设计模式

### 2.1 单例 + 资源注册销毁（Disposable）

- `MultiColorManager` 继承 `BaseSingletonManager`，通过 `getInstance()` 保证全局唯一。
- `create()` 里拿到数据源返回的 `disposer`，用 `this.register(disposer)` 挂到基类；`destroy()` 时 `super.destroy()` → `dispose()` 统一执行所有注册的清理函数。

**可迁移经验**：凡「创建时拿到清理函数」的 API（订阅、注册到全局列表、打开句柄），都可用 `register(disposer)` 集中管理，避免遗漏 unsubscribe/remove。

### 2.2 Manager 只做编排，不持有多余状态

- Manager 只持有一个 `alias`，其余通过 `layerManager` getter 从 `visualLayersManager` 按 alias 取。
- 子图层的增删、显隐、颜色都委托给 `this.layerManager`（即具体的 LayerManager），避免在 Manager 层重复维护图层列表或状态。

**可迁移经验**：业务 Manager 适合做「入口 + 生命周期 + 委托」，具体能力放在专门的对象（如 LayerManager）里，便于测试和复用。

### 2.3 子资源别名由统一方法生成，禁止手拼

readme 明确写「不要自己拼子图层名字」；`getSubAlias(gene)` 统一生成 `MultiColorSubImageAlias`：

```ts
getSubAlias(gene: GeneID | GeneName) {
  return `${this.alias}__${gene}` as MultiColorSubImageAlias;
}
```

**可迁移经验**：凡有层级或组合 ID（如主 ID + 子 ID），都提供唯一生成函数并配合类型，避免各处手拼导致格式不一致或 typo。

### 2.4 异步数据用 Promise 列表，统一 await 再映射

`getSubMultiColorSourceData` 里对 `properties.maxExpList`（Promise 数组）做 `Promise.all` 再按 index 与 `aliasList`、`genes` 对齐：

```ts
const maxExpList = await Promise.all(properties.maxExpList);
return maxExpList.map((_, index) => ({
  alias: properties.aliasList[index],
  maxExp: maxExpList[index],
  gene: sourceData.genes[index],
}));
```

**可迁移经验**：多个异步值需要与同步数组按位对应时，先 `Promise.all` 再 `map` 按索引组对象，结构清晰且类型好写。

### 2.5 父子图层两层 Manager 结构

- 上层：`MultiColorImageVisualLayerManager` 管理整幅伪彩图，持有 `layerManagers: MultiColorSubImageVisualLayerManager[]` 和 `subVisibleStatus: Map<subAlias, boolean>`。
- 子层：每个子图一个 `MultiColorSubImageVisualLayerManager`，负责单图层的创建、显隐、颜色等。
- 父层 `show()` 时根据 `options.visible` 和 `subVisibleStatus` 决定每个子图是否真正显示，实现「图层级 + 子图层级」两级可见性。

**可迁移经验**：复合图层（多子图/多通道）可采用「一个父 Manager + 多个子 Manager」，父层管生命周期与可见性策略，子层管具体渲染与属性。

---

## 3. 容易踩坑的地方

### 3.1 单例基类 `destroy()` 会清空所有子类实例

`BaseSingletonManager.destroy()` 中调用了 `BaseSingletonManager.clearInstances()`，会清空静态 Map 里**所有**子类的单例实例。因此调用 `multiColorManager.destroy()` 后，其他继承 `BaseSingletonManager` 的 Manager 再通过 `getInstance()` 拿到的也会是「新实例」（旧实例仍在内存中，只是不再被 Map 引用）。

**建议**：若期望「只销毁当前 Manager 对应的资源，不影响其他单例」，应在基类中改为只从 Map 中移除当前构造函数对应的实例，而不是清空整个 Map；若设计上就是「销毁即重置所有单例」，则需在文档中明确说明。

### 3.2 getter 中抛错与错误信息里的 `this.alias`

当 `this.alias` 为 `undefined` 时，错误信息写的是「伪彩图 undefined 不存在」，可读性一般。若希望更友好，可改为固定文案，例如「伪彩图尚未创建或已被销毁」。

### 3.3 子图层可见性依赖「父 visible × 子 visible」

父层 `show()` 里用 `visible && subVisible` 决定子图是否渲染。若只记「子图层 visible」，而忘记父图层本身可能被 hide，容易出现「以为开了子图却看不到」的情况。文档或接口注释里可明确写出：最终可见 = 父图层可见 × 子图层可见。

### 3.4 异步 create 与「已存在」校验

`create()` 开头有 `if (this.alias) throw Error(...)`，防止重复创建。若多次快速调用 `create()`（例如连续点击），只有第一次会执行，后续会直接抛错。若产品上需要「先销毁再创建」或「幂等创建」，需要在 UI 或上层逻辑里保证顺序，或在此处提供更明确的错误类型便于上层区分处理。

### 3.5 装饰器对 async 方法的包装与调试

`methodCallRecord` 包装的是 `descriptor.value`，若原方法是 async，返回的是 Promise；装饰器里若只做 `originalMethod.apply(this, args)` 而不 await，日志会在「方法开始执行」时打，不会等 async 完成。当前实现是记录「调用」与「return」（即 Promise 的 resolve），若需记录「真正执行完毕」的时机，需要针对 Promise 做 then/await 再打日志。

---

## 4. 小结

| 维度         | 要点摘要                                                                 |
|--------------|--------------------------------------------------------------------------|
| 类型设计     | 模板字面量类型约束别名格式；Brand 类型区分语义；GeneItem 二选一联合类型  |
| 生命周期     | Disposable + register(disposer)；单例 + 统一 destroy                    |
| 职责划分     | Manager 只做编排与委托；子资源别名统一生成；父子两层 LayerManager        |
| 可观测性     | 高阶方法装饰器 methodCallRecord，按 logger 绑定，生产可关闭              |
| 易错点       | 单例 destroy 清空全部实例；getter 抛错文案；父子可见性叠加；异步 create 校验 |

以上内容侧重通用思路与可迁移经验，可直接应用到其他「带资源创建/销毁、单例、复合图层」的模块中。
