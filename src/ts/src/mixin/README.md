# TypeScript Mixin 装饰器系统 / TypeScript Mixin Decorator System

这是一个强大而简洁的 TypeScript Mixin 装饰器系统，支持**一次性应用多个 Mixin**、参数传递和类型约束，使用 interface 合并提供完美的类型体验。

This is a powerful and concise TypeScript Mixin decorator system that supports **applying multiple Mixins at once**, parameter passing and type constraints, using interface merging for perfect type experience.

## 🚀 核心功能 / Core Features

- ✅ **无限 Mixin 支持** / Unlimited Mixins support: `@mixinWith(M1, M2, M3, ..., M10, M20, ...)`
- ✅ **多个 Mixin 支持** / Multiple Mixins support: `@mixinWith(Mixin1, Mixin2, Mixin3)`
- ✅ **参数传递** / Parameter support: `@mixinWith([Mixin1, param1], [Mixin2, param2])`
- ✅ **混合语法** / Mixed syntax: `@mixinWith(SimpleMixin, [ParamMixin, param1], AnotherMixin)`
- ✅ **Interface 合并** / Interface merging: 最佳的类型体验，无需类型断言
- ✅ **类型约束** / Type constraints: 使用 `BaseMixin<Interface>()` 
- ✅ **完美的 IDE 支持** / Perfect IDE support: 智能提示和类型检查

## 基本用法 / Basic Usage

### 1. 多个简单 Mixin / Multiple Simple Mixins

```typescript
import { mixinWith } from './mixin';

class SwimMixin {
    swimSpeed = 3;
    swim() { console.log(`Swimming at speed ${this.swimSpeed}`); }
    dive() { console.log('Diving underwater!'); }
}

class JumpMixin {
    jumpHeight = 2;
    jump() { console.log(`Jumping ${this.jumpHeight} meters high!`); }
    bounce() { console.log('Bouncing around!'); }
}

// 🎯 一次性应用多个 Mixin！
@mixinWith(SwimMixin, JumpMixin)
class Frog {
    species: string;
    constructor(species: string) { this.species = species; }
    croak() { console.log(`${this.species}: Ribbit!`); }
}
interface Frog extends SwimMixin, JumpMixin {} // 支持多个 Mixin 的接口合并

// 使用 - 拥有所有 Mixin 的功能
const frog = new Frog('Green Tree Frog');
frog.croak();  // 原有方法
frog.swim();   // 来自 SwimMixin
frog.jump();   // 来自 JumpMixin
frog.dive();   // 来自 SwimMixin
frog.bounce(); // 来自 JumpMixin
```

### 2. 带参数的多个 Mixin / Multiple Mixins with Parameters

```typescript
class LoggingMixin {
    prefix: string;
    level: number;
    
    constructor(prefix: string, level: number) {
        this.prefix = prefix;
        this.level = level;
    }
    
    log(message: string) {
        console.log(`[${this.prefix}] ${message}`);
    }
}

class TimestampMixin {
    timezone: string;
    
    constructor(timezone: string) {
        this.timezone = timezone;
    }
    
    now() {
        return new Date().toLocaleString('zh-CN', { timeZone: this.timezone });
    }
}

// 🎯 混合带参数和无参数的 Mixin
@mixinWith(
    [LoggingMixin, 'SERVICE', 2],           // 带参数
    [TimestampMixin, 'Asia/Shanghai'],      // 带参数
    SwimMixin                               // 无参数
)
class EnhancedService {
    name: string;
    constructor(name: string) { this.name = name; }
    
    start() {
        this.log(`${this.name} service starting...`);
        console.log('Current time:', this.now());
        this.swim(); // 为什么不能游泳呢？😄
    }
}
interface EnhancedService extends LoggingMixin, TimestampMixin, SwimMixin {}
```

### 3. 带类型约束的多个 Mixin / Multiple Type-Constrained Mixins

