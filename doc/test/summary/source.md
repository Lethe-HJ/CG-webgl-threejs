# Code Summary: `src/views/visual/layers/source`

基于 `src/views/visual/layers/source/index.ts`、`type.ts` 及 `source/layers` 目录的通用技术要点与设计总结，侧重可迁移思路与经验。

---

## 1. 不常见的特殊语法与用法

### 1.1 TypeScript 方法重载（多入口、单实现）

`DataSourceManager.init` 通过**重载签名 + 单实现**，用同一方法支持「单次初始化」和「历史列表恢复」两种入口，调用方类型清晰，内部用 `Array.isArray` 做分支：

```ts
async init(visualLayersGetResponseData: VisualLayersGetResponseData): Promise<LayersSourceData>;
async init(historyList: HistoryItem[]): Promise<LayersSourceData>;
async init(
  visualLayersGetResponseDataOrHistoryList:
    | VisualLayersGetResponseData
    | HistoryItem[],
): Promise<LayersSourceData> {
  if (Array.isArray(visualLayersGetResponseDataOrHistoryList)) {
    await this.initHistory(visualLayersGetResponseDataOrHistoryList);
  } else {
    await this.firstInit(visualLayersGetResponseDataOrHistoryList);
  }
  return this.layersSourceData;
}
```

要点：重载只写签名，实现只有一个，参数类型为联合类型；用运行时类型守卫（如 `Array.isArray`）区分分支，既保证类型安全又避免重复实现。

### 1.2 泛型约束 `T extends Record<string, any>` 与 `keyof T`

`sortByFieldOrder` 用泛型 + `keyof T` 做「按任意字段、给定顺序」排序，且不改变原数组：

```ts
sortByFieldOrder<T extends Record<string, any>>(
  data: T[],
  field: keyof T,
  order: any[],
): T[] {
  return [...data].sort((a, b) => {
    const indexA = order.indexOf(a[field]);
    const indexB = order.indexOf(b[field]);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
}
```

可迁移点：需要「按配置字段排序」的列表逻辑，可抽象成类似的通用方法，用 `keyof T` 保证 `field` 与 `T` 一致。

### 1.3 类型谓词 `value is FilterConditionValue<T>`

筛选逻辑里用类型谓词把「操作符对象」从普通值里区分开，避免把 `{ operator, value }` 当成普通值比较：

```ts
private _isFilterConditionValue<T>(
  value: any,
): value is import('./type').FilterConditionValue<T> {
  return value && typeof value === 'object' && 'operator' in value;
}
```

在 `_matchesValue` 中先判断 `_isFilterConditionValue(conditionValue)`，再走 `operator` 分支。这样既支持「简单值/数组」又支持「操作符对象」，类型收窄正确。

### 1.4 嵌套属性路径与 `_getNestedValue`

筛选支持点号路径（如 `origin.sid`），用 `path.split('.')` 逐层取属性，安全访问：

```ts
private _getNestedValue(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return undefined;
    }
  }
  return value;
}
```

可迁移点：任何「按字符串路径读对象」的配置化逻辑（表格列、筛选条件、表单校验）都可复用这一模式，注意 `in` 与 `undefined` 的边界即可。

### 1.5 AccessiblePromise + 返回异步函数（懒请求 + 单次缓存）

`getHeatmapMaxMidcount` / `getClusterMsg` 并非直接返回 Promise，而是返回一个「调用后才发起请求」的 async 函数；内部用 `AccessiblePromise` 存结果，并用 `isFulfilled` / `isInRequest` 做去重与缓存：

```ts
getHeatmapMaxMidcount(sourceDataItem: AllHeatmapSourceDataItem) {
  const result = new AccessiblePromise<number>();
  let isInRequest = false;
  return async () => {
    if (result.isFulfilled || isInRequest) return result;
    isInRequest = true;
    try {
      // ... 请求逻辑
      result.resolve(queryRes.data.maxExp);
      return result;
    } catch (error) {
      return 0;
    }
  };
}
```

要点：  
- 调用方拿到的是「getter 函数」，真正请求发生在第一次调用时。  
- 同一 source 多次访问共享同一个 `AccessiblePromise`，避免重复请求。  
- 若需在类型上表达「可能是 Promise 或同步值」，当前做法是属性赋值为「返回 Promise 的函数」，需在消费处统一 `await xxx()`。

