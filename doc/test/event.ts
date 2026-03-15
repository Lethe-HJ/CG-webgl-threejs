import { AccessiblePromise } from './promise';
import mitt from 'mitt';
import { Disposable } from './base';

/**
 * 带有 Promise 的事件对象接口
 */
interface EventWithPromise<T = any> {
  __promise?: AccessiblePromise<T>;
}

export type cancelAble = () => void;

/**
 * 事件中心类
 * 提供事件的订阅、发布、一次性订阅等功能
 *
 * 使用示例:
 * ```typescript
 * import { COMMON_EVENTS } from '@/views/steps/events';
 * // 1. 订阅事件
 * eventCenter.on(COMMON_EVENTS.DISABLE_NEXT_STEPS, () => {
 *   console.log('禁用下一步');
 * });
 *
 * // 2. 一次性订阅事件
 * eventCenter.once(COMMON_EVENTS.DISABLE_NEXT_STEPS, () => {
 *   console.log('仅触发一次');
 * });
 *
 * // 3. 发布事件
 * eventCenter.emit(COMMON_EVENTS.DISABLE_NEXT_STEPS);
 *
 * // 4. 取消订阅
 * const handler = () => console.log('处理事件');
 * eventCenter.on(COMMON_EVENTS.DISABLE_NEXT_STEPS, handler);
 * eventCenter.off(COMMON_EVENTS.DISABLE_NEXT_STEPS, handler);
 *
 * // 5. 清除所有事件
 * eventCenter.clear();
 *
 * // 6. 异步事件处理
 * // 发布者:
 * const result = await eventCenter.emitAsync(COMMON_EVENTS.SomeAsyncEvent, { data: 'example' });
 * console.log('事件处理完成, 结果:', result);
 *
 * // 订阅者:
 * eventCenter.on(COMMON_EVENTS.SomeAsyncEvent, async (event) => {
 *   // 执行异步操作
 *   await new Promise(resolve => setTimeout(resolve, 1000));
 *   // 处理事件数据
 *   console.log('异步处理完成', event);
 *   // 无需显式解析 Promise，on 方法内部会处理
 * });
 * ```
 */
class EventHelper<S extends Record<string | symbol, unknown>> {
  private emitter: ReturnType<typeof mitt<S>>;
  private handlerWrappers = new Map<Function, Function>();

  constructor(emitter = mitt<S>()) {
    this.emitter = emitter;
  }
  /**
   * 订阅事件
   * @param type 事件类型
   * @param handler 事件处理函数
   */
  on<T extends keyof S>(
    type: T,
    handler: (event: S[T] & EventWithPromise<S[T]>) => void | Promise<void>,
  ): cancelAble {
    // 创建包装处理函数，处理异步和非异步情况
    const wrapperFn = async (event: S[T]) => {
      // 处理 null 或 undefined 事件数据
      if (event === null || event === undefined) {
        return handler(null as unknown as S[T] & EventWithPromise<S[T]>);
      }

      const eventWithPromise = event as S[T] & EventWithPromise<S[T]>;

      if (eventWithPromise && eventWithPromise.__promise) {
        // 异步事件处理
        try {
          // 调用处理函数，可能是同步或异步的
          const result = handler(eventWithPromise);

          // 如果处理函数返回 Promise，等待它完成
          if (result instanceof Promise) {
            try {
              await result;
            } catch (error) {
              console.error('事件处理异常:', error);
              eventWithPromise.__promise?.reject(error);
              return;
            }
          }

          // 处理完成，解析 Promise
          const cleanResult = { ...eventWithPromise } as S[T];
          delete (cleanResult as any).__promise;
          eventWithPromise.__promise?.resolve(cleanResult);
        } catch (error) {
          // 处理同步错误
          console.error('事件处理异常:', error);
          eventWithPromise.__promise?.reject(error);
        }
      } else {
        // 普通非异步事件处理
        handler(eventWithPromise);
      }
    };

    // 存储原始处理函数和包装函数的映射，用于后续取消订阅
    this.handlerWrappers.set(handler, wrapperFn);

    // 订阅事件
    this.emitter.on(type, wrapperFn as any);

    return () => this.off(type, wrapperFn);
  }

