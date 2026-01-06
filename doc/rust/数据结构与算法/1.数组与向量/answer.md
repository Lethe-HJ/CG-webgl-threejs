# 数组与向量 - 练习题答案与解析

## 基础题答案

### 练习 1：数组求和

```rust
fn sum_array(arr: &[i32]) -> i32 {
    arr.iter().sum()
}

// 或者使用循环
fn sum_array_loop(arr: &[i32]) -> i32 {
    let mut sum = 0;
    for &num in arr {
        sum += num;
    }
    sum
}
```

**解析：**
- 使用 `iter().sum()` 是最简洁的方式
- 注意使用 `&num` 来解引用，或者使用 `for num in arr.iter()` 然后 `sum += num`
- 时间复杂度：O(n)，空间复杂度：O(1)

---

### 练习 2：查找最大值

```rust
fn find_max(arr: &[i32]) -> Option<&i32> {
    arr.iter().max()
}

// 或者手动实现
fn find_max_manual(arr: &[i32]) -> Option<&i32> {
    if arr.is_empty() {
        return None;
    }
    let mut max = &arr[0];
    for num in arr.iter() {
        if num > max {
            max = num;
        }
    }
    Some(max)
}
```

**解析：**
- `iter().max()` 返回 `Option<&T>`，因为数组可能为空
- 手动实现时要注意处理空数组的情况
- 时间复杂度：O(n)，空间复杂度：O(1)

---

### 练习 3：数组反转

```rust
fn reverse_array(arr: &mut [i32]) {
    let len = arr.len();
    for i in 0..len / 2 {
        arr.swap(i, len - 1 - i);
    }
}

// 或者使用 reverse 方法
fn reverse_array_builtin(arr: &mut [i32]) {
    arr.reverse();
}
```

**解析：**
- 使用双指针从两端向中间交换
- 只需要遍历一半的长度
- 可以使用 `swap` 方法或直接使用 `reverse`
- 时间复杂度：O(n)，空间复杂度：O(1)

---

### 练习 4：查找元素

```rust
fn find_index(arr: &[i32], target: i32) -> Option<usize> {
    arr.iter().position(|&x| x == target)
}

// 或者手动实现
fn find_index_manual(arr: &[i32], target: i32) -> Option<usize> {
    for (index, &value) in arr.iter().enumerate() {
        if value == target {
            return Some(index);
        }
    }
    None
}
```

**解析：**
- `position` 方法返回第一个匹配的索引
- 手动实现使用 `enumerate` 同时获取索引和值
- 时间复杂度：O(n)，空间复杂度：O(1)

---

### 练习 5：移除重复元素

```rust
use std::collections::HashSet;

fn remove_duplicates(vec: Vec<i32>) -> Vec<i32> {
    let mut seen = HashSet::new();
    let mut result = Vec::new();
    
    for num in vec {
        if seen.insert(num) {
            result.push(num);
        }
    }
    
    result
}

// 如果输入已排序，可以使用更高效的方法
fn remove_duplicates_sorted(mut vec: Vec<i32>) -> Vec<i32> {
    vec.dedup();
    vec
}
```

**解析：**
- 使用 `HashSet` 来跟踪已见过的元素
- `HashSet::insert` 返回 `bool`，表示是否成功插入（即是否是新元素）
- 如果输入已排序，可以使用 `dedup` 方法，时间复杂度 O(n)
- 时间复杂度：O(n)，空间复杂度：O(n)

---

## 中等题答案

### 练习 6：合并两个有序数组

```rust
fn merge_sorted(arr1: &[i32], arr2: &[i32]) -> Vec<i32> {
    let mut result = Vec::with_capacity(arr1.len() + arr2.len());
    let mut i = 0;
    let mut j = 0;
    
    while i < arr1.len() && j < arr2.len() {
        if arr1[i] <= arr2[j] {
            result.push(arr1[i]);
            i += 1;
        } else {
            result.push(arr2[j]);
            j += 1;
        }
    }
    
    // 添加剩余元素
    result.extend_from_slice(&arr1[i..]);
    result.extend_from_slice(&arr2[j..]);
    
    result
}
```

