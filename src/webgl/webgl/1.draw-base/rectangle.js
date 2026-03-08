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
    //顶点坐标aPos赋值给内置变量gl_Position
    //逐顶点处理数据
    gl_Position = a_pos;
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

const data = new Float32Array([0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5]);

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
  gl.vertexAttribPointer(aPosLocation, 2, gl.FLOAT, false, 0, 0);
  //允许数据传递
  gl.enableVertexAttribArray(aPosLocation);
}
