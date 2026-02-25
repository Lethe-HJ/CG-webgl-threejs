fn reverse_array(arr: &mut [i32]) {
    // 你的代码
    return arr;
}

fn main() {
    // 测试用例
    let mut arr = [1, 2, 3, 4, 5];
    reverse_array(&mut arr);
    assert_eq!(arr, [5, 4, 3, 2, 1]);
}
