import { mixinWith, BaseMixin } from '../../mixin';

// ===== 基础 Mixin 测试 / Basic Mixin Tests =====

console.log('🎯 ===== 基础 Mixin 功能测试 / Basic Mixin Functionality Tests =====\n');

// ===== 1. 基础功能测试 / Basic Functionality Tests =====

class WalkMixin {
    walkSpeed = 5;
    walk() { 
        console.log(`Walking at speed ${this.walkSpeed}`); 
        return `walking-${this.walkSpeed}`;
    }
    
    run() { 
        console.log(`Running at speed ${this.walkSpeed * 2}`); 
        return `running-${this.walkSpeed * 2}`;
    }
}

class SwimMixin {
    swimSpeed = 3;
    swim() { 
        console.log(`Swimming at speed ${this.swimSpeed}`); 
        return `swimming-${this.swimSpeed}`;
    }
    
    dive() { 
        console.log('Diving underwater!'); 
        return 'diving';
    }
}

class FlyMixin {
    flySpeed = 10;
    altitude = 0;
    
    fly() { 
        this.altitude = 100;
        console.log(`Flying at speed ${this.flySpeed}, altitude ${this.altitude}`); 
        return `flying-${this.flySpeed}-${this.altitude}`;
    }
    
    land() { 
        this.altitude = 0;
        console.log('Landing safely'); 
        return 'landed';
    }
}

class JumpMixin {
    jumpHeight = 2;
    jump() { 
        console.log(`Jumping ${this.jumpHeight} meters high!`); 
        return `jump-${this.jumpHeight}`;
    }
    
    bounce() { 
        console.log('Bouncing around!'); 
        return 'bouncing';
    }
}

// ===== 2. 参数化 Mixin / Parameterized Mixins =====

class LoggingMixin {
    prefix: string;
    level: number;
    
    constructor(prefix: string, level: number = 1) {
        this.prefix = prefix;
        this.level = level;
    }
    
    log(message: string) {
        const output = `[${this.prefix}] ${message}`;
        console.log(output);
        return output;
    }
    
    debug(message: string) {
        if (this.level >= 2) {
            const output = `[${this.prefix}:DEBUG] ${message}`;
            console.log(output);
            return output;
        }
        return null;
    }
}

class TimestampMixin {
    timezone: string;
    
