import { DBCacher } from '@/utils/dbCacher/cacher';
import { INDEXDB_NAME_PREFIX } from '@/utils/dbCacher/config';
import { cloneDeep } from 'lodash-es';
import { Logger, LogLevel } from './logger';
import { LogItem, LogStoreQueue } from './queue';
import { randomUUID } from 'crypto';
const LOG_DB_STORE_NAME = 'log';
// 日志过期时间
const lOG_EXPIRE_TIME = 1000 * 60 * 60 * 24 * 30; // 30天
const CLEAN_INTERVAL_TIME = 1000 * 60 * 60 * 24 * 1; // 1天
// 日志队列容量
const LOG_QUEUE_CAPACITY = 1000;

interface LogMetaData {
  lastCleanTime: number;
}

const METADATA_KEY = '_metadata';

const defaultLogMetaData: LogMetaData = {
  lastCleanTime: 0,
};

const STORE_LOG_WHEN_DEV = false; // 开发环境下是否存储日志

class LogService {
  static dbStoreName = LOG_DB_STORE_NAME;
  dbCacher: DBCacher;
  private logQueue: LogStoreQueue;

  constructor() {
    this.init();
    // 初始化日志队列，批量处理函数
    this.logQueue = new LogStoreQueue(
      'logStore',
      LOG_QUEUE_CAPACITY,
      async (items: LogItem[]) => {
        await this.batchStoreLogs(items);
      },
    );
    console.help('使用 logService.printLogs() 打印日志');
    console.help('使用 logService.enableAutoLog() 开启日志自动打印');
    console.help('使用 logService.disableAutoLog() 关闭日志自动打印');
  }

  enableAutoLog() {
    window.__logServiceLogPrintEnable = true;
  }

  disableAutoLog() {
    window.__logServiceLogPrintEnable = false;
  }

  async init() {
    this.initCacher();
    await this.initMetaData();
    await this.cleanExpiredLog();
  }

  initCacher() {
    this.dbCacher = new DBCacher(INDEXDB_NAME_PREFIX, LogService.dbStoreName);
  }

  async initMetaData() {
    const hasMetaData = await this.dbCacher.has(METADATA_KEY);
    if (hasMetaData) return;
    await this.dbCacher.set(METADATA_KEY, cloneDeep(defaultLogMetaData));
  }

  async cleanExpiredLog() {
    const metaData = (await this.dbCacher.get(METADATA_KEY)) as LogMetaData;
    const lastCleanTime = metaData?.lastCleanTime || 0;
    const currentTime = new Date().getTime();
    if (currentTime - lastCleanTime < CLEAN_INTERVAL_TIME) return; // 一天内检查一次即可

    // Use iterate to process logs one by one
    const dbStoreInstance = await this.dbCacher.dbStoreInstance;
    await dbStoreInstance.iterate((_, key) => {
      // Skip the metadata entry
      if (key === METADATA_KEY) return; // Continue iteration

      const timeStamp = Number(key);
      if (currentTime - timeStamp > lOG_EXPIRE_TIME) {
        this.dbCacher.delete(key);
        return; // Continue iteration
      } else {
        // Stop iteration when we find a non-expired log
        return true; // Exit early since logs are time-ordered
      }
    });
    metaData.lastCleanTime = currentTime;
    await this.dbCacher.set(METADATA_KEY, metaData);
  }

  createLogger(module: string, subModule?: string, level?: LogLevel) {
    const logger = new Logger(module, subModule, level);
    // 设置日志存储的简略化函数
    logger.setStringifyForLog(stringify);
    // 生产环境下不记录日志
    if (__DEV__ && STORE_LOG_WHEN_DEV) {
      logger.setLogCallback((...args) => {
        const time = new Date().getTime();
        this.storeLog(time, args.join(' '));
      });
    }
    return logger;
  }

  /**
   * 将日志项加入队列，由队列在空闲时批量处理
   * @param timeStamp 时间戳
   * @param message 日志消息
   */
  storeLog(timeStamp: number, message: string): void {
    // 生产环境下不记录日志
    if (!__DEV__) return;
    this.logQueue.enqueue({ timeStamp, message });
  }

  /**
   * 批量存储日志到 IndexedDB
   * @param items 日志项数组
   */
  private async batchStoreLogs(items: LogItem[]): Promise<void> {
    // 批量写入，减少 IndexedDB 操作次数
    const promises = items.map((item) =>
      this.dbCacher.set(String(item.timeStamp), item.message),
    );
    await Promise.all(promises);
  }

  /**
   * 强制刷新队列，立即处理所有待处理的日志
   */
  async flushLogQueue(): Promise<void> {
    await this.logQueue.flush();
  }

