import { initShader } from "../utils/shader.js";

const vertexShaderSource = /*glsl*/ `
  //attribute声明vec4类型变量aPos
  attribute vec4 a_pos;
  // attribute声明顶点颜色变量
  attribute vec4 a_color;
  //varying声明顶点颜色插值后变量
  varying vec4 v_color;
  void main() {
    // 顶点坐标aPos赋值给内置变量gl_Position
    gl_Position = a_pos;
    //顶点颜色插值计算
    v_color = a_color;
  }
`;
//片元着色器源码
const fragShaderSource = /*glsl*/ `
  // 所有float类型数据的精度是lowp
  precision lowp float;
  // 接收顶点着色器中v_color数据
  varying vec4 v_color;
  void main() {
    // 插值后颜色数据赋值给对应的片元
    gl_FragColor = v_color;
  }
`; //通过getElementById()方法获取canvas画布
const canvas = document.getElementById("webgl-c");
//通过方法getContext()获取WebGL上下文
const gl = canvas.getContext("webgl");

//调用函数initShader(),初始化着色器,返回program对象
const program = initShader(gl, vertexShaderSource, fragShaderSource);
//获取顶点着色器的位置变量aPos
const aPosLocation = gl.getAttribLocation(program, "a_pos");
const a_color = gl.getAttribLocation(program, "a_color");

/**
 * 创建顶点位置数据数组data，存储6个顶点
 * 创建顶点颜色数组colorData，存储6个顶点对应RGB颜色值
 */
const data = new Float32Array([
  -0.5,
  0.5,
  0.5,
  0.5,
  0.5,
  -0.5, //第一个三角形的三个点
  -0.5,
  0.5,
  0.5,
  -0.5,
  -0.5,
  -0.5, //第二个三角形的三个点
]);
const colorData = new Float32Array([
  1,
  0,
  0,
  1,
  0,
  0,
  1,
  0,
  0, //三个红色点
  0,
  0,
  1,
  0,
  0,
  1,
  0,
  0,
  1, //三个蓝色点
]);
/**
 * 创建缓冲区colorBuffer，传入顶点颜色数据colorData
 */
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(a_color);
/**
     创建缓冲区buffer，传入顶点位置数据data
     **/
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
gl.vertexAttribPointer(aPosLocation, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosLocation);

/**执行绘制命令**/
gl.drawArrays(gl.TRIANGLES, 0, 6);
