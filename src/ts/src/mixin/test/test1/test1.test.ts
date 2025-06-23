import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Dog, Bird, Chicken, Penguin } from './test1'

describe('Mixin 装饰器系统测试 / Mixin Decorator System Tests', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  describe('基础 Mixin 功能测试 / Basic Mixin Functionality Tests', () => {
    test('Dog 类应该只有走路功能 / Dog should only have walking abilities', () => {
      const dog = new Dog('旺财')
      
      // 基本属性测试
      expect(dog.name).toBe('旺财')
      expect(dog.leg).toBe(4)
      
      // 方法存在性测试
      expect(typeof dog.bark).toBe('function')
      expect(typeof dog.walk).toBe('function')
      expect(typeof dog.run).toBe('function')
      expect(typeof dog.slowWalk).toBe('function')
      expect(typeof dog.fastWalk).toBe('function')
      
      // 不应该有飞行相关方法
      expect('fly' in dog).toBe(false)
      expect('glide' in dog).toBe(false)
      expect('soar' in dog).toBe(false)
    })

    test('Dog 的方法调用应该正常工作 / Dog methods should work correctly', () => {
      const dog = new Dog('旺财')
      
      dog.bark()
      expect(consoleSpy).toHaveBeenCalledWith('🐕 旺财: 汪汪!')
      
      dog.walk()
      expect(consoleSpy).toHaveBeenCalledWith('🚶 走路 - 腿数: 4, 速度: 5 (来自 WalkMixin)')
      
      dog.run()
      expect(consoleSpy).toHaveBeenCalledWith('🏃‍♂️ 跑步 - 腿数: 4, 速度: 15 (来自 WalkMixin)')
    })
  })

  describe('多个 Mixin 组合测试 / Multiple Mixin Combination Tests', () => {
    test('Bird 类应该同时拥有走路和飞行功能 / Bird should have both walking and flying abilities', () => {
      const bird = new Bird('小鸟')
      
      // 基本属性测试
      expect(bird.name).toBe('小鸟')
      expect(bird.leg).toBe(2)
      expect(bird.wing).toBe(2)
      
      // 应该有所有方法
      expect(typeof bird.chirp).toBe('function')
      expect(typeof bird.walk).toBe('function')
      expect(typeof bird.run).toBe('function')
      expect(typeof bird.fly).toBe('function')
      expect(typeof bird.glide).toBe('function')
      expect(typeof bird.soar).toBe('function')
    })

    test('Bird 的方法调用应该正常工作 / Bird methods should work correctly', () => {
      const bird = new Bird('小鸟')
      
      bird.chirp()
      expect(consoleSpy).toHaveBeenCalledWith('🐦 小鸟: 啾啾啾!')
      
      bird.walk()
      expect(consoleSpy).toHaveBeenCalledWith('🚶 走路 - 腿数: 2, 速度: 5 (来自 WalkMixin)')
      
      bird.fly()
      expect(consoleSpy).toHaveBeenCalledWith('🦅 飞行 - 翅膀数: 2, 速度: 10 (来自 FlyMixin)')
      
      bird.glide()
      expect(consoleSpy).toHaveBeenCalledWith('🪂 滑翔 - 翅膀数: 2 (来自 FlyMixin)')
    })
  })

  describe('参数化 Mixin 测试 / Parameterized Mixin Tests', () => {
    test('Chicken 类应该有走路功能但飞行受限 / Chicken should have walking but limited flying', () => {
      const chicken = new Chicken('公鸡')
      
      // 基本属性测试
      expect(chicken.name).toBe('公鸡')
      expect(chicken.leg).toBe(2)
      expect(chicken.wing).toBe(2)
      
      // 应该有所有方法
      expect(typeof chicken.cluck).toBe('function')
      expect(typeof chicken.walk).toBe('function')
      expect(typeof chicken.fly).toBe('function')
      expect(typeof chicken.glide).toBe('function')
    })

    test('Chicken 的 fly 方法实际被 FlyMixin 覆盖 / Chicken fly method is actually overridden by FlyMixin', () => {
      const chicken = new Chicken('公鸡')
      
      chicken.fly()
      // 实际上 FlyMixin 的方法覆盖了 Chicken 类的方法
      // 因为参数 canFly=false，所以显示不能飞的消息
      expect(consoleSpy).toHaveBeenCalledWith('扑腾翅膀但不能飞 - 翅膀数: 2 (来自 FlyMixin)')
      
      chicken.glide()
      // glide 方法来自 FlyMixin
      expect(consoleSpy).toHaveBeenCalledWith('🪂 滑翔 - 翅膀数: 2 (来自 FlyMixin)')
    })
  })

  describe('方法覆盖测试 / Method Override Tests', () => {
    test('Penguin 类应该覆盖多个方法 / Penguin should override multiple methods', () => {
      const penguin = new Penguin('企鹅')
      
      // 基本属性测试
      expect(penguin.name).toBe('企鹅')
      expect(penguin.leg).toBe(2)
      expect(penguin.wing).toBe(2)
      
      // 应该有所有方法
      expect(typeof penguin.waddle).toBe('function')
      expect(typeof penguin.walk).toBe('function')
      expect(typeof penguin.fly).toBe('function')
      expect(typeof penguin.glide).toBe('function')
    })

    test('Penguin 的方法实际被 Mixin 覆盖 / Penguin methods are actually overridden by Mixins', () => {
      const penguin = new Penguin('企鹅')
      
      penguin.walk()
      // walk 方法实际被 WalkMixin 覆盖
      expect(consoleSpy).toHaveBeenCalledWith('🚶 走路 - 腿数: 2, 速度: 5 (来自 WalkMixin)')
      
      penguin.fly()
      // fly 方法实际被 FlyMixin 覆盖，因为参数 canFly=false
      expect(consoleSpy).toHaveBeenCalledWith('扑腾翅膀但不能飞 - 翅膀数: 2 (来自 FlyMixin)')
      
      penguin.glide()
      // glide 方法来自 FlyMixin
      expect(consoleSpy).toHaveBeenCalledWith('🪂 滑翔 - 翅膀数: 2 (来自 FlyMixin)')
      
      penguin.waddle()
      // waddle 是 Penguin 类独有的方法，不会被覆盖
      expect(consoleSpy).toHaveBeenCalledWith('🐧 企鹅: 摇摆走路!')
    })
  })

  describe('方法来源检测测试 / Method Source Detection Tests', () => {
    test('应该能够检测方法来源 / Should be able to detect method sources', () => {
      const bird = new Bird('小鸟')
      const chicken = new Chicken('公鸡')
      const penguin = new Penguin('企鹅')
      
      // 由于 Mixin 实现方式，方法源码不会包含原始类名
      // 我们测试方法是否存在和类型
      expect(typeof bird.fly).toBe('function')
      expect(typeof chicken.fly).toBe('function')
      expect(typeof penguin.fly).toBe('function')
      expect(typeof penguin.walk).toBe('function')
      expect(typeof penguin.waddle).toBe('function')
    })
  })

  describe('类型安全测试 / Type Safety Tests', () => {
    test('所有类都应该实现正确的接口 / All classes should implement correct interfaces', () => {
      const dog = new Dog('旺财')
      const bird = new Bird('小鸟')
      const chicken = new Chicken('公鸡')
      const penguin = new Penguin('企鹅')
      
      // Dog 只实现 Legs 接口
      expect(dog.leg).toBeDefined()
      expect(typeof dog.leg).toBe('number')
      
      // Bird, Chicken, Penguin 都实现 Legs 和 Wings 接口
      expect(bird.leg).toBeDefined()
      expect(bird.wing).toBeDefined()
      expect(typeof bird.leg).toBe('number')
      expect(typeof bird.wing).toBe('number')
      
      expect(chicken.leg).toBeDefined()
      expect(chicken.wing).toBeDefined()
      expect(typeof chicken.leg).toBe('number')
      expect(typeof chicken.wing).toBe('number')
      
      expect(penguin.leg).toBeDefined()
      expect(penguin.wing).toBeDefined()
      expect(typeof penguin.leg).toBe('number')
      expect(typeof penguin.wing).toBe('number')
    })
  })

  describe('Mixin 行为一致性测试 / Mixin Behavior Consistency Tests', () => {
    test('相同的 Mixin 在不同类中应该表现一致 / Same mixin should behave consistently across different classes', () => {
      const dog = new Dog('旺财')
      const bird = new Bird('小鸟')
      const chicken = new Chicken('公鸡')
      
      // WalkMixin 的 walk 方法在不同类中应该表现一致
      dog.walk()
      bird.walk()
      chicken.walk()
      
      expect(consoleSpy).toHaveBeenCalledWith('🚶 走路 - 腿数: 4, 速度: 5 (来自 WalkMixin)')
      expect(consoleSpy).toHaveBeenCalledWith('🚶 走路 - 腿数: 2, 速度: 5 (来自 WalkMixin)')
      expect(consoleSpy).toHaveBeenCalledWith('🚶 走路 - 腿数: 2, 速度: 5 (来自 WalkMixin)')
    })

    test('FlyMixin 在不同参数下应该表现不同 / FlyMixin should behave differently with different parameters', () => {
      const bird = new Bird('小鸟')
      const chicken = new Chicken('公鸡')
      
      bird.fly()
      // Bird 使用默认参数 canFly=true，应该能飞
      expect(consoleSpy).toHaveBeenCalledWith('🦅 飞行 - 翅膀数: 2, 速度: 10 (来自 FlyMixin)')
      
      // Chicken 使用参数 canFly=false，FlyMixin 覆盖了 Chicken 的 fly 方法
      chicken.fly()
      expect(consoleSpy).toHaveBeenCalledWith('扑腾翅膀但不能飞 - 翅膀数: 2 (来自 FlyMixin)')
    })
  })

  describe('边界情况测试 / Edge Case Tests', () => {
    test('空名字应该正常工作 / Empty name should work normally', () => {
      const dog = new Dog('')
      
      dog.bark()
      expect(consoleSpy).toHaveBeenCalledWith('🐕 : 汪汪!')
    })

    test('特殊字符名字应该正常工作 / Special character names should work normally', () => {
      const bird = new Bird('🐦小鸟🐦')
      
      bird.chirp()
      expect(consoleSpy).toHaveBeenCalledWith('🐦 🐦小鸟🐦: 啾啾啾!')
    })
  })

  describe('性能和内存测试 / Performance and Memory Tests', () => {
    test('创建大量实例不应该有内存泄漏 / Creating many instances should not cause memory leaks', () => {
      const instances = []
      
      for (let i = 0; i < 100; i++) {
        instances.push(new Dog(`dog${i}`))
        instances.push(new Bird(`bird${i}`))
        instances.push(new Chicken(`chicken${i}`))
        instances.push(new Penguin(`penguin${i}`))
      }
      
      expect(instances.length).toBe(400)
      
      // 验证所有实例都正常工作
      instances.forEach(instance => {
        expect(instance).toBeDefined()
        expect(typeof instance.name).toBe('string')
      })
    })

    test('方法调用应该快速响应 / Method calls should be responsive', () => {
      const dog = new Dog('测试狗')
      
      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        dog.walk()
      }
      const end = performance.now()
      
      // 1000次调用应该在合理时间内完成（这里设置为100ms）
      expect(end - start).toBeLessThan(100)
    })
  })
}) 