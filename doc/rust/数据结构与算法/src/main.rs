fn sum_array(arr: &[i32]) -> i32 {
    // return sum_array1(arr);
    return sum_array2(arr);
}

fn sum_array1(arr: &[i32]) -> i32 {
    let mut sum = 0;
    // 普通for循环写法 更加灵活 可以写更加复杂的逻辑控制
    for i in arr { // 迭代出来的是切片对应元素的引用
        // 这里使用 for i in arr.iter() 也是一样的
        sum += i; // rust中 += 会自动解引用 所以不需要 *i
    }
    return sum; // sum 是 i32，实现了 Copy，返回时发生copy 而不是move
}

fn sum_array2(arr: &[i32]) -> i32 {
    return arr.iter().sum(); // 这种函数式写法 更加简便已读 编译器优化后与 for in 性能相当
}

fn find_max(arr: &[i32]) -> Option<&i32> {
    // return find_max1(arr);
    return find_max2(arr);
}

fn find_max1(arr: &[i32]) -> Option<&i32> {
    if arr.len() == 0 {
        return None;
    }
    let mut max = &arr[0]; // arr表示切片的引用 arr[0]表示切片的第一个元素的值 &arr[0]表示切片的第一个元素的引用
    for i in arr {
        if *i > *max { // *表示取引用指向位置的值
            max = i;
        }
    }
    return Some(max);
}

fn find_max2(arr: &[i32]) -> Option<&i32> {
    return arr.iter().max();
}



fn main() {
    assert_eq!(sum_array(&[1, 2, 3, 4, 5]), 15);
    assert_eq!(sum_array(&[]), 0);

    assert_eq!(find_max(&[1, 5, 3, 9, 2]), Some(&9));
    assert_eq!(find_max(&[]), None);
}