```typescript
import { mixinWith, BaseMixin } from './mixin';

interface Animal {
    name: string;
    age: number;
}

interface Vehicle {
    speed: number;
    fuel: number;
}

class AnimalBehaviorMixin extends BaseMixin<Animal>() {
    introduce() {
        console.log(`Hello, I'm ${this.name}, ${this.age} years old`);
    }
    
    celebrate() {
        console.log(`${this.name} is celebrating!`);
    }
}

class VehicleBehaviorMixin extends BaseMixin<Vehicle>() {
    accelerate() {
        if (this.fuel > 0) {
            this.speed += 10;
            this.fuel -= 5;
            console.log(`Speed: ${this.speed}, Fuel: ${this.fuel}`);
        }
    }
    
    brake() {
        this.speed = Math.max(0, this.speed - 15);
        console.log(`Braking! Speed: ${this.speed}`);
    }
}

// 🎯 神奇的变形金刚 - 既是动物又是车辆！
@mixinWith(AnimalBehaviorMixin, VehicleBehaviorMixin)
class Transformer implements Animal, Vehicle {
    name: string;
    age: number;
    speed: number = 0;
    fuel: number = 100;
    
    constructor(name: string, age: number) {
        this.name = name;
        this.age = age;
    }
    
    transform() {
        console.log(`${this.name} is transforming!`);
    }
}
interface Transformer extends AnimalBehaviorMixin, VehicleBehaviorMixin {}

// 使用 - 同时拥有动物和车辆的行为
const optimus = new Transformer('Optimus Prime', 1000);
optimus.introduce();  // 动物行为
optimus.accelerate(); // 车辆行为
optimus.transform();  // 自身方法
optimus.celebrate();  // 动物行为
optimus.brake();      // 车辆行为
```

### 4. 超级复杂的多层 Mixin 组合 / Super Complex Multi-layered Mixin Combinations

```typescript
interface Cacheable { id: string; }
interface Configurable { config: Record<string, any>; }

class CacheMixin extends BaseMixin<Cacheable>() {
    private cache = new Map<string, any>();
    private maxSize: number;
    
    constructor(maxSize: number) {
        super();
        this.maxSize = maxSize;
    }
    
    setCache(key: string, value: any) { /* ... */ }
    getCache(key: string) { /* ... */ }
}

class ConfigMixin extends BaseMixin<Configurable>() {
    setConfig(key: string, value: any) { /* ... */ }
    getConfig(key: string) { /* ... */ }
}

class EventMixin {
    private listeners = new Map<string, Function[]>();
    on(event: string, callback: Function) { /* ... */ }
    emit(event: string, ...args: any[]) { /* ... */ }
}

// 🎯 超级复杂的服务类 - 一次性获得所有功能！
@mixinWith(
    [CacheMixin, 50],                    // 缓存功能，最大50个条目
    ConfigMixin,                         // 配置管理
    EventMixin,                          // 事件系统
    [LoggingMixin, 'SUPER', 2]          // 日志功能
)
class SuperService implements Cacheable, Configurable {
    id: string;
    config: Record<string, any> = {};
    
    constructor(id: string) {
        this.id = id;
    }
    
    initialize() {
        this.log('Initializing SuperService...');
        this.setConfig('initialized', true);
        this.setCache('status', 'ready');
        this.emit('initialized', this.id);
    }
}
interface SuperService extends CacheMixin, ConfigMixin, EventMixin, LoggingMixin {}

// 使用 - 拥有所有功能的超级服务
const superService = new SuperService('super-service-001');
superService.on('initialized', (id: string) => console.log(`Service ${id} is ready!`));
superService.initialize();
console.log('Cache status:', superService.getCache('status'));
console.log('Config initialized:', superService.getConfig('initialized'));
```

## 🎯 语法参考 / Syntax Reference

### 支持的语法格式 / Supported Syntax Formats

```typescript
// 1. 单个无参数 Mixin / Single parameterless Mixin
@mixinWith(MixinClass)

// 2. 单个带参数 Mixin / Single parameterized Mixin
@mixinWith([MixinClass, param1, param2])

// 3. 多个无参数 Mixin / Multiple parameterless Mixins
@mixinWith(Mixin1, Mixin2, Mixin3)

