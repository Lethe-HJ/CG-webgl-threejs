# 数组与向量 (Array & Vector) 学习笔记

## 目录
1. [数组 (Array)](#数组-array)
2. [向量 (Vec)](#向量-vec)
3. [切片 (Slice)](#切片-slice)
4. [动态数组的扩容机制](#动态数组的扩容机制)
5. [所有权与借用](#所有权与借用)
6. [性能考虑](#性能考虑)

---

## 数组 (Array)

### 基本概念

数组是 Rust 中最基础的数据结构之一，它是一个固定大小的、相同类型元素的集合。

### 声明和初始化

```rust
// 声明一个数组，类型为 [i32; 5]，表示包含 5 个 i32 元素的数组
let arr: [i32; 5] = [1, 2, 3, 4, 5];

// 类型推断
let arr = [1, 2, 3, 4, 5];

// 初始化所有元素为相同值
let arr = [0; 10];  // 包含 10 个 0 的数组

// 数组的大小必须在编译时确定
const SIZE: usize = 5;
let arr = [0; SIZE];  // 可以使用 const 值
```

### 数组的特点

1. **固定大小**：数组的大小在编译时确定，运行时不能改变
2. **栈分配**：数组存储在栈上（对于小数组）或静态内存中
3. **类型安全**：所有元素必须是同一类型
4. **零成本抽象**：数组操作通常编译为高效的机器码

### 访问数组元素

```rust
let arr = [1, 2, 3, 4, 5];

// 通过索引访问（从 0 开始）
let first = arr[0];   // 1
let second = arr[1];  // 2

// 使用 get 方法（返回 Option）
match arr.get(10) {
    Some(value) => println!("值: {}", value),
    None => println!("索引越界"),
}
```

### 数组的遍历

```rust
let arr = [1, 2, 3, 4, 5];

// 使用 for 循环遍历值
for element in arr.iter() {
    println!("{}", element);
}

// 使用 for 循环遍历索引和值
for (index, value) in arr.iter().enumerate() {
    println!("索引 {}: 值 {}", index, value);
}

// 使用索引遍历
for i in 0..arr.len() {
    println!("{}", arr[i]);
}
```

### 数组的方法

```rust
let arr = [1, 2, 3, 4, 5];

// 获取长度
let len = arr.len();

// 检查是否为空（对于数组，如果长度不为 0，总是返回 false）
let is_empty = arr.is_empty();

// 获取第一个和最后一个元素
let first = arr.first();  // Option<&T>
let last = arr.last();    // Option<&T>

// 切片（返回 &[T]）
let slice = &arr[1..4];  // [2, 3, 4]
```

---

## 向量 (Vec)

### 基本概念

向量（`Vec<T>`）是 Rust 标准库提供的动态数组，可以在运行时增长或缩小。

### 创建向量

```rust
// 使用 Vec::new() 创建空向量
let mut vec: Vec<i32> = Vec::new();

// 使用 vec! 宏创建并初始化
let vec = vec![1, 2, 3, 4, 5];

// 创建指定容量的向量（预分配空间）
let mut vec = Vec::with_capacity(10);

// 创建包含相同元素的向量
let vec = vec![0; 10];  // 10 个 0
```

### 向量的基本操作

#### 添加元素

```rust
let mut vec = Vec::new();

// push: 在末尾添加元素
vec.push(1);
vec.push(2);
vec.push(3);

// insert: 在指定位置插入元素
vec.insert(1, 10);  // 在索引 1 处插入 10

// extend: 从迭代器添加多个元素
vec.extend([4, 5, 6].iter().cloned());
```

#### 访问元素

```rust
let vec = vec![1, 2, 3, 4, 5];

// 通过索引访问（可能 panic）
let first = vec[0];

// 使用 get 方法（返回 Option）
match vec.get(10) {
    Some(value) => println!("值: {}", value),
    None => println!("索引越界"),
}

// 使用 first 和 last
let first = vec.first();  // Option<&T>
let last = vec.last();    // Option<&T>
```

#### 删除元素

```rust
let mut vec = vec![1, 2, 3, 4, 5];

// pop: 移除并返回最后一个元素
let last = vec.pop();  // Option<T>

// remove: 移除指定位置的元素
let removed = vec.remove(1);  // 移除索引 1 的元素

// clear: 清空向量
vec.clear();

// truncate: 截断到指定长度
vec.truncate(2);
```

### 向量的容量管理

```rust
let mut vec = Vec::new();

// capacity: 获取当前容量
println!("容量: {}", vec.capacity());

// reserve: 预留额外容量
vec.reserve(10);

// reserve_exact: 精确预留容量
vec.reserve_exact(10);

// shrink_to_fit: 缩小容量以匹配长度
vec.shrink_to_fit();
```

### 向量的遍历

```rust
let vec = vec![1, 2, 3, 4, 5];

// 遍历引用
for element in &vec {
    println!("{}", element);
}

// 遍历值（会移动所有权）
for element in vec {
    println!("{}", element);
}

// 遍历可变引用
let mut vec = vec![1, 2, 3, 4, 5];
for element in &mut vec {
    *element *= 2;
}

// 使用迭代器
vec.iter().for_each(|x| println!("{}", x));
vec.iter_mut().for_each(|x| *x *= 2);
vec.into_iter().for_each(|x| println!("{}", x));
```

### 向量的常用方法

```rust
let vec = vec![1, 2, 3, 4, 5];

// 长度和容量
let len = vec.len();
let capacity = vec.capacity();
let is_empty = vec.is_empty();

// 查找
let contains = vec.contains(&3);
let position = vec.iter().position(|&x| x == 3);

// 排序
let mut vec = vec![3, 1, 4, 1, 5];
vec.sort();                    // 升序排序
vec.sort_by(|a, b| b.cmp(a)); // 降序排序
vec.sort_by_key(|x| -x);      // 按键排序

// 反转
vec.reverse();
```

---

## 切片 (Slice)

### 基本概念

切片（`&[T]`）是对数组或向量一部分的引用，它是一个"视图"，不拥有数据。

### 创建切片

```rust
let arr = [1, 2, 3, 4, 5];
let vec = vec![1, 2, 3, 4, 5];

// 从数组创建切片
let slice: &[i32] = &arr[1..4];  // [2, 3, 4]

// 从向量创建切片
let slice: &[i32] = &vec[1..4];  // [2, 3, 4]

// 整个数组/向量的切片
let slice = &arr[..];   // 整个数组
let slice = &vec[..];   // 整个向量

// 从开头到某个位置
let slice = &arr[..3];  // [1, 2, 3]

// 从某个位置到结尾
let slice = &arr[2..];  // [3, 4, 5]
```

### 切片的操作

```rust
let arr = [1, 2, 3, 4, 5];
let slice = &arr[1..4];

// 获取长度
let len = slice.len();

// 检查是否为空
let is_empty = slice.is_empty();

// 获取第一个和最后一个元素
let first = slice.first();  // Option<&T>
let last = slice.last();    // Option<&T>

// 分割切片
let (left, right) = slice.split_at(1);

// 检查是否包含元素
let contains = slice.contains(&3);
```

### 可变切片

```rust
let mut arr = [1, 2, 3, 4, 5];
let mut vec = vec![1, 2, 3, 4, 5];

// 创建可变切片
let mut_slice = &mut arr[1..4];
let mut_slice = &mut vec[1..4];

// 通过可变切片修改元素
mut_slice[0] = 10;
```

### 切片的优势

1. **零成本抽象**：切片不拥有数据，只是引用
2. **灵活性**：可以对数组或向量的一部分进行操作
3. **函数参数**：函数可以接受 `&[T]` 来处理数组或向量

```rust
// 这个函数可以接受数组或向量的切片
fn print_slice(slice: &[i32]) {
    for element in slice {
        println!("{}", element);
    }
}

let arr = [1, 2, 3];
let vec = vec![4, 5, 6];

print_slice(&arr);  // 可以传入数组
print_slice(&vec);  // 可以传入向量
```

---

## 动态数组的扩容机制

### Vec 的内部结构

`Vec<T>` 在内存中的布局：
- **指针**：指向堆上分配的内存
- **长度**：当前元素数量
- **容量**：已分配的内存可以容纳的元素数量

```rust
// Vec 的内部结构（简化）
struct Vec<T> {
    ptr: *mut T,      // 指向数据的指针
    len: usize,       // 当前长度
    cap: usize,       // 容量
}
```

### 扩容策略

当向 `Vec` 添加元素且容量不足时，Rust 会：

1. **分配新内存**：分配一个更大的内存块（通常是当前容量的 2 倍）
2. **复制元素**：将现有元素复制到新内存
3. **释放旧内存**：释放原来的内存块

```rust
let mut vec = Vec::new();
println!("初始容量: {}", vec.capacity());  // 通常是 0

vec.push(1);
println!("添加 1 个元素后容量: {}", vec.capacity());  // 可能是 4

// 继续添加元素，当容量不足时会自动扩容
for i in 2..10 {
    vec.push(i);
    println!("长度: {}, 容量: {}", vec.len(), vec.capacity());
}
```

### 容量增长模式

Rust 的 `Vec` 使用**指数增长**策略：
- 初始容量通常为 0 或 4
- 每次扩容时，新容量通常是旧容量的 2 倍
- 这保证了 `push` 操作的**摊还时间复杂度为 O(1)**

### 性能优化建议

```rust
// 1. 如果知道大概大小，使用 with_capacity 预分配
let mut vec = Vec::with_capacity(1000);
for i in 0..1000 {
    vec.push(i);  // 不会触发多次扩容
}

// 2. 使用 reserve 预留空间
let mut vec = Vec::new();
vec.reserve(1000);  // 预留 1000 个元素的空间

// 3. 使用 shrink_to_fit 释放多余容量
let mut vec = Vec::with_capacity(1000);
vec.push(1);
vec.push(2);
vec.shrink_to_fit();  // 缩小容量到实际需要的大小
```

---

## 所有权与借用

### 数组的所有权

```rust
let arr = [1, 2, 3, 4, 5];

// 移动所有权
let arr2 = arr;  // arr 的所有权被移动到 arr2
// println!("{:?}", arr);  // 错误！arr 不再有效

// 借用
let arr = [1, 2, 3, 4, 5];
let slice = &arr;  // 借用，arr 仍然有效
println!("{:?}", arr);  // 可以继续使用
```

### 向量的所有权

```rust
let vec = vec![1, 2, 3, 4, 5];

// 移动所有权
let vec2 = vec;  // vec 的所有权被移动
// println!("{:?}", vec);  // 错误！

// 借用
let vec = vec![1, 2, 3, 4, 5];
let slice = &vec;  // 借用
println!("{:?}", vec);  // 可以继续使用

// 可变借用
let mut vec = vec![1, 2, 3, 4, 5];
let mut_slice = &mut vec;
mut_slice.push(6);
```

### 借用规则

1. **不可变借用可以有多个**
2. **可变借用只能有一个**
3. **不可变借用和可变借用不能同时存在**

```rust
let mut vec = vec![1, 2, 3];

let slice1 = &vec;      // 不可变借用 1
let slice2 = &vec;      // 不可变借用 2（可以）
// vec.push(4);         // 错误！不能在有不可变借用时进行可变操作

let mut_slice = &mut vec;  // 可变借用
// let slice = &vec;       // 错误！不能同时有可变和不可变借用
mut_slice.push(4);
```

---

## 性能考虑

### 时间复杂度

| 操作 | 数组 | 向量 |
|------|------|------|
| 访问元素 | O(1) | O(1) |
| 在末尾添加 | N/A | O(1) 摊还 |
| 在中间插入 | N/A | O(n) |
| 删除元素 | N/A | O(n) |
| 查找元素 | O(n) | O(n) |

### 空间复杂度

- **数组**：固定大小，栈分配（小数组）或静态内存
- **向量**：动态大小，堆分配，有额外容量开销

### 选择建议

**使用数组当：**
- 大小在编译时已知
- 大小固定不变
- 需要栈分配（性能考虑）

**使用向量当：**
- 大小在运行时确定
- 需要动态增长或缩小
- 需要堆分配

### 实际示例

```rust
// 示例：统计数组中每个元素的出现次数
use std::collections::HashMap;

fn count_frequency(arr: &[i32]) -> HashMap<i32, usize> {
    let mut counts = HashMap::new();
    for &num in arr {
        *counts.entry(num).or_insert(0) += 1;
    }
    counts
}

let arr = [1, 2, 2, 3, 3, 3];
let counts = count_frequency(&arr);
println!("{:?}", counts);  // {1: 1, 2: 2, 3: 3}
```

---

## 总结

1. **数组**：固定大小，编译时确定，适合固定大小的数据
2. **向量**：动态大小，运行时可变，适合需要动态调整的数据
3. **切片**：对数组或向量一部分的引用，提供灵活的视图
4. **所有权**：理解 Rust 的所有权系统对于正确使用这些数据结构至关重要
5. **性能**：根据使用场景选择合适的数据结构

## 下一步

- 实现一个简单的动态数组
- 练习使用数组、向量和切片解决实际问题
- 理解所有权和借用在这些数据结构中的应用

