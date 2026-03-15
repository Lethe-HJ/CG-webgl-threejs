/**
 * 通用装饰器示例（对应 doc/typescripts/通用装饰器封装.md）
 *
 * - 01-class-decorators.ts  类装饰器：只打标记 / 包装类
 * - 02-injectable-and-container.ts  Injectable + 最小 DI 容器
 * - 03-controller-style.ts   Controller 风格路由元数据
 */

export { defineMetadata, getMetadata, METADATA_KEYS } from "./metadata.ts";
export { Injectable, Inject, getOrCreate, clearContainer } from "./02-injectable-and-container.ts";
export type { InjectableOptions } from "./02-injectable-and-container.ts";
export { Controller, registerController, getRegisteredRoutes } from "./03-controller-style.ts";
