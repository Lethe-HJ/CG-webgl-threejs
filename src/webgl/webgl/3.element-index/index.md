## gl.drawElements()

参数格式：drawElements(mode, count, type, offset)

| 参数   | 含义               | 值                                                                   |
| ------ | ------------------ | -------------------------------------------------------------------- |
| mode   | 绘制模式           | gl.LINE_LOOP、gl.LINES、gl.TRIANGLES 等                              |
| count  | 绘制顶点个数       | 整型数                                                               |
| type   | 数据类型           | gl.UNSIGNED_BYTE 对应 Uint8Array，gl.UNSIGNED_SHORT 对应 Uint16Array |
| offset | 从第几个点开始绘制 | 整型数，以字节为单位                                                 |

count 和 offset 组合可以确定绘制众多顶点中的连续一段，通过顶点索引关联顶点数据，count 和 offset 指的是顶点的索引数组。
