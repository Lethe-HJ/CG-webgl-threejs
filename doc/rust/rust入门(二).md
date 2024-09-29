# 24. Trait

简单声明和调用

```rust
pub trait Summary {
    fn summarize(&self) -> String;
}

pub struct NewsArticle {
    pub headline: String,
    pub location: String,
    pub author: String,
    pub content: String,
}

impl Summary for NewsArticle {
    fn summarize(&self) -> String {
        format!("{}, by {} ({})", self.headline, self.author, self.location);
    }
}


// 调用时
use Demo::NewsArticle;
use Demo::Summary;

let article = NewsArticle {
    headline: String::from("aobama say hello"),
    location: String::from("USA"),
    author: String::from("aobama"),
    content: String::from("aobama say hello hello"),
};

println!("article summary {}", article.summarize());
```

默认实现

```rust
pub trait Summary {
    fn summarize_author(&self) -> String;

    fn summarize(&self) -> String { // 可以给默认实现
        String::from("Read more ...")
    }
}

impl Summary for NewsArticle {
    fn summarize_author(&self) -> String {
        format!("@{}", self.author)
    }
}

// summarize方法已经可以使用了
```

将Trait作为参数

```rust
pub fn notify(item: impl Summary) -> String {
    println!("Breaking news! {}", item.summarize());
}
```


```rust
pub fn notify<T: Summary>(item: T) -> String {
    println!("Breaking news! {}", item.summarize());
}

```

指定多个Trait

```rust
use std::fmt::Display;

pub fn notify(item: impl Summary + Display) -> String { // 
    println!("Breaking news! {}", item.summarize());
}
```

```rust
pub fn notify<T: Summary + Display>(item: T) -> String {
    println!("Breaking news! {}", item.summarize());
}
```


使用where子句

```rust
pub fn notify<T, U>(item1: T, item2: U) -> String
where
    T: Summary + Display,
    U: Clone + Debug,
{
    println!("Breaking news! {}", item1.summarize());
}

```


使用Trait作为返回类型


```rust
pub fn notify(s: &str) -> impl Summary {
    NewsArticle {
        headline: String::from("aobama say hello"),
        location: String::from("USA"),
        author: String::from("aobama"),
        content: String::from("aobama say hello hello"),
    }
}
```

为实现了特定Trait的类型来实现方法

```rust
use std::fmt::Display;

struct Pair<T> {
    x: T,
    y: T,
}

impl<T> Pair<T> {
    fn new(x: T, y: T) -> Self {
        Self {x, y}
    }
} 


impl <T: Display + PartialOrd> Pair<T> {
    fn cmd_display(&self) {
        if self.x >= self.y {
            println!("The largest member is x = {}", self.x);
        }
    }
}
```

# 25. 生命周期

```rust
let string1 = String::from("abcd");
let string2 = "xyz";

let result = longest(string1.as_str(), string2);
// result的生命周期是参数里面最短的那个


fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

```

生命周期的省略规则

1. 每个引用类型的参数都有自己的生命周期
2. 如果只有一个输入生命周期参数, 那么该生命周期将会被赋给所有的输出生命周期参数
3. 如果有多个生命周期参数, 但其中一个是`&self`或`&mut self`(方法), 那么self的生命周期会被赋给所有的输出生命周期参数

静态生命周期 `'static`在程序整个生命周期中都存活


# 26. 测试

`cargo test`

```rust
mod tests {
    #[test]
    fn exploration() {
        assert_eq!(2 + 2, 4);
    }

    #[test]
    fn another() {
        panic!("Make this test fail");
    }
}
```

断言

```rust

#[derive(Debug)]

pub struct Rectangle {
    length: u32,
    width: u32,
}

impl Rectangle {
    pub fn can_hold(&self, other: &Rectangle) -> bool {
        self.length > other.length && self.width > other.width
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn large_can_hold_smaller() {
        let larger = Rectangle {
            length: 8,
            width: 7,
        };
        let smaller = Rectangle {
            length: 5,
            width: 1,
        };
        assert!(larger.can_hold(&smaller), "'{}' can not hold, '{}'", larger, smaller );
    }
}

```

`assert_eq!`断言相等
`assert_ne!`断言不等
`should_panic`断言错误

