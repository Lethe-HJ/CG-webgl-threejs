import {
  WithFilter,
  WithSplit,
  BasicLayer,
  type FilterAble,
  type SplitAble,
} from "./mixin";

// 定义 ClusterLayer 接口，继承 FilterAble 和 SplitAble 接口
// 这个接口的扩展, 相当于给ClusterLayer类的类型添加了FilterAble和SplitAble的相关方法和属性
// 如果不使用这个方式来扩展 后续使用ClusterLayer类时访问FilterAble和SplitAble的相关方法和属性会类型报错
export interface ClusterLayer extends FilterAble, SplitAble {}

// 装饰器从下往上依次包裹：
// 1. WithSplit 先扩展 BasicLayer，使其具备分割能力
// 2. WithFilter 再进一步扩展，使最终类同时具备过滤能力
@WithFilter
@WithSplit
export class ClusterLayer extends BasicLayer {}

// 演示：实例化后即可直接调用由装饰器注入的方法
const layer = new ClusterLayer("demo-layer");
layer.enableFilter();
layer.disableSplit();
