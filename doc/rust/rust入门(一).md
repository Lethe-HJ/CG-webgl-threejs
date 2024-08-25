

# 1. rust介绍

## 1.1 rust的优缺点

优点
1. 运行速度快
2. 内存安全
3. 无所畏惧的并发

缺点
1. 学习难度大


## 1.2 rust与不同的语言的对比

c/c++ 性能非常好 但是类型系统和内存都不太安全
java/c# 拥有GC 能保证内存安全，但是性能不行
rust 内存安全  无需GC 易于维护，调试，代码安全高效

## 1.3 擅长领域

高性能web service
webassembly
命令行工具
网络编程
嵌入式设备
系统编程

## 1.4 rust的应用案例

Google: 新操作系统Fuschia
Amazoon：基于Linux开发的直接可以在裸机和虚机上运行容器的操作系统
System76： 纯Rust开发的下一代安全操作系统Redox
蚂蚁金服： 库操作系统Occlum
微软： 正在使用rust重写window系统中的一些低级组件
Deno


# 2. rust的安装

[rust官网](https://www.rust-lang.org/)

[安装地址](https://www.rust-lang.org/tools/install)

## 其余命令

查看rust版本
`rustc --version`

建立文档
`rustup doc`
更新rust
`rustup update`
卸载rust
`rustup self uninstall`

# 3. rust相关vscode插件

rust-analyzer
Prettier - Code formatter (Rust)
TOML Language Support


# 4. hello world

```rust

fn main(){
    println!("hello world");
}

```

编译 `rustc main.rs` 生成二进制可执行文件 main.exe
在window系统上还会生成用于调试的.pdb文件

# 5. cargo

cargo 是rust的构建系统和包管理工具

查看cargo版本
`cargo --version`

创建项目
`cargo new hello`

检查代码
`cargo check`

编译项目
`cargo build`

运行项目
`cargo run`

发布代码(会进行代码优化)
`cargo build --release`

安装库
`cargo add rand@^0.3.14`

[rust的库](https://www.crates.io/crates)

crates的英文释义是：板条箱


crate.io 镜像
创建`~/.cargo/config`文件 内容如下

```
[source.crates-io]
registry = "https://github.com/rust-lang/crates.io-index"

replace-with = 'tuna'
[source.tuna]
registry = "https://mirrors.tuna.tsinghua.edu.cngit/crates.io-index.git"

[net]
git-fetch-with-cli = true

```

# 6. 示例1 猜测数字

```rust
use rand::Rng; // 随机库
use std::cmp::Ordering;
use std::io;

fn main() {
    println!("guessing number game");
    let secret_number = rand::thread_rng().gen_range(1, 101); // 随机生成1-100以内的随机数
    println!("secret number is {}", secret_number);

    loop {
        println!("guess a number");
        let mut guess = String::new(); // mut 声明变量为可变的

        io::stdin()
            .read_line(&mut guess) // 将读取到的输入数字传入到guess中
            .expect("can not read line"); // 报错时的处理

        // match 来匹配解析操作的结果
        let guess: u32 = match guess.trim().parse() {
            // 将输入的数字进行去首尾空格 然后解析成数字类型 具体类型为u32
            Ok(num) => num,     // 解析成功时的处理
            Err(_) => continue, // 解析失败时的处理
        };
        println!("the number you guess is {}", guess);
        match guess.cmp(&secret_number) {
            // 比较guess和secret_number
            Ordering::Less => println!("too small!"),
            Ordering::Greater => println!("too big"),
            Ordering::Equal => {
                println!("you win");
                break;
            }
        }
    }
}

```


# 7.  变量与可变性

## 7.1 变量

变量使用`let`声明
默认情况下 变量是不可变的(Immutable)
使用`let mut`来声明可变的变量

```rust
let a = 1;
a = 2; // error: cannot assgin twice to immutable variable 'x'

let mut b = 1;
b = 2; // b: 2
```


## 7.2 常量

常量在绑定之后不可变
常量用`const`声明
常量的命名规范: 用大写字母加下划线

```rust
const MAX_POINTS: u32 = 100_000;
```

## 7.3 隐藏(shadowing)

可以声明和之前的变量同名的变量 类型可以不一样 之前的变量后续都无法被访问了

```rust
let x = 1;
let x = x + 5;
println!("{}", x); // 6
```

# 8. 数据类型

rust有四种主要的标量类型
1. 整数类型
2. 浮点类型
3. 布尔类型
4. 字符类型

## 8.1 整数类型

| 有符号 | 无符号 | 位数         |
| :----- | :----- | :----------- |
| i8     | u8     | 8位          |
| i6     | u6     | 16位         |
| i32    | u32    | 32位         |
| i64    | u64    | 64位         |
| isize  | usize  | 系统最大位数 |

有符号范围 `-(2^n - 1)`到 `2^(n-1) - 1`
无符号范围 `0`到`2^n - 1`

| 整数的字面值    | 例子                            |
| :-------------- | :------------------------------ |
| 十进制(Decimal) | `98_222` 或者 `98222`           |
| 十六进制(Hex)   | `0xff`                          |
| 八进制(Octal)   | `0o77`                          |
| 二进制(Binary)  | `0b1111_0000` 或者 `0b11110000` |
| 字节(Byte)      | `b'A'`                          |

一个字节是4个二进制位 即4 bit
除了bytes类型外, 所有的数值字面值都允许使用类型后缀 比如 `57u8`
整数的默认类型就是 `i32`

## 8.2 浮点类型

`f32` 32位单精度
`f64` 64位双精度

默认的浮点类型是`f64`

## 8.3 布尔类型

布尔类型`bool` 占一个字节大小
布尔类型的值分为`true`和`false`

## 8.4 字符类型

字符类型`char`用来描述语言中的单个字符
字符类型占4字节大小
字符类型使用`unicode`标量值
`unicode`的表示范围为`U+0000`到`U+D7FF`和`U+E000`到`U+10FFFF`

## 8.5 复合类型

### 8.6 Tuple

Tuple中的每个元素不必是同一类型
Tuple的长度是固定的


```rust
let tup: (i32, f64, u8) = (500, 6.4, 1);
println!("{}, {}, {}", tup.0, tup.1, tup.2);

let (x, y, z) = tup; // 使用模式匹配来解构tuple的值
println!("{}, {}, {}", x, y, z);
```

### 8.7 数组

数组中的每个元素必须是同一类型
数组的长度是固定的
数组是在栈上分配的单个块的内存

```rust
let a = [3, 3, 3, 3, 3];
let b: [i32;5] = [1, 2, 3, 4, 5];
let c: [3;5]; // 相当于 let a = [3, 3, 3, 3, 3];
println!("{}", b[0]); // 1
```

# 9. 函数

函数的命名规范 `snake case` 小写字母加下划线分开 
函数签名中必须指明形参的类型

```rust

fn my_function(a: i32) -> i32{ // parameters 形参 
    let b = a + 1;
    if b > 3 {
        return b; // 提前返回需要用return
    }
    b + a // 函数中最后一个表达式的值会自动得作为函数的返回值
    // 作为返回时 表达式不能加分号 否则就变成语句而不是表达式了 就无法自动返回了
}

my_function(1); // arguments 实参
// 这个调用的返回结果是 3
```


# 10. 控制流

## 10.1 if

普通if else

```rust
let number = 3;
if number % 2 == 0 {
    println!("number is divisible by 2");
} else if number % 3 == 0 {
    println!("number is divisible by 3");
} else {
    println!("number is not divisible by 2 or 3");
}
```

if表达式

```rust
let a = 3;
let is_odd = if a % 2 == 1 { true } else { false };
println!("{}", is_odd);
```

### 10.2 loop

```rust
let mut count = 0;
let result = loop {
    count += 1;
    if count == 10 {
        break count * 2
    }
};
println!("{}", result); // 20

```


### 10.3 while

```rust
let mut time = 10;
while time != 0 {
    println!("{}!", time);
    time -= 1;
}
println!("countdown ends!");

```

### 10.4 for

```rust
let a = [10, 20, 30, 40];
for item in a.iter() {
    println!("{}", item);
}

```

```rust
for number in (1..11).rev() {
    println!("{}", number); // 10 9 ... 1
}
```

# 11. 所有权

规则:
1. 每个值都有一个变量, 这个变量是该值的所有者
2. 每个值同时只能有一个所有者
3. 当所有者超出作用域时, 该值将被删除

## 11.1 复制

标量类型直接复制

```rust
let x = 5;
let y = x;
println!("{} {}", x, y);// 5 5
```

## 11.2 移动(move)

引用类型会出现移动(move)

```rust
let s1 = String::from("hello");
let s2 = s1;
println!("{}", s2);// hello
println!("{}", s1);// borrow of moved value 's1';

// s1的值存放在heap中 s1的指针存放在stack中
// 当执行let s2 = s1;时 新建指针s2 指向s1的值 同时删除掉了 s1自身的指针 后续将无法访问s1
// 我们简单地称之为 s1移动到了s2中
```

## 11.3 克隆

克隆可以防止移动

```rust
let s1 = String::from("hello");
let s2 = s1.clone();
println!("{} {}", s1, s2);// hello
```

## 11.4 引用与借用

### 11.4.1 不可变引用

```rust
let s1 = String::from("hello");

fn calculate_length(s: &String) -> usize { // 使用引用传递给形参 就叫借用
    s.len()
}
println!("{}", calculate_length(&s1)); // 5
```

### 11.4.2 可变引用

```rust
// 可变引用
let mut s2 = s1.clone();
fn add_str(s: &mut String) -> usize {
    s.push_str(" world")
}
println!("{}", add_str(&mut s2)); // hello world
```

可变引用在同一个作用域下, 对同一块数据如果有一个可变引用, 那么不可以同时再有其他引用


# 12. 切片

## 12.1 字符串切片

```rust
let my_string = String::from("Hello world");
let world_index1 = first_world(&my_string[..]);

let my_string_literal = "hello world"; //字符串字面量本身就是切片
let world_index2 = first_world(my_string_literal);


fn first_world(s: &str) -> &str {
    let bytes = s.as_bytes;

    for(i, &item) in bytes.iter().enumerate() {
        if item == b' ' {
            return &s[..i];
        }
    }
    &s[..]
}
```

## 12.2 数组切片

```rust
let a = [1, 2, 3, 4, 5];
let slice = &a[1..3]; //[2, 3]
```

# 13. 结构体

## 13.1 声明

```rust
struct User {
    username: String,
    email: String,
};

let user1 = User {
    email: "haha@outlook.com",
    username: 'haha',
}

user1.email = "haha@mircrosoft.com";
```

一旦struct可变 则内部的字段都可变

## 13.2 简写

```rust
fn build_user(email: String, username: String) -> User {
    User {
        email,
        username,
    }
}
```

字段赋值可以简写

## 13.3 复用

```rust
let user2 = User {
    email: String::from("haha@qq.com"),
    ..user1
}
```

可以解出并复用其他strut

## 13.4 tuple struct

```rust
struct Color(i32, i32, i32);
let black = Color(0, 0, 0);
```

tuple struct更像tuple 可以用模式解构

## 13.5 方法

```rust
#[derive(Debug)] // 注解 为Rectangle添加格式化打印的triat
struct Rectangle {
    width: u32,
    length: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.length
    }
}

fn main(){
    let rect = Rectangle {
        width: 30,
        length: 50,
    };
    println!("{}", rect.area());
    printLn!("{:#?}", rect);
}


```

println中 `{}` 对应`std::fmt::Display`方法
`{:?}` 对应`std::fmt::Debug`方法
`{:#?}` 对应`std::fmt::Debug`方法 有格式化换行

结构体的方法 需要在与结构体同名的impl块中定义
一个结构体允许有多个impl块


## 13.6 关联函数

```rust
impl Rectangle {
    // ...

    fn squre(size: u32) -> Rectangle {
        Rectangle {
            width: size,
            length: size,
        }
    }
}

let s = Rectangle::squre(20);
```

# 14. 枚举

```rust
enum IpAddrKind {
    V4,
    V6,
}

let four = IpAddrKind::V4;

route(four);

fn route(ip_kin: IpAddrKind) {
    ip_kin
}
``

枚举类型中可以嵌入任何数据类型

```rust
enum IpAddrKind {
    V4(u8, u8, u8, u8),
    V6(String),
}

let home = IpAddrKind::V4(127, 0, 0, 1);
let loopback = IpAddrKind::V6(String::from("::1"));
```

为枚举定义方法

```rust
impl IpAddrKind {
    fn call(&self) {
        println!("{}.{}.{}.{}", self.0, self.1, self.2, self.3);
    }
}

let m = IpAddrKind::V4(127, 0, 0, 1);
m.call(); // 127.0.0.1
```

# 15. Option


```rust
let some_number = Some(5);
let some_string = Some("A String");
let absent_number: Option<i32> = None;

```

```rust
let x: i8 = 5;
let y: Option<i8> = Some(5);
let sum = x + y; // error

```

# 16. match

## 16.1 绑定值的模式匹配

```rust
#[derive(Debug)]
enum UsState {
    Alabama,
    Alaska,
}

enum Coin {
    Penny,
    Nickel,
    Dime,
    Quarter(UsState),
}

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => 1,
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {
            println!("State quarter from {:?}!", state);
            25
        },
    }
}

fn main() {
    let c = Coin::Quarter(UsState::Alaska);
    println!("{}", value_in_cents(c));
}
```

## 16.2 匹配Option

```rust
fn main(){
    let five = Some(5);
    let six = plus_one(five);
    let none = plus_one(None);
}

fn plus_one(x: Option<i32>) -> Option<32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),
    }
}
```

match 必须穷举所有情况

## 16.3 不需要处理的情况

```rust
fn main(){
    let v = 0u8;
    match v {
        1 => println!("one"),
        3 => println!("three"),
        5 => println!("five"),
        7 => println!("seven"),
        _ => (), // 其余情况什么都不发生
    }
}
```

# 16.4 if let

```rust
let v = 0u8;
if let Some(3) = v {
    println!("three");
}
// 与下面的代码等效
// match v {
//     Some(3) => println!("one"),
//     _ => (),
// }
```


```rust
let v = 0u8;
if let Some(3) = v {
    println!("three");
} else {
    println!("others");
}
// 与下面的代码等效
// match v {
//     Some(3) => println!("one"),
//     _ => println!("others"),
// }

