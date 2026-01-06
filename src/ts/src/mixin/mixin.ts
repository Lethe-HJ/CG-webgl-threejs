// ✅ 装饰器 + 混入模式示例
// 说明：
// 1. 请确保在 tsconfig.json 中开启 "experimentalDecorators": true
// 2. 这里的装饰器本质上是一个高阶构造函数，返回继承了额外能力的新类
// 3. 通过可组合的 Mixins，避免多层继承的复杂性，同时保留类型信息

export interface FilterAble {
  enableFilter(): void;
  disableFilter(): void;
}

export interface SplitAble {
  enableSplit(): void;
  disableSplit(): void;
}

/**
 * 类装饰器：将过滤能力（FilterAble）混入目标类
 * @param Base 原始基类
 */
export function WithFilter<TBase extends new (...args: any[]) => object>(
  Base: TBase
) {
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

/**
 * 类装饰器：将分屏能力（SplitAble）混入目标类
 * @param Base 原始基类
 */
export function WithSplit<TBase extends new (...args: any[]) => object>(
  Base: TBase
) {
  return class extends Base implements SplitAble {
    constructor(...args: any[]) {
      super(...args);
      this.enableSplit();
    }
    enableSplit() {
      console.log("split on");
    }
    disableSplit() {
      console.log("split off");
    }
  };
}

/**
 * 被装饰的基础类，仅负责管理公共的基础属性
 */
export class BasicLayer {
  constructor(public name: string) {}
  init() {
    console.log(`init ${this.name}`);
  }
}
