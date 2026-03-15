export type cancelAble = () => void;

export class Disposable {
  private _events: cancelAble[] = [];
  register(...events: cancelAble[]) {
    this._events.push(...events);
  }

  dispose() {
    this._events.forEach((cancelAble) => cancelAble());
    this._events = [];
  }
}

export class BaseManager extends Disposable {}

export class BaseSingletonManager extends BaseManager {
  // 使用构造函数作为键，避免压缩后类名重复的问题
  private static instances = new Map<
    new () => BaseSingletonManager,
    BaseSingletonManager
  >();

  constructor() {
    super();
    // 这个单例管理器基类的每个子类 只能被new一次
    const constructor = this.constructor as new () => BaseSingletonManager;
    if (BaseSingletonManager.instances.has(constructor)) {
      const className = this.constructor.name;
      throw new Error(`${className} is a singleton class`);
    }
    BaseSingletonManager.instances.set(constructor, this);
  }

  protected static clearInstances() {
    this.instances = new Map();
  }

  static getInstance<T extends BaseSingletonManager>(this: { new (): T }): T {
    if (!BaseSingletonManager.instances.has(this)) {
      new this();
    }
    return BaseSingletonManager.instances.get(this) as T;
  }

  destroy() {
    this.dispose();
    BaseSingletonManager.clearInstances();
  }
}
