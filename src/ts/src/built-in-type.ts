// 1. Record
type Record<K extends keyof any, T> = {
    [P in K]: T;
};

// 使用示例
type User1 = {
    id: number;
    name: string;
    email: string;
};

type UserRecord = Record<keyof User1, string>;


// 2. Pick
type Pick<T, K extends keyof T> = {
    [P in K]: T[P];
};

// 使用示例
type User2 = {
    id: number;
    name: string;
    email: string;
};

type UserName = Pick<User2, 'name'>;



// 3. Omit
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

// 使用示例
type UserWithoutEmail = Omit<User2, 'email'>;



// 4. Exclude
type Exclude<T, U> = T extends U ? never : T;

// 使用示例
type UserKeys = keyof User2;
type UserWithoutEmail2 = Exclude<UserKeys, 'email'>;

type User3 = {
    name: string;
    age: number;
    id: number;
    email: string;
};

type User3SelfFields = Exclude<keyof User3, 'email' | 'id'>;

type User3Self = Pick<User3, User3SelfFields>;



// 5. Extract
type Extract<T, U> = T extends U ? T : never;

type AllTypes = string | number | boolean | Function | object;

// 提取函数类型
type FunctionTypes = Extract<AllTypes, Function | object>;



// 6. NonNullable
type NonNullable<T> = T extends null | undefined ? never : T;

type User4 = {
    name: string;
    age: number;
    id: number;
    email?: string;
};

type User4Self = NonNullable<User4>;
