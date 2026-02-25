// 1. Brand
export type Brand<T> = T & { readonly __brand: unique symbol };

export function brand<T extends Brand<any>>(value: T extends Brand<infer U> ? U : never): T {
    return value as T;
}

// 示例
type UserId = Brand<string>;

const userId1: UserId = '123' as UserId;
console.log(userId1);
const userId2 = brand<UserId>('1234');
console.log(userId2);


// 2. Cast
export const cast = <T>(value: unknown): T => value as T;

const a = cast<number>('123');
console.log(a);

