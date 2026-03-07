# 日志服务使用指南

## 1. 基本使用

```typescript
import { logService, createLoggerError } from '@/service/log';

//                                       父模块名   子模块名
const logger = logService.createLogger('feature', '多基因');

logger.info('输出信息');
// 2025-03-13 07:41:22 [feature:多基因] INFO: 输出信息

logger.error('失败信息', error);
// 2025-03-13 07:41:22 [feature:多基因] ERROR: 失败信息 error变量的toString返回值

logger.warn('警告信息');
// 2025-03-13 07:41:22 [feature:多基因] WARN: 警告信息

logger.debug('调试信息');
// 2025-03-13 07:41:22 [feature:多基因] DEBUG: 调试信息
```

其中上面的logger的几个输出方法的方法签名如下

```typescript
// 与console.log console.info的签名一致
info(message: string, ...args: any[]): void

// 与console.error的签名一致
error(message: string, ...args: any[]): void

// 与console.warn的签名一致
warn(message: string, ...args: any[]): void

// 与console.debug的签名一致
debug(message: string, ...args: any[]): void
```

## 2. 替代Error

```typescript
import { logService, createLoggerError } from '@/service/log';

//                                       父模块名   子模块名
const logger = logService.createLogger('feature', '多基因');

const LError = createLoggerError(logger);

// ...
// 在业务代码中需要抛出错误的时候
if (!this.geneMidCountProp) throw Error('geneMidCountProp is undefined');

// 使用LError替换为如下代码
if (!this.geneMidCountProp) throw LError('geneMidCountProp is undefined');
// LError会执行上面的Error一样的逻辑 同时还会调用logger.error将该报错输出到日志中
//...
```

## 3. 查看日志

### 3.1 在开发者工具中的IndexDB中查看

`开发者工具` --> `Application选项卡` --> `Storage侧边栏` --> `IndexDB选项` --> `visualIndexDB - http://localhost:8858` --> `log表`
key对应时间戳 value对应日志内容

### 3.2 在开发者工具的console里面打印查看

输入`window.logService.printLogs()`即可打印

## 4. 内部机制说明

### 4.1 日志清除

每次启动会自动清除过期的日志(过期时间为30天)
