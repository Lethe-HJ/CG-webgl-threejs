# Code Summary: `src/views/visual/layers/common/index.ts`

> 基于 `common/index.ts` 提炼的通用技术要点与可迁移经验，侧重思路与实现模式，不涉及业务细节。

---

## 1. 不常见或易忽略的语法与用法

### 1.1 TypeScript 函数重载：用「参数个数 + 类型」区分语义

文件中 `getAlias` 通过**多组重载签名 + 单一实现**，用**参数个数**区分多种调用形态（spots 6 参数、跨 ROI 7 参数、multi image 4 参数、normal image 4 参数）。实现签名用「宽泛联合类型 + 可选参数」收口，在函数体内用 `undefined` 与具体值做分支。

要点：

- 重载只影响**类型推断与校验**，不改变运行时行为；运行时只有实现签名那一份逻辑。
- 实现签名必须兼容所有重载签名（参数可多不可少、类型要覆盖），且对调用方不可见（调用方只看重载签名）。
- 用注释明确「识别特征」（如「参数长度为 6/7/4」），便于后续加新重载或改分支时保持一致性。

### 1.2 类型断言 `as Alias` 与「名义字符串」约定

多处使用 `` `${sid}__${...}__${...}` as Alias ``，把拼接出的普通 `string` 断言为 `Alias`。`Alias` 在类型层面是多种模板字面类型的联合（如 `SpotsAlias | ImageAlias | ...`），用于在类型上区分「图层别名」与普通字符串。

要点：

- 断言不改变运行时值，只影响类型；若拼接规则与类型定义不一致，容易在运行时出现「类型是 Alias 但格式不对」的数据。
- 适合作为「构造 + 类型约束」的集中点：构造在 `getAlias` 内完成，调用方拿到的就是 `Alias`，避免在业务里到处 `as Alias`。

### 1.3 用「分隔符 + 段数 + 段位置」统一解析多种别名

所有别名统一用 `__` 分隔，通过 `parts.length` 和 `parts[n]` 区分种类（如 6/7 为 spots，4 为 image）。这种「一种格式、多种语义」的设计在需要兼容多种别名形态时很常见。

要点：

- 解析逻辑集中在「先 `split('__')`，再按长度/下标判断」，避免到处手写正则或重复解析。
- 段数、段含义要在类型或注释里写清楚，否则新增一种别名时容易漏改解析或类型。

---

## 2. 值得借鉴的思路与设计模式

### 2.1 谓词函数分层：内部用 `parts`，对外只暴露 `alias`

`isSpots`、`isCell`、`isBin` 等对外接收 `alias: Alias` 并 `split` 一次；内部再抽出 `_isSpots(parts)`、`_isImage(parts)`，供多个 `isXxx` 复用，避免同一 alias 被多次 `split`。

可迁移点：

- 凡是以「同一字符串、多种判断」的解析逻辑，都可以先拆成「string → parts」和「parts → boolean」两层，前者只做一次，后者可组合。
- 带下划线前缀的 `_isXxx(parts)` 明确表示「内部实现、不直接导出」，减少误用。

### 2.2 复合谓词由原子谓词组合

如 `isBinHeatMap(alias) => isBin(alias) && isHeatMap(alias)`，以及 `isBinHeatMapSpatial`、`isCellClusterUmap` 等，都是「原子谓词 + 与」的组合。这样：

- 原子谓词（isBin、isHeatMap、isSpatial 等）只写一次，复合语义通过组合表达，易读也易改。
- 若将来别名格式变化，只需改原子谓词，复合谓词自动跟随。

### 2.3 重载的「识别特征」文档化

每个重载前都有注释写清「识别特征：参数长度为 4/6/7」或「multi image / normal image」。这样在改实现时能快速对应「哪段分支对应哪组重载」，减少漏分支或错顺序。

可迁移点：

- 多分支、多形态的函数，用简短注释标出「如何区分」，比只靠参数名更稳，尤其参数类型是联合类型时。

### 2.4 单一出口的 getter：`getSid(alias)`

从 alias 中取 sid 只通过 `getSid(alias)`，统一用 `parts[0]`。这样「alias 的哪一段是 sid」的约定只在一处维护，别处都用 `getSid`，避免散落 `alias.split('__')[0]`。

---

## 3. 容易踩坑的地方

### 3.1 重载实现中的分支顺序

实现里先判断「7 个参数」（跨 ROI），再「6 个参数」（spots），再「multi image」（param3 === AliasSuffix.multiColor && param5 === undefined），再「param6 === undefined」的 image 分支。若把「image」分支提前或合并到「multi」之前，multi 形态可能被误判为 normal image（因为 multi 也是 4 段且 param5 为 undefined）。

教训：**用可选参数和联合类型区分多种形态时，分支顺序必须与「更特殊 → 更一般」一致**，并在注释里写明识别条件，避免以后调顺序或加条件时破坏已有形态。

### 3.2 类型与实现对「段数」的约定是否一致

例如 `MultiColorImageAlias` 在类型里可能是 3 段（sid__binsize__suffix），而实现里 multi image 的 getAlias 返回 4 段（含 sliceId）。若类型定义和实际拼接不一致，会出现「类型上不是 MultiColorImageAlias，但运行时格式是 4 段」或反之。建议：**类型中的模板字面类型段数、顺序要与 getAlias 各分支的拼接结果一致**，必要时用类型测试或单测校验「getAlias(...) 的返回值满足对应 Alias 子类型」。

### 3.3 isMultiImage 与 isMultiSubImage 的重复与歧义

`isMultiImage` 与 `isMultiSubImage` 当前实现相同（都是 `parts.length === 4` 且 `suffix === AliasSuffix.multiColor`）。若业务上「MultiColorSubImageAlias」是 5 段（多一段 GeneID/GeneName），则 5 段的 subImage 用「parts.length !== 4」会被判为 false，与类型或业务含义不符。建议：**明确 multi 与 multiSub 在段数/格式上的区别，并在 isXxx 中按段数或最后一段含义区分**，避免两个谓词等价或漏判。

### 3.4 新增重载或新别名形态时的检查清单

- 在类型中补充新的 Alias 子类型（若有新格式）。
- 在 `getAlias` 中增加对应重载签名与实现分支，并注意分支顺序。
- 若新形态是「某种 spots 或 image」，补充或复用 `_isSpots`/`_isImage` 及原子谓词，再组合出需要的 `isXxx`。
- 更新「识别特征」类注释，便于后续维护。

---

## 4. 小结

| 维度         | 要点摘要                                                                 |
|--------------|----------------------------------------------------------------------------|
| 语法/用法    | 重载用参数个数与类型区分语义；`as Alias` 集中构造；统一用 `__` + 段数解析。 |
| 设计模式     | 谓词分层（alias→parts→bool）、复合谓词组合、重载识别特征文档化、getSid 单一出口。 |
| 易踩坑       | 实现分支顺序敏感、类型段数与实现一致、multi vs multiSub 的段数区分、新形态的检查清单。 |

以上内容可直接迁移到「多形态字符串标识符的构造与解析」「类型安全别名/ID 设计」等场景，用于提升类型利用率和可维护性。
