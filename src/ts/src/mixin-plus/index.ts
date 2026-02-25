import {
  Mix,
  createMixedClass,
  type AnyConstructor,
  type Mixin,
} from "./decorators";

/**
 * 以下为三个可复用的能力 mixin
 */
export const WithFilter: Mixin<AnyConstructor> = (Base) =>
  class extends Base implements FilterAble {
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

export const WithSplit: Mixin<AnyConstructor> = (Base) =>
  class extends Base implements SplitAble {
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

export const WithSnapshot: Mixin<AnyConstructor> = (Base) =>
  class extends Base implements SnapshotAble {
    takeSnapshot() {
      console.log("snapshot saved");
    }
  };

/**
 * 基础层：提供共享能力，可被 mixin 扩展
 */
export class BasicLayer {
  constructor(public name: string) {}
  init() {
    console.log(`init ${this.name}`);
  }
}

export interface FilterAble {
  enableFilter(): void;
  disableFilter(): void;
}

export interface SplitAble {
  enableSplit(): void;
  disableSplit(): void;
}

export interface SnapshotAble {
  takeSnapshot(): void;
}

/**
 * 示例 1：通过 Mix 装饰器一次性组合多个能力
 */
export interface SmartLayer extends FilterAble, SplitAble, SnapshotAble {}

@Mix(WithFilter, WithSplit, WithSnapshot)
export class SmartLayer extends BasicLayer {}

/**
 * 示例 2：通过工厂函数在运行时组合
 */
export const MixedRuntimeLayer = createMixedClass(
  BasicLayer,
  WithFilter,
  WithSplit
);

export type RuntimeLayerInstance = InstanceType<typeof MixedRuntimeLayer> &
  FilterAble &
  SplitAble;

const fromDecorator = new SmartLayer("decorator-layer");
fromDecorator.disableSplit();
fromDecorator.takeSnapshot();

const fromFactory = new MixedRuntimeLayer(
  "factory-layer"
) as RuntimeLayerInstance;
fromFactory.enableFilter();
fromFactory.disableSplit();