### 1.6 `declare global` 扩展 Window

在模块末尾扩展全局类型并挂实例，便于在控制台或非模块上下文中使用：

```ts
declare global {
  interface Window {
    dataSourceManager: DataSourceManager;
  }
}
```

配合 `export const dataSourceManager = DataSourceManager.getInstance();` 并在合适处赋值 `window.dataSourceManager`，可保证类型与运行时一致。

### 1.7 子类中 `declare sourceData` 收窄类型

在 `source/layers/bin.ts` 等子类里用 `declare sourceData: BinSpatialHeatmapSourceDataItem` 将基类的 `SourceDataItem` 收窄为具体类型，避免重复声明与类型断言：

```ts
export class BinHeatMapSpatialLayerSource extends SpotLayerSource {
  declare sourceData: BinSpatialHeatmapSourceDataItem;
  // ...
}
```

这样在子类方法里直接用 `this.sourceData` 即可获得具体类型，且不生成额外运行时代码。

---

## 2. 比较优秀的思路与设计模式

### 2.1 元数据 → 视图数据的单向转换管道

`LayerSourceMetaData`（接口返回的原始结构）与 `LayersSourceData`（前端使用的扁平 bin/cell/image 等列表）分离，通过 `_trans2LayersSourceData` 做一次性转换，再在 `_processBinData` / `_processCellData` / `_processImageData` 中细分。  
好处：  
- 接口形态与前端使用形态解耦，接口变更只需改转换层。  
- 所有「补全热图/聚类、UMAP 相对项、cross-ROI」等规则集中在一处，便于理解和测试。

### 2.2 可组合的筛选条件与操作符

`FilterCondition` 设计成「字段 → 值 | 值数组 | FilterConditionValue(operator, value)」，同一套 `_filterData` + `_matchesConditions` + `_matchesValue` 支持：  
- 简单相等、多值（in）、存在性（exists/notExists）、字符串（contains/startsWith/endsWith）等。  
- 嵌套字段通过 `_getNestedValue(path)` 支持。

在此基础上再封装 `filterBySid`、`filterByOmics`、`filterByFieldExists`、`filterExcluding` 等便捷方法，调用方按需选用，避免到处写重复的 `filter` 逻辑。可迁移到任何「列表 + 多维度筛选」场景（表格、目录树、配置列表等）。

### 2.3 策略式「按 alias 匹配 LayerSource 类」

`LayerSourceManager.matchLayerSource(alias)` 根据 alias 的语义（normalImage / template / multiImage / heatmap+spatial+bin 等）返回对应的 LayerSource 子类，再 `new matchedLayerSourceCls(alias, sourceData)` 创建实例并放入 Map。  
这样新增图层类型只需：  
- 增加 alias 判断分支；  
- 新增对应的 LayerSource 子类。  
无需改 `getSource` 的主流程，符合开闭原则。

### 2.4 单例 Manager + 显式 init 与历史栈

`DataSourceManager` 继承 `BaseSingletonManager`，通过 `getInstance()` 取单例；初始化通过 `init(单次)` 或 `init(historyList)` 完成，并用 `historyList` 记录每次加载，支持「首次 + 多次 patch」的恢复。  
`firstInit` 内用 `initialed` 标志防止重复初始化并抛错，避免静默覆盖；patch 时合并到 `layersSourceData` 并更新 `sidFileNameMap` 等派生状态，保证数据与索引一致。

### 2.5 序列化入口 toJSON / fromJSON

类上提供 `toJSON()` 与 `static fromJSON(...)`，只序列化必要字段（如 `__class__`、`visualLayersGetResponseData`），便于持久化或跨窗口传递。注意 `fromJSON` 目前只恢复数据并调用 `init`，若存在循环引用或不可序列化引用，需要单独约定。

### 2.6 规则表驱动替代长 if-else（transLabel）

`transLabel` 将「label → 展示/逻辑用 label」的规则拆成 `transformRules` 数组（keywords + result），用 `rule.keywords.some(k => lowerLabel.includes(k))` 匹配，避免一长串 if-else，新增规则只需加一项配置。适合「多规则、多关键词」的映射场景。

### 2.7 去重与唯一键设计