```

# 17. 代码结构

Package 包
Crate 单元包 模块树
Module 模块
Path 路径

Crate的类型:
1. binary
2. library

Crate Root:
- 源代码文件
- 编译入口

Package:
- 包含一个`Cargo.toml`, 描述了构建这些Crates的方式
- 包含0-1个library crate
- 包含任意数量的`binary crate`
- 至少包含一个`crate`

惯例:
1. `src/main.rs`
   - 默认是`binary crate`的`crate root`
   - crate名与Package名相同
2. `src/lib.rs`
   - 默认是`library crate`的`crate root`
   - package包含一个`library crate`
   - crate名与Package名相同
3. `src/bin`
   - 文件夹下的文件是单独的`binary crate`

## 17.2 Module

### 17.2.1 mod和Path

```rust
mod front_of_house {
    pub mod hosting {
        fn add_to_waitlist() {} // 默认私有
        pub fn add_to_waitlist_pub() {
            println!("{}", front_of_house::hosting_private::add_to_waitlist()); // 相对路径访问
            // super::hosting_private::add_to_waitlist() // 使用super的相对路径访问
            // crate::front_of_house::hosting_private::add_to_waitlist(); // 绝对路径访问
        } // 公有
    }

    mod hosting_private {
        fn add_to_waitlist() {}
    }
}
```

子模块可以调用祖先模块中的条目


### 17.2.2 use

可以使用`use`来引入模块

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }
}

use create::front_of_house::hosting;
// pub use create::front_of_house::hosting; // 这样可以导出到外部

pub fn eat_at_restaurant() {
    hosting::add_to_waitlist();
}
```

