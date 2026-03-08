import { initShader } from "../utils/shader.js";

//通过getElementById()方法获取canvas画布
const canvas = document.getElementById("webgl-a");

//通过方法getContext()获取WebGL上下文
const gl = canvas.getContext("webgl");

//顶点着色器源码
const vertexShaderSource = /*glsl*/ `
  #pragma vscode_glsllint_stage: vert
  void main(){
    //给内置变量gl_PointSize赋值像素大小
    gl_PointSize = 20.0;
    //顶点位置，位于坐标原点
    gl_Position = vec4(0.0,0.0,0.0,1.0);
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
//开始绘制，显示器显示结果
gl.drawArrays(gl.POINTS, 0, 1);