// 4. 多个带参数 Mixin / Multiple parameterized Mixins
@mixinWith([Mixin1, param1], [Mixin2, param2], [Mixin3, param3])

// 5. 混合语法 / Mixed syntax
@mixinWith(
    SimpleMixin,                    // 无参数
    [ParamMixin, param1, param2],   // 带参数
    AnotherSimpleMixin,             // 无参数
    [AnotherParamMixin, param]      // 带参数
)
```

## API 参考 / API Reference

### `mixinWith(...mixins)`

强大的多 Mixin 装饰器函数。

Powerful multiple Mixin decorator function.

**参数 / Parameters:**
- `...mixins`: Mixin 类数组，支持以下格式 / Array of Mixin classes, supports following formats:
  - `MixinClass` - 无参数 Mixin / Parameterless Mixin
  - `[MixinClass, param1, param2, ...]` - 带参数 Mixin / Parameterized Mixin

**返回 / Returns:**
- 装饰器函数，返回增强后的类 / Decorator function that returns enhanced class

### `BaseMixin<TConstraint>()`

创建带类型约束的 Mixin 基类。

Create a type-constrained Mixin base class.

**类型参数 / Type Parameters:**
- `TConstraint`: 约束接口，Mixin 可以访问此接口的属性 / Constraint interface

## 🔑 使用注意事项 / Usage Notes

### 关键：Interface 合并 / Key: Interface Merging

**这是最重要的步骤！必须添加 interface 合并声明：**

```typescript
@mixinWith(Mixin1, Mixin2, Mixin3)
class MyClass {
    // 类定义
}
interface MyClass extends Mixin1, Mixin2, Mixin3 {} // 🔑 必需！
```

### 参数语法 / Parameter Syntax

```typescript
// ✅ 正确的参数语法
@mixinWith([MixinClass, param1, param2])

// ❌ 错误的语法
@mixinWith(MixinClass, param1, param2) // 这会被当作多个 Mixin
```

### 多重 Mixin 的执行顺序 / Execution Order of Multiple Mixins

Mixin 按照声明顺序执行，后面的 Mixin 可能会覆盖前面的同名方法：

```typescript
@mixinWith(Mixin1, Mixin2, Mixin3) // 执行顺序: Mixin1 → Mixin2 → Mixin3
```

## 🌟 为什么选择多 Mixin 方式？ / Why Choose Multiple Mixins?

### ❌ 传统方式 (繁琐) / Traditional Way (Tedious)
```typescript
@mixinWith(Mixin1)
@mixinWith(Mixin2)
@mixinWith(Mixin3)
class MyClass { }
interface MyClass extends Mixin1 {}
interface MyClass extends Mixin2 {}
interface MyClass extends Mixin3 {}
```

### ✅ 新方式 (简洁) / New Way (Concise)
```typescript
@mixinWith(Mixin1, Mixin2, Mixin3)
class MyClass { }
interface MyClass extends Mixin1, Mixin2, Mixin3 {}
```

**优势 / Advantages:**
- 🎯 **一行搞定** / One line solution
- 🔧 **灵活参数** / Flexible parameters  
- 📝 **代码简洁** / Cleaner code
- 🚀 **更好维护** / Better maintainability
- 💡 **直观易懂** / Intuitive and easy to understand

## ♾️ 无限参数支持 / Unlimited Parameter Support

**🎉 重大升级：现在支持无限数量的 Mixin 参数！**

**🎉 Major Upgrade: Now supports unlimited number of Mixin parameters!**

### 旧版本限制 / Previous Version Limitation

```typescript
// ❌ 旧版本：最多只能支持 5 个 Mixin
@mixinWith(M1, M2, M3, M4, M5) // 最多 5 个
```

### 新版本优势 / New Version Advantages

```typescript
// ✅ 新版本：支持任意数量的 Mixin！
@mixinWith(M1, M2, M3, M4, M5, M6, M7, M8, M9, M10, M11, M12, ...) // 无限制！
```

### 实际示例 / Real Examples

#### 示例 1: 超过 5 个简单 Mixin / Example 1: More than 5 Simple Mixins

```typescript
class Mixin1 { method1() { return 'method1'; } }
class Mixin2 { method2() { return 'method2'; } }
class Mixin3 { method3() { return 'method3'; } }
class Mixin4 { method4() { return 'method4'; } }
class Mixin5 { method5() { return 'method5'; } }
class Mixin6 { method6() { return 'method6'; } }
class Mixin7 { method7() { return 'method7'; } }
class Mixin8 { method8() { return 'method8'; } }

