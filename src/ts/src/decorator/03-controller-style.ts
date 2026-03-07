/**
 * 示例 3：NestJS 风格的 Controller 装饰器
 * 对应文档《通用装饰器封装》第 4 节 —— NestJS 里类装饰器在做什么
 *
 * 仅在类上挂 path、controller 等元数据；路由注册由“框架”在启动时扫描完成。
 */

import { defineMetadata, getMetadata, METADATA_KEYS } from "./metadata.ts";

// ---------------------------------------------------------------------------
// 装饰器：Controller(path)
// ---------------------------------------------------------------------------

export function Controller(path: string) {
  return function (target: Function) {
    defineMetadata(METADATA_KEYS.PATH, path, target);
    defineMetadata(METADATA_KEYS.CONTROLLER, true, target);
  };
}

// ---------------------------------------------------------------------------
// 模拟“框架”启动时扫描并注册路由
// ---------------------------------------------------------------------------

const routes: { path: string; Controller: Function }[] = [];

export function registerController(Ctor: Function): void {
  const isController = getMetadata<boolean>(METADATA_KEYS.CONTROLLER, Ctor);
  if (!isController) return;
  const path = getMetadata<string>(METADATA_KEYS.PATH, Ctor) ?? "/";
  routes.push({ path, Controller: Ctor });
}

export function getRegisteredRoutes(): Readonly<typeof routes> {
  return routes;
}

// ---------------------------------------------------------------------------
// 使用示例
// ---------------------------------------------------------------------------

@Controller("/api/user")
class UserController {
  getUsers(): string[] {
    // 这里写“处理请求并返回响应”的逻辑；实际框架中通常会给该方法加 @Get() 等装饰器，以指定匹配的 HTTP 方法（GET/POST 等）。
    return ["u1", "u2"];
  }
}

@Controller("/api/config")
class ConfigController {
  getConfig(): Record<string, string> {
    return { theme: "dark" };
  }
}

const controllers = [UserController, ConfigController];
// 模拟启动时扫描（实际框架会通过模块/入口自动发现）
controllers.forEach((controller) => {
  registerController(controller);
});

console.log(
  "已注册路由:",
  getRegisteredRoutes().map((r) => r.path),
);
