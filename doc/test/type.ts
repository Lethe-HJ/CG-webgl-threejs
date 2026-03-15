export type Cast<T> = {
  <U>(value: T): U;
};

// 强制类型转换
export const cast: Cast<unknown> = (value: unknown) => value as any;

/**
 * 创建自定义的brand类型, 用于从普通类型中创建特殊的标识类型
 */
export type Brand<T> = T & { readonly __brand: unique symbol };

export const brand = <T>(value: T): Brand<T> => value as Brand<T>;
