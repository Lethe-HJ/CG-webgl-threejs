/**
 * 示例 2：Injectable 风格 + 最小 DI 容器
 * 对应文档《通用装饰器封装》第 2、3 节 —— 元数据与 Angular 风格 Injectable
 *
 * 使用本目录的 metadata 存储；若使用 reflect-metadata + emitDecoratorMetadata，
 * 可由 TS 自动生成 design:paramtypes，容器逻辑相同。
 */

import { defineMetadata, getMetadata, METADATA_KEYS } from "./metadata.ts";

// ---------------------------------------------------------------------------
// 装饰器：Injectable（打标记 + 写元数据）
// ---------------------------------------------------------------------------

type Constructor<T = unknown, Arg = unknown> = new (...args: Arg[]) => T;

export interface InjectableOptions {
  providedIn?: "root" | null;
}

export function Injectable(metadata?: InjectableOptions) {
  return function (target: Function) {
    defineMetadata(METADATA_KEYS.INJECTABLE, metadata ?? {}, target);
  };
}

/** 参数装饰器：显式指定该参数要注入的 depCtors（类） */
export function Inject(depCtors: Constructor) {
  return function (
    target: object,
    _key: string | symbol | undefined,
    index: number,
  ) {
    const ctor =
      typeof target === "function"
        ? target
        : (target as { constructor: Function }).constructor;
    const existingDepCtors: Constructor[] =
      getMetadata("inject:dep-ctors", ctor) ?? [];
    existingDepCtors[index] = depCtors;
    defineMetadata("inject:dep-ctors", existingDepCtors, ctor);
  };
}

// ---------------------------------------------------------------------------
// 最小 DI 容器：根据元数据解析依赖并实例化
// ---------------------------------------------------------------------------

const instances = new Map<Function, unknown>();

export function getInstance<T>(Ctor: Constructor<T, any>): T {
  if (instances.has(Ctor)) {
    return instances.get(Ctor) as T;
  }
  const depCtors: Constructor[] = getMetadata("inject:dep-ctors", Ctor) ?? [];
  const depInstances = depCtors.map((T) => getInstance(T));
  const instance = new Ctor(...depInstances);
  instances.set(Ctor, instance);
  return instance;
}

/** 仅用于示例：清空容器，便于测试 */
export function clearContainer(): void {
  instances.clear();
}

// ---------------------------------------------------------------------------
// 使用示例
// ---------------------------------------------------------------------------

@Injectable()
class UserService {
  getUserId(): string {
    return "user-001";
  }
}

@Injectable()
class AppService {
  constructor(
    @Inject(UserService)
    private userService: UserService,
  ) {}

  run(): string {
    return `AppService running, userId: ${this.userService.getUserId()}`;
  }
}

// 通过容器获取实例，依赖自动解析
const app = getInstance(AppService);
console.log(app.run());
