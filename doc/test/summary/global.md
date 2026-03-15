# Code Summary: `src/global.ts`

> 基于 `src/global.ts` 提炼的通用技术要点与可迁移经验，侧重思路与实现方式，弱化业务细节。

---

## 1. 不常见或值得注意的语法与用法

### 1.1 全局类型增强（Global Augmentation）

```ts
declare global {
  interface Window {
    visualTaskId: AccessiblePromise<VisualTaskId>;
    configService: ConfigService;
    // ...
  }
  const configService: typeof window.configService;
  const languageService: typeof window.languageService;
  // ...
}
```

- **要点**：在 TypeScript 中通过 `declare global` 扩展内置的 `Window` 类型，并配合**同名全局常量**声明。
- **作用**：  
  - 为 `window.xxx` 提供类型，避免到处写 `(window as any).xxx`。  
  - 声明 `const xxx` 后，在业务代码里可直接写 `configService` 而不写 `window.configService`，类型与 `window.configService` 一致。
- **注意**：这些 `const` 只是类型声明，运行时仍需要某处把 `window.xxx` 赋给全局（或始终通过 `window.xxx` 访问），否则运行时会拿不到变量。

### 1.2 仅类型导入（Type-Only Imports）

```ts
import type { ConfigService } from '@/service/config';
import type { LayersHelper } from '@/views/visual/layers/helpers/layers';
// ...
```

- **要点**：所有 Manager/Service/Helper 仅作类型使用，一律用 `import type`。
- **好处**：编译后这些导入会被擦除，不增加 bundle 体积，同时保留完整类型信息，适合“只用来给全局/接口打类型”的场景。

### 1.3 “先 Promise 后占位”的异步全局初始化

```ts
// 声明处允许两种形态
osType: OSTypeEnum | Promise<OSTypeEnum>;

// 初始化：先给 Promise，再在 then 里替换为具体值
window.osType = detectOS().then((osType) => {
  window.osType = osType;
  return osType;
});
```

- **要点**：全局量先被赋值为 Promise，在 `.then` 里再赋值为最终结果，类型上用 `T | Promise<T>` 表达“可能是异步结果”。
- **用途**：调用方可以 `await window.osType`（若为 Promise）或直接使用（若已解析），兼容“尚未就绪”与“已就绪”两种状态。
- **注意**：使用方必须按“可能异步”来写（如统一 `await` 或判断是否为 Promise），否则在未解析时可能拿到 Promise 对象而非值。

### 1.4 自定义类型：`AccessiblePromise<T>`

```ts
visualTaskId: AccessiblePromise<VisualTaskId>;
```

- **要点**：不是标准 `Promise<T>`，而是项目内封装的“可访问的 Promise”类型（通常既可能被 await，又可能在某种情况下同步取到结果）。
- **经验**：对“异步但可能提前就绪”的全局单例，用自定义 Promise 相关类型可以更准确表达 API，避免被误用为普通 Promise。

### 1.5 开发环境专用全局与动态导入

```ts
if (__DEV__) {
  import('@/utils/tracker/memory').then(({ memoryTracker }) => {
    if (window.memoryTracker) return;
    window.memoryTracker = memoryTracker;
  });
  window.dev = { httpResponseHeader: {} };
  import('@/stores/visualMap').then(({ useVisualMapStore }) => {
    window.dev.visualMapStore = useVisualMapStore();
  });
}
```

- **要点**：  
  - `__DEV__` 作为全局常量，便于构建时做 dead code elimination，生产包可去掉整块逻辑。  
  - 开发环境才用 `import()` 懒加载 `memoryTracker`、`visualMapStore`，避免生产包带入这些模块。
- **注意**：依赖 `window.memoryTracker` / `window.dev.visualMapStore` 的代码需考虑“尚未挂到 window”的时序，必要时做存在性判断或延迟使用。

### 1.6 索引签名与固定属性并存

```ts
dev: {
  httpResponseHeader: Record<string, string>;
  [key: string]: unknown;
};
```

- **要点**：既有具名属性 `httpResponseHeader`，又有 `[key: string]: unknown`，表示“已知结构 + 允许其它未知键”。
- **注意**：索引签名会要求所有已知属性类型也兼容 `unknown`（或该签名类型），否则会报错，这里用 `unknown` 比较宽松。

---

## 2. 比较优秀的思路与设计模式

### 2.1 全局能力集中声明与分层

- **集中声明**：所有挂到 `window` 的运行时能力（各类 Manager、Service、Helper、DB、callbacks 等）在单一文件里通过 `declare global` 声明，类型集中、易维护。
- **分层清晰**：  
  - 环境/基础设施：`env`、`osType`、`__DEV__`、`remoteConfigEnabled`、`pathBrowserifyPatch`。  
  - 业务单例：visual、layers、dataSource、multiColor、lasso 等。  
  - 工具与扩展点：`callbacks`、`dev`、`TimerGroup`。  
  便于理解“谁在全局、为何在全局”。

### 2.2 环境驱动初始化

- 根据 `env`（如 `VITE_REMOTE_CONFIG_ENABLE`）决定是否 `pathBrowserifyPatch()`、是否启用远程配置。
- 根据 `__DEV__` 决定是否挂 `memoryTracker`、`dev`、以及是否使用 dev 的 remote 开关。
- **可迁移经验**：把“环境变量 + 全局开关”放在入口集中处理，避免在业务代码里散落判断，也利于测试时 mock 环境。

### 2.3 类型与运行时分离

- 所有 Manager/Service 只做 `import type`，真正实例化在别处（如应用初始化或懒加载），全局文件只负责“类型 + 挂载点”。
- **好处**：不形成循环依赖，打包时可被 tree-shaking，类型与运行时边界清晰。

### 2.4 防御式重复挂载

```ts
if (window.memoryTracker) {
  return;
}
window.memoryTracker = memoryTracker;
```

- 避免多次动态 import 或多次初始化导致覆盖或重复创建，适合“全局单例只设一次”的场景。

---

## 3. 容易踩坑的地方

### 3.1 过多依赖全局 `window`

- **问题**：大量能力挂在 `window` 上，模块间通过全局变量通信，不利于单元测试和按需加载，也容易产生隐式依赖。
- **建议**：新能力优先考虑通过依赖注入、Context 或 Pinia 等显式依赖；若必须用全局，尽量只保留“真正全局单例”的少数几项，并在文档中说明谁在何时赋值。

### 3.2 类型过宽或过窄

- `featureCustomData: []`：字面量类型为“空数组”，若实际会放入元素，应改为具体元素类型或泛型数组，避免类型与运行时不一致。
- `visualLayersData: any`：失去类型检查，后续重构或改字段时容易漏改，建议至少用 `unknown` 或具体接口。
- `callbacks` 里使用 `Function`：无法表达参数与返回值，建议改为具体函数类型，例如 `afterSetHeader: (() => void)[]`，便于类型安全和重构。

### 3.3 `window.osType` 的时序

- 声明为 `OSTypeEnum | Promise<OSTypeEnum>`，在未 resolve 前是 Promise。若某处直接当“已解析值”使用（如传给只接受 `OSTypeEnum` 的 API），会出错。
- **建议**：对外封装一个 `getOsType(): Promise<OSTypeEnum>`，内部统一 `await window.osType`（若为 Promise 再 await），保证调用方拿到的始终是解析后的值。

### 3.4 全局 `const` 声明与运行时一致性

- `declare global { const configService: typeof window.configService; }` 只保证类型存在，不保证运行时存在名为 `configService` 的全局变量。
- 若项目里确实写了 `configService` 而不写 `window.configService`，需要确保在入口或某个初始化脚本里对全局变量赋值（例如 `globalThis.configService = window.configService`），否则运行时会 ReferenceError。

### 3.5 注释掉的初始化逻辑

- 文件末尾大段注释掉的 `initializeVisualCache` 与 `setTimeout(initializeVisualCache, 0)` 若代表“暂时不用”，建议删除或移到文档/issue 中说明原因和后续计划，避免误以为已启用或误删关键逻辑。

---

## 4. 小结

| 维度           | 要点 |
|----------------|------|
| 类型与全局     | 用 `declare global` + `interface Window` + 同名 `const` 统一管理 window 与全局变量类型；Manager/Service 等仅 `import type`。 |
| 异步与初始化   | “先赋 Promise，再在 then 里赋结果”的模式适合全局异步初始化；使用方需统一按异步处理（如 await）。 |
| 环境与构建     | 用 `__DEV__` + 条件动态 import，把开发专用逻辑和包体隔离，便于生产裁剪。 |
| 可维护性       | 避免滥用 window；收敛 any/Function，用具体类型；对“可能为 Promise”的全局量提供统一访问函数，避免时序错误。 |

文档路径：`tmp/code-summary-20250307-120000.md`
