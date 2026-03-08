## 彩色图转灰度图


`亮度 = 0.299 x R + 0.587 x G + 0.114 x B`

```glsl
void main() {
  //采集纹素
  vec4 texture = texture2D(u_Sampler,v_TexCoord);
  //计算RGB三个分量光能量之和，也就是亮度
  float luminance = 0.299*texture.r+0.587*texture.g+0.114*texture.b;
  //逐片元赋值，RGB相同均为亮度值，用黑白两色表达图片的明暗变化
  gl_FragColor = vec4(luminance,luminance,luminance,1.0);
}
```

## 拉伸图片

```js
/**
 * 四个顶点坐标数据data，z轴为零
 * 定义纹理贴图在WebGL坐标系中位置
 **/
var data=new Float32Array([
    -0.5, 0.5,//左上角——v0
    -0.5,-0.5,//左下角——v1
    0.5,  0.5,//右上角——v2
    0.5, -0.5 //右下角——v3
]);
/**
 * 四个顶点坐标数据data，z轴为零
 * 定义纹理贴图在WebGL坐标系中位置
 **/
var data=new Float32Array([
    -0.5, 0.7,//左上角——v0
    -0.5,-0.7,//左下角——v1
    0.5,  0.7,//右上角——v2
    0.5, -0.7 //右下角——v3
]);
```

## 旋转图片

```glsl
/**uniform声明旋转矩阵变量mx、my**/
uniform mat4 mx;//绕x轴旋转矩阵
uniform mat4 my;//绕y轴旋转矩阵
void main() {
  //两个旋转矩阵、顶点齐次坐标连乘
  gl_Position = mx*my*a_Position;
  //纹理坐标插值计算
  v_TexCoord = a_TexCoord;
}
```

```js
/**
 * 传入旋转矩阵数据
 ***/
var angle = Math.PI/6;//旋转角度
var sin = Math.sin(angle);
var cos = Math.cos(angle);
//旋转矩阵数据
var mxArr = new Float32Array([1,0,0,0,  0,cos,-sin,0,  0,sin,cos,0,  0,0,0,1]);
var myArr = new Float32Array([cos,0,-sin,0,  0,1,0,0,  sin,0,cos,0,  0,0,0,1]);
//类型数组传入矩阵
gl.uniformMatrix4fv(mx, false, mxArr);
gl.uniformMatrix4fv(my, false, myArr);
```
