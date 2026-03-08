export enum PromiseStatus {
  pending = 'pending',
  fulfilled = 'fulfilled',
  rejected = 'rejected',
}
type resolveFunc<T> = (value: T | PromiseLike<T>) => void;
type rejectFunc = (reason?: unknown) => void;

/**
 * 聚合错误类型定义
 * 用于在不支持原生AggregateError的环境中提供兼容性
 */
interface CustomAggregateError extends Error {
  errors: unknown[];
}

/**
 * 创建聚合错误的辅助函数
 * 当环境不支持原生AggregateError时使用
 */
function createAggregateError(errors: unknown[], message: string): Error {
  // 尝试使用原生AggregateError
  if (typeof globalThis !== 'undefined' && 'AggregateError' in globalThis) {
    // @ts-ignore - 某些TypeScript版本可能不认识AggregateError
    return new globalThis.AggregateError(errors, message);
  }

  // 回退到自定义实现
  const error = new Error(message) as CustomAggregateError;
  error.name = 'AggregateError';
  error.errors = errors;
  return error;
}

/**
 * AccessiblePromise - Promise 的增强类
 *
 * 这个类扩展了标准 Promise 的功能，提供了以下增强特性：
 * 1. 可以在外部解析或拒绝 Promise
 * 2. 可以检查 Promise 的当前状态 (pending/fulfilled/rejected)
 * 3. 保持完全兼容标准 Promise 的 API
 * 4. 提供所有标准 Promise 静态方法的增强版本，如 all、race、any、allSettled 等
 * 5. 可以直接使用 await 关键字
 *
 * 使用场景：
 * - 异步事件处理：在事件处理中延迟解析 Promise
 * - 复杂流程控制：需要在代码不同部分控制 Promise 的解析/拒绝
 * - 状态追踪：需要检查 Promise 当前状态而不依赖于 then/catch
 * - 并发控制：使用 all、race、any、allSettled 等方法管理多个并发操作
 * - 直接在 async 函数中 await：与原生 Promise 行为一致
 *
 * 基本用法示例：
 * ```typescript
 * // 1. 创建可访问的 Promise
 * const promise = new AccessiblePromise<string>();
 *
 * // 2. 获取标准 Promise 对象 (用于返回给其他代码)
 * return promise.promise;
 *
 * // 3. 在其他地方解析 Promise
 * promise.resolve('操作成功');
 *
 * // 4. 或者拒绝 Promise
 * promise.reject(new Error('操作失败'));
 *
 * // 5. 检查 Promise 状态
 * if (promise.isPending) {
 *   console.log('Promise 仍在等待中');
 * }
 *
 * // 6. 使用与标准 Promise 相同的方式
 * handleAsyncOperation()
 *   .then(result => console.log('成功:', result))
 *   .catch(error => console.error('失败:', error));
 *
 * // 7. 使用静态方法
 * const results = await AccessiblePromise.all([promise1, promise2, promise3]);
 * const fastestResult = await AccessiblePromise.race([promise1, promise2, promise3]);
 * const anyResult = await AccessiblePromise.any([promise1, promise2, promise3]);
 * const allSettledResults = await AccessiblePromise.allSettled([promise1, promise2, promise3]);
 *
 * // 8. 从标准Promise创建AccessiblePromise
 * const accessiblePromise = AccessiblePromise.from(standardPromise);
 *
 * // 9. 直接使用await关键字
 * const result = await accessiblePromise;
 * ```
 *
 * @template T 此 Promise 解析后的值的类型
 */
export class AccessiblePromise<T> implements Promise<T> {
  public promise: Promise<T>;
  private _resolve!: resolveFunc<T>;
  private _reject!: rejectFunc;
  public status: PromiseStatus = PromiseStatus.pending;

  // 实现Promise接口需要的方法
  readonly [Symbol.toStringTag]: string = 'Promise';

  static resolved() {
    return new AccessiblePromise<void>().resolve();
  }