    constructor(timezone: string = 'UTC') {
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

class ConfigMixin {
    private config: Record<string, any> = {};
    
    constructor(initialConfig: Record<string, any> = {}) {
        this.config = { ...initialConfig };
    }
    
    setConfig(key: string, value: any) {
        this.config[key] = value;
        console.log(`Config set: ${key} = ${value}`);
        return this;
    }
    
    getConfig(key: string) {
        return this.config[key];
    }
    
    getAllConfig() {
        return { ...this.config };
    }
}

// ===== 3. 类型约束 Mixin / Type-Constrained Mixins =====

interface Animal {
    name: string;
    age: number;
    species: string;
}

interface Vehicle {
    brand: string;
    speed: number;
    fuel: number;
}

interface Identifiable {
    id: string;
}

class AnimalBehaviorMixin extends BaseMixin<Animal>() {
    introduce() {
        const intro = `Hello, I'm ${this.name}, a ${this.age}-year-old ${this.species}`;
        console.log(intro);
        return intro;
    }
    
    celebrate() {
        const msg = `${this.name} is celebrating!`;
        console.log(msg);
        return msg;
    }
    
    aging() {
        this.age += 1;
        console.log(`${this.name} is now ${this.age} years old`);
        return this.age;
    }
}

class VehicleBehaviorMixin extends BaseMixin<Vehicle>() {
    accelerate() {
        if (this.fuel > 0) {
            this.speed += 10;
            this.fuel -= 5;
            const status = `${this.brand} accelerating! Speed: ${this.speed}, Fuel: ${this.fuel}`;
            console.log(status);
            return status;
        }
        const status = `${this.brand} out of fuel!`;
        console.log(status);
        return status;
    }
    
    brake() {
        this.speed = Math.max(0, this.speed - 15);
        const status = `${this.brand} braking! Speed: ${this.speed}`;
        console.log(status);
        return status;
    }
    
    refuel(amount: number) {
        this.fuel += amount;
        console.log(`${this.brand} refueled. Fuel: ${this.fuel}`);
        return this.fuel;
    }
}

class IdentifiableMixin extends BaseMixin<Identifiable>() {
    generateToken() {
        const token = `${this.id}-${Date.now()}`;
        console.log(`Generated token: ${token}`);
        return token;
    }
    
    validate() {
        const isValid = Boolean(this.id && this.id.length > 0);
        console.log(`ID ${this.id} is ${isValid ? 'valid' : 'invalid'}`);
        return isValid;
    }
}

// ===== 测试类 / Test Classes =====

// 测试 1: 单一 Mixin
@mixinWith(WalkMixin)
export class BasicWalker {
    name: string;
    
    constructor(name: string) {
        this.name = name;
    }
    
    introduce() {
        console.log(`I'm ${this.name}, and I can walk!`);
        return `${this.name}-walker`;
    }
}
export interface BasicWalker extends WalkMixin {}

// 测试 2: 多个简单 Mixin
@mixinWith(WalkMixin, SwimMixin, JumpMixin)
export class Amphibian {
    species: string;
    
    constructor(species: string) {
        this.species = species;
    }
    
    showAbilities() {
        console.log(`${this.species} can walk, swim, and jump!`);
        return [this.walk(), this.swim(), this.jump()];
    }
}
export interface Amphibian extends WalkMixin, SwimMixin, JumpMixin {}

// 测试 3: 大量 Mixin 组合
@mixinWith(WalkMixin, SwimMixin, FlyMixin, JumpMixin)
export class SuperCreature {
    name: string;
    
    constructor(name: string) {
        this.name = name;
    }
    
    showAllAbilities() {
        console.log(`${this.name} demonstrating all abilities:`);
        const results = [
            this.walk(),
            this.swim(),
            this.fly(),
            this.jump()
        ];
        return results;
    }
    
    performSequence() {
        console.log(`${this.name} performing movement sequence:`);
        this.walk();
        this.jump();
        this.fly();
        this.land();
        this.dive();
        this.swim();
        return 'sequence-complete';
    }
}
export interface SuperCreature extends WalkMixin, SwimMixin, FlyMixin, JumpMixin {}

// 测试 4: 参数化 Mixin 组合
@mixinWith(
    [LoggingMixin, 'SYSTEM', 2],
    [TimestampMixin, 'Asia/Shanghai'],
    [ConfigMixin, { debug: true, version: '1.0' }]
)
export class SystemService {
    serviceName: string;
    
    constructor(serviceName: string) {
        this.serviceName = serviceName;
    }
    
    start() {
        this.log(`${this.serviceName} service starting...`);
        this.now();
        this.setConfig('status', 'running');
        this.debug('Service initialization complete');
        return 'started';
    }
    
    status() {
        const config = this.getAllConfig();
        this.log(`Service status: ${config.status}`);
        return config;
    }
}
export interface SystemService extends LoggingMixin, TimestampMixin, ConfigMixin {}

// 测试 5: 类型约束 Mixin
@mixinWith(AnimalBehaviorMixin, IdentifiableMixin)
export class Pet implements Animal, Identifiable {
    id: string;
    name: string;
    age: number;
    species: string;
    
    constructor(id: string, name: string, age: number, species: string) {
        this.id = id;
        this.name = name;
        this.age = age;
        this.species = species;
    }
    
    profile() {
        this.validate();
        const intro = this.introduce();
        const token = this.generateToken();
        return { intro, token };
    }
}
export interface Pet extends AnimalBehaviorMixin, IdentifiableMixin {}

// 测试 6: 混合所有类型的 Mixin
@mixinWith(
    WalkMixin,
    [LoggingMixin, 'HYBRID', 1],
    SwimMixin,
    [ConfigMixin, { mode: 'hybrid' }],
    AnimalBehaviorMixin,
    JumpMixin
)
export class HybridCreature implements Animal {
    name: string;
    age: number;
    species: string;
    
    constructor(name: string, age: number, species: string) {
        this.name = name;
        this.age = age;
        this.species = species;
    }
    
    demonstrate() {
        this.log(`${this.name} demonstrating hybrid abilities`);
        this.introduce();
        this.setConfig('lastDemo', Date.now());
        
        const abilities = [
            this.walk(),
            this.swim(),
            this.jump()
        ];
        
        this.celebrate();
        return abilities;
    }
}
export interface HybridCreature extends WalkMixin, LoggingMixin, SwimMixin, ConfigMixin, AnimalBehaviorMixin, JumpMixin {}

// 测试 7: 方法冲突测试
class ConflictMixin1 {
    conflictMethod() {
        console.log('Method from ConflictMixin1');
        return 'conflict1';
    }
    
    uniqueMethod1() {
        console.log('Unique method from ConflictMixin1');
        return 'unique1';
    }
}

class ConflictMixin2 {
    conflictMethod() {
        console.log('Method from ConflictMixin2');
        return 'conflict2';
    }
    
    uniqueMethod2() {
        console.log('Unique method from ConflictMixin2');
        return 'unique2';
    }
}

@mixinWith(ConflictMixin1, WalkMixin, ConflictMixin2, SwimMixin)
export class ConflictTester {
    name: string;
    
    constructor(name: string) {
        this.name = name;
    }
    
    testConflicts() {
        console.log(`${this.name} testing method conflicts:`);
        const conflictResult = this.conflictMethod(); // 应该是后面的覆盖前面的
        const unique1 = this.uniqueMethod1();
        const unique2 = this.uniqueMethod2();
        const walk = this.walk();
        const swim = this.swim();
        
        return { conflictResult, unique1, unique2, walk, swim };
    }
}
export interface ConflictTester extends ConflictMixin1, WalkMixin, ConflictMixin2, SwimMixin {}

// ===== 演示代码 / Demo Code =====

console.log('📋 【测试 1: 基础单一 Mixin】');
const walker = new BasicWalker('Walker');
walker.introduce();
walker.walk();
walker.run();
console.log();

console.log('📋 【测试 2: 多个简单 Mixin】');
const frog = new Amphibian('Tree Frog');
const abilities = frog.showAbilities();
frog.dive();
frog.bounce();
console.log('Abilities results:', abilities);
console.log();

console.log('📋 【测试 3: 大量 Mixin 组合】');
const superCreature = new SuperCreature('Phoenix');
const allAbilities = superCreature.showAllAbilities();
console.log('All abilities:', allAbilities);
superCreature.performSequence();
console.log();

console.log('📋 【测试 4: 参数化 Mixin】');
const systemService = new SystemService('DataProcessor');
systemService.start();
const status = systemService.status();
console.log('Service config:', status);
console.log();

console.log('📋 【测试 5: 类型约束 Mixin】');
const pet = new Pet('PET001', 'Buddy', 3, 'Golden Retriever');
const profile = pet.profile();
pet.aging();
console.log('Pet profile:', profile);
console.log();

console.log('📋 【测试 6: 混合所有类型】');
const hybrid = new HybridCreature('Chimera', 100, 'Mythical Beast');
const hybridAbilities = hybrid.demonstrate();
console.log('Hybrid abilities:', hybridAbilities);
console.log('Hybrid config:', hybrid.getAllConfig());
console.log();

console.log('📋 【测试 7: 方法冲突】');
const conflictTester = new ConflictTester('Tester');
const conflicts = conflictTester.testConflicts();
console.log('Conflict test results:', conflicts);
console.log();

console.log('🎉 所有基础测试完成！/ All basic tests completed!'); 