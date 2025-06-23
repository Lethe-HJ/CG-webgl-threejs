import { mixinWith, BaseMixin } from '../../mixin';

// ===== 示例 1: 多个简单 Mixin 的组合 =====
// Example 1: Combination of multiple simple Mixins

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

// 一次性应用多个 Mixin
@mixinWith(SwimMixin, JumpMixin)
export class Frog {
    species: string;
    constructor(species: string) { this.species = species; }
    croak() { console.log(`${this.species}: Ribbit!`); }
}
export interface Frog extends SwimMixin, JumpMixin {} // 支持多个 Mixin 的接口合并

// ===== 示例 2: 带参数的多个 Mixin =====
// Example 2: Multiple Mixins with parameters

class LoggingMixin {
    prefix: string;
    level: number;
    
    constructor(prefix: string, level: number) {
        this.prefix = prefix;
        this.level = level;
    }
    
    log(message: string) {
        if (this.level >= 1) {
            console.log(`[${this.prefix}] ${message}`);
        }
    }
    
    debug(message: string) {
        if (this.level >= 2) {
            console.log(`[${this.prefix}:DEBUG] ${message}`);
        }
    }
}

class TimestampMixin {
    timezone: string;
    
    constructor(timezone: string) {
        this.timezone = timezone;
    }
    
    now() {
        const time = new Date().toLocaleString('zh-CN', { timeZone: this.timezone });
        console.log(`Current time (${this.timezone}): ${time}`);
        return time;
    }
    
    timestamp() {
        return Date.now();
    }
}

// 混合带参数和无参数的 Mixin
@mixinWith([LoggingMixin, 'SERVICE', 2], [TimestampMixin, 'Asia/Shanghai'], SwimMixin)
export class EnhancedService {
    name: string;
    constructor(name: string) { this.name = name; }
    
    start() {
        this.log(`${this.name} service starting...`);
        this.now();
        this.swim(); // 为什么不能游泳呢？😄
    }
}
export interface EnhancedService extends LoggingMixin, TimestampMixin, SwimMixin {}

// ===== 示例 3: 带类型约束的多个 Mixin =====
// Example 3: Multiple Mixins with type constraints

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
            console.log(`Accelerating! Speed: ${this.speed}, Fuel: ${this.fuel}`);
        } else {
            console.log('Out of fuel!');
        }
    }
    
    brake() {
        this.speed = Math.max(0, this.speed - 15);
        console.log(`Braking! Speed: ${this.speed}`);
    }
}

// 神奇的变形金刚 - 既是动物又是车辆！
@mixinWith(AnimalBehaviorMixin, VehicleBehaviorMixin)
export class Transformer implements Animal, Vehicle {
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
export interface Transformer extends AnimalBehaviorMixin, VehicleBehaviorMixin {}

// ===== 示例 4: 复杂的多层 Mixin 组合 =====
// Example 4: Complex multi-layered Mixin combinations

interface Cacheable { id: string; }
interface Configurable { config: Record<string, any>; }

class CacheMixin extends BaseMixin<Cacheable>() {
    private cache = new Map<string, any>();
    private maxSize: number;
    
    constructor(maxSize: number) {
        super();
        this.maxSize = maxSize;
    }
    
    setCache(key: string, value: any) {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
        console.log(`Cached ${key} for ${this.id}`);
    }
    
    getCache(key: string) {
        const value = this.cache.get(key);
        if (value) {
            console.log(`Cache hit for ${key} on ${this.id}`);
        }
        return value;
    }
}

class ConfigMixin extends BaseMixin<Configurable>() {
    setConfig(key: string, value: any) {
        this.config[key] = value;
        console.log(`Config ${key} set to ${value}`);
    }
    
    getConfig(key: string) {
        return this.config[key];
    }
}

class EventMixin {
    private listeners = new Map<string, Function[]>();
    
    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }
    
    emit(event: string, ...args: any[]) {
        if (this.listeners.has(event)) {
            this.listeners.get(event)!.forEach(callback => callback(...args));
        }
    }
}

// 超级复杂的服务类
@mixinWith([CacheMixin, 50], ConfigMixin, EventMixin, [LoggingMixin, 'SUPER', 2])
export class SuperService implements Cacheable, Configurable {
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
export interface SuperService extends CacheMixin, ConfigMixin, EventMixin, LoggingMixin {}

// ===== 测试代码 =====
// Test Code

console.log('=== Testing Frog with Multiple Mixins ===');
const frog = new Frog('Green Tree Frog');
frog.croak();
frog.swim();   // 来自 SwimMixin
frog.jump();   // 来自 JumpMixin
frog.dive();   // 来自 SwimMixin
frog.bounce(); // 来自 JumpMixin

console.log('\n=== Testing Enhanced Service ===');
const service = new EnhancedService('DataProcessor');
service.start();
service.debug('Service is running smoothly');

console.log('\n=== Testing Transformer ===');
const optimus = new Transformer('Optimus Prime', 1000);
optimus.introduce();  // 动物行为
optimus.accelerate(); // 车辆行为
optimus.transform();  // 自身方法
optimus.celebrate();  // 动物行为
optimus.brake();      // 车辆行为

console.log('\n=== Testing Super Service ===');
const superService = new SuperService('super-service-001');
superService.on('initialized', (id: string) => console.log(`Service ${id} is ready!`));
superService.initialize();
console.log('Cache status:', superService.getCache('status'));
console.log('Config initialized:', superService.getConfig('initialized')); 