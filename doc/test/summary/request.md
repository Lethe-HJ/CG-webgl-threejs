# src/request 通用技术要点与设计总结

本文档从 `src/request` 目录提炼可复用的核心技术要点与设计模式，用于提升编码水平与架构理解。

---

## 一、整体架构：分层与职责分离

### 1.1 两层结构

| 层级 | 目录 | 职责 |
|------|------|------|
| **HTTP 层** | `http/` | 创建 axios 实例、配置拦截器、封装 get/post/patch/put/delete、统一错误与响应形态 |
| **API 层** | `api/` | 按业务模块组织：接口地址常量、请求/响应类型、具体请求函数 |

**设计要点**：业务代码只调用 API 层的请求函数，不直接使用 HTTP 实例，从而：

- 统一收敛请求入口，便于日志、监控、重试
- 类型与接口一一对应，避免手写 URL 和参数
- 换 HTTP 库或加一层网关时只需改 HTTP 层

### 1.2 多实例按服务拆分

不同后端服务使用**独立 baseURL 的 axios 实例**：

- `renderHttp`：渲染服务
- `visualHttp`：可视化服务
- `imageProcessingHttp`：图像处理服务
- `analyzeHttp`：分析服务

**设计要点**：

- 每个服务一个 `http/xxx.ts`，内部 `createAxiosInstance(baseURL)` + 同一套拦截器与方法封装
- 配置集中在 `http/config.ts`，通过 `getXxxBaseUrl()` 等函数提供 baseURL
- 多实例避免单实例 baseURL 频繁切换和拦截器逻辑耦合

---

## 二、HTTP 层核心技术点

### 2.1 工厂 + 组合式增强

```ts
// 创建裸实例
export function createAxiosInstance(baseURL: string) {
  const http = axios.create({ baseURL });
  return http;
}

// 通过“增强函数”挂载拦截器和方法，而不是继承
useRequestInterceptors(http);
useResponseInterceptors(http);
const httpObject = { ...useRequestMethods(http), baseUrl, socket, ... };
```

**设计要点**：用「工厂 + 无继承的组合」替代「类继承」。每个 `useXxx` 只做一件事，便于单测和按需组合（例如某个实例不需要取消请求就不挂 cancelToken 逻辑）。

### 2.2 请求拦截器：可追踪请求头与取消令牌

- **统一请求头**：通过 `onlineTraceableHeaderFields` 存储 token、lang 等，在请求拦截器里写回 `config.headers`，便于多端/多环境追踪。
- **请求取消**：用 axios `CancelToken` 在拦截器里挂到每次请求，并暴露 `cancelAllRequests()`，用于页面卸载或路由切换时取消未完成请求。

**可借鉴点**：需要“全请求生效”的横切逻辑（头、取消、日志）放在拦截器，而不是在每个 API 里写一遍。

### 2.3 响应拦截器：统一解包与错误形态

- **成功**：拦截器里 `return response.data`，即业务拿到的直接是 `BaseResponse<T>`，不再包一层 `response.data`。
- **错误**：区分 `error.response`（有响应）、`error.request`（无响应）、其它，统一转成 `{ message, code }` 再 `Promise.reject`，便于上层统一处理。

**设计要点**：响应形态在拦截器里定型（解包、错误归一化），业务层只关心「成功拿 T」或「失败拿统一错误结构」。

### 2.4 方法封装：GET 参数形态统一

```ts
const get = async <T>(url: string, params?: any): Promise<BaseResponse<T>> => {
  const res = await http.get<BaseResponse<T>>(
    url,
    params?.params ? params : { params },
  );
  return cast<BaseResponse<T>>(res);
};
```

**设计要点**：兼容「直接传 query 对象」和「传 `{ params }`」两种写法，避免调用方因形态不一致报错；返回用 `cast` 对接拦截器解包后的类型。

### 2.5 类型与枚举集中定义

- **BaseResponse\<T\>**：`code / level / data / msg` 统一结构。
- **ResponseMsg**：如 `OK`、`EMPTY_DATA`，用于业务判断是否成功、是否空数据。
- **ResponseErrorCode**：所有业务/系统错误码集中枚举，避免魔法字符串。

**可借鉴点**：接口层用枚举表达固定集合（状态、错误码），类型表达数据结构，便于重构和检索。

---

## 三、配置与运行时覆盖

### 3.1 静态默认配置

`http/config.ts` 中：

- 用 `interface ServerConfigs` 约束端口等字段。
- 通过 `declare global` 扩展 `window.serverConfigs`，在 __DEV__ 下可覆盖端口。
- 对外只暴露 `config` 对象和 `getXxxBaseUrl()`、`getXxxSocket()`，不暴露裸端口。

### 3.2 运行时异步覆盖

各 http 实例在模块加载时先使用 config 默认值，再在 `window.configService.ready.then(...)` 中用远端或本地配置覆盖 `http.defaults.baseURL` 和自暴露的 `baseUrl`。

**设计要点**：支持「先可用的默认 baseURL + 后生效的配置」，适合 Electron 或需要异步拉配置的场景。

---

## 四、API 层规范与模式

### 4.1 四件套结构

每个接口建议包含（与 readme 一致）：

1. **接口地址常量**：`api.xxx = '/path'` 或 `api.xxx = (id) => \`/path/${id}\``
2. **请求参数类型**：`XxxGetRequestParams` / `XxxPostRequestParams`
3. **响应数据类型**：`XxxGetResponseData` / `XxxPostResponseData`
4. **请求函数**：内部调用 `xxxHttp.get/post/...(api.xxx, params)`，返回 `Promise<BaseResponse<T>>` 或封装后的 `Promise<T>`