use可以嵌套

```rust
// use std::cmp::Ordering;
// use std::io;

use std::{cmp::Ordering, io};
```

更加复杂的嵌套

```rust
// use std::io::Write;
// use std::io;
use std::io::{self, Write};
```

引入全部

```rust
use std::collections::*;
```

### 17.2.3 as

```rust
use std::fmt:Result;
use std::io::Result as IoResult;

fn f1() -> Result() {}
fn f2() -> IoResult() {}

```


### 17.2.4 将模块内容放到其他文件

```rust
// src/lib.rs
mod front_of_house;
```

```rust
// src/front_of_house.rs
pub mod hosting {}
```

# 18. Vector

## 18.1 新建 访问 Vector

```rust
// let v: Vec<i32> = Vec::new();
let v = vec![1, 2, 3, 4, 5];
let third:&i32 = &v[1]; // 假设越界则会报错
println!("{}", third);

match v.get(100) { // 使用get则可以处理越界的情况
    Some(third) => println!("{}", third),
    None => println!("index no exist"),
}
```

## 18.2 Vector的所有权

```rust

let mut v = rec![1, 2, 3, 4, 5];
let first = &v[0]; // 不可变借用
v.push(6); // 可变借用 报错 vector push时可能会发生数据迁移, 所以first引用可能访问不到正确的值了 所有权规则帮我们很好地提示我到了我们这个潜在的风险
println!("the first element is {}", first);
```