  /**
   * 打印最近count条日志
   * @param count 需要打印的日志条数
   */
  async printLogs(count = Infinity) {
    if (count === Infinity) {
      const dbStoreInstance = await this.dbCacher.dbStoreInstance;
      await dbStoreInstance.iterate((value) => {
        console.log(value);
      });
      return;
    } else {
      // 创建一个固定容量的循环队列
      const queue = new CircularQueue<any>(count);

      // 遍历所有日志记录，依次入队
      const dbStoreInstance = await this.dbCacher.dbStoreInstance;
      await dbStoreInstance.iterate((value) => {
        queue.enqueue(value);
      });

      // 从队头依次出队并打印
      const logs = queue.dequeueAll();
      logs.forEach((log) => console.log(log));
    }
  }

  async destroy() {
    await this.flushLogQueue();
    this.logQueue.clear();
  }
}

export function stringify(value: any) {
  // 简单数据类型：直接序列化
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  // 字符串：大字符串截取前10个字符
  if (typeof value === 'string') {
    return value.length > 10 ? value.substring(0, 10) + '...' : value;
  }

  // 复杂数据类型：只显示类型名称和数量
  try {
    if (value instanceof Array) {
      return `Array ${value.length} items`;
    }
    if (value instanceof ArrayBuffer) {
      return `ArrayBuffer ${value.byteLength} bytes`;
    }
    if (
      value instanceof Int8Array ||
      value instanceof Uint8Array ||
      value instanceof Uint8ClampedArray ||
      value instanceof Int16Array ||
      value instanceof Uint16Array ||
      value instanceof Int32Array ||
      value instanceof Uint32Array ||
      value instanceof Float32Array ||
      value instanceof Float64Array ||
      value instanceof BigInt64Array ||
      value instanceof BigUint64Array
    ) {
      return `${value.constructor.name} ${value.length} items`;
    }
    if (value instanceof Map) {
      return `Map ${value.size} entries`;
    }
    if (value instanceof Set) {
      return `Set ${value.size} items`;
    }
    if (value instanceof WeakMap) {
      return 'WeakMap';
    }
    if (value instanceof WeakSet) {
      return 'WeakSet';
    }
    if (value instanceof Function) {
      return 'Function';
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      return `Object ${keys.length} keys`;
    }
    // 其他类型尝试序列化
    return JSON.stringify(value);
  } catch (e) {
    return `[${typeof value}]`;
  }
}

/**
 * 返回数组
 * @param strings
 * @param args
 * @returns
 */
function innerTagFormat(strings: TemplateStringsArray, ...args: any[]) {
  const list = [];
  for (let i = 0; i < strings.length; i++) {
    list.push(strings[i]);
    if (args[i]) {
      list.push(args[i]);
    }
  }
  return list;
}

class Stack {
  private stack: string[] = [];
  private maxSize = Math.pow(2, 32) - 1;
  constructor(maxSize?: number) {
    if (maxSize) this.maxSize;
  }
  push(funcName: string) {
    if (this.stack.length >= this.maxSize) {
      throw new Error('Stack overflow: max size reached');
    }
    this.stack.push(funcName);
  }
  pop() {
    return this.stack.pop();
  }
  getStack() {
    return this.stack;
  }
  clear() {
    this.stack = [];
  }
}

class FuncCallStack extends Stack {
  /**
   * 往栈中添加一个元素, 并返回这个元素的索引
   * @param id
   */
  funcCall(id: string): number {
    this.push(id);
    return this.getStack().length - 1;
  }

  /**
   * 从栈顶往栈地寻找相同的id的元素 找到了就弹出中间的所有元素
   */
  funcReturn(id: string): boolean {
    const stack = this.getStack();
    let foundIndex = -1;

    // 从栈顶往栈底寻找相同的id
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i] === id) {
        foundIndex = i;
        break;
      }
    }

    // 如果找到了，弹出从栈顶到该元素之间的所有元素（包括该元素）
    if (foundIndex !== -1) {
      const popCount = stack.length - foundIndex;
      for (let i = 0; i < popCount; i++) {
        this.pop();
      }
      return true;
    }

    return false;
  }
}

const funcCallStack = new FuncCallStack();
function getIdent(ident: { value: number }) {
  return '    '.repeat(ident.value);
}
/**
 * 方法调用记录装饰器
 * @param logger Logger实例
 * @returns 方法装饰器
 */
