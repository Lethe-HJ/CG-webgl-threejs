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