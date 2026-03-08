import { initShader } from "../utils/shader.js";

//通过getElementById()方法获取canvas画布
const canvas = document.getElementById("webgl-b");
//通过方法getContext()获取WebGL上下文
const gl = canvas.getContext("webgl");

//顶点着色器源码
const vertexShaderSource = /*glsl*/ `
  #pragma vscode_glsllint_stage: vert
  //attribute声明vec4类型变量aPos
  attribute vec4 a_pos;
  void main(){
    //设置几何体轴旋转角度为30度，并把角度值转化为弧度值
    float radian = radians(30.0);
    //求解旋转角度余弦值
    float cos = cos(radian);
    //求解旋转角度正弦值
    float sin = sin(radian);
    //引用上面的计算数据，创建绕x轴旋转矩阵
    // 1      0      0     0
    // 0   cosα   sinα     0
    // 0  -sinα   cosα     0
    // 0      0      0     1
    mat4 mx = mat4(
      1,   0,    0,  0,
      0, cos, -sin,  0,
      0, sin,  cos,  0,
      0,   0,    0,  1
    );
    //引用上面的计算数据，创建绕y轴旋转矩阵
    // cosβ   0   sinβ    0
    //    0   1   0       0
    //-sinβ   0   cosβ    0
    //    0   0   0       1
    mat4 my = mat4(
      cos,  0,-sin,  0,
        0,  1,   0,  0,
      sin,  0, cos,  0,
        0,  0,   0,  1
    );
    //两个旋转矩阵、顶点齐次坐标连乘
    gl_Position = mx*my*a_pos;
  }
`;

//片元着色器源码
const fragShaderSource = /*glsl*/ `
  #pragma vscode_glsllint_stage: frag
  void main(){ 
    //定义片元颜色
    gl_FragColor = vec4(1.0,0.0,0.0,1.0);
  }
`;
//初始化着色器
const program = initShader(gl, vertexShaderSource, fragShaderSource);

//9个元素构建三个顶点的xyz坐标值
// 数组里9个元素，每间隔3个为一组，分别代表xyz轴上的坐标值
// prettier-ignore
const data = new Float32Array([
   0.5,  0.5,  0.5,
  -0.5,  0.5,  0.5,
  -0.5, -0.5,  0.5,
   0.5, -0.5,  0.5,

   0.5,  0.5, -0.5,
  -0.5,  0.5, -0.5,
  -0.5, -0.5, -0.5,
   0.5, -0.5, -0.5,

   0.5,  0.5,  0.5,
   0.5,  0.5,  -0.5,
  -0.5,  0.5,  0.5,
  -0.5,  0.5,  -0.5,

  -0.5, -0.5,  0.5,
  -0.5, -0.5,  -0.5,
   0.5, -0.5,  0.5,
   0.5, -0.5,  -0.5,
]);
initData(data, program);

//开始绘制，显示器显示结果
//LINE_LOOP模式绘制前四个点
gl.drawArrays(gl.LINE_LOOP, 0, 4);
//LINE_LOOP模式从第五个点开始绘制四个点
gl.drawArrays(gl.LINE_LOOP, 4, 4);
//LINES模式绘制后8个点
gl.drawArrays(gl.LINES, 8, 8);

function initData(data, program) {
  //获取顶点着色器的位置变量aPos，即aPosLocation指向aPos变量。
  var aPosLocation = gl.getAttribLocation(program, "a_pos");
  //创建缓冲区对象
  var buffer = gl.createBuffer();
  //绑定缓冲区对象,激活buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  //顶点数组data数据传入缓冲区
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  //缓冲区中的数据按照一定的规律传递给位置变量aPos
  gl.vertexAttribPointer(aPosLocation, 3, gl.FLOAT, false, 0, 0);
  //允许数据传递
  gl.enableVertexAttribArray(aPosLocation);
}
