# 装饰器式 Mixin 封装与用法 — 学习文档

本文档整理自 `src/engine/manager/common/split/layer_manager.ts`、`filter/layer_manager.ts` 及相关文件中的 **Mixin 封装与装饰器用法**，作为通用学习参考。  
项目中另有一套基于 Proxy 的 mixin 实现，参见 [mixin.read.md](./mixin.read.md)。

---

## 目录

1. [概念：什么是这里的“装饰器”与 Mixin](#1-概念什么是这里的装饰器与-mixin)
2. [Mixin 的封装模式](#2-mixin-的封装模式)
3. [装饰器用法（在类上使用）](#3-装饰器用法在类上使用)
4. [类型约定：接口 + implements](#4-类型约定接口--implements)
5. [项目中的两套 Mixin 体系](#5-项目中的两套-mixin-体系)
6. [装饰器顺序与继承链](#6-装饰器顺序与继承链)
7. [如何新增一个 Mixin](#7-如何新增一个-mixin)
8. [常见问题与注意点](#8-常见问题与注意点)

---

## 1. 概念：什么是这里的“装饰器”与 Mixin

- **Mixin**：一个接收“基类构造函数”、返回“新类”的函数；新类会继承基类并增加若干属性和方法，从而把一份能力“混入”到不同基类上。
- **装饰器用法**：在 TypeScript 中通过 `experimentalDecorators: true`，把这类 Mixin 当作 **类装饰器** 使用，写在类声明上方，例如 `@SpotsSplitMixin`。

因此：

- “装饰器” = 类装饰器语法（`@MixinName`）。
- “Mixin” = 封装成「接收 Base，返回 `class extends Base`」的高阶函数；二者配合使用。

---

## 2. Mixin 的封装模式

### 2.1 标准签名与约束

来自 `split/layer_manager.ts` 的典型写法：

```typescript
// 1）先定义该 Mixin 对外提供的能力（接口）
export interface ISpotsSplit {
  managedUserLayer: ManagedUserLayer;
  enableSplitMode: () => void;
  disableSplitMode: () => void;
  setSplitOffset: (colors: Float32Array) => void;
  clearSplitOffset: () => void;
  clearChunksSplitProp(): Promise<void>;
  setCurrentChunksPointsOffsetIndex(/* ... */): Promise<void>;
}

// 2）Mixin 函数：约束“基类”必须继承自某个基类
export function SpotsSplitMixin<
  TBase extends { new (...args: any[]): AnnotationLayerManager },
>(Base: TBase) {
  return class extends Base implements ISpotsSplit {
    // 新增状态
    renderMode: RenderModeEnum;
    splitOffsetData: Float32Array;
    polytreeArr: PolyTree[] | null;
    polygonsData: PolygonData[] = [];
    offset = 0;

    constructor(...args: any[]) {
      super(...args);
      const layer = this.managedUserLayer.layer as AnnotationUserLayer;
      this.renderMode = layer.renderMode = RenderModeEnum.normalMode;
      this.splitOffsetData = layer.splitOffsetData = new Float32Array();
      this._init();
    }

    async enableSplitMode() { /* ... */ }
    async disableSplitMode() { /* ... */ }
    setSplitOffset(offset: Float32Array) { /* ... */ }
    clearSplitOffset() { /* ... */ }
    async clearChunksSplitProp() { /* ... */ }
    async setCurrentChunksPointsOffsetIndex(/* ... */) { /* ... */ }
    addSplitVertexPreMainCode() { /* ... */ }
  };
}
```

要点：

| 要点 | 说明 |
|------|------|
| **泛型约束** | `TBase extends { new (...args: any[]): AnnotationLayerManager }` 表示“只接受能 new 出 `AnnotationLayerManager` 子类的构造函数”，保证基类具备 `managedUserLayer`、`_init` 等。 |
| **返回类** | `return class extends Base implements ISpotsSplit` 表示：新类继承 `Base`，并声明实现接口 `ISpotsSplit`，便于类型检查。 |
| **constructor** | 必须 `super(...args)`，并可在此初始化 Mixin 自己的状态（如 `splitOffsetData`），或调用基类钩子（如 `_init()`）。 |

Filter 侧的 `SpotsFilterMixin` 结构相同，只是接口为 `ISpotsFilter`、实现的是过滤相关方法与状态。

### 2.2 Render Helper 侧的 Mixin（同一模式）

`common/split/render_helper.ts`、`common/filter/render_helper.ts` 里是同一套“装饰器式 Mixin”思路，只是基类约束不同：

```typescript
// split/render_helper.ts
export interface ISpotsSplitRenderHelperMixin {}

export function SpotsSplitOffsetRenderHelperMixin<
  TBase extends { new (...args: any[]): IRenderHelperBase },
>(Base: TBase) {
  return class SpotsSplitRenderHelperMixinClass
    extends Base
    implements ISpotsSplitRenderHelperMixin
  {
    splitOffsetData: Float32Array | undefined;
    splitOffsetShaderManager: IndexStatedOffsetShaderManager = new IndexStatedOffsetShaderManager();
    _lastProcessedData: Float32Array | null = null;

    dispose() { /* ... */ }
    defineShaderCommon(builder: ShaderBuilder) { /* ... */ }
    enableCommon(shader: ShaderProgram, context: AnnotationRenderContext) { /* ... */ }
    enableOffsetSplit(shader: ShaderProgram) { /* ... */ }
  };
}
```

- 这里约束的是“能 new 出 `IRenderHelperBase` 的构造函数”，用于渲染管线中的 Helper 类，而不是 LayerManager。

---

## 3. 装饰器用法（在类上使用）

在需要“既支持 Filter 又支持 Split”的 LayerManager 上，直接叠两个类装饰器：

```typescript
// 来自 bin/cluster.ts
import { AnnotationLayerManager } from "engine/manager/common/base";
import { ISpotsFilter, SpotsFilterMixin } from "engine/manager/common/filter/layer_manager";
import { ISpotsSplit, SpotsSplitMixin } from "engine/manager/common/split/layer_manager";

export interface BinClusterSpatialLayerManager
  extends ISpotsFilter,
    ISpotsSplit,
    AnnotationLayerManager {}

@SpotsFilterMixin
@SpotsSplitMixin
export class BinClusterSpatialLayerManager extends AnnotationLayerManager {
  // 类自身状态与方法
  storageLayerOptions: BinClusterSpatialLayerOptions;
  infoProperties = binClusterInfoProperties;
  // ...
  protected generateShader() {
    // 可调用 Mixin 提供的方法
    `${this.addFilterVertexPreMainCode()}`
    `${this.addSplitVertexPreMainCode()}`
  }
}
```

- **谁可以被“装饰”**：继承自 `AnnotationLayerManager`（或满足 Mixin 泛型约束）的类。
- **效果**：最终导出的类在运行时是“多层继承”的匿名子类，同时拥有 Filter 与 Split 的方法和状态；类型上通过下面的接口合并表达。

---

## 4. 类型约定：接口 + implements

- 每个 Mixin 都对应一个 **接口**（如 `ISpotsSplit`、`ISpotsFilter`），在 Mixin 的 `return class ... implements IXxx` 里声明实现。
- 使用方在 **声明具体 Manager 类型** 时，用接口做交叉类型，这样 TypeScript 和 IDE 能识别到混入的方法和属性：

```typescript
export interface BinClusterSpatialLayerManager
  extends ISpotsFilter,
    ISpotsSplit,
    AnnotationLayerManager {}
```

这样：

- 实现侧：Mixin 返回的匿名类 `implements ISpotsSplit`（或 `ISpotsFilter`），保证实现完整。
- 使用侧：`BinClusterSpatialLayerManager` 被声明为同时具备 Filter、Split 和基类能力，类型安全。

---

## 5. 项目中的两套 Mixin 体系

| 体系 | 作用 | 基类约束 | 典型文件 |
|------|------|----------|----------|
| **LayerManager Mixin** | 图层业务：过滤、分屏、chunk 数据等 | `AnnotationLayerManager` | `common/filter/layer_manager.ts`、`common/split/layer_manager.ts` |
| **RenderHelper Mixin** | 渲染管线：着色器、uniform、纹理等 | `IRenderHelperBase` | `common/filter/render_helper.ts`、`common/split/render_helper.ts` |

两套都采用「泛型约束 Base + return class extends Base implements IXxx」的同一封装模式，只是应用在不同层次的类上。

---

## 6. 装饰器顺序与继承链

TypeScript 类装饰器的执行顺序是 **从下到上**（先应用最靠近 class 的装饰器）：

```typescript
@SpotsFilterMixin   // ② 后应用：包装的是 ① 的结果
@SpotsSplitMixin   // ① 先应用：包装 BinClusterSpatialLayerManager
export class BinClusterSpatialLayerManager extends AnnotationLayerManager {}
```

等价于：

```typescript
const WithSplit = SpotsSplitMixin(BinClusterSpatialLayerManager);
const WithFilterAndSplit = SpotsFilterMixin(WithSplit);
export const BinClusterSpatialLayerManager = WithFilterAndSplit;
```

因此 **继承链** 是：

`AnnotationLayerManager` → `BinClusterSpatialLayerManager` → Split 匿名类 → Filter 匿名类。

若 Mixin 之间有依赖（例如某个 Mixin 依赖另一个提供的 `addSplitVertexPreMainCode`），顺序要保证被依赖的 Mixin 先应用（更靠近 `class`），即先 Split 再 Filter 是合理的。

---

## 7. 如何新增一个 Mixin

按下面步骤即可与现有风格一致：

1. **定义接口**  
   在对应模块（如 `common/xxx/layer_manager.ts`）中声明 `IXxx`，列出对外方法（和关键属性）。

2. **写 Mixin 函数**  
   - 泛型：`TBase extends { new (...args: any[]): AppropriateBase }`（Base 选 `AnnotationLayerManager` 或 `IRenderHelperBase` 等）。  
   - 返回：`return class extends Base implements IXxx { ... }`。  
   - 在 `constructor` 里 `super(...args)` 并做必要初始化。

3. **在目标类上使用**  
   - 在类上叠加 `@XxxMixin`（注意顺序）。  
   - 在类的类型声明里 `extends IXxx`（或把 `IXxx` 合并进已有接口）。

4. **若在 Render 侧**  
   在 Helper 链上同样用「接口 + Mixin 函数 + 装饰器」方式扩展，约束为 `IRenderHelperBase`。

---

## 8. 常见问题与注意点

- **为什么要 `implements IXxx`？**  
  保证 Mixin 返回的类完整实现接口，并让被装饰的类通过接口合并获得类型提示和检查。

- **基类约束里的 `new (...args: any[]): AnnotationLayerManager` 是什么？**  
  表示“任意参数、且实例类型为 `AnnotationLayerManager` 的构造函数”，这样 Mixin 里可以安全使用 `this.managedUserLayer`、`this._init()` 等基类成员。

- **多个 Mixin 的 constructor 都会执行吗？**  
  会。每个 `class extends Base` 的 constructor 里都会 `super(...args)`，最终形成一条从 `AnnotationLayerManager` 到最外层匿名类的完整构造链；每个 Mixin 的初始化逻辑都会跑一遍。

- **和 docs/mixin.read.md 的区别？**  
  `mixin.read.md` 描述的是基于 **Proxy + 方法复制到原型** 的另一套 mixin 系统（如 `mixinWith(SpotsFilterMixin)`）。当前 `split`/`filter` 下的 LayerManager 和 RenderHelper 使用的是 **类装饰器 + 继承** 的写法，没有 Proxy，结构更简单，本文档针对的是后者。

---

## 小结

| 项目 | 说明 |
|------|------|
| **封装** | Mixin = 函数 `(Base) => class extends Base implements IXxx`，泛型约束 Base 为某基类的子类构造函数。 |
| **用法** | 在类上使用 `@SpotsFilterMixin`、`@SpotsSplitMixin` 等类装饰器（需 `experimentalDecorators: true`）。 |
| **类型** | 每个 Mixin 对应一个接口；具体 Manager/Helper 类型用 `extends ISpotsFilter, ISpotsSplit, ...` 合并。 |
| **顺序** | 装饰器从下到上应用，被依赖的 Mixin 应更靠近 class（先应用）。 |
| **两套体系** | LayerManager 用 `AnnotationLayerManager` 约束；RenderHelper 用 `IRenderHelperBase` 约束，模式相同。 |

按上述模式即可在现有代码中保持一致的“装饰器式 Mixin”封装与用法。