多处用 `Map<key, item>` 或 `Set<key>` 做去重与查找：  
- `createCrossRoiClusterItem` 里用 `sid_binSize` 或 `sid` 作为 key 去重 bin/cell；  
- `_processMissingBinSizes` 用 `Set<Alias>` 避免重复 push；  
- `getFeatureList` 里用 `binSize-omics-label` 等组合 key 做图层去重，并结合 `_shouldReplaceLayer`（如 gef > h5ad）做优先级。  
统一思路：先定「业务唯一键」，再用 Map/Set 保证唯一性，再按需排序或转数组。

---

## 3. 容易踩坑的地方

### 3.1 异步 getter 的形态与消费方式

`getHeatmapMaxMidcount` / `getClusterMsg` 返回的是「async 函数」，而不是 Promise 本身。若调用方误写 `await getHeatmapMaxMidcount(item)` 会得到函数引用而不是数值；正确用法是 `await getHeatmapMaxMidcount(item)()`。  
建议：对这类「懒加载 + 缓存」的 API，在命名或类型上区分「返回函数」与「返回 Promise」（如 `getHeatmapMaxMidcountGetter` 或 `Promise<number>`），或在封装层统一 `await getter()`，避免误用。

### 3.2 AccessiblePromise 的 resolve 与返回值

上述方法里在 try 中 `result.resolve(xxx)` 后 `return result`。调用方若 `await getter()` 得到的是 AccessiblePromise 实例；因为实现了 thenable/asyncIterator，await 会得到解析值，但若某处直接拿返回值当 Promise 用（如 `Promise.all([getter()])`）会出错。建议：要么统一返回 `result.promise`，要么在文档中明确「必须 await 返回的函数」。

### 3.3 init 只允许一次与 initHistory 标志

`firstInit` 里若 `initialed` 已为 true 会直接 throw，因此同一单例不能重复「首次初始化」。而 `initHistory` 用 `initHistoryFlag` 避免在历史恢复过程中写 cache。若未来有「重置 DataSourceManager」需求，需要提供 `reset()` 并清理 `initialed`、`historyList`、`layerSourceMetaData`、`layersSourceData` 等，否则容易状态错乱。

### 3.4 可变引用与 cloneDeep 的边界

`historyList.push({ layersGetResponseData: cloneDeep(visualLayersGetResponseData) })` 对入参做了深拷贝，避免外部修改影响历史；但 `this.layersSourceData`、`this.layerSourceMetaData` 等是内部可变引用，若外部拿到并修改会直接影响 Manager 状态。对外暴露时若需要防篡改，应返回拷贝或只读代理。

### 3.5 filterExcluding 对操作符条件的简化

`filterExcluding` 把任意条件都转成 `notIn`，若传入的本来就是 `exists` / `contains` 等，语义会变化（例如「不存在某字段」变成「字段值 notIn undefined」）。更稳妥的做法是：对「操作符类型」做映射（如 exists → notExists），或限制 filterExcluding 只接受简单值/数组。

### 3.6 类型断言与 any 的局部使用

`_processBinData`、`_processBaseBinSpatialData` 等内部方法参数使用 `any`，以及 `(processedItem as any).binList` 等断言，在快速迭代时可以接受，但会弱化类型安全。建议：为 meta 结构定义明确接口（如 `BinSpatialMetaItem`），逐步替换 any，减少运行时字段错误。

### 3.7 控制台日志与生产环境

`createCrossRoiClusterItem` 内存在 `console.log`（如「借用…的聚类颜色」），适合开发排查，上线前建议改为调试开关或移除，避免控制台噪音和轻微性能开销。

---

## 4. 小结

| 类别         | 要点摘要 |
|--------------|----------|
| 语法/用法    | 方法重载 + 联合类型、泛型 keyof 排序、类型谓词、路径取值、AccessiblePromise 懒缓存、declare global、declare 收窄子类类型 |
| 设计/模式    | 元数据→视图数据管道、可组合筛选与操作符、alias 策略匹配 LayerSource、单例 + init/历史栈、toJSON/fromJSON、规则表驱动、Map/Set 唯一键去重 |
| 易踩坑       | 异步 getter 返回函数需再调用、AccessiblePromise 返回形态、init 单次与 reset、可变引用暴露、filterExcluding 语义、any 与断言、console 清理 |

以上内容均从 `src/views/visual/layers/source` 相关代码归纳，并抽象为可复用的 TypeScript/架构经验，便于在其他模块或项目中迁移使用。
