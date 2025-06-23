type Constructor<T = any> = new (...args: any[]) => T;

// 类型工具：从 Mixin 参数中提取实例类型 / Type utility: Extract instance type from Mixin parameters
type ExtractMixinType<T> = T extends Constructor<infer U> ? U : 
                          T extends [Constructor<infer U>, ...any[]] ? U : 
                          never;

// 类型工具：将 Mixin 数组转换为交集类型 / Type utility: Convert Mixin array to intersection type
type MixinArrayToIntersection<T extends readonly any[]> = 
    T extends readonly [infer First, ...infer Rest] 
        ? ExtractMixinType<First> & MixinArrayToIntersection<Rest>
        : {};

// 类型工具：确保至少有一个 Mixin / Type utility: Ensure at least one Mixin
type NonEmptyArray<T> = [T, ...T[]];

/**
 * 强大的 Mixin 装饰器工厂 / Powerful Mixin Decorator Factory
 * 支持无限个 Mixin 类的同时应用，支持参数传递和类型约束
 * Supports applying unlimited Mixin classes simultaneously, with parameter passing and type constraints
 * 
 * 用法 / Usage:
 * 1. 单个无参数: @mixinWith(MixinClass)
 * 2. 单个有参数: @mixinWith([MixinClass, param1, param2])
 * 3. 多个 Mixin: @mixinWith(Mixin1, Mixin2, Mixin3, ...)
 * 4. 多个带参数: @mixinWith([Mixin1, param1], [Mixin2, param2], Mixin3, ...)
 * 5. 无限组合: @mixinWith(M1, [M2, p1], M3, [M4, p1, p2], M5, ...)
 */
export function mixinWith<TMixins extends NonEmptyArray<Constructor<any> | [Constructor<any>, ...any[]]>>(
    ...mixins: TMixins
): <T extends Constructor>(target: T) => T & Constructor<InstanceType<T> & MixinArrayToIntersection<TMixins>> {
    return function <T extends Constructor>(target: T): T & Constructor<InstanceType<T> & MixinArrayToIntersection<TMixins>> {
        const DecoratedClass = class extends target {
            constructor(...args: any[]) {
                super(...args);
                
                // 处理每个 Mixin
                mixins.forEach(mixin => {
                    let MixinClass: Constructor<any>;
                    let params: any[] = [];
                    
                    if (Array.isArray(mixin)) {
                        // 带参数的 Mixin: [MixinClass, param1, param2, ...]
                        [MixinClass, ...params] = mixin;
                    } else {
                        // 无参数的 Mixin: MixinClass
                        MixinClass = mixin;
                    }
                    
                    // 创建 mixin 实例并复制其方法
                    const mixinInstance = params.length > 0 
                        ? new MixinClass(...params)
                        : new MixinClass();
                    
                    Object.getOwnPropertyNames(MixinClass.prototype).forEach(name => {
                        if (name !== 'constructor') {
                            const descriptor = Object.getOwnPropertyDescriptor(MixinClass.prototype, name);
                            if (descriptor) {
                                Object.defineProperty(this, name, {
                                    ...descriptor,
                                    value: descriptor.value?.bind(this)
                                });
                            }
                        }
                    });
                    
                    // 复制实例属性
                    Object.assign(this, mixinInstance);
                });
            }
        } as T & Constructor<InstanceType<T> & MixinArrayToIntersection<TMixins>>;

        // 复制静态属性和方法
        Object.getOwnPropertyNames(target).forEach(name => {
            if (name !== 'prototype' && name !== 'length' && name !== 'name') {
                (DecoratedClass as any)[name] = (target as any)[name];
            }
        });

        // 设置正确的类名
        Object.defineProperty(DecoratedClass, 'name', { value: target.name });

        return DecoratedClass;
    };
}

/**
 * 带类型约束的 Mixin 基类 / Type-constrained Mixin base class
 * 允许 Mixin 类直接访问目标类的接口属性
 * Allows Mixin class to directly access target class interface properties
 */
export function BaseMixin<TConstraint = {}>() {
    return class {
        // 类型断言，让 this 直接拥有约束接口的类型
        // Type assertion to let this directly have the constraint interface type
        constructor() {
            // 运行时不做任何操作，只是为了类型系统
            // No runtime operation, just for type system
        }
    } as new() => TConstraint;
}

// 导出类型辅助工具 / Export type helper utilities
export type Enhanced<TBase, TEnhancement> = TBase & TEnhancement;
export type EnhancedConstructor<TBase, TEnhancement> = Constructor<Enhanced<TBase, TEnhancement>>; 