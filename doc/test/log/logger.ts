import { safeStructuredClone } from '@/utils/utils';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// HSL转RGB辅助函数
function hslToRgb(h: number, s: number, l: number): string {
  h = h % 360;
  s = s / 100;
  l = l / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (h >= 300 && h < 360) {
    r = c;
    g = 0;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 生成高对比度颜色序列
// 要求：每个颜色和前后各10个颜色（总共21个颜色）之间都有高对比度
// 注意：颜色序列是首尾相接的圆环，最后一个颜色和第一个颜色也是相邻的
//       在圆环上，索引i的前10个颜色是 (i-10+count)%count 到 (i-1+count)%count
//       索引i的后10个颜色是 (i+1)%count 到 (i+10)%count
// 策略：使用HSL颜色空间，使用黄金角度（137.508度）确保颜色在色相环上均匀分布
//       由于黄金角度和360度几乎互质，可以确保在圆环上任意位置，相邻颜色都有足够的色相差
//       色相差约137.5度，远大于所需的最小17.14度，确保高对比度
// 饱和度90-100%，亮度50-60%，确保在深色和浅色背景下都清晰可见
function generateHighContrastColors(count: number): string[] {
  const colors: string[] = [];
  const saturation = 95; // 高饱和度
  const lightness = 55; // 中等亮度，在深色和浅色背景下都清晰

  // 使用黄金角度（约137.5度）确保颜色在色相环上均匀分布
  // 黄金角度确保了无论从哪个位置开始，相邻颜色都有足够的色相差（约137.5度）
  // 这远大于所需的最小色相差（360/21≈17.14度），确保高对比度
  const goldenAngle = 137.508;

  // 生成颜色序列
  for (let i = 0; i < count; i++) {
    // 在圆环上，使用模运算确保索引正确
    // 色相 = (索引 * 黄金角度) % 360
    const hue = (i * goldenAngle) % 360;
    colors.push(hslToRgb(hue, saturation, lightness));
  }

  return colors;
}

// 生成100个高对比度颜色，确保滑动窗口（21个颜色）内都有高对比度
const HIGH_CONTRAST_COLORS = generateHighContrastColors(21);

export class Logger {
  private module: string;
  private subModule?: string;
  private level: LogLevel;
  private stringifyForLog: (value: any) => string = String;

  constructor(
    module: string,
    subModule?: string,
    level: LogLevel = LogLevel.INFO,
  ) {
    this.module = module;
    this.subModule = subModule;
    this.level = level;
  }

  // Set stringify function for log storage
  setStringifyForLog(fn: (value: any) => string): void {
    this.stringifyForLog = fn;
  }

  // Format log prefix with timestamp, module and submodule
  private formatPrefix(logLevel: string): string {
    let moduleInfo = this.subModule
      ? `${this.module}:${this.subModule}`
      : `${this.module}`;
    moduleInfo = moduleInfo.substring(0, 15).padEnd(15, ' ');
    // moduleInfo字符不能超过15个 超过就截断 缺就补空格
    return `${logLevel} ${moduleInfo}`;
  }

  // Set log level
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setLogCallback(callback: (...args: any[]) => void) {
    this.printCallback = callback;
  }

  private printCallback = (..._: any[]) => {};
  print(...args: any[]): void {
    window.__logServiceLogPrintEnable && console.info(...args);
    this.printCallback(...args);
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      this.print(`${this.formatPrefix('LOG.INFO ')}`, message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      this.print(`${this.formatPrefix('LOG.WARN ')}`, message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      this.print(`${this.formatPrefix('LOG.ERROR')}`, message, ...args);
    }
  }

  /**
   * 处理 console 输出的参数，函数类型只显示函数名
   */
  private processArgsForConsole(args: any[] | Record<string, any>): any[] {
    return typeof args === 'object'
      ? Object.values(args)
      : (args as any[]).map((arg) => {
          if (typeof arg === 'function') {
            return arg.name ? `[Function: ${arg.name}]` : '[Function]';
          }
          return arg;
        });
  }

  private _idColorMap = new Map<string, string>();
  static _colorIndex = 0;
  getColorById(id: string): string {
    let color = this._idColorMap.get(id);
    if (color) return color;
    else {
      const color =
        HIGH_CONTRAST_COLORS[Logger._colorIndex % HIGH_CONTRAST_COLORS.length];
      this._idColorMap.set(id, color);
      Logger._colorIndex++;
      return color;
    }
  }

  /**
   * 记录日志，区分 console 输出和日志存储
   * console 打印完整参数（函数除外），日志存储使用简略参数
   * @param messagePrefix 消息前缀
   * @param rawArgs 原始参数数组
   * @param messageSuffix 消息后缀
   * @param options 选项，包含 id 用于颜色标识
   */
  debug(messagePrefix: string, rawArgs?: any[], messageSuffix?: string): void {
    const clonedArgs = safeStructuredClone(rawArgs);
    rawArgs = clonedArgs ?? rawArgs ?? [];
    if (this.level <= LogLevel.INFO) {
      const prefix = `${this.formatPrefix('LOG.DEBUG')}`;
      const stringifiedArgs = rawArgs
        ? rawArgs.map(this.stringifyForLog).join(', ')
        : '';

      // 构建存储用的消息
      const storeMessage = messageSuffix
        ? `${messagePrefix}${stringifiedArgs}${messageSuffix}`
        : `${messagePrefix}${stringifiedArgs}`;

      // console 打印完整参数（函数除外）
      if (window.__logServiceLogPrintEnable && rawArgs) {
        const consoleArgs = this.processArgsForConsole(rawArgs);
        // 根据 id 获取颜色，应用到 messagePrefix 的样式上
        const id = rawArgs[rawArgs.length - 2] as string | undefined;
        const messagePrefixStyle = id
          ? `color: ${this.getColorById(id)};font-weight: bold;`
          : 'font-weight: bold;';
        if (messageSuffix) {
          console.info(
            `%c${prefix} %c${messagePrefix}`,
            'color: grey;font-weight: lighter;',
            messagePrefixStyle,
            ...consoleArgs,
            messageSuffix,
          );
        } else {
          console.info(
            `%c${prefix} %c${messagePrefix}`,
            'color: grey;font-weight: lighter;',
            messagePrefixStyle,
            ...consoleArgs,
          );
        }
      }

      // 日志存储使用简略参数
      this.printCallback(prefix, storeMessage);
    }
  }

  /**
   * 记录错误日志，区分 console 输出和日志存储
   * console 打印完整参数（函数除外），日志存储使用简略参数
   * @param messagePrefix 消息前缀
   * @param rawArgs 原始参数数组
   * @param messageSuffix 消息后缀
   */
  errorWithArgs(
    messagePrefix: string,
    rawArgs?: any[],
    messageSuffix?: string,
  ): void {
    rawArgs = rawArgs ?? [];
    if (this.level <= LogLevel.ERROR) {
      const prefix = `${this.formatPrefix('LOG.ERROR')}`;
      const stringifiedArgs = rawArgs.map(this.stringifyForLog).join(', ');

      // 构建存储用的消息
      const storeMessage = messageSuffix
        ? `${messagePrefix}${stringifiedArgs}${messageSuffix}`
        : `${messagePrefix}${stringifiedArgs}`;

      // console 打印完整参数（函数除外）
      if (window.__logServiceLogPrintEnable) {
        const consoleArgs = this.processArgsForConsole(rawArgs);
        if (messageSuffix) {
          console.error(prefix, messagePrefix, ...consoleArgs, messageSuffix);
        } else {
          console.error(prefix, messagePrefix, ...consoleArgs);
        }
      }

      // 日志存储使用简略参数
      this.printCallback(prefix, storeMessage);
    }
  }
}

declare global {
  interface Window {
    __logServiceLogPrintEnable: boolean;
  }
}

window.__logServiceLogPrintEnable = false;
