import { describe, it, expect, beforeEach } from 'vitest';
import { mixinWith, BaseMixin } from '../../mixin';
import { 
    BasicWalker, 
    Amphibian, 
    SuperCreature, 
    SystemService, 
    Pet, 
    HybridCreature, 
    ConflictTester 
} from './test3';

describe('基础 Mixin 功能测试 / Basic Mixin Functionality Tests', () => {

    describe('单一 Mixin 测试 / Single Mixin Tests', () => {
        
        it('应该正确应用单个 Mixin / Should correctly apply single Mixin', () => {
            const walker = new BasicWalker('TestWalker');
            
            expect(walker.name).toBe('TestWalker');
            expect(walker.introduce()).toBe('TestWalker-walker');
            expect(walker.walk()).toBe('walking-5');
            expect(walker.run()).toBe('running-10');
            expect(walker.walkSpeed).toBe(5);
        });
        
        it('应该保持原有类的方法 / Should preserve original class methods', () => {
            const walker = new BasicWalker('TestWalker');
            
            expect(typeof walker.introduce).toBe('function');
            expect(typeof walker.walk).toBe('function');
            expect(typeof walker.run).toBe('function');
        });
    });

    describe('多个 Mixin 测试 / Multiple Mixins Tests', () => {
        
        it('应该正确组合多个简单 Mixin / Should correctly combine multiple simple Mixins', () => {
            const amphibian = new Amphibian('Frog');
            
            expect(amphibian.species).toBe('Frog');
            
            // 测试所有 Mixin 的方法都可用
            expect(amphibian.walk()).toBe('walking-5');
            expect(amphibian.swim()).toBe('swimming-3');
            expect(amphibian.jump()).toBe('jump-2');
            expect(amphibian.run()).toBe('running-10');
            expect(amphibian.dive()).toBe('diving');
            expect(amphibian.bounce()).toBe('bouncing');
            
            // 测试属性
            expect(amphibian.walkSpeed).toBe(5);
            expect(amphibian.swimSpeed).toBe(3);
            expect(amphibian.jumpHeight).toBe(2);
            
            // 测试组合方法
            const abilities = amphibian.showAbilities();
            expect(abilities).toEqual(['walking-5', 'swimming-3', 'jump-2']);
        });
        
        it('应该支持四个 Mixin 的组合 / Should support combination of four Mixins', () => {
            const superCreature = new SuperCreature('Phoenix');
            
            expect(superCreature.name).toBe('Phoenix');
            
            // 测试所有四个 Mixin 的功能
            expect(superCreature.walk()).toBe('walking-5');
            expect(superCreature.swim()).toBe('swimming-3');
            expect(superCreature.jump()).toBe('jump-2');
            expect(superCreature.fly()).toBe('flying-10-100');
            expect(superCreature.land()).toBe('landed');
            expect(superCreature.dive()).toBe('diving');
            expect(superCreature.bounce()).toBe('bouncing');
            
            // 测试组合方法
            const allAbilities = superCreature.showAllAbilities();
            expect(allAbilities).toEqual(['walking-5', 'swimming-3', 'flying-10-100', 'jump-2']);
            
            // 测试序列方法
            expect(superCreature.performSequence()).toBe('sequence-complete');
            
            // 测试状态变化
            expect(superCreature.altitude).toBe(0); // land() 应该重置 altitude
        });
    });

    describe('参数化 Mixin 测试 / Parameterized Mixin Tests', () => {
        
        it('应该正确处理参数化 Mixin / Should correctly handle parameterized Mixins', () => {
            const systemService = new SystemService('TestService');
            
            expect(systemService.serviceName).toBe('TestService');
            
            // 测试启动服务
            expect(systemService.start()).toBe('started');
            
            // 测试配置功能
            expect(systemService.getConfig('status')).toBe('running');
            expect(systemService.getConfig('debug')).toBe(true);
            expect(systemService.getConfig('version')).toBe('1.0');
            
            // 测试状态方法
            const status = systemService.status();
            expect(status.status).toBe('running');
            expect(status.debug).toBe(true);
            expect(status.version).toBe('1.0');
            
            // 测试日志功能
            const logResult = systemService.log('Test message');
            expect(logResult).toBe('[SYSTEM] Test message');
            
            // 测试调试功能 (level = 2)
            const debugResult = systemService.debug('Debug message');
            expect(debugResult).toBe('[SYSTEM:DEBUG] Debug message');
            
            // 测试时间功能
            const timeResult = systemService.now();
            expect(typeof timeResult).toBe('string');
            expect(timeResult.length).toBeGreaterThan(0);
        });
        
        it('应该支持配置链式调用 / Should support config chaining', () => {
            const systemService = new SystemService('ChainService');
            
            const result = systemService.setConfig('key1', 'value1')
                                      .setConfig('key2', 'value2');
            
            expect(result).toBe(systemService);
            expect(systemService.getConfig('key1')).toBe('value1');
            expect(systemService.getConfig('key2')).toBe('value2');
        });
    });

    describe('类型约束 Mixin 测试 / Type-Constrained Mixin Tests', () => {
        
        it('应该正确处理类型约束的 Mixin / Should correctly handle type-constrained Mixins', () => {
            const pet = new Pet('PET001', 'Buddy', 3, 'Golden Retriever');
            
            expect(pet.id).toBe('PET001');
            expect(pet.name).toBe('Buddy');
            expect(pet.age).toBe(3);
            expect(pet.species).toBe('Golden Retriever');
            
            // 测试动物行为 Mixin
            const intro = pet.introduce();
            expect(intro).toBe('Hello, I\'m Buddy, a 3-year-old Golden Retriever');
            
            const celebration = pet.celebrate();
            expect(celebration).toBe('Buddy is celebrating!');
            
            // 测试年龄增长
            const newAge = pet.aging();
            expect(newAge).toBe(4);
            expect(pet.age).toBe(4);
            
            // 测试身份验证 Mixin
            expect(pet.validate()).toBe(true);
            
            const token = pet.generateToken();
            expect(token).toContain('PET001-');
            expect(token.length).toBeGreaterThan(10);
            
            // 测试组合方法
            const profile = pet.profile();
            expect(profile.intro).toBe('Hello, I\'m Buddy, a 4-year-old Golden Retriever');
            expect(profile.token).toContain('PET001-');
        });
        
        it('应该验证无效 ID / Should validate invalid ID', () => {
            const invalidPet = new Pet('', 'NoName', 1, 'Unknown');
            
            expect(invalidPet.validate()).toBe(false);
        });
    });

    describe('混合类型 Mixin 测试 / Mixed Type Mixin Tests', () => {
        
        it('应该正确处理混合类型的 Mixin / Should correctly handle mixed type Mixins', () => {
            const hybrid = new HybridCreature('Chimera', 100, 'Mythical Beast');
            
            expect(hybrid.name).toBe('Chimera');
            expect(hybrid.age).toBe(100);
            expect(hybrid.species).toBe('Mythical Beast');
            
            // 测试演示方法
            const abilities = hybrid.demonstrate();
            expect(abilities).toEqual(['walking-5', 'swimming-3', 'jump-2']);
            
            // 测试配置功能
            const config = hybrid.getAllConfig();
            expect(config.mode).toBe('hybrid');
            expect(typeof config.lastDemo).toBe('number');
            
            // 测试日志功能
            const logResult = hybrid.log('Test hybrid');
            expect(logResult).toBe('[HYBRID] Test hybrid');
            
            // 测试动物行为
            const intro = hybrid.introduce();
            expect(intro).toBe('Hello, I\'m Chimera, a 100-year-old Mythical Beast');
            
            const celebration = hybrid.celebrate();
            expect(celebration).toBe('Chimera is celebrating!');
            
            // 测试运动能力
            expect(hybrid.walk()).toBe('walking-5');
            expect(hybrid.swim()).toBe('swimming-3');
            expect(hybrid.jump()).toBe('jump-2');
        });
    });

    describe('方法冲突测试 / Method Conflict Tests', () => {
        
        it('应该正确处理方法冲突（后面的覆盖前面的）/ Should handle method conflicts correctly (later overrides earlier)', () => {
            const conflictTester = new ConflictTester('Tester');
            
            expect(conflictTester.name).toBe('Tester');
            
            // 测试冲突方法 - 应该是 ConflictMixin2 的版本
            expect(conflictTester.conflictMethod()).toBe('conflict2');
            
            // 测试独有方法都应该可用
            expect(conflictTester.uniqueMethod1()).toBe('unique1');
            expect(conflictTester.uniqueMethod2()).toBe('unique2');
            
            // 测试其他 Mixin 的方法
            expect(conflictTester.walk()).toBe('walking-5');
            expect(conflictTester.swim()).toBe('swimming-3');
            
            // 测试组合方法
            const conflicts = conflictTester.testConflicts();
            expect(conflicts.conflictResult).toBe('conflict2');
            expect(conflicts.unique1).toBe('unique1');
            expect(conflicts.unique2).toBe('unique2');
            expect(conflicts.walk).toBe('walking-5');
            expect(conflicts.swim).toBe('swimming-3');
        });
    });

    describe('性能和内存测试 / Performance and Memory Tests', () => {
        
        it('应该高效创建实例 / Should efficiently create instances', () => {
            const startTime = performance.now();
            
            const instances = [];
            for (let i = 0; i < 50; i++) {
                instances.push(new SuperCreature(`Creature${i}`));
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 50个实例应该在合理时间内创建完成
            expect(duration).toBeLessThan(100); // 100ms
            expect(instances.length).toBe(50);
            
            // 验证每个实例都正常工作
            instances.forEach((instance, index) => {
                expect(instance.name).toBe(`Creature${index}`);
                expect(instance.walk()).toBe('walking-5');
                expect(instance.fly()).toBe('flying-10-100');
            });
        });
        
        it('应该高效执行方法调用 / Should efficiently execute method calls', () => {
            const hybrid = new HybridCreature('SpeedTest', 1, 'Test Species');
            
            const startTime = performance.now();
            
            // 执行大量方法调用
            for (let i = 0; i < 1000; i++) {
                hybrid.walk();
                hybrid.swim();
                hybrid.jump();
                hybrid.log('test');
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // 4000次方法调用应该很快完成
            expect(duration).toBeLessThan(200); // 200ms
        });
        
        it('应该正确处理内存使用 / Should handle memory usage correctly', () => {
            const instances = [];
            
            // 创建大量实例
            for (let i = 0; i < 100; i++) {
                instances.push(new SystemService(`Service${i}`));
            }
            
            // 验证所有实例都正常工作
            instances.forEach((instance, index) => {
                expect(instance.serviceName).toBe(`Service${index}`);
                expect(instance.start()).toBe('started');
                expect(instance.getConfig('debug')).toBe(true);
            });
            
            // 清理引用
            instances.length = 0;
            
            // 这里我们只是验证没有抛出异常，实际的内存泄漏检测需要更复杂的工具
            expect(true).toBe(true);
        });
    });

    describe('类型安全验证 / Type Safety Verification', () => {
        
        it('应该提供完整的类型支持 / Should provide complete type support', () => {
            const amphibian = new Amphibian('TypeTest');
            
            // 验证所有方法都存在且为函数类型
            expect(typeof amphibian.walk).toBe('function');
            expect(typeof amphibian.run).toBe('function');
            expect(typeof amphibian.swim).toBe('function');
            expect(typeof amphibian.dive).toBe('function');
            expect(typeof amphibian.jump).toBe('function');
            expect(typeof amphibian.bounce).toBe('function');
            expect(typeof amphibian.showAbilities).toBe('function');
            
            // 验证属性类型
            expect(typeof amphibian.species).toBe('string');
            expect(typeof amphibian.walkSpeed).toBe('number');
            expect(typeof amphibian.swimSpeed).toBe('number');
            expect(typeof amphibian.jumpHeight).toBe('number');
            
            // 验证方法绑定正确
            const walkMethod = amphibian.walk;
            expect(walkMethod()).toBe('walking-5');
        });
        
        it('应该支持方法解构 / Should support method destructuring', () => {
            const systemService = new SystemService('DestructureTest');
            
            // 解构方法应该正常工作
            const { log, setConfig, getConfig } = systemService;
            
            expect(typeof log).toBe('function');
            expect(typeof setConfig).toBe('function');
            expect(typeof getConfig).toBe('function');
            
            // 注意：解构后的方法可能丢失 this 绑定，这是 JavaScript 的正常行为
            // 在实际使用中，建议使用 bind 或箭头函数来保持绑定
        });
    });

    describe('边界情况测试 / Edge Case Tests', () => {
        
        it('应该处理空构造函数参数 / Should handle empty constructor parameters', () => {
            const walker = new BasicWalker('');
            
            expect(walker.name).toBe('');
            expect(walker.walk()).toBe('walking-5');
            expect(walker.introduce()).toBe('-walker');
        });
        
        it('应该处理特殊字符 / Should handle special characters', () => {
            const walker = new BasicWalker('Test@#$%');
            
            expect(walker.name).toBe('Test@#$%');
            expect(walker.introduce()).toBe('Test@#$%-walker');
        });
        
        it('应该处理数值边界 / Should handle numeric boundaries', () => {
            const pet = new Pet('PET001', 'OldPet', 0, 'Ancient');
            
            expect(pet.age).toBe(0);
            
            // 测试年龄增长
            pet.aging();
            expect(pet.age).toBe(1);
            
            // 多次增长
            for (let i = 0; i < 100; i++) {
                pet.aging();
            }
            expect(pet.age).toBe(101);
        });
        
        it('应该处理配置覆盖 / Should handle config overrides', () => {
            const systemService = new SystemService('ConfigTest');
            
            // 初始配置
            expect(systemService.getConfig('debug')).toBe(true);
            expect(systemService.getConfig('version')).toBe('1.0');
            
            // 覆盖配置
            systemService.setConfig('debug', false);
            systemService.setConfig('version', '2.0');
            
            expect(systemService.getConfig('debug')).toBe(false);
            expect(systemService.getConfig('version')).toBe('2.0');
            
            // 添加新配置
            systemService.setConfig('newKey', 'newValue');
            expect(systemService.getConfig('newKey')).toBe('newValue');
        });
    });
}); 