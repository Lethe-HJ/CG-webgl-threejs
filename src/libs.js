function initShader(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertexShader, VERTEX_SHADER_SOURCE); // 指定顶点着色器的源码
  gl.shaderSource(fragmentShader, FRAGMENT_SHADER_SOURCE); // 指定片元着色器的源码

  // 编译着色器
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
    return;
}

  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
    return;
}

  // 创建一个程序对象
  const program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(
      "ERROR linking program!",
      gl.getProgramInfoLog(program)
    );
    return null;
  }

  gl.useProgram(program);

  return program;
}

// 平移矩阵
function getTranslateMatrix(x = 0, y = 0, z = 0) {
  // prettier-ignore
  return new Float32Array([
    1.0, 0.0, 0.0, 0.0,
    0.0, 1.0, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    x  , y  , z  , 1,
  ])
}
// 缩放矩阵
function getScaleMatrix(x = 1, y = 1, z = 1) {
  // prettier-ignore
  return new Float32Array([
    x  , 0.0, 0.0, 0.0,
    0.0, y  , 0.0, 0.0,
    0.0, 0.0, z  , 0.0,
    0.0, 0.0, 0.0, 1,
  ])
}
// 绕z轴旋转的旋转矩阵
function getRotateMatrix(deg) {
  // prettier-ignore
  return new Float32Array([
    Math.cos(deg),  Math.sin(deg), 0.0,0.0,
    -Math.sin(deg), Math.cos(deg), 0.0,0.0,
    0.0,            0.0,           1.0,0.0,
    0.0,            0.0,           0.0, 1,
  ])
}

// 矩阵复合函数
function mixMatrix(A, B) {
  const result = new Float32Array(16);

  for (let i = 0; i < 4; i++) {
    result[i] =
      A[i] * B[0] + A[i + 4] * B[1] + A[i + 8] * B[2] + A[i + 12] * B[3];
    result[i + 4] =
      A[i] * B[4] + A[i + 4] * B[5] + A[i + 8] * B[6] + A[i + 12] * B[7];
    result[i + 8] =
      A[i] * B[8] + A[i + 4] * B[9] + A[i + 8] * B[10] + A[i + 12] * B[11];
    result[i + 12] =
      A[i] * B[12] + A[i + 4] * B[13] + A[i + 8] * B[14] + A[i + 12] * B[15];
  }

  return result;
}

// 归一化函数
function normalized(arr) {
  let sum = 0;

  for (let i = 0; i < arr.length; i++) {
    sum += arr[i] * arr[i];
  }

  const middle = Math.sqrt(sum);

  for (let i = 0; i < arr.length; i++) {
    arr[i] = arr[i] / middle;
  }
}

// 叉积函数 获取法向量
function cross(a, b) {
  return new Float32Array([
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]);
}

// 点积函数 获取投影长度
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

// 向量差
function minus(a, b) {
  return new Float32Array([a[0] - b[0], a[1] - b[1], a[2] - b[2]]);
}

// 视图矩阵获取
function getViewMatrix(
  eyex,
  eyey,
  eyez,
  lookAtx,
  lookAty,
  lookAtz,
  upx,
  upy,
  upz
) {
  // 视点
  const eye = new Float32Array([eyex, eyey, eyez]);
  // 目标点
  const lookAt = new Float32Array([lookAtx, lookAty, lookAtz]);
  // 上方向
  const up = new Float32Array([upx, upy, upz]);

  // 确定z轴
  const z = minus(eye, lookAt);

  normalized(z);
  normalized(up);

  // 确定x轴
  const x = cross(z, up);

  normalized(x);
  // 确定y轴
  const y = cross(x, z);
  // prettier-ignore
  return new Float32Array([
    x[0],       y[0],       z[0],       0,
    x[1],       y[1],       z[1],       0,
    x[2],       y[2],       z[2],       0,
    -dot(x,eye),-dot(y,eye),-dot(z,eye),1
  ])
}

// 获取正射投影矩阵
function getOrtho(l, r, t, b, n, f) {
  // prettier-ignore
  return new Float32Array([
    2 / (r - l), 0,           0,           0,
    0,           2/(t-b),     0,           0,
    0,           0,           -2/(f-n),    0,
    -(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1
  ])
}

// 获取透视投影矩阵
function getPerspective(fov, aspect, far, near) {
  fov = (fov * Math.PI) / 180;
  // prettier-ignore
  return new Float32Array([
    1/(aspect*Math.tan(fov / 2)), 0,                   0,                      0,
    0,                            1/(Math.tan(fov/2)), 0,                      0,
    0,                            0,                   -(far+near)/(far-near), -(2*far*near)/(far-near),
    0,                            0,                   -1,                     0,
  ])
}

function distanceSelf(a, b) {
  const x = a[0] - b[0];
  const y = a[1] - b[1];
  const z = a[2] - b[2];

  const v = x * x + y * y + z * z;

  return Math.sqrt(v);
}

function inverseTranspose(vm) {
  // 创建一个新的矩阵以存储逆矩阵的结果
  let inversedMatrix = glMatrix.mat4.create(); // 使用glMatrix创建矩阵会自动得到Float32Array类型

  // 计算vm的逆矩阵并将结果存储在inversedMatrix中
  if (glMatrix.mat4.invert(inversedMatrix, vm)) {
    // 如果成功计算了逆矩阵，继续进行转置
    let transposedMatrix = glMatrix.mat4.create(); // 再次创建一个新矩阵用于存储转置结果
    glMatrix.mat4.transpose(transposedMatrix, inversedMatrix); // 对逆矩阵进行转置
    return transposedMatrix; // 返回转置后的逆矩阵
  } else {
    // 如果无法求逆，返回null表示失败
    return null;
  }
}