```rust
mod tests {
    use super::*;
    #[test]
    #[should_panic(expected = "Guess value must be less than or equal tp 100")]
    fn greater_than_100() {
        Guess::new(200);
    }
}

```

使用Result来作为测试的结果

```rust
mod tests {
    #[test]
    fn it_workes() -> Result<(), String> {
        if 2 + 2 == 4 {
            return Ok(());
        } else {
            return Err(String::from("two plus two does not equal four"));
        }
    }
}

```

运行测试时默认会使用多个线程来并行运行测试, 所以需要确保测试之间满足以下条件:
1. 不会相互依赖
2. 不依赖于某个共享状态(环境、工作目录、环境变量等)


`cargo test --test-threads=1` 单线程启动测试

测试通过时 不会打印`println!`打印的内容
`cargo test -- --show-output` 测试通过时 也会打印`println!`打印的内容

`cargo test 测试函数名`按测试的名称来运行测试
`cargo test 测试函数名的一部分`按测试的名称的一部分来运行测试
`cargo test 测试模块名`按测试的模块名称来运行测试
`cargo test --test 文件名`运行某个测试文件内的所有测试

```rust

#[test]
#[ignore]
// test fn 
```

`cargo test -- --ignored` 运行被忽略的测试


单元测试
1. 小、专注
2. 一次对一个模块进行隔离的测试
3. 可测试private接口
4. 目的: 验证被测试的每个独立的小部分是否能正确的工作

由于单元测试的代码不在`tests`目录下 所以需要对测试模块标注`#[cfg(test)]` 告诉rust 仅在执行`cargo test`时编译

集成测试
1. 在库外部. 和其他外部代码一样使用你的代码
2. 只能使用public接口
3. 可能在每个测试中使用到多个模块
4. 目的: 验证被测试库的多个部分在一起是否能正确的工作
   
集成测试一般放在`tests`目录下, 所以不需要进行额外的标注 rust会自动在仅执行`cargo test`时才编译

`tests`目录下的子目录不会被视为集成测试模块, 所以用于测试的公共函数应该被放在子目录下

# 27. 闭包

闭包是可以捕获其所在环境的匿名函数

闭包:
1. 是匿名函数
2. 保存为变量、作为参数
3. 可在一个地方创建闭包, 然后再另一个上下文中调用闭包来完成运算
4. 可从其定义的作用域捕获值

```rust
fn generate_workout(random_number: u32) {
    let expensive_closure = |num| {
        println!("calculating slowly ...");
        num
    };
    if random_number == 3 {
        println!("haha");
    } else {
        println!("{}", expensive_closure(random_number));
    }
}

```

闭包不要求标注参数和返回值的类型
闭包的定义最终只会为参数/返回值推断出唯一具体的类型

```rust
fn main(){
    let example_closure = |num| {
        println!("calculation slowly ...");
        thread::sleep(Duration::from_secs(2));
        num
    };
    let s = example_closure(String::from("hello")); // 闭包已经被推断为String类型
    let n = example_closure(5); // 报错
}
```

## fn Trait

Fn
FnMut
FnOnce


```rust

struct Cacher<T>
where
    T: Fn(u32) -> u32,
{
    calculation: T,
    value: Option<u32>,
}

impl<T> Cacher<T>
where
    T: Fn(u32) -> u32,
{
    fn new(calculation: T) -> Cacher<T> {
        Cacher {
            calculation,
            value: None,
        }
    }

    fn value(&mut self, arg: u32) -> u32 {
        match self.value {
            Some(v) => v,
            None => {
                let v = (self.calculation)(arg);
                self.value = Some(v);
                v
            }
        }
    }
}


let mut expensive_closure = Cacher::new(|num| {
    println!("calculation slowly ...");
    thread::sleep(Duration::from_secs(2));
    num
})

let s = example_closure.value(5);
```


闭包捕获所在作用域中的变量, 而普通函数不能

```rust
fn main() {
    let x = 4;
    let equal_to_x = |z| z === x;
    fn equal_to_x_fn(z: i32) -> bool {
        z === x // 报错
    }
}
```

捕获值的方式 rust会自动推断
1. 取得所有权FnOnce
2. 可变借用: FnMut
3. 不可变借用: Fn



```rust
fn main(){
    let x = vec![1, 2, 3];
    let equal_to_x = move |z| z == x;
    println!('{}', x); // 报错 x已经被移动到了闭包中
}

```