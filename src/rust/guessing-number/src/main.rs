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
