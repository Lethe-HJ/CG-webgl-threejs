/**
 * 轻量元数据存储（不依赖 reflect-metadata）
 * 若项目已安装 reflect-metadata 并开启 emitDecoratorMetadata，
 * 可直接用 Reflect.defineMetadata / Reflect.getMetadata 替代。
 */

const store = new WeakMap<object, Map<string, unknown>>();

function getMap(target: object): Map<string, unknown> {
  let m = store.get(target);
  if (!m) {
    m = new Map();
    store.set(target, m);
  }
  return m;
}

export function defineMetadata(key: string, value: unknown, target: object): void {
  getMap(target).set(key, value);
}

export function getMetadata<T = unknown>(key: string, target: object): T | undefined {
  return getMap(target).get(key) as T | undefined;
}

export const METADATA_KEYS = {
  PARAMTYPES: "design:paramtypes",
  INJECTABLE: "angular:injectable",
  CONTROLLER: "controller",
  PATH: "path",
} as const;
