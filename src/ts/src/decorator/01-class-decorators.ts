/**
 * 示例 1：类装饰器的两种用法
 * 对应文档《通用装饰器封装》第 1 节 —— 类装饰器的标准形式
 *
 * - 只打标记、不替换类（不返回值）
 * - 返回新构造函数，包装/替换原类
 */

/** 仅打标记：记录被装饰的类名，不替换类 */
function SimpleDecorator(target: Function) {
  console.log("[SimpleDecorator] 装饰的类:", target.name);
}

/** 包装类：返回新的构造函数，在实例化时打印日志 */
function WrapDecorator<T extends new (...args: any[]) => object>(target: T) {
  return class extends target {
    constructor(...args: any[]) {
      super(...args);
      console.log("[WrapDecorator] 实例已创建:", target.name);
    }
  };
}

// ---------------------------------------------------------------------------
// 使用示例
// ---------------------------------------------------------------------------

@SimpleDecorator
class A {
  name = "A";
}

@WrapDecorator
class B {
  name = "B";
}

// 运行效果：
// 加载时即打印: [SimpleDecorator] 装饰的类: A
const a = new A();
console.log("a.name:", a.name);

const b = new B();
// 打印: [WrapDecorator] 实例已创建: B
console.log("b.name:", b.name);
