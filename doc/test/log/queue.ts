import { Queue } from '@/utils/ds';

export interface LogItem {
  timeStamp: number;
  message: string;
}

export class LogStoreQueue extends Queue<LogItem> {
  private processing = false;
  private pendingTimeout:
    | ReturnType<typeof requestIdleCallback>
    | ReturnType<typeof setTimeout>
    | null = null;
  private batchProcessor: (items: LogItem[]) => Promise<void>;

  constructor(
    name: string,
    capacity: number,
    batchProcessor: (items: LogItem[]) => Promise<void>,
    items: LogItem[] = [],
  ) {
    super(name, capacity, items);
    this.batchProcessor = batchProcessor;
  }

  /**
   * 入队日志项，并触发延迟批量处理
   * @param item 日志项
   */
  enqueue(item: LogItem): void {
    this._enqueue(item);
    this.scheduleProcess();
  }

  /**
   * 调度批量处理，优先使用 requestIdleCallback，否则使用 setTimeout
   */
  private scheduleProcess(): void {
    if (this.processing) return;
    if (this.pendingTimeout !== null) return;

    // 优先使用 requestIdleCallback（浏览器空闲时执行）
    if (typeof requestIdleCallback !== 'undefined') {
      this.pendingTimeout = requestIdleCallback(
        () => {
          this.pendingTimeout = null;
          this.processBatch();
        },
        { timeout: 1000 }, // 最多等待 1 秒
      );
    } else {
      // 降级到 setTimeout，使用 Promise.resolve 确保在下一个事件循环执行
      this.pendingTimeout = setTimeout(() => {
        this.pendingTimeout = null;
        this.processBatch();
      }, 0);
    }
  }

  /**
   * 批量处理队列中的日志项
   */
  private async processBatch(): Promise<void> {
    if (this.processing || this.size === 0) return;

    this.processing = true;
    const itemsToProcess: LogItem[] = [];

    // 批量出队
    while (this.size > 0) {
      const item = this._dequeue();
      if (item) {
        itemsToProcess.push(item);
      }
    }

    if (itemsToProcess.length > 0) {
      try {
        await this.batchProcessor(itemsToProcess);
      } catch (error) {
        console.error('[LogStoreQueue] Batch process failed:', error);
        // 处理失败时，可以选择重新入队或丢弃
        // 这里选择丢弃，避免无限重试
      }
    }

    this.processing = false;

    // 如果处理过程中又有新项入队，继续处理
    if (this.size > 0) {
      this.scheduleProcess();
    }
  }

  /**
   * 强制立即处理队列中的所有项
   */
  async flush(): Promise<void> {
    if (this.pendingTimeout !== null) {
      if (typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(this.pendingTimeout as number);
      } else {
        clearTimeout(this.pendingTimeout as ReturnType<typeof setTimeout>);
      }
      this.pendingTimeout = null;
    }
    await this.processBatch();
  }

  clear(): void {
    super.clear();
    if (this.pendingTimeout !== null) {
      if (typeof cancelIdleCallback !== 'undefined') {
        cancelIdleCallback(this.pendingTimeout as number);
      } else {
        clearTimeout(this.pendingTimeout as ReturnType<typeof setTimeout>);
      }
      this.pendingTimeout = null;
    }
    this.processing = false;
  }
}