  /**
   * 一次性订阅事件
   * 事件触发后会自动取消订阅
   * @param type 事件类型
   * @param handler 事件处理函数
   */
  once<T extends keyof S>(
    type: T,
    handler: (event: S[T] & EventWithPromise<S[T]>) => void | Promise<void>,
  ) {
    // 创建一个仅执行一次的处理函数
    const onceHandler = (event: S[T] & EventWithPromise<S[T]>) => {
      // 先取消订阅，确保只被调用一次
      this.off(type, onceHandler);
      // 执行原始处理函数
      return handler(event);
    };

    // 使用 on 方法注册
    return this.on(type, onceHandler);
  }

  /**
   * 取消订阅事件
   * @param type 事件类型
   * @param handler 事件处理函数
   */
  off<T extends keyof S>(
    type: T,
    handler: (event: S[T] & EventWithPromise<S[T]>) => void | Promise<void>,
  ) {
    // 获取对应的包装函数
    const wrapperFn = this.handlerWrappers.get(handler);
    if (wrapperFn) {
      // 从 mitt 中取消订阅
      this.emitter.off(type, wrapperFn as any);
      // 清除映射
      this.handlerWrappers.delete(handler);
    } else {
      // 如果没有找到包装函数，可能是传入了包装函数本身（如 once 方法中创建的函数）
      this.emitter.off(type, handler as any);
    }
  }

  /**
   * 发布事件
   * @param type 事件类型
   * @param event 事件参数
   */
  emit<T extends keyof S>(type: T, event?: S[T]) {
    if (event !== undefined) {
      this.emitter.emit(type, event);
    } else {
      this.emitter.emit(type, null as S[T]);
    }
  }

  /**
   * 异步发布事件，等待事件处理完成
   * @param type 事件类型
   * @param event 事件参数
   * @param timeout 超时时间(毫秒)，如果提供，则在指定时间后自动解析 Promise
   * @returns Promise 等待事件处理完成后的Promise
   */
  emitAsync<T extends keyof S>(
    type: T,
    event?: S[T] & EventWithPromise<S[T]>,
    timeout?: number,
  ): Promise<S[T]> {
    // 创建事件对象并添加 Promise
    const eventObj =
      event !== undefined
        ? ({ ...event } as S[T] & EventWithPromise<S[T]>)
        : ({} as S[T] & EventWithPromise<S[T]>);

    eventObj.__promise = new AccessiblePromise<S[T]>();

    // 设置可选的超时
    let timeoutId: NodeJS.Timeout | number | undefined;
    if (timeout) {
      // 使用 setTimeout 而不是 window.setTimeout，兼容 Node 环境
      timeoutId = setTimeout(() => {
        if (eventObj.__promise?.isPending) {
          const result = { ...eventObj } as S[T];
          delete (result as any).__promise;
          // 直接使用 console.warn，而不是 window.console.warn
          console.warn(`事件处理超时(${timeout}ms): ${String(type)}`);
          eventObj.__promise?.resolve(result);
        }
      }, timeout);
    }

    // 添加清理逻辑，确保 Promise 完成后清除超时
    const cleanup = () => {
      if (timeoutId !== undefined) {
        // 使用 clearTimeout 而不是 window.clearTimeout，兼容 Node 环境
        clearTimeout(timeoutId as NodeJS.Timeout);
      }
    };

    // 为原始 Promise 添加错误处理
    eventObj.__promise.promise.then(cleanup, cleanup);

    // 使用 try-catch 包装 emit 操作，确保捕获任何同步错误
    try {
      // 发布事件
      this.emitter.emit(type, eventObj as S[T]);
    } catch (error) {
      // 如果发生同步错误，拒绝 Promise 并清理资源
      console.error('事件发布异常:', error);
      cleanup();
      eventObj.__promise.reject(error);
    }

    // 返回可等待的 Promise
    return eventObj.__promise.promise;
  }

  /**
   * 清除所有事件
   */
  clear() {
    this.emitter.all.clear();
    this.handlerWrappers.clear();
  }

  /**
   * 注册一个可一次性销毁的事件组
   */
  static registerDisposer(...events: cancelAble[]) {
    const disposer = new Disposable();
    disposer.register(...events);
    return disposer;
  }
}

export { EventHelper };
