# webgl 画笔技术实现方案

## 方案 1

将轨迹进行额外绘制

## 方案 2

利用帧缓冲 操作帧缓冲 将笔迹绘制到帧缓冲中

## 对比

| 方案     | 优点                                 | 缺点                                            |
| -------- | ------------------------------------ | ----------------------------------------------- |
| 额外绘制 | 实现简单, 容易嵌入, 对 ng 代码影响小 | 稍微影响性能 要多一次绘制(个人感觉可以忽略不计) |
| 帧缓冲   | 性能影响最小                         | 实现稍微复杂,可能需要深入了解 ng                |


## 总结

### 个人总结

"额外绘制"的方案性价比最高