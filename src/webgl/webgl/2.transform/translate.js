import { initShader } from "../utils/shader.js";

//通过getElementById()方法获取canvas画布
const canvas = document.getElementById("webgl-a");
//通过方法getContext()获取WebGL上下文
const gl = canvas.getContext("webgl");

//顶点着色器源码
const vertexShaderSource = /*glsl*/ `
  #pragma vscode_glsllint_stage: vert
  //attribute声明vec4类型变量aPos
  attribute vec4 a_pos;
  void main(){
    // 创建平移矩阵(沿x轴平移-0.4)
    mat4 m4 = mat4(
      1,    0,    0,    0,
      0,    1,    0,    0,
      0,    0,    1,    0,
      -0.4, 0,    0,    1);
    //平移矩阵m4左乘顶点坐标(vec4类型数据可以理解为线性代数中的nx1矩阵，即列向量)
    // 逐顶点进行矩阵变换
    gl_Position = m4 * a_pos;
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
  0.0, 0.0, 1.0,//三角形顶点1坐标
  0.0, 1.0, 0.0,//三角形顶点2坐标
  1.0, 0.0, 0.0 //三角形顶点3坐标
]);
initData(data, program);

//开始绘制，显示器显示结果
gl.drawArrays(gl.LINE_LOOP, 0, 4);

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