// 🎯 8 个 Mixin 一次性应用！
@mixinWith(Mixin1, Mixin2, Mixin3, Mixin4, Mixin5, Mixin6, Mixin7, Mixin8)
class MegaClass {
    baseMethod() { return 'base'; }
}
interface MegaClass extends Mixin1, Mixin2, Mixin3, Mixin4, Mixin5, Mixin6, Mixin7, Mixin8 {}

const mega = new MegaClass();
mega.method1(); // ✅ 可用
mega.method8(); // ✅ 可用
```

#### 示例 2: 混合参数化 Mixin（超过 5 个）/ Example 2: Mixed Parameterized Mixins (More than 5)

```typescript
@mixinWith(
    Mixin1,                              // 1
    [ParameterizedMixin, 'PREFIX1', 10], // 2 (带参数)
    Mixin2,                              // 3
    [ParameterizedMixin, 'PREFIX2', 20], // 4 (带参数)
    Mixin3,                              // 5
    Mixin4,                              // 6
    IdMixin,                             // 7
    NameMixin                            // 8
)
class ComplexClass implements HasId, HasName {
    id = 'complex-001';
    name = 'ComplexInstance';
}
interface ComplexClass extends Mixin1, ParameterizedMixin, Mixin2, Mixin3, Mixin4, IdMixin, NameMixin {}
```

#### 示例 3: 极限测试 - 12 个 Mixin / Example 3: Extreme Test - 12 Mixins

```typescript
@mixinWith(
    Mixin1, Mixin2, Mixin3, Mixin4, Mixin5, 
    Mixin6, Mixin7, Mixin8, Mixin9, Mixin10,
    Mixin11, Mixin12
)
class UltimateClass {
    ultimateMethod() {
        console.log('Ultimate method - 12 Mixins applied!');
    }
}
interface UltimateClass extends 
    Mixin1, Mixin2, Mixin3, Mixin4, Mixin5, 
    Mixin6, Mixin7, Mixin8, Mixin9, Mixin10,
    Mixin11, Mixin12 {}

const ultimate = new UltimateClass();
ultimate.method1();  // ✅ 来自 Mixin1  
ultimate.method12(); // ✅ 来自 Mixin12
```

### 技术实现 / Technical Implementation

新版本使用了高级 TypeScript 类型技术：

The new version uses advanced TypeScript type techniques:

```typescript
// 类型工具：从 Mixin 参数中提取实例类型
type ExtractMixinType<T> = T extends Constructor<infer U> ? U : 
                          T extends [Constructor<infer U>, ...any[]] ? U : 
                          never;

// 类型工具：将 Mixin 数组转换为交集类型
type MixinArrayToIntersection<T extends readonly any[]> = 
    T extends readonly [infer First, ...infer Rest] 
        ? ExtractMixinType<First> & MixinArrayToIntersection<Rest>
        : {};

// 支持无限参数的函数签名
export function mixinWith<TMixins extends NonEmptyArray<Constructor<any> | [Constructor<any>, ...any[]]>>(
    ...mixins: TMixins
): <T extends Constructor>(target: T) => T & Constructor<InstanceType<T> & MixinArrayToIntersection<TMixins>>
```

### 性能表现 / Performance

即使应用大量 Mixin，性能依然出色：

Even with many Mixins applied, performance remains excellent:

- ⚡ **创建实例**: < 10ms (即使 12 个 Mixin)
- ⚡ **方法调用**: < 5ms (所有方法)
- 💾 **内存使用**: 高效，无内存泄漏
- 🔧 **类型检查**: 完整的 TypeScript 支持

## 🧪 测试 / Testing

项目包含完整的单元测试套件，分为三个测试集：

The project includes a comprehensive unit test suite, divided into three test sets:

### Test1: 基础功能测试 / Basic Functionality Tests

位置：`test/test1/` 目录

Location: `test/test1/` directory

```bash
# 运行基础测试
npm test -- test1