**命名约定**：

- 参数：`${ApiName}${Method}RequestParams`
- 响应：`${ApiName}${Method}ResponseData` 或 `Response`

### 4.2 动态路径与 Brand 类型

路径带动态片段时用函数返回 URL：

```ts
layerQuery: (taskId: string | null = null) => `render/${taskId}/query`
```

对「语义化字符串」使用 Brand 类型，避免与普通 string 混用：

```ts
export type PrecomputedUrl = Brand<string>;
// 使用: `... as PrecomputedUrl`
```

**设计要点**：URL 集中在一处，调用方传参即可；Brand 在类型层面区分「任意字符串」与「预定义格式的 URL」。

### 4.3 接口复用与按业务拆分

- **复用**：共用的类型和基础请求放在 `api/xxx/base.ts`，具体业务再在 `category.ts` 等文件中封装更贴业务的请求函数。
- **拆分**：`api/visual/`、`api/render/`、`api/processing/`、`api/analyze/` 按领域划分，便于查找和权限/网关按模块配置。

### 4.4 两种返回风格

1. **直接返回 BaseResponse**：`return xxxHttp.get<Res>(url, params)`，由调用方自己取 `res.data`、判断 `res.msg`。
2. **封装成“业务语义”**：在请求函数内判断 `res.msg === ResponseMsg.OK`，抛错或返回默认值，最后 `return res.data.xxx`，调用方直接拿业务数据。

**可借鉴点**：高频、多处调用的接口适合封装成「直接返回业务数据 + 内部统一错误处理」；通用、需灵活处理的接口可保留返回 `BaseResponse<T>`。

---

## 五、类型与错误处理

### 5.1 避免 any，用 cast 衔接拦截器

拦截器改变了返回值形态，类型上仍可能是 `AxiosResponse`，用工具函数做一次断言，避免到处 `as`：

```ts
return cast<BaseResponse<T>>(res);
```

**设计要点**：在边界处集中做类型衔接，业务代码保持泛型 `T` 推断。

### 5.2 业务错误与 HTTP 错误分离

- **HTTP 层**：只负责把网络/服务器错误转成统一结构并 reject。
- **API 层**：根据 `res.code`、`res.msg` 决定是抛错、提示还是返回默认值（如空数组），必要时用 `ResponseErrorCode` 做分支。

### 5.3 联合类型表达多形态请求

当同一接口对应多种请求体时，用联合类型而不是 any：

```ts
export type RenderInitPostRequestParams =
  | SpotsRenderInitPostRequestParams
  | ImageRenderInitPostRequestParams
  | MultiColorRenderInitPostRequestParams
  | ...;
```

**设计要点**：类型即文档，调用方和实现方都能得到约束和补全。

---

## 六、可观测与解耦

### 6.1 日志包装

对重要 API 使用 `functionCallRecord(logger)` 包装，便于记录入参、耗时、异常：

```ts
export const visualCoordinatesPostRequest = record(
  async function visualCoordinatesPostRequest(params) { ... }
);
```

**设计要点**：在 API 层对“入口函数”做 AOP，而不是在业务里到处打 log。

### 6.2 事件解耦

请求/响应中需要影响全局状态时（如更新 token、lang），通过事件中心发出：

```ts
commonEventCenter.emit(COMMON_EVENTS.AFTER_SET_HEADER, { old, new: ... });
commonEventCenter.emit(COMMON_EVENTS.AFTER_UPDATE_HEADER, { old, new: ... });
```

**设计要点**：HTTP 层不直接依赖具体 Store 或 UI，只发事件；谁关心谁订阅，保持依赖方向单一。

---

## 七、可提升编码水平的要点小结

1. **分层**：HTTP 管传输与形态，API 管语义与类型，业务只调 API。
2. **多实例**：按服务拆实例，配置集中，便于不同 baseURL、超时、拦截策略。
3. **组合优于继承**：`createAxiosInstance` + `useXxx` 增强，易测试、易扩展。
4. **拦截器定型**：请求头、取消、日志、响应解包、错误归一化都在拦截器完成，业务代码简洁。
5. **类型即契约**：BaseResponse、RequestParams、ResponseData、枚举错误码，命名统一、避免 any。
6. **Brand 与 cast**：在边界区分“语义化类型”和“任意字符串”，在拦截器边界做类型衔接。
7. **配置两阶段**：静态默认 + 异步 ready 覆盖，兼容本地与远端配置。
8. **API 四件套**：URL 常量 + 请求/响应类型 + 请求函数，便于维护和检索。
9. **错误分层**：网络/HTTP 在底层统一形态，业务错误在 API 层按 code/msg 处理。
10. **可观测与解耦**：关键接口用 record 包装；跨模块通知用事件，避免 HTTP 层依赖业务模块。

---

## 八、与项目规范的对应关系

- **命名**：接口 PascalCase，请求函数 camelCase 且动词开头，类型名带 RequestParams/ResponseData。
- **职责**：request 目录相当于「面向后端的 Service 层」，不包含 UI 和 Store，通过事件与上层解耦。
- **错误与日志**：集中使用 logger 与统一错误结构，符合「错误处理与日志记录」的规范要求。

按上述要点理解和扩展 `src/request`，可以在保持风格一致的前提下，提升接口层的可维护性、类型安全和可观测性。