## 18.3 遍历 Vector

```rust
let v1 = rec![100, 32, 57];
for i in &v1 {
    println!("{}", i);
}

let mut v2 = rec![100, 32, 57];
for i in &mut v2 {
    *i += 50;
}

for i in &v2 {
    println!("{}", i);
}
```


### 18.4 enum vector

```rust

enum SpreadsheetCell {
    Int(i32),
    Float(f64),
    Text(String),
}

let row = vec![
    SpreadsheetCell::Int(3),
    SpreadsheetCell::Text(String::from("blue")),
    SpreadsheetCell::Float(10.12),
];
```

# 19. 字符串

## 19.1 新建字符串

```rust
let s1 = "hello".to_string();

let s2_raw = "hello";
let s2 = s2_raw.to_string();


let s3 = String::from("hello");
```

## 19.2 修改字符串

```rust
let mut s1 = String::from("hello");
s1.push_str(" world");
println!("{}", s1); // hello world


let mut s2 = String::from("hello");
let world = String::from(" world");
s2.push_str(&world);
println!("{}", s2); // hello world

let mut s3 = String::from("hell");
s3.push('l');
println!("{}", s3); // hello


let mut s4 = String::from("hello");
let mut s5 = String::from(" world");
let s6 = s4 + &s5;
println!("{}", s5); //  world
println!("{}", s6); // hello world
println!("{}", s4); // 报错

let s7 = "a";
let s8 = String::from("b");
let s9 = format!("{}-{}", s7, s8);
```

## 19.3 字符串的长度与切片

```rust
let hola = String::from("Hola").len();
println!("{}", hole.len()); // 4 4个Unicode标量值 注意 一个字符并不一定对应一个Unicode标量值

```

字节 `.bytes()`
标量值 `.chars()`
字形簇


```rust
let hello = "hello";
println!("{}", &hello[0..2]); // he
// 切片时 必须按照对于语言的字符边界切割 否则会报错
```

# 20. HashMap

