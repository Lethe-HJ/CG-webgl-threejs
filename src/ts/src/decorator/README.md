# 通用装饰器示例

本目录是 [《通用装饰器封装》](../../../../../doc/typescripts/通用装饰器封装.md) 的配套示例，演示在 Angular / NestJS 这类 OOP 框架中类装饰器的实现方式。

## 文件说明

| 文件 | 对应文档章节 | 内容 |
|------|--------------|------|
| `01-class-decorators.ts` | §1 类装饰器的标准形式 | `SimpleDecorator`（只打标记）、`WrapDecorator`（返回包装类） |
| `02-injectable-and-container.ts` | §2 元数据与 §3 Angular 风格 | `@Injectable()`、`@Inject(Token)`、最小 DI 容器 `getOrCreate()` |
| `03-controller-style.ts` | §4 NestJS 风格 | `@Controller(path)`、`registerController`、路由元数据扫描 |
| `metadata.ts` | - | 轻量元数据存储（可替换为 `reflect-metadata`） |

## 运行示例

各文件末尾有可直接运行的示例（`console.log`）。在项目根目录或 `src/ts` 下通过测试或临时入口引入即可，例如：

```ts
import "./01-class-decorators.ts";
import "./02-injectable-and-container.ts";
import "./03-controller-style.ts";
```

或单独运行单个文件观察输出。

## 与文档的对应关系

- **只打标记**：不返回值的类装饰器，仅做元数据或日志（如 `SimpleDecorator`、`Injectable`、`Controller`）。
- **包装类**：返回新构造函数的类装饰器，用于 AOP（如 `WrapDecorator`）。
- **DI**：通过参数装饰器 `@Inject(Token)` 记录依赖，容器根据元数据递归实例化；若使用 `reflect-metadata` 并开启 `emitDecoratorMetadata`，可省略 `@Inject`，直接读取 `design:paramtypes`。