**解析：**
- 使用双指针技术，分别指向两个数组的当前位置
- 比较两个指针指向的元素，将较小的加入结果
- 最后将剩余元素添加到结果中
- 时间复杂度：O(n + m)，空间复杂度：O(n + m)

---

### 练习 7：数组旋转

```rust
fn rotate_array(arr: &mut [i32], k: usize) {
    let len = arr.len();
    if len == 0 {
        return;
    }
    let k = k % len;  // 处理 k 大于数组长度的情况
    
    // 方法1：三次反转
    arr[..len - k].reverse();
    arr[len - k..].reverse();
    arr.reverse();
}

// 方法2：使用额外空间
fn rotate_array_extra_space(arr: &mut [i32], k: usize) {
    let len = arr.len();
    if len == 0 {
        return;
    }
    let k = k % len;
    let mut temp = arr[len - k..].to_vec();
    temp.extend_from_slice(&arr[..len - k]);
    arr.copy_from_slice(&temp);
}
```

**解析：**
- 方法1（三次反转）：最优雅，空间复杂度 O(1)
  - 反转前 `len - k` 个元素
  - 反转后 `k` 个元素
  - 反转整个数组
- 方法2：使用额外空间，更直观但需要 O(n) 空间
- 注意处理 `k` 大于数组长度的情况
- 时间复杂度：O(n)，空间复杂度：O(1) 或 O(n)

---

### 练习 8：移动零

```rust
fn move_zeros(vec: &mut Vec<i32>) {
    let mut write_pos = 0;
    
    // 将所有非零元素移到前面
    for i in 0..vec.len() {
        if vec[i] != 0 {
            vec.swap(write_pos, i);
            write_pos += 1;
        }
    }
}

// 或者使用 retain 和 extend
fn move_zeros_alternative(vec: &mut Vec<i32>) {
    let zeros_count = vec.iter().filter(|&&x| x == 0).count();
    vec.retain(|&x| x != 0);
    vec.extend(vec![0; zeros_count]);
}
```

**解析：**
- 使用双指针技术：一个指针遍历数组，一个指针指向下一个非零元素应该放置的位置
- 当遇到非零元素时，交换到前面
- 时间复杂度：O(n)，空间复杂度：O(1)

---

### 练习 9：两数之和

```rust
use std::collections::HashMap;

fn two_sum(nums: &[i32], target: i32) -> Option<(usize, usize)> {
    let mut map = HashMap::new();
    
    for (i, &num) in nums.iter().enumerate() {
        let complement = target - num;
        if let Some(&j) = map.get(&complement) {
            return Some((j, i));
        }
        map.insert(num, i);
    }
    
    None
}
```

**解析：**
- 使用哈希表存储已访问的元素及其索引
- 对于每个元素，检查 `target - num` 是否在哈希表中
- 如果在，返回两个索引；如果不在，将当前元素加入哈希表
- 时间复杂度：O(n)，空间复杂度：O(n)

---

### 练习 10：子数组最大和（Kadane 算法）

```rust
fn max_subarray_sum(arr: &[i32]) -> i32 {
    if arr.is_empty() {
        return 0;
    }
    
    let mut max_ending_here = arr[0];
    let mut max_so_far = arr[0];
    
    for &num in arr.iter().skip(1) {
        max_ending_here = num.max(max_ending_here + num);
        max_so_far = max_so_far.max(max_ending_here);
    }
    
    max_so_far
}
```

**解析：**
- **Kadane 算法**：动态规划思想
- `max_ending_here`：以当前元素结尾的最大子数组和
- `max_so_far`：全局最大子数组和
- 对于每个元素，要么加入前面的子数组，要么重新开始
- 时间复杂度：O(n)，空间复杂度：O(1)

---

## 进阶题答案

### 练习 11：实现简单的动态数组