export function methodCallRecord(
  logger: Logger,
  options: {
    time: boolean;
  } = { time: false },
) {
  return function (
    _: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    // 生产环境下不记录日志，直接返回原方法
    if (!__DEV__) {
      return descriptor;
    }

    // 保存原始方法
    const originalMethod = descriptor.value;

    // 替换原始方法
    descriptor.value = function (...args: any[]) {
      const id = randomUUID();
      const ident = {
        value: 0,
      };
      // 记录方法调用（区分 console 和日志存储）
      ident.value = funcCallStack.funcCall(id);
      const identStr = getIdent(ident);
      try {
        logger.debug(
          `${identStr}${propertyKey}`,
          innerTagFormat`args:${args} id:${id}`,
        );

        const startTime = Date.now();
        // 调用原始方法
        // !!!!!!! 注意debug时 跳进下面这个apply就行
        const result = originalMethod.apply(this, args);
        const duration = Date.now() - (startTime ?? 0);
        logger.debug(
          `${identStr}${propertyKey}`,
          innerTagFormat`return:${result} time:${duration}ms id:${id}`,
        );
        funcCallStack.funcReturn(id);
        // 如果返回值是 Promise，则处理异步结果
        if (result instanceof Promise) {
          return result.then(
            (value) => {
              const duration = Date.now() - (startTime ?? 0);
              logger.debug(
                `${identStr}${propertyKey}`,
                innerTagFormat`resolve:${transformUndefined(value)} time:${duration}ms id:${id}`,
              );
              return value;
            },
            (error) => {
              const duration = Date.now() - (startTime ?? 0);
              logger.debug(
                `${identStr}${propertyKey}`,
                innerTagFormat`reject:${error} time:${duration}ms id:${id}`,
              );
              throw error;
            },
          );
        }

        if (options.time) {
          const duration = Date.now() - (startTime ?? 0);
          logger.debug(
            `${identStr}${propertyKey}`,
            innerTagFormat`time:${duration}ms id:${id}`,
          );
        }

        return result;
      } catch (error) {
        // 记录错误
        logger.debug(
          `${identStr}${propertyKey}`,
          innerTagFormat`error:${error} id:${id}`,
        );
        // 重新抛出错误
        throw error;
      }
    };

    return descriptor;
  };
}

function transformUndefined(value: any): string {
  return value === undefined ? 'undefined' : value;
}

/**
 * 函数调用记录装饰器
 * @param logger Logger实例
 * @returns 包装后的函数
 */
export function functionCallRecord<TArgs extends readonly any[], TReturn>(
  logger: Logger,
) {
  return function <T extends (...args: TArgs) => TReturn>(
    originalFunction: T,
    options: {
      time: boolean;
      id?: string;
    } = { time: false },
  ): T {
    // 生产环境下不记录日志，直接返回原函数
    if (!__DEV__) {
      return originalFunction;
    }

    const funcName = originalFunction.name || 'anonymous';
    const id = options.id || randomUUID();
    const wrappedFunction = function (this: any, ...args: TArgs): TReturn {
      try {
        // 记录函数调用（区分 console 和日志存储）
        logger.debug(`${funcName}`, innerTagFormat`args:${args} id:${id}`);

        let startTime: number | undefined;
        if (options.time) {
          startTime = Date.now();
        }
        // 调用原始函数
        const result = originalFunction.apply(this, args);

        // 如果返回值是 Promise，则处理异步结果
        if (result instanceof Promise) {
          return result.then(
            (value) => {
              if (options.time) {
                const duration = Date.now() - (startTime ?? 0);
                logger.info(
                  `${funcName}`,
                  innerTagFormat`time:${duration}ms id:${id}`,
                );
              }
              logger.debug(
                `${funcName}`,
                innerTagFormat`resolve:${transformUndefined(value)} id:${id}`,
              );
              return value;
            },
            (error) => {
              logger.errorWithArgs(
                `${funcName}`,
                innerTagFormat`reject:${transformUndefined(error)} id:${id}`,
              );
              throw error;
            },
          ) as TReturn;
        }

        // 同步函数直接记录返回值
        if (options.time) {
          const endTime = Date.now();
          const duration = endTime - (startTime ?? 0);
          logger.info(
            `${funcName}`,
            innerTagFormat`time:${duration}ms id:${id}`,
          );
        }
        logger.debug(`${funcName}`, innerTagFormat`return:${result} id:${id}`); // ==>: 表示return

        return result as TReturn;
      } catch (error) {
        // 记录错误
        logger.errorWithArgs(
          `${funcName}`,
          innerTagFormat`error:${error} id:${id}`,
        ); // !!> 表示throw Error
        // 重新抛出错误
        throw error;
      }
    };

    // 保留原函数的名称和其他属性
    Object.defineProperty(wrappedFunction, 'name', {
      value: funcName,
      configurable: true,
    });

    return wrappedFunction as T;
  };
}

class CircularQueue<T> {
  private items: T[];
  private head = 0;
  private tail = 0;
  private size = 0;

  constructor(private capacity: number) {
    this.items = new Array(capacity);
  }

  enqueue(item: T) {
    this.items[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  dequeueAll(): T[] {
    const result: T[] = [];
    let current = this.head;
    for (let i = 0; i < this.size; i++) {
      result.push(this.items[current]);
      current = (current + 1) % this.capacity;
    }
    this.head = 0;
    this.tail = 0;
    this.size = 0;
    return result;
  }
}

export const logService = new LogService();
window.logService = logService;
export { createLoggerError, type LoggerError } from './error';
export { LogLevel, type Logger } from './logger';
export { type LogService };