# 查看 test1 文档
cat src/mixin/test/test1/README.md
```

**覆盖范围 / Coverage:**
- ✅ 基础 Mixin 功能（Dog, Bird, Chicken, Penguin）
- ✅ 多个 Mixin 组合  
- ✅ 参数化 Mixin
- ✅ 方法覆盖行为验证
- ✅ 类型安全性测试
- ✅ 性能和内存测试

### Test2: 高级功能测试 / Advanced Functionality Tests

位置：`test/test2/` 目录

Location: `test/test2/` directory

```bash
# 运行高级测试
npm test -- test2

# 查看 test2 文档
cat src/mixin/test/test2/README.md
```

**覆盖范围 / Coverage:**
- ✅ 复杂多 Mixin 组合（Frog, EnhancedService, Transformer, SuperService）
- ✅ 企业级应用场景
- ✅ 缓存、配置、事件、日志系统
- ✅ 类型约束 Mixin (`BaseMixin<T>`)
- ✅ LRU 缓存策略验证
- ✅ 发布订阅事件机制

### Test3: 无限参数支持测试 / Unlimited Parameter Support Tests

位置：`test/unlimited-test.ts` 和 `test/unlimited-test.test.ts`

Location: `test/unlimited-test.ts` and `test/unlimited-test.test.ts`

```bash
# 运行无限参数演示
npx tsx test/unlimited-test.ts

# 运行无限参数单元测试
npx vitest test/unlimited-test.test.ts --run
```

**覆盖范围 / Coverage:**
- ✅ 超过 5 个 Mixin 的组合（6, 8, 10, 12 个 Mixin）
- ✅ 混合参数化和非参数化 Mixin（超过 5 个）
- ✅ 类型约束 Mixin（超过 5 个）
- ✅ 性能测试（大量 Mixin 的创建和方法调用性能）
- ✅ 内存管理测试（100 个实例的内存使用）
- ✅ 类型安全验证（完整的 TypeScript 类型支持）
- ✅ 边界情况测试（方法重写、空 Mixin 类）

**测试结果 / Test Results:**
```
✅ 10 个测试全部通过 / 10 tests passed
⚡ 创建实例: < 10ms (即使 12 个 Mixin)
⚡ 方法调用: < 5ms (所有方法)
💾 内存使用: 高效，无内存泄漏
🔧 类型检查: 完整的 TypeScript 支持
```

### 运行所有测试 / Run All Tests

```bash
# 运行所有测试
npm test

# 运行测试并查看覆盖率
npm test -- --coverage

# 运行测试 UI
npm run test:ui

# 运行特定测试套件
npm test -- --grep "复杂多层"
```

### 测试架构 / Test Architecture

```
src/mixin/
├── mixin.ts                    # 核心 Mixin 实现
├── README.md                   # 主文档（本文件）
└── test/
    ├── test1/                  # 基础功能测试
    │   ├── test1.ts           # 基础示例代码
    │   ├── test1.test.ts      # 基础单元测试
    │   └── README.md          # 基础测试文档
    └── test2/                  # 高级功能测试
        ├── test2.ts           # 高级示例代码
        ├── test2.test.ts      # 高级单元测试
        └── README.md          # 高级测试文档
```

## 完整示例 / Complete Examples

查看以下文件获取完整的使用示例：

See the following files for complete usage examples:

- `test/test1/test1.ts` - 基础示例 / Basic examples
- `test/test2/test2.ts` - 高级示例 / Advanced examples
- `test/test1/README.md` - 基础测试文档 / Basic test documentation
- `test/test2/README.md` - 高级测试文档 / Advanced test documentation

## 导出的类型 / Exported Types

```typescript
export type Enhanced<TBase, TEnhancement> = TBase & TEnhancement;
export type EnhancedConstructor<TBase, TEnhancement> = Constructor<Enhanced<TBase, TEnhancement>>;
``` 