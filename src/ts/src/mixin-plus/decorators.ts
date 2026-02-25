// ✅ 组合式混入装饰器工具
// 说明：
// 1. 请确保 tsconfig.json 中开启 "experimentalDecorators": true
// 2. 通过 Mix() 装饰器或 createMixedClass() 工厂函数，一次性组合多个能力

export type AnyConstructor<TInstance = any> = new (...args: any[]) => TInstance;


export type Mixin<TBase extends AnyConstructor> = (
  Base: TBase
) => AnyConstructor;

const applyMixins = <TBase extends AnyConstructor>(
  Base: TBase,
  mixins: Mixin<any>[]
) : AnyConstructor =>
  mixins.reduceRight(
    (Current, mixin) => mixin(Current as AnyConstructor),
    Base as AnyConstructor
  );

/**
 * 装饰器形式：@Mix(WithFilter, WithSplit)
 * - 执行顺序仍然遵循装饰器从下往上的规则
 */
export function Mix(...mixins: Mixin<any>[]): ClassDecorator {
  return ((target: Function) =>
    applyMixins(target as AnyConstructor, mixins)) as ClassDecorator;
}

/**
 * 工厂形式：const Mixed = createMixedClass(BasicLayer, WithFilter, WithSplit)
 * - 便于在运行时根据条件动态组合能力
 */
export function createMixedClass<TBase extends AnyConstructor>(
  Base: TBase,
  ...mixins: Mixin<any>[]
) {
  return applyMixins(Base, mixins) as TBase;
}
