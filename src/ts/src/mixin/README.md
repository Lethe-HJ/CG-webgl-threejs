## 类装饰器 + Mixins 示例说明

### 场景简介

`mixin` 目录展示了如何使用 TypeScript 的实验性类装饰器，将多个“能力模块”组合到同一个类上，从而避免深层继承带来的复杂性。示例包含以下角色：
- `BasicLayer`：基础类，只管理公共属性与初始化逻辑。
- `WithFilter` / `WithSplit`：用于注入过滤、分屏能力的类装饰器（本质上是 mixin）。
- `ClusterLayer`：通过顺序应用装饰器获得多重能力的示例类。

### 使用前置条件

1. 确保 `tsconfig.json` 已开启装饰器支持：
   ```json
   {
     "compilerOptions": {
       "experimentalDecorators": true
     }
   }
   ```
2. 构建/运行环境使用 TypeScript 5.x 及支持装饰器的打包器。

### 装饰器工作原理

每个装饰器都是一个高阶构造函数：

```ts
export function WithFilter<TBase extends new (...args: any[]) => object>(Base: TBase) {
  return class extends Base implements FilterAble {
    constructor(...args: any[]) {
      super(...args);
      this.enableFilter();
    }
    enableFilter() {
      console.log("filter on");
    }
    disableFilter() {
      console.log("filter off");
    }
  };
}
```

- `Base`：被装饰的原始类构造函数。
- `return class extends Base`：新类继承原始类，并额外实现能力接口。
- 构造函数中可以执行初始化逻辑，例如自动开启 `filter`。

### 装饰器的组合顺序

```ts
@WithFilter
@WithSplit
export class ClusterLayer extends BasicLayer {}
```

- 最靠近类声明的装饰器（`@WithSplit`）会 **先** 执行，返回的新类再交给 `@WithFilter`。
- 最终的 `ClusterLayer` 同时实现了 `FilterAble` 与 `SplitAble` 接口。
- 通过 `interface ClusterLayer extends FilterAble, SplitAble {}` 可以让类型系统识别出新增的方法。

### 类型系统如何感知扩展能力

虽然装饰器返回的新类在运行时已经具备了额外方法，但 TypeScript 对此并不了解。为了让类型提示同步更新，可额外声明一个同名接口，将能力接口合并进来：

```ts
export interface ClusterLayer extends FilterAble, SplitAble {}
```

这一行的作用：
- 告诉 TypeScript：`ClusterLayer` 实例拥有 `FilterAble`、`SplitAble` 中定义的成员。
- 避免在调用 `enableFilter()` / `disableSplit()` 等方法时出现类型报错。
- 与装饰器返回的新类配合，实现运行时与类型系统的双重扩展。

### 快速演示

```ts
const layer = new ClusterLayer("demo-layer");
layer.enableFilter();   // 来自 WithFilter
layer.disableSplit();   // 来自 WithSplit
```

### 延伸实践建议

- 将能力拆分为更细的 mixin，保持职责单一。
- 在 mixin 内部可以安全地访问基类公开成员，也可以覆写方法。
- 若 mixin 之间存在依赖，注意装饰器的顺序与构造函数初始化顺序。

通过这种模式，可以在保持类型安全的前提下柔性组合类能力，非常适合地图图层、图形渲染等需要“能力拼装”的场景。

