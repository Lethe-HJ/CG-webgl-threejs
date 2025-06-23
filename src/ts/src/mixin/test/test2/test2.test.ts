import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { Frog, EnhancedService, Transformer, SuperService } from './test2'

describe('高级 Mixin 装饰器系统测试 / Advanced Mixin Decorator System Tests', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('多个简单 Mixin 组合测试 / Multiple Simple Mixin Combination Tests', () => {
    test('Frog 类应该同时拥有游泳和跳跃功能 / Frog should have both swimming and jumping abilities', () => {
      const frog = new Frog('Green Tree Frog')
      
      // 基本属性测试
      expect(frog.species).toBe('Green Tree Frog')
      
      // 应该有所有方法
      expect(typeof frog.croak).toBe('function')
      expect(typeof frog.swim).toBe('function')
      expect(typeof frog.dive).toBe('function')
      expect(typeof frog.jump).toBe('function')
      expect(typeof frog.bounce).toBe('function')
      
      // 应该有 Mixin 的属性
      expect(frog.swimSpeed).toBe(3)
      expect(frog.jumpHeight).toBe(2)
    })

    test('Frog 的方法调用应该正常工作 / Frog methods should work correctly', () => {
      const frog = new Frog('Green Tree Frog')
      
      frog.croak()
      expect(consoleSpy).toHaveBeenCalledWith('Green Tree Frog: Ribbit!')
      
      frog.swim()
      expect(consoleSpy).toHaveBeenCalledWith('Swimming at speed 3')
      
      frog.jump()
      expect(consoleSpy).toHaveBeenCalledWith('Jumping 2 meters high!')
      
      frog.dive()
      expect(consoleSpy).toHaveBeenCalledWith('Diving underwater!')
      
      frog.bounce()
      expect(consoleSpy).toHaveBeenCalledWith('Bouncing around!')
    })
  })

  describe('带参数的多个 Mixin 测试 / Multiple Parameterized Mixin Tests', () => {
    test('EnhancedService 应该正确组合参数化和非参数化 Mixin / EnhancedService should correctly combine parameterized and non-parameterized Mixins', () => {
      const service = new EnhancedService('DataProcessor')
      
      // 基本属性测试
      expect(service.name).toBe('DataProcessor')
      
      // 应该有所有方法
      expect(typeof service.start).toBe('function')
      expect(typeof service.log).toBe('function')
      expect(typeof service.debug).toBe('function')
      expect(typeof service.now).toBe('function')
      expect(typeof service.timestamp).toBe('function')
      expect(typeof service.swim).toBe('function')
      
      // 应该有参数化 Mixin 的属性
      expect(service.prefix).toBe('SERVICE')
      expect(service.level).toBe(2)
      expect(service.timezone).toBe('Asia/Shanghai')
      expect(service.swimSpeed).toBe(3)
    })

    test('EnhancedService 的参数化方法应该正确工作 / EnhancedService parameterized methods should work correctly', () => {
      const service = new EnhancedService('DataProcessor')
      
      service.log('Test message')
      expect(consoleSpy).toHaveBeenCalledWith('[SERVICE] Test message')
      
      service.debug('Debug message')
      expect(consoleSpy).toHaveBeenCalledWith('[SERVICE:DEBUG] Debug message')
      
      // 测试 start 方法的组合调用
      consoleSpy.mockClear()
      service.start()
      
      expect(consoleSpy).toHaveBeenCalledWith('[SERVICE] DataProcessor service starting...')
      expect(consoleSpy).toHaveBeenCalledWith('Swimming at speed 3')
      // now() 方法会输出当前时间，我们只检查是否被调用
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Current time (Asia/Shanghai):'))
    })

    test('EnhancedService 的时间戳功能应该正常工作 / EnhancedService timestamp functionality should work', () => {
      const service = new EnhancedService('DataProcessor')
      
      const timestamp = service.timestamp()
      expect(typeof timestamp).toBe('number')
      expect(timestamp).toBeGreaterThan(0)
    })
  })

  describe('带类型约束的 Mixin 测试 / Type-Constrained Mixin Tests', () => {
    test('Transformer 应该实现 Animal 和 Vehicle 接口 / Transformer should implement Animal and Vehicle interfaces', () => {
      const optimus = new Transformer('Optimus Prime', 1000)
      
      // Animal 接口属性
      expect(optimus.name).toBe('Optimus Prime')
      expect(optimus.age).toBe(1000)
      expect(typeof optimus.name).toBe('string')
      expect(typeof optimus.age).toBe('number')
      
      // Vehicle 接口属性
      expect(optimus.speed).toBe(0)
      expect(optimus.fuel).toBe(100)
      expect(typeof optimus.speed).toBe('number')
      expect(typeof optimus.fuel).toBe('number')
      
      // 应该有所有方法
      expect(typeof optimus.transform).toBe('function')
      expect(typeof optimus.introduce).toBe('function')
      expect(typeof optimus.celebrate).toBe('function')
      expect(typeof optimus.accelerate).toBe('function')
      expect(typeof optimus.brake).toBe('function')
    })

    test('Transformer 的 Animal 行为应该正确工作 / Transformer Animal behaviors should work correctly', () => {
      const optimus = new Transformer('Optimus Prime', 1000)
      
      optimus.introduce()
      expect(consoleSpy).toHaveBeenCalledWith('Hello, I\'m Optimus Prime, 1000 years old')
      
      optimus.celebrate()
      expect(consoleSpy).toHaveBeenCalledWith('Optimus Prime is celebrating!')
    })

    test('Transformer 的 Vehicle 行为应该正确工作 / Transformer Vehicle behaviors should work correctly', () => {
      const optimus = new Transformer('Optimus Prime', 1000)
      
      // 初始状态
      expect(optimus.speed).toBe(0)
      expect(optimus.fuel).toBe(100)
      
      // 加速测试
      optimus.accelerate()
      expect(optimus.speed).toBe(10)
      expect(optimus.fuel).toBe(95)
      expect(consoleSpy).toHaveBeenCalledWith('Accelerating! Speed: 10, Fuel: 95')
      
      // 刹车测试
      optimus.brake()
      expect(optimus.speed).toBe(0) // Math.max(0, 10 - 15)
      expect(consoleSpy).toHaveBeenCalledWith('Braking! Speed: 0')
    })

    test('Transformer 燃料耗尽时应该正确处理 / Transformer should handle fuel depletion correctly', () => {
      const optimus = new Transformer('Optimus Prime', 1000)
      
      // 消耗所有燃料
      while (optimus.fuel > 0) {
        optimus.accelerate()
      }
      
      // 燃料耗尽后尝试加速
      consoleSpy.mockClear()
      optimus.accelerate()
      expect(consoleSpy).toHaveBeenCalledWith('Out of fuel!')
      expect(optimus.fuel).toBe(0)
    })

    test('Transformer 的自身方法应该正常工作 / Transformer own methods should work correctly', () => {
      const optimus = new Transformer('Optimus Prime', 1000)
      
      optimus.transform()
      expect(consoleSpy).toHaveBeenCalledWith('Optimus Prime is transforming!')
    })
  })

  describe('复杂多层 Mixin 组合测试 / Complex Multi-layered Mixin Combination Tests', () => {
    test('SuperService 应该实现所有接口和功能 / SuperService should implement all interfaces and functionalities', () => {
      const superService = new SuperService('super-service-001')
      
      // 基本属性
      expect(superService.id).toBe('super-service-001')
      expect(superService.config).toEqual({})
      
      // 应该有所有方法
      expect(typeof superService.initialize).toBe('function')
      expect(typeof superService.setCache).toBe('function')
      expect(typeof superService.getCache).toBe('function')
      expect(typeof superService.setConfig).toBe('function')
      expect(typeof superService.getConfig).toBe('function')
      expect(typeof superService.on).toBe('function')
      expect(typeof superService.emit).toBe('function')
      expect(typeof superService.log).toBe('function')
      expect(typeof superService.debug).toBe('function')
      
      // 应该有参数化属性
      expect(superService.prefix).toBe('SUPER')
      expect(superService.level).toBe(2)
    })

    test('SuperService 的缓存功能应该正确工作 / SuperService cache functionality should work correctly', () => {
      const superService = new SuperService('super-service-001')
      
      // 设置缓存
      superService.setCache('test-key', 'test-value')
      expect(consoleSpy).toHaveBeenCalledWith('Cached test-key for super-service-001')
      
      // 获取缓存
      consoleSpy.mockClear()
      const value = superService.getCache('test-key')
      expect(value).toBe('test-value')
      expect(consoleSpy).toHaveBeenCalledWith('Cache hit for test-key on super-service-001')
      
      // 获取不存在的缓存
      consoleSpy.mockClear()
      const nonExistent = superService.getCache('non-existent')
      expect(nonExistent).toBeUndefined()
      expect(consoleSpy).not.toHaveBeenCalled()
    })

    test('SuperService 的配置功能应该正确工作 / SuperService config functionality should work correctly', () => {
      const superService = new SuperService('super-service-001')
      
      // 设置配置
      superService.setConfig('timeout', 5000)
      expect(consoleSpy).toHaveBeenCalledWith('Config timeout set to 5000')
      expect(superService.config.timeout).toBe(5000)
      
      // 获取配置
      const timeout = superService.getConfig('timeout')
      expect(timeout).toBe(5000)
      
      // 获取不存在的配置
      const nonExistent = superService.getConfig('non-existent')
      expect(nonExistent).toBeUndefined()
    })

    test('SuperService 的事件功能应该正确工作 / SuperService event functionality should work correctly', () => {
      const superService = new SuperService('super-service-001')
      
      let eventData: any = null
      const callback = vi.fn((data: any) => { eventData = data })
      
      // 注册事件监听器
      superService.on('test-event', callback)
      
      // 触发事件
      superService.emit('test-event', 'test-data')
      
      expect(callback).toHaveBeenCalledWith('test-data')
      expect(eventData).toBe('test-data')
    })

    test('SuperService 的日志功能应该正确工作 / SuperService logging functionality should work correctly', () => {
      const superService = new SuperService('super-service-001')
      
      superService.log('Test log message')
      expect(consoleSpy).toHaveBeenCalledWith('[SUPER] Test log message')
      
      superService.debug('Test debug message')
      expect(consoleSpy).toHaveBeenCalledWith('[SUPER:DEBUG] Test debug message')
    })

    test('SuperService 的 initialize 方法应该组合所有功能 / SuperService initialize method should combine all functionalities', () => {
      const superService = new SuperService('super-service-001')
      
      let initEventData: any = null
      superService.on('initialized', (data: any) => { initEventData = data })
      
      consoleSpy.mockClear()
      superService.initialize()
      
      // 检查日志
      expect(consoleSpy).toHaveBeenCalledWith('[SUPER] Initializing SuperService...')
      
      // 检查配置
      expect(consoleSpy).toHaveBeenCalledWith('Config initialized set to true')
      expect(superService.getConfig('initialized')).toBe(true)
      
      // 检查缓存
      expect(consoleSpy).toHaveBeenCalledWith('Cached status for super-service-001')
      expect(superService.getCache('status')).toBe('ready')
      
      // 检查事件
      expect(initEventData).toBe('super-service-001')
    })
  })

  describe('缓存大小限制测试 / Cache Size Limit Tests', () => {
    test('CacheMixin 应该正确处理缓存大小限制 / CacheMixin should handle cache size limits correctly', () => {
      const superService = new SuperService('cache-test')
      
      // 添加超过限制的缓存项（限制为50）
      for (let i = 0; i < 55; i++) {
        superService.setCache(`key-${i}`, `value-${i}`)
      }
      
      // 早期的缓存项应该被清除
      expect(superService.getCache('key-0')).toBeUndefined()
      expect(superService.getCache('key-1')).toBeUndefined()
      expect(superService.getCache('key-2')).toBeUndefined()
      expect(superService.getCache('key-3')).toBeUndefined()
      expect(superService.getCache('key-4')).toBeUndefined()
      
      // 最新的缓存项应该存在
      expect(superService.getCache('key-54')).toBe('value-54')
      expect(superService.getCache('key-53')).toBe('value-53')
      expect(superService.getCache('key-52')).toBe('value-52')
    })
  })

  describe('多个事件监听器测试 / Multiple Event Listeners Tests', () => {
    test('EventMixin 应该支持多个监听器 / EventMixin should support multiple listeners', () => {
      const superService = new SuperService('event-test')
      
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()
      
      // 为同一事件注册多个监听器
      superService.on('multi-event', callback1)
      superService.on('multi-event', callback2)
      superService.on('multi-event', callback3)
      
      // 触发事件
      superService.emit('multi-event', 'test-data')
      
      // 所有监听器都应该被调用
      expect(callback1).toHaveBeenCalledWith('test-data')
      expect(callback2).toHaveBeenCalledWith('test-data')
      expect(callback3).toHaveBeenCalledWith('test-data')
    })
  })

  describe('类型安全性测试 / Type Safety Tests', () => {
    test('所有类都应该实现正确的接口 / All classes should implement correct interfaces', () => {
      const frog = new Frog('Test Frog')
      const service = new EnhancedService('Test Service')
      const transformer = new Transformer('Test Bot', 100)
      const superService = new SuperService('test-super')
      
      // Frog 的类型检查
      expect(typeof frog.species).toBe('string')
      expect(typeof frog.swimSpeed).toBe('number')
      expect(typeof frog.jumpHeight).toBe('number')
      
      // EnhancedService 的类型检查
      expect(typeof service.name).toBe('string')
      expect(typeof service.prefix).toBe('string')
      expect(typeof service.level).toBe('number')
      expect(typeof service.timezone).toBe('string')
      
      // Transformer 的类型检查
      expect(typeof transformer.name).toBe('string')
      expect(typeof transformer.age).toBe('number')
      expect(typeof transformer.speed).toBe('number')
      expect(typeof transformer.fuel).toBe('number')
      
      // SuperService 的类型检查
      expect(typeof superService.id).toBe('string')
      expect(typeof superService.config).toBe('object')
      expect(Array.isArray(superService.config)).toBe(false)
    })
  })

  describe('性能和内存测试 / Performance and Memory Tests', () => {
    test('创建大量复杂实例不应该有内存泄漏 / Creating many complex instances should not cause memory leaks', () => {
      const instances = []
      
      for (let i = 0; i < 50; i++) {
        instances.push(new Frog(`frog-${i}`))
        instances.push(new EnhancedService(`service-${i}`))
        instances.push(new Transformer(`transformer-${i}`, i))
        instances.push(new SuperService(`super-${i}`))
      }
      
      expect(instances.length).toBe(200)
      
      // 验证所有实例都正常工作
      instances.forEach((instance, index) => {
        expect(instance).toBeDefined()
        
        if (instance instanceof Frog) {
          expect(typeof instance.species).toBe('string')
        } else if (instance instanceof EnhancedService) {
          expect(typeof instance.name).toBe('string')
        } else if (instance instanceof Transformer) {
          expect(typeof instance.name).toBe('string')
        } else if (instance instanceof SuperService) {
          expect(typeof instance.id).toBe('string')
        }
      })
    })

    test('复杂方法调用应该快速响应 / Complex method calls should be responsive', () => {
      const superService = new SuperService('performance-test')
      
      const start = performance.now()
      for (let i = 0; i < 1000; i++) {
        superService.setCache(`key-${i}`, `value-${i}`)
        superService.setConfig(`config-${i}`, i)
        superService.log(`Log message ${i}`)
      }
      const end = performance.now()
      
      // 1000次复杂调用应该在合理时间内完成（这里设置为200ms）
      expect(end - start).toBeLessThan(200)
    })
  })
}) 