
interface的可选属性

```ts
interface User {
  userName: string;
  userAge: number;
  userMarried: boolean;
  userJob?: string;
}

const user: User = {
  userName: 'test',
  userAge: 20,
  userMarried: false,
};
```


枚举的函数计算成员

```ts
function generate() {
  return Math.random() * 10000;
}

enum UserLevelCode {
  Visitor = 10001,
  NonVIPUser = 10002,
  VIPUser,
  Admin,
  Mixed = 'Mixed',
  Random = generate(),
  // ...
}
```


函数类型的声明

```ts
type Sum = (a: number, b: number) => number;

const sum: Sum = function(a, b) {
  return a + b;
};
```

```ts
function handler1(): void {}; // √
function handler2(): undefined {}; // X
```


函数(伪)重载

```ts
function sum(base: number, incre: number): number;
function sum(baseArray: number[], incre: number): number[];
function sum(incre: number, baseArray: number[]): number[];
function sum(baseArray: number[], increArray: number[]): number[];
function sum(x: number | number[], y: number | number[]): number | number[] { }
```


方法中的重载

```ts
class Person {
  feedPet(catFood: CatFood): void;
  feedPet(dogFood: DogFood): void;
  feedPet(rabbitFood: RabbitFood): void;
  feedPet(food: CatFood | DogFood | RabbitFood): void {}
}

```

字面量联合类型
```ts
type Status = 'success' | 'failure';
type Code = 200 | 404 | 502;
```

接口联合类型
```ts
interface VisitorUser {}
interface CommonUser {}
interface VIPUser {}
interface AdminUser {}

type User = VisitorUser | CommonUser | VIPUser | AdminUser;

const user: User = {
  // ...任意实现一个组成的对象类型
}
```

交叉类型


```ts

interface UserBasicInfo {}
interface UserJobInfo {}
interface UserFamilyInfo {}

type UserInfo = UserBasicInfo & UserJobInfo & UserFamilyInfo;
```