```rust
struct MyVec<T> {
    data: Vec<T>,
}

impl<T> MyVec<T> {
    fn new() -> Self {
        MyVec {
            data: Vec::new(),
        }
    }
    
    fn push(&mut self, value: T) {
        self.data.push(value);
    }
    
    fn pop(&mut self) -> Option<T> {
        self.data.pop()
    }
    
    fn get(&self, index: usize) -> Option<&T> {
        self.data.get(index)
    }
    
    fn len(&self) -> usize {
        self.data.len()
    }
    
    fn capacity(&self) -> usize {
        self.data.capacity()
    }
}

// 更完整的实现（手动管理内存）
use std::alloc::{alloc, dealloc, Layout};
use std::ptr;

struct MyVecRaw<T> {
    ptr: *mut T,
    len: usize,
    cap: usize,
}

impl<T> MyVecRaw<T> {
    fn new() -> Self {
        MyVecRaw {
            ptr: ptr::null_mut(),
            len: 0,
            cap: 0,
        }
    }
    
    fn push(&mut self, value: T) {
        if self.len >= self.cap {
            self.grow();
        }
        
        unsafe {
            ptr::write(self.ptr.add(self.len), value);
        }
        self.len += 1;
    }
    
    fn grow(&mut self) {
        let new_cap = if self.cap == 0 { 1 } else { self.cap * 2 };
        let new_layout = Layout::array::<T>(new_cap).unwrap();
        
        let new_ptr = if self.cap == 0 {
            unsafe { alloc(new_layout) as *mut T }
        } else {
            let old_layout = Layout::array::<T>(self.cap).unwrap();
            unsafe {
                let new_ptr = alloc(new_layout) as *mut T;
                ptr::copy_nonoverlapping(self.ptr, new_ptr, self.len);
                dealloc(self.ptr as *mut u8, old_layout);
                new_ptr
            }
        };
        
        self.ptr = new_ptr;
        self.cap = new_cap;
    }
    
    fn pop(&mut self) -> Option<T> {
        if self.len == 0 {
            return None;
        }
        
        self.len -= 1;
        unsafe {
            Some(ptr::read(self.ptr.add(self.len)))
        }
    }
    
    fn get(&self, index: usize) -> Option<&T> {
        if index >= self.len {
            return None;
        }
        unsafe {
            Some(&*self.ptr.add(index))
        }
    }
    
    fn len(&self) -> usize {
        self.len
    }
    
    fn capacity(&self) -> usize {
        self.cap
    }
}

impl<T> Drop for MyVecRaw<T> {
    fn drop(&mut self) {
        if self.cap != 0 {
            for i in 0..self.len {
                unsafe {
                    ptr::drop_in_place(self.ptr.add(i));
                }
            }
            let layout = Layout::array::<T>(self.cap).unwrap();
            unsafe {
                dealloc(self.ptr as *mut u8, layout);
            }
        }
    }
}
```

**解析：**
- 第一个实现使用 `Vec` 作为底层存储，简单但失去了学习意义
- 第二个实现手动管理内存，更接近 `Vec` 的真实实现
- 需要处理内存分配、扩容、释放等
- 注意使用 `unsafe` 代码块，因为涉及原始指针操作
- 实现 `Drop` trait 确保内存正确释放

---

### 练习 12：数组的滑动窗口最大值

```rust
use std::collections::VecDeque;

fn max_sliding_window(nums: &[i32], k: usize) -> Vec<i32> {
    if nums.is_empty() || k == 0 {
        return Vec::new();
    }
    
    let mut result = Vec::new();
    let mut deque = VecDeque::new();
    
    // 初始化第一个窗口
    for i in 0..k {
        while let Some(&back) = deque.back() {
            if nums[back] <= nums[i] {
                deque.pop_back();
            } else {
                break;
            }
        }
        deque.push_back(i);
    }
    result.push(nums[deque[0]]);
    
    // 滑动窗口
    for i in k..nums.len() {
        // 移除窗口外的元素
        if let Some(&front) = deque.front() {
            if front <= i - k {
                deque.pop_front();
            }
        }
        
        // 移除小于当前元素的元素
        while let Some(&back) = deque.back() {
            if nums[back] <= nums[i] {
                deque.pop_back();
            } else {
                break;
            }
        }
        
        deque.push_back(i);
        result.push(nums[deque[0]]);
    }
    
    result
}
```

**解析：**
- 使用**双端队列（deque）**维护窗口内可能成为最大值的元素索引
- 队列中存储索引，按对应的值从大到小排列
- 当新元素进入窗口时，移除所有小于它的元素
- 当窗口移动时，移除窗口外的元素
- 时间复杂度：O(n)，空间复杂度：O(k)

---

### 练习 13：三数之和

```rust
fn three_sum(mut nums: Vec<i32>) -> Vec<Vec<i32>> {
    nums.sort();
    let mut result = Vec::new();
    let n = nums.len();
    
    for i in 0..n {
        // 跳过重复元素
        if i > 0 && nums[i] == nums[i - 1] {
            continue;
        }
        
        let mut left = i + 1;
        let mut right = n - 1;
        
        while left < right {
            let sum = nums[i] + nums[left] + nums[right];
            
            if sum == 0 {
                result.push(vec![nums[i], nums[left], nums[right]]);
                
                // 跳过重复元素
                while left < right && nums[left] == nums[left + 1] {
                    left += 1;
                }
                while left < right && nums[right] == nums[right - 1] {
                    right -= 1;
                }
                
                left += 1;
                right -= 1;
            } else if sum < 0 {
                left += 1;
            } else {
                right -= 1;
            }
        }
    }
    
    result
}
```

**解析：**
- 先排序，然后使用双指针技术
- 固定第一个数，用双指针找另外两个数
- 注意跳过重复元素以避免重复结果
- 时间复杂度：O(n²)，空间复杂度：O(1)（不考虑结果存储）

---

### 练习 14：合并区间

```rust
fn merge_intervals(mut intervals: Vec<(i32, i32)>) -> Vec<(i32, i32)> {
    if intervals.is_empty() {
        return Vec::new();
    }
    
    // 按起始位置排序
    intervals.sort_by_key(|&(start, _)| start);
    
    let mut result = Vec::new();
    let mut current = intervals[0];
    
    for interval in intervals.into_iter().skip(1) {
        if current.1 >= interval.0 {
            // 重叠，合并
            current.1 = current.1.max(interval.1);
        } else {
            // 不重叠，保存当前区间，开始新区间
            result.push(current);
            current = interval;
        }
    }
    
    result.push(current);
    result
}
```

**解析：**
- 先按起始位置排序
- 遍历区间，如果当前区间与下一个区间重叠，合并它们
- 重叠条件：`current.end >= next.start`
- 时间复杂度：O(n log n)（排序），空间复杂度：O(1)

---

### 练习 15：数组中的第 K 大元素

```rust
// 方法1：排序（简单但效率较低）
fn find_kth_largest_sort(mut nums: Vec<i32>, k: usize) -> i32 {
    nums.sort();
    nums[nums.len() - k]
}

// 方法2：快速选择算法（更高效）
fn find_kth_largest(mut nums: Vec<i32>, k: usize) -> i32 {
    let k = k - 1; // 转换为索引
    let mut left = 0;
    let mut right = nums.len() - 1;
    
    while left <= right {
        let pivot_index = partition(&mut nums, left, right);
        
        if pivot_index == k {
            return nums[pivot_index];
        } else if pivot_index < k {
            left = pivot_index + 1;
        } else {
            right = pivot_index - 1;
        }
    }
    
    nums[k]
}

fn partition(nums: &mut [i32], left: usize, right: usize) -> usize {
    let pivot = nums[right];
    let mut i = left;
    
    for j in left..right {
        if nums[j] > pivot {
            nums.swap(i, j);
            i += 1;
        }
    }
    
    nums.swap(i, right);
    i
}
```

**解析：**
- 方法1：排序后直接取第 k 大，时间复杂度 O(n log n)
- 方法2：**快速选择算法**，类似快速排序的分区思想
- 平均时间复杂度：O(n)，最坏情况：O(n²)
- 可以进一步优化为 O(n) 的确定性算法（使用中位数的中位数）

---

## 挑战题答案

### 练习 16：实现一个通用的栈

```rust
struct Stack<T> {
    data: Vec<T>,
}

impl<T> Stack<T> {
    fn new() -> Self {
        Stack {
            data: Vec::new(),
        }
    }
    
    fn push(&mut self, value: T) {
        self.data.push(value);
    }
    
    fn pop(&mut self) -> Option<T> {
        self.data.pop()
    }
    
    fn peek(&self) -> Option<&T> {
        self.data.last()
    }
    
    fn peek_mut(&mut self) -> Option<&mut T> {
        self.data.last_mut()
    }
    
    fn is_empty(&self) -> bool {
        self.data.is_empty()
    }
    
    fn len(&self) -> usize {
        self.data.len()
    }
}
```

