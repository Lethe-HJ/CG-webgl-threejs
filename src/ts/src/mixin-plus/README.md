## 组合式类装饰器封装示例

本目录展示如何在基础示例之上，封装更易用的 mixin 组合工具，使装饰器写法与运行时工厂写法都更简洁。

### 目录结构

- `decorators.ts`：定义基础类、能力接口以及 `Mix`、`createMixedClass` 两个核心工具。
- `index.ts`：给出装饰器（`@Mix()`）与工厂函数两种使用方式的示例。

### 核心 API

```ts
Mix(...mixins: Mixin[]): ClassDecorator;
createMixedClass(Base, ...mixins): new (...args) => any;
```

- `Mix`：包装成单个类装饰器，支持顺序组合多个 mixin。
- `createMixedClass`：在运行时动态组合新类，适用于条件化的能力注入。

### 使用示例

```ts
@Mix(WithFilter, WithSplit, WithSnapshot)
class SmartLayer extends BasicLayer {}

const MixedLayer = createMixedClass(BasicLayer, WithFilter, WithSplit);
```

配合接口扩展，类型系统能够正确推断新增方法：

```ts
interface SmartLayer extends FilterAble, SplitAble, SnapshotAble {}
```

### 适用场景

- 需要频繁组合不同能力的图层/组件。
- 希望保留装饰器语法的同时，减少重复书写。
- 需要在运行时根据配置动态组合能力。

更多细节可参考原始示例 `src/ts/src/mixin` 中的基础讲解，本目录作为进阶封装补充。