  /**
   * 创建 AccessiblePromise 实例
   * @param callback 可选的回调函数，与标准 Promise 构造函数参数相同
   */
  constructor(
    callback?: (resolve: resolveFunc<T>, reject: rejectFunc) => void,
  ) {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
      if (callback) {
        const typedResolve: resolveFunc<T> = (value) => this.resolve(value);
        callback(typedResolve, this.reject.bind(this));
      }
    });
  }

  /**
   * 从标准Promise创建AccessiblePromise实例
   * @param promise 标准Promise对象
   * @returns 包装后的AccessiblePromise
   */
  static from<T>(promise: Promise<T>): AccessiblePromise<T> {
    const accessiblePromise = new AccessiblePromise<T>();
    promise.then(
      (value) => accessiblePromise.resolve(value),
      (error) => accessiblePromise.reject(error),
    );
    return accessiblePromise;
  }

  /**
   * 标准的 then 方法，功能与 Promise.then 相同
   */
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  /**
   * 标准的 catch 方法，功能与 Promise.catch 相同
   */
  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T | TResult> {
    return this.promise.catch(onrejected);
  }

  /**
   * 标准的 finally 方法，功能与 Promise.finally 相同
   */
  finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return this.promise.finally(onfinally);
  }

  /**
   * 解析此 Promise
   * @param value 用于解析 Promise 的值
   * @example
   * const promise = new AccessiblePromise<number>();
   * // 稍后在代码中的任何位置
   * promise.resolve(42);
   */
  resolve(value: T | PromiseLike<T>): AccessiblePromise<T> {
    if (this.status !== PromiseStatus.pending) return this;
    this.status = PromiseStatus.fulfilled;
    this._resolve(value);
    return this;
  }

  /**
   * 创建一个已解析的AccessiblePromise
   * @param value 用于解析Promise的值
   * @returns 已解析的AccessiblePromise实例
   */
  static resolve<S>(value: S | PromiseLike<S>): AccessiblePromise<S> {
    const p = new AccessiblePromise<S>();
    p.resolve(value);
    return p;
  }

  /**
   * 拒绝此 Promise
   * @param reason 错误对象或拒绝原因
   * @example
   * const promise = new AccessiblePromise<number>();
   * // 稍后在代码中的任何位置
   * promise.reject(new Error('Something went wrong'));
   */
  reject(reason?: unknown): void {
    if (this.status !== PromiseStatus.pending) return;
    this.status = PromiseStatus.rejected;
    this._reject(reason);
  }

  /**
   * 创建一个已拒绝的AccessiblePromise
   * @param reason 拒绝原因
   * @returns 已拒绝的AccessiblePromise实例
   */
  static reject<S>(reason?: unknown): AccessiblePromise<S> {
    const p = new AccessiblePromise<S>();
    p.reject(reason);
    return p;
  }

  /**
   * 检查 Promise 是否处于等待状态
   * @returns 如果 Promise 仍在等待解析或拒绝，则为 true
   */
  get isPending() {
    return this.status === PromiseStatus.pending;
  }

  /**
   * 检查 Promise 是否已解析
   * @returns 如果 Promise 已成功解析，则为 true
   */
  get isFulfilled() {
    return this.status === PromiseStatus.fulfilled;
  }

  /**
   * 检查 Promise 是否已拒绝
   * @returns 如果 Promise 已被拒绝，则为 true
   */
  get isRejected() {
    return this.status === PromiseStatus.rejected;
  }

  /**
   * 并行处理多个Promise，等待所有Promise完成
   * 如果其中任何一个Promise被拒绝，则返回的Promise被拒绝
   * @param promises Promise数组
   * @returns 包含所有Promise结果的数组的Promise
   */
  static all<T>(promises: Array<T | PromiseLike<T>>): Promise<T[]> {
    // 直接使用原生Promise.all以获得最佳性能和兼容性
    return Promise.all(promises);
  }

  /**
   * 等待第一个完成的Promise（无论是成功还是失败）
   * @param promises Promise数组
   * @returns 第一个完成的Promise的结果
   */
  static race<T>(promises: Array<T | PromiseLike<T>>): Promise<T> {
    // 直接使用原生Promise.race以获得最佳性能和兼容性
    return Promise.race(promises);
  }

  /**
   * 等待第一个成功的Promise，如果所有Promise都失败，则抛出AggregateError
   * @param promises Promise数组
   * @returns 第一个成功的Promise的值
   */
  static any<T>(promises: Array<T | PromiseLike<T>>): Promise<T> {
    // 检查是否可以使用原生Promise.any
    if (typeof Promise === 'function' && 'any' in Promise) {
      try {
        // @ts-ignore - 某些TypeScript版本可能不认识Promise.any
        return Promise.any(promises);
      } catch (e) {
        // 如果运行时不支持，回退到手动实现
      }
    }

    // 手动实现Promise.any
    return Promise.all(
      promises.map((p) =>
        Promise.resolve(p).then(
          (value) => Promise.reject(new SuccessContainer(value)),
          (err) => err,
        ),
      ),
    ).then(
      (errors) =>
        Promise.reject(
          createAggregateError(errors, 'All promises were rejected'),
        ),
      (reason: SuccessContainer<T>) => reason.value,
    );
  }

  /**
   * 等待所有Promise完成（无论是成功还是失败），并返回它们的状态和结果
   * @param promises Promise数组或者迭代器
   * @returns 所有Promise的状态和结果数组
   */
  static allSettled<T>(
    promises: Array<T | PromiseLike<T>>,
  ): Promise<PromiseSettledResult<T>[]> {
    // 检查是否可以使用原生Promise.allSettled
    if (typeof Promise === 'function' && 'allSettled' in Promise) {
      try {
        // @ts-ignore - 某些TypeScript版本可能不认识Promise.allSettled
        return Promise.allSettled(promises);
      } catch (e) {
        // 如果运行时不支持，回退到手动实现
      }
    }

    // 手动实现Promise.allSettled，使用Promise.all来规避TypeScript类型问题
    return Promise.all(
      promises.map((p) =>
        Promise.resolve(p).then(
          (value) =>
            ({ status: 'fulfilled', value }) as PromiseSettledResult<T>,
          (reason) =>
            ({ status: 'rejected', reason }) as PromiseSettledResult<T>,
        ),
      ),
    );
  }

  /**
   * 获取此Promise的值或抛出其拒绝原因
   * 允许直接await AccessiblePromise实例
   * @returns Promise的解析值
   * @throws Promise的拒绝原因
   */
  valueOf(): Promise<T> {
    return this.promise;
  }

  /**
   * 允许将实例转换为字符串
   * @returns 包含状态信息的字符串表示
   */
  toString(): string {
    return `AccessiblePromise<${this.status}>`;
  }

  /**
   * 提供类型转换行为
   * 允许AccessiblePromise被转换为原生Promise
   * 支持await关键字直接使用AccessiblePromise实例
   */
  [Symbol.toPrimitive](hint: string): Promise<T> | string {
    if (hint === 'string') {
      return this.toString();
    }
    return this.promise;
  }

  /**
   * 支持then/await链式调用
   */
  get [Symbol.species](): PromiseConstructor {
    return Promise;
  }

  /**
   * Symbol.asyncIterator实现，支持异步遍历
   * 这使得AccessiblePromise实例可以被直接await
   */
  async *[Symbol.asyncIterator](): AsyncIterator<T, T, undefined> {
    const value = await this.promise;
    yield value;
    return value;
  }

  /**
   * 使AccessiblePromise与await操作符兼容
   * 当使用await时，此方法将被调用
   */
  get [Symbol.for('nodejs.util.inspect.custom')](): Promise<T> {
    return this.promise;
  }
}

/**
 * 用于Promise.any实现的内部辅助类
 * 在Promise.any中用于区分成功值和失败
 */
class SuccessContainer<T> {
  constructor(public value: T) {}
}