**解析：**
- 使用 `Vec` 作为底层存储，`push` 和 `pop` 都在末尾操作
- `peek` 返回栈顶元素的引用
- 时间复杂度：所有操作都是 O(1)

---

### 练习 17：螺旋矩阵

```rust
fn spiral_order(matrix: Vec<Vec<i32>>) -> Vec<i32> {
    if matrix.is_empty() || matrix[0].is_empty() {
        return Vec::new();
    }
    
    let mut result = Vec::new();
    let mut top = 0;
    let mut bottom = matrix.len() - 1;
    let mut left = 0;
    let mut right = matrix[0].len() - 1;
    
    while top <= bottom && left <= right {
        // 从左到右
        for j in left..=right {
            result.push(matrix[top][j]);
        }
        top += 1;
        
        // 从上到下
        for i in top..=bottom {
            result.push(matrix[i][right]);
        }
        if right == 0 { break; } // 防止 usize 下溢
        right -= 1;
        
        // 从右到左
        if top <= bottom {
            for j in (left..=right).rev() {
                result.push(matrix[bottom][j]);
            }
            bottom -= 1;
        }
        
        // 从下到上
        if left <= right {
            for i in (top..=bottom).rev() {
                result.push(matrix[i][left]);
            }
            left += 1;
        }
    }
    
    result
}
```

**解析：**
- 使用四个边界变量控制遍历范围
- 按照右、下、左、上的顺序遍历
- 注意处理边界情况，特别是防止 `usize` 下溢
- 时间复杂度：O(m × n)，空间复杂度：O(1)

---

### 练习 18：接雨水

```rust
fn trap_rain_water(height: Vec<i32>) -> i32 {
    if height.is_empty() {
        return 0;
    }
    
    let n = height.len();
    let mut left_max = vec![0; n];
    let mut right_max = vec![0; n];
    
    // 计算每个位置左边的最大高度
    left_max[0] = height[0];
    for i in 1..n {
        left_max[i] = left_max[i - 1].max(height[i]);
    }
    
    // 计算每个位置右边的最大高度
    right_max[n - 1] = height[n - 1];
    for i in (0..n - 1).rev() {
        right_max[i] = right_max[i + 1].max(height[i]);
    }
    
    // 计算每个位置能接的雨水
    let mut water = 0;
    for i in 0..n {
        water += (left_max[i].min(right_max[i]) - height[i]).max(0);
    }
    
    water
}

// 方法2：双指针（空间优化）
fn trap_rain_water_optimized(height: Vec<i32>) -> i32 {
    if height.is_empty() {
        return 0;
    }
    
    let mut left = 0;
    let mut right = height.len() - 1;
    let mut left_max = 0;
    let mut right_max = 0;
    let mut water = 0;
    
    while left < right {
        if height[left] < height[right] {
            if height[left] >= left_max {
                left_max = height[left];
            } else {
                water += left_max - height[left];
            }
            left += 1;
        } else {
            if height[right] >= right_max {
                right_max = height[right];
            } else {
                water += right_max - height[right];
            }
            right -= 1;
        }
    }
    
    water
}
```

**解析：**
- 方法1：对于每个位置，能接的雨水 = min(左边最大高度, 右边最大高度) - 当前高度
- 需要预处理每个位置的左右最大高度
- 方法2：使用双指针，空间复杂度优化到 O(1)
- 时间复杂度：O(n)，空间复杂度：O(n) 或 O(1)

---

## 总结

这些练习题涵盖了：
1. **基础操作**：求和、查找、反转等
2. **算法技巧**：双指针、滑动窗口、动态规划等
3. **数据结构实现**：动态数组、栈等
4. **复杂问题**：三数之和、接雨水等经典算法题

建议：
- 先理解算法思路，再写代码
- 注意边界情况和错误处理
- 考虑时间复杂度和空间复杂度
- 多写测试用例验证正确性

Happy coding! 🎉

