const ORIGIN_NAME = 'stereomap';

/**
 * 内存跟踪工具
 * 用于跟踪对象是否被 GC 回收
 */
export class MemoryTracker {
  private static instance: MemoryTracker;
  origin = ORIGIN_NAME;

  // 使用 WeakMap 存储对象和其元数据
  private trackedObjects = new WeakMap<object, TrackedObjectInfo>();

  // 使用 Map 存储对象 ID 到对象的引用（强引用，用于检查）
  private idToObject = new Map<string, WeakRef<object>>();

  // 使用 FinalizationRegistry 检测对象何时被 GC
  private registry: FinalizationRegistry<string> | null = null;

  // 统计信息
  private stats = {
    totalTracked: 0,
    totalCollected: 0,
    active: new Map<string, TrackedObjectInfo>(),
  };

  private constructor() {
    // 检查是否支持 FinalizationRegistry
    if (typeof FinalizationRegistry !== 'undefined') {
      this.registry = new FinalizationRegistry((id: string) => {
        this.stats.totalCollected++;
        const info = this.stats.active.get(id);
        if (info) {
          info.collectedAt = Date.now();
          info.isCollected = true;
          memoryPrintEnable &&
            console.log(`[MemoryTracker] 对象被 GC 回收: ${id}`, {
              trackedAt: new Date(info.trackedAt).toISOString(),
              collectedAt: new Date(info.collectedAt).toISOString(),
              lifetime: info.collectedAt - info.trackedAt,
            });
        }
        this.stats.active.delete(id);
      });
    }
  }

  static getInstance(): MemoryTracker {
    if (!MemoryTracker.instance) {
      MemoryTracker.instance = new MemoryTracker();
    }
    if (__DEV__) {
      console.help('使用 memoryTracker.enablePrint() 启用内存跟踪打印');
    }
    return MemoryTracker.instance;
  }

  /**
   * 跟踪一个对象
   * @param obj 要跟踪的对象
   * @param name 对象名称（用于标识）
   * @param metadata 额外的元数据
   */
  track<T extends object>(
    obj: T,
    name: string,
    metadata?: Record<string, any>,
  ): T {
    // 检查对象是否已被跟踪
    const existingInfo = this.trackedObjects.get(obj);
    if (existingInfo) {
      // 如果已跟踪，更新元数据（如果需要）但不创建新记录
      if (metadata) {
        existingInfo.metadata = { ...existingInfo.metadata, ...metadata };
      }
      memoryPrintEnable &&
        console.log(`[MemoryTracker] 对象已被跟踪，跳过: ${name}`, {
          id: existingInfo.id,
          existingName: existingInfo.name,
          size: this.formatSize(existingInfo.size),
        });
      return obj;
    }

    const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const info: TrackedObjectInfo = {
      id,
      name,
      trackedAt: Date.now(),
      metadata: metadata || {},
      isCollected: false,
      size: this.estimateSize(obj),
    };

    // 存储到 WeakMap（弱引用，不影响 GC）
    this.trackedObjects.set(obj, info);

    // 存储到 Map（用于检查对象是否还存在）
    this.idToObject.set(id, new WeakRef(obj));

    // 注册到 FinalizationRegistry（如果支持）
    if (this.registry) {
      this.registry.register(obj, id);
    }

    this.stats.totalTracked++;
    this.stats.active.set(id, info);

    memoryPrintEnable &&
      console.log(`[MemoryTracker] 开始跟踪对象: ${name}`, {
        id,
        size: this.formatSize(info.size),
        metadata,
      });

    return obj;
  }

  /**
   * 检查对象是否还存在（未被 GC）
   * @param id 对象 ID
   */
  isAlive(id: string): boolean {
    const weakRef = this.idToObject.get(id);
    if (!weakRef) return false;

    const obj = weakRef.deref();
    if (!obj) {
      // 对象已被 GC，清理引用
      this.idToObject.delete(id);
      return false;
    }
    return true;
  }

  /**
   * 获取对象信息
   */
  getInfo(id: string): TrackedObjectInfo | null {
    return this.stats.active.get(id) || null;
  }

  /**
   * 获取所有活跃的对象
   */
  getActiveObjects(): Array<{ id: string; info: TrackedObjectInfo }> {
    const result: Array<{ id: string; info: TrackedObjectInfo }> = [];

    // 清理已回收的对象引用
    for (const [id, weakRef] of this.idToObject.entries()) {
      if (!weakRef.deref()) {
        this.idToObject.delete(id);
      } else {
        const info = this.stats.active.get(id);
        if (info && !info.isCollected) {
          result.push({ id, info });
        }
      }
    }

    return result;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      totalTracked: this.stats.totalTracked,
      totalCollected: this.stats.totalCollected,
      activeCount: this.getActiveObjects().length,
      collectedCount: this.stats.totalCollected,
      collectionRate:
        this.stats.totalTracked > 0
          ? (
              (this.stats.totalCollected / this.stats.totalTracked) *
              100
            ).toFixed(2) + '%'
          : '0%',
    };
  }

  /**
   * 打印统计信息
   */
  printStats() {
    const active = this.getActiveObjects();

    // 计算总内存大小
    const totalSize = active.reduce((sum, { info }) => sum + info.size, 0);

    console.group('[MemoryTracker] 统计信息');
    console.log(`未回收引用数量: ${active.length}`);
    console.log(`总内存占用: ${this.formatSize(totalSize)}`);

    if (active.length > 0) {
      console.group('活跃对象:');
      // 按内存大小降序排序，大的在前面
      active
        .sort((a, b) => b.info.size - a.info.size)
        .slice(0, 10)
        .forEach(({ id, info }) => {
          console.log(`${info.name} (${id}):`, {
            trackedAt: new Date(info.trackedAt).toISOString(),
            lifetime: Date.now() - info.trackedAt,
            size: this.formatSize(info.size),
            metadata: info.metadata,
          });
        });
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * 估算对象大小（粗略估算）
   */
  private estimateSize(obj: any): number {
    if (obj === null || obj === undefined) return 0;

    if (obj instanceof Float32Array || obj instanceof Float64Array) {
      return obj.byteLength;
    }

    if (obj instanceof ArrayBuffer) {
      return obj.byteLength;
    }

    if (Array.isArray(obj)) {
      return obj.reduce((size, item) => size + this.estimateSize(item), 0);
    }

    if (obj instanceof Map) {
      let size = 0;
      obj.forEach((value, key) => {
        size += this.estimateSize(key) + this.estimateSize(value);
      });
      return size;
    }

    if (typeof obj === 'object') {
      return Object.keys(obj).reduce((size, key) => {
        return size + this.estimateSize(obj[key]);
      }, 0);
    }

    return 0;
  }

  /**
   * 格式化大小
   */
  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * 清理所有跟踪（仅清理 Map，WeakMap 会自动清理）
   */
  clear() {
    this.idToObject.clear();
    this.stats.active.clear();
    this.stats.totalTracked = 0;
    this.stats.totalCollected = 0;
  }

  enablePrint() {
    window.memoryPrintEnable = true;
  }

  disablePrint() {
    window.memoryPrintEnable = false;
  }
}

interface TrackedObjectInfo {
  id: string;
  name: string;
  trackedAt: number;
  collectedAt?: number;
  isCollected: boolean;
  size: number;
  metadata: Record<string, any>;
}

// 导出单例
export const memoryTracker = MemoryTracker.getInstance();

declare global {
  interface Window {
    memoryPrintEnable: boolean;
  }
  const memoryPrintEnable: boolean;
}

window.memoryPrintEnable = false;
