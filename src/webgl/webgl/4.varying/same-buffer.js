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
`;
//通过getElementById()方法获取canvas画布
const canvas = document.getElementById("webgl-d");
//通过方法getContext()获取WebGL上下文
const gl = canvas.getContext("webgl");

//调用函数initShader(),初始化着色器,返回program对象
const program = initShader(gl, vertexShaderSource, fragShaderSource);
//获取顶点着色器的位置变量aPos
const aPosLocation = gl.getAttribLocation(program, "a_pos");
const a_color = gl.getAttribLocation(program, "a_color");

/**
 * 创建顶点位置数据数组data，存储两个顶点(-0.5,0.5、(0.5,0.5)
 * 存储两个顶点对应RGB颜色值(0,0,1)、(1,0,0)
 */
const data = new Float32Array([
  -0.5, 0.5, 0.0, 0.0, 1.0, 0.5, 0.5, 1.0, 0.0, 0.0,
]);

/**
 * 创建缓冲区buffer，传入顶点颜色、位置数据data
 */
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
//4表示data数组一个元素占据的字节数
//倒数第二个参数4*5表示每5个元素是一个选择单元
gl.vertexAttribPointer(aPosLocation, 2, gl.FLOAT, false, 4 * 5, 0);
//最后一个参数4*2表示5元素组成的一个选择单元中偏移2个元素，选择后三个作为顶点颜色数据
gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 4 * 5, 4 * 2);
gl.enableVertexAttribArray(aPosLocation);
gl.enableVertexAttribArray(a_color);

/**执行绘制命令**/
gl.drawArrays(gl.LINES, 0, 2);