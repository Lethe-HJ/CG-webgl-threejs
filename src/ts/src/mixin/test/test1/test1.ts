import { mixinWith, BaseMixin } from '../../mixin';

// ===== 接口定义 / Interface Definitions =====
interface Legs { 
    leg: number; 
}

interface Wings { 
    wing: number; 
}

// ===== Mixin 类定义 / Mixin Class Definitions =====

// 走路 Mixin / Walking Mixin
class WalkMixin extends BaseMixin<Legs>() {
    walkSpeed = 5;

    walk(speed = this.walkSpeed) {
        console.log(`🚶 走路 - 腿数: ${this.leg}, 速度: ${speed} (来自 WalkMixin)`);
    }

    slowWalk(speed = this.walkSpeed) {
        console.log(`🐌 慢走`);
        this.walk(speed);
    }

    fastWalk(speed = this.walkSpeed * 2) {
        console.log(`🏃 快走`);
        this.walk(speed);
    }

    run(speed = this.walkSpeed * 3) {
        console.log(`🏃‍♂️ 跑步 - 腿数: ${this.leg}, 速度: ${speed} (来自 WalkMixin)`);
    }
}

// 飞行 Mixin / Flying Mixin
class FlyMixin extends BaseMixin<Wings>() {
    flySpeed = 10;
    canFly = true;

    constructor(canFly = true) {
        super();
        this.canFly = canFly;
    }

    fly(speed = this.flySpeed) {
        if (this.canFly) {
            console.log(`🦅 飞行 - 翅膀数: ${this.wing}, 速度: ${speed} (来自 FlyMixin)`);
        } else {
            console.log(`扑腾翅膀但不能飞 - 翅膀数: ${this.wing} (来自 FlyMixin)`);
        }
    }

    glide() {
        console.log(`🪂 滑翔 - 翅膀数: ${this.wing} (来自 FlyMixin)`);
    }

    soar() {
        console.log(`🦆 翱翔 - 翅膀数: ${this.wing} (来自 FlyMixin)`);
    }
}

// ===== 动物类定义 / Animal Class Definitions =====

// 1. 只有走路能力的狗
@mixinWith(WalkMixin)
export class Dog implements Legs {
    leg = 4;
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    bark() { 
        console.log(`🐕 ${this.name}: 汪汪!`); 
    }
}
export interface Dog extends WalkMixin {}

// 2. 既能走又能飞的鸟
@mixinWith(WalkMixin, FlyMixin)
export class Bird implements Legs, Wings {
    leg = 2;
    wing = 2;
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    chirp() { 
        console.log(`🐦 ${this.name}: 啾啾啾!`); 
    }
}
export interface Bird extends WalkMixin, FlyMixin {}

// 3. 有翅膀但不能飞的鸡 (使用参数化 Mixin)
@mixinWith(WalkMixin, [FlyMixin, false])
export class Chicken implements Legs, Wings {
    leg = 2;
    wing = 2;
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    cluck() { 
        console.log(`🐔 ${this.name}: 咯咯咯!`); 
    }

    fly() {
        console.log(`🐔 ${this.name}: 鸡不会飞，只能扑腾翅膀! (来自 Chicken 类)`);
    }
}
export interface Chicken extends WalkMixin, FlyMixin {}

// 4. 企鹅 - 有翅膀但用来游泳
@mixinWith(WalkMixin, [FlyMixin, false])
export class Penguin implements Legs, Wings {
    leg = 2;
    wing = 2;
    name: string;

    constructor(name: string) {
        this.name = name;
    }

    waddle() {
        console.log(`🐧 ${this.name}: 摇摆走路!`);
    }

    // 重写 fly 方法 - 企鹅用翅膀游泳
    fly() {
        console.log(`🐧 ${this.name}: 用翅膀游泳! (来自 Penguin 类)`);
    }

    // 重写 walk 方法 - 企鹅走路很特别
    walk() {
        console.log(`🐧 ${this.name}: 摇摆着走路，腿数: ${this.leg} (来自 Penguin 类)`);
    }
}
export interface Penguin extends WalkMixin, FlyMixin {}