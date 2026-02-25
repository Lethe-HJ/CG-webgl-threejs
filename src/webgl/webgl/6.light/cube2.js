import { initShader } from "../utils/shader.js";

const vertexShaderSource = /*glsl*/ `
  //attribute声明vec4类型变量aPos
  attribute vec4 a_pos;
  // attribute声明顶点颜色变量
  attribute vec4 a_color;
  //顶点法向量变量
  attribute vec4 a_normal;
  // uniform声明平行光颜色变量
  uniform vec3 u_lightColor;
  // uniform声明点光源位置变量
  uniform vec3 u_lightPosition;
  // uniform 声明环境光颜色
  uniform vec3 u_ambientLight;
  //varying声明顶点颜色插值后变量
  varying vec4 v_color;
  void main() {
    //设置几何体轴旋转角度为30度，并把角度值转化为弧度值
    float radian = radians(30.0);
    //求解旋转角度余弦值
    float cos = cos(radian);
    //求解旋转角度正弦值
    float sin = sin(radian);
    //引用上面的计算数据，创建绕x轴旋转矩阵
    // 1      0       0    0
    // 0   cosα   sinα   0
    // 0  -sinα   cosα   0
    // 0      0        0   1
    mat4 mx = mat4(1,0,0,0,  0,cos,-sin,0,  0,sin,cos,0,  0,0,0,1);
    //引用上面的计算数据，创建绕y轴旋转矩阵
    // cosβ   0   sinβ    0
    //     0   1   0        0
    //-sinβ   0   cosβ    0
    //     0   0   0        1
    mat4 my = mat4(cos,0,-sin,0,  0,1,0,0,  sin,0,cos,0,  0,0,0,1);
    //两个旋转矩阵、顶点齐次坐标连乘
    gl_Position = mx*my*a_pos;

    // 光照处理

    // 顶点法向量进行矩阵变换，然后归一化
    vec3 normal = normalize((mx*my*a_normal).xyz);
    // 计算点光源照射顶点的方向并归一化
    vec3 lightDirection = normalize(vec3(gl_Position) - u_lightPosition);
    // 计算平行光方向向量和顶点法向量的点积
    float dotRes = max(dot(lightDirection, normal), 0.0);
    // 计算反射后的颜色（漫反射）
    vec3 reflectedLight = u_lightColor * a_color.rgb * dotRes;
    // 环境光
    vec3 ambient = u_ambientLight * a_color.rgb;
    // 颜色插值计算（漫反射 + 环境光）
    v_color = vec4(ambient + reflectedLight, a_color.a);
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
const canvas = document.getElementById("webgl-cube2");
//通过方法getContext()获取WebGL上下文
const gl = canvas.getContext("webgl");
//调用函数initShader(),初始化着色器,返回program对象
const program = initShader(gl, vertexShaderSource, fragShaderSource);
//获取顶点着色器的位置变量aPos
const aPosLocation = gl.getAttribLocation(program, "a_pos");
const a_color = gl.getAttribLocation(program, "a_color");

const a_normal = gl.getAttribLocation(program, "a_normal");
const u_lightColor = gl.getUniformLocation(program, "u_lightColor");
const u_lightPosition = gl.getUniformLocation(program, "u_lightPosition");
// 新增环境光 uniform 位置
const u_ambientLight = gl.getUniformLocation(program, "u_ambientLight");
/**
 * 传入点光源颜色数据、位置数据、环境光
 **/
gl.uniform3f(u_lightColor, 1.0, 1.0, 1.0);
gl.uniform3f(u_lightPosition, 2.0, 3.0, 4.0);
// 设置环境光（示例：弱白色环境光）
gl.uniform3f(u_ambientLight, 0.2, 0.2, 0.2);

/**
 * 创建顶点位置数据数组data,Javascript中小数点前面的0可以省略
 */
// prettier-ignore
const data = new Float32Array([
   0.5, 0.5, 0.5, -0.5, 0.5, 0.5, -0.5,-0.5, 0.5,  0.5, 0.5, 0.5, -0.5,-0.5, 0.5,  0.5,-0.5, 0.5, //面1
   0.5, 0.5, 0.5,  0.5,-0.5, 0.5,  0.5,-0.5,-0.5,  0.5, 0.5, 0.5,  0.5,-0.5,-0.5,  0.5, 0.5,-0.5, //面2
   0.5, 0.5, 0.5,  0.5, 0.5,-0.5, -0.5, 0.5,-0.5,  0.5, 0.5, 0.5, -0.5, 0.5,-0.5, -0.5, 0.5, 0.5, //面3
  -0.5, 0.5, 0.5, -0.5, 0.5,-0.5, -0.5,-0.5,-0.5, -0.5, 0.5, 0.5, -0.5,-0.5,-0.5, -0.5,-0.5, 0.5, //面4
  -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,-0.5, 0.5, -0.5,-0.5,-0.5,  0.5,-0.5, 0.5, -0.5,-0.5, 0.5, //面5
   0.5,-0.5,-0.5, -0.5,-0.5,-0.5, -0.5, 0.5,-0.5,  0.5,-0.5,-0.5, -0.5, 0.5,-0.5,  0.5, 0.5,-0.5, //面6
]);
/**
 * 创建顶点颜色数组colorData
 */
// prettier-ignore
const colorData = new Float32Array([
  1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0,      //红色——面1
  1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0,      //红色——面2
  1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0,      //红色——面3
  1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0,      //红色——面4
  1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0,      //红色——面5
  1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0, 1,0,0,      //红色——面6
]);

/**
 * 顶点法向量数组normalData
 */
// prettier-ignore
const normalData = new Float32Array([
   0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1,  0, 0, 1, 0, 0, 1,//z轴正方向——面1
   1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0, 1, 0, 0,//x轴正方向——面2
   0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0,  0, 1, 0, 0, 1, 0,//y轴正方向——面3
  -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,-1, 0, 0,//x轴负方向——面4
   0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0,  0,-1, 0, 0,-1, 0,//y轴负方向——面5
   0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1,  0, 0,-1, 0, 0,-1//z轴负方向——面6
]);

/**
 * 创建缓冲区normalBuffer，传入顶点法向量数据normalData
 */
var normalBuffer=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER,normalData,gl.STATIC_DRAW);
gl.vertexAttribPointer(a_normal,3,gl.FLOAT,false,0,0);
gl.enableVertexAttribArray(a_normal);

/**
 * 创建缓冲区colorBuffer，传入顶点颜色数据colorData
 */
const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(a_color);
/**
 * 创建缓冲区buffer，传入顶点位置数据data
 */
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
gl.vertexAttribPointer(aPosLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosLocation);

/**执行绘制之前，一定要开启深度测试，以免颜色混乱**/
gl.enable(gl.DEPTH_TEST);
/**执行绘制命令**/
gl.drawArrays(gl.TRIANGLES, 0, 36);
