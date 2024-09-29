// cargo 1.80.1

use std::fmt::Debug;
use std::fmt::Display;

#[derive(Debug)]
struct Stack<T> {
    name: String,
    size: usize,
    value: Vec<T>,
}

impl<T> Stack<T> 
where T:  Debug + Display + Clone,
{
    fn new(name: String, size: usize) -> Self {
        let stack = Stack {
            name,
            size,
            value: Vec::with_capacity(size),
        };
        println!("新建Stack {:?}", stack.name);
        return stack;
    }

    fn push(&mut self, item: T) -> bool {
        if self.value.len() < self.size {
            self.value.push(item.clone());
            println!("元素 {:?} 已压入栈", item);
            return true;
        } else {
            println!("栈已满，无法添加元素 {:?}", item);
            return false;
        }
    }

    fn pop(&mut self) -> Option<T> {
        let item = self.value.pop();
        if let Some(ref val) = item {
            println!("元素 {:?} 已从栈中弹出", val);
        } else {
            println!("栈为空");
        }
        return item;
    }
}

fn main() {
    let mut stack = Stack::new(String::from("MyStack"), 3);
    stack.push(1);
    stack.push(2);
    stack.push(3);
    stack.push(4); // 将提示栈已满

    stack.pop();
    stack.pop();
    stack.pop();
    stack.pop(); // 将提示栈为空
}
