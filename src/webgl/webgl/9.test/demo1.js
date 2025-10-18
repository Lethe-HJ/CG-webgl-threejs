import { initShader } from "../utils/shader.js";
import { multiplyMatrices } from "../utils/math.js";

const vertexShaderSource = /*glsl*/ `
  // attribute声明vec4类型变量a_pos
  attribute vec4 a_pos;
  // attribute声明顶点颜色变量
  attribute vec4 a_color;
  // varying声明顶点颜色插值后变量
  varying vec4 v_color;
  // 旋转矩阵
  uniform mat4 u_transform;
  void main() {
    gl_Position = u_transform * a_pos;
    //顶点颜色插值计算
    v_color = a_color;
  }
`;
// 片元着色器源码
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

// 通过getElementById()方法获取canvas画布
const canvas = document.getElementById("webgl-demo1");
// 通过方法getContext()获取WebGL上下文
const gl = canvas.getContext("webgl");

//初始化着色器
const program = initShader(gl, vertexShaderSource, fragShaderSource);
/**
 *从program对象获取顶点位置变量a_pos、颜色变量a_color
 */
const aPosLocation = gl.getAttribLocation(program, "a_pos");
const a_color = gl.getAttribLocation(program, "a_color");

const u_transform = gl.getUniformLocation(program, "u_transform");

/**
 *创建顶点位置数据数组data,Javascript中小数点前面的0可以省略
 */
// prettier-ignore
const cubePosition = new Float32Array([
   // 立方体         
   0.2, 0.2, 0.2,  -0.2, 0.2, 0.2,  -0.2,-0.2, 0.2,   0.2, 0.2, 0.2,  -0.2,-0.2, 0.2,   0.2,-0.2, 0.2, //面1
   0.2, 0.2, 0.2,   0.2,-0.2, 0.2,   0.2,-0.2,-0.2,   0.2, 0.2, 0.2,   0.2,-0.2,-0.2,   0.2, 0.2,-0.2, //面2
   0.2, 0.2, 0.2,   0.2, 0.2,-0.2,  -0.2, 0.2,-0.2,   0.2, 0.2, 0.2,  -0.2, 0.2,-0.2,  -0.2, 0.2, 0.2, //面2
  -0.2, 0.2, 0.2,  -0.2, 0.2,-0.2,  -0.2,-0.2,-0.2,  -0.2, 0.2, 0.2,  -0.2,-0.2,-0.2,  -0.2,-0.2, 0.2, //面4
  -0.2,-0.2,-0.2,   0.2,-0.2,-0.2,   0.2,-0.2, 0.2,  -0.2,-0.2,-0.2,   0.2,-0.2, 0.2,  -0.2,-0.2, 0.2, //面2
   0.2,-0.2,-0.2,  -0.2,-0.2,-0.2,  -0.2, 0.2,-0.2,   0.2,-0.2,-0.2,  -0.2, 0.2,-0.2,   0.2, 0.2,-0.2, //面6
]);

/**
 *创建顶点颜色数组colorData
 */
// prettier-ignore
const cubeColor = new Float32Array([
  // 立方体1，不透明
  1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1, 1,0,0,1, //红色——面1
  0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1, //绿色——面2
  0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1, 0,0,1,1, //蓝色——面3
  
  1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1, //黄色——面4
  0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1, //黑色——面5
  1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, 1,0,1,1, //粉色——面6
]);

const cube1 = {
  position: Float32Array.from(cubePosition),
  color: Float32Array.from(cubeColor),
  offset: [0, 0, 0],
};

const cube2 = {
  position: Float32Array.from(cubePosition),
  color: Float32Array.from(cubeColor),
  offset: [0.5, 0, 0],
};

const cubes = [cube1, cube2];

cubes.forEach((cube) => {
  for (let i = 0; i < cube.position.length / 3; i++) {
    cube.position[i * 3] += cube.offset[0];
    cube.position[i * 3 + 1] += cube.offset[1];
    cube.position[i * 3 + 2] += cube.offset[2];
  }
});

const position = new Float32Array([...cube1.position, ...cube2.position]);
const color = new Float32Array([...cube1.color, ...cube2.color]);

/**
 * 创建缓冲区colorBuffer，传入顶点颜色数据colorData
 */
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, color, gl.STATIC_DRAW);
gl.vertexAttribPointer(a_color, 4, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(a_color);
/**
 * 创建缓冲区buffer，传入顶点位置数据data
 */
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, position, gl.STATIC_DRAW);
gl.vertexAttribPointer(aPosLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosLocation);

const angle = Math.PI / 4;
const sin = Math.sin(angle); //旋转角度正弦值
const cos = Math.cos(angle); //旋转角度余弦值
// prettier-ignore
const myArr = new Float32Array([
    cos,  0, -sin,  0, 
      0,  1,    0,  0,  
    sin,  0,  cos,  0, 
      0,  0,    0,  1
  ]);

// prettier-ignore
const mxArr = new Float32Array([
    1,      0,     0,     0,
    0,    cos,  -sin,     0,
    0,    sin,   cos,     0,
    0,      0,     0,     1
  ]);
const transformMatrix = multiplyMatrices(mxArr, myArr);
gl.uniformMatrix4fv(u_transform, false, transformMatrix);

/**
 * 开启深度测试并设置颜色融合单元
 */
gl.enable(gl.DEPTH_TEST);
/**执行绘制命令**/
gl.drawArrays(gl.TRIANGLES, 0, 36*2);
