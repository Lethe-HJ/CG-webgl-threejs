const ctx = document.getElementById("canvas");

const gl = ctx.getContext("webgl");

// 顶点着色器
const VERTEX_SHADER_SOURCE = /*glsl */ `
  attribute vec4 aPosition;
  attribute vec4 aNormal;
  varying vec4 vColor;
  uniform vec3 uPointLightColor;
  uniform vec3 uPointLightPosition;
  uniform vec3 uAmbientLightColor;
  uniform vec3 uMaterialColor;
  uniform int uMaterialType;
  

  uniform mat4 uVpMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uPerspectiveMatrix;
  uniform mat4 uTransformMatrix;
  uniform mat4 uNormalMatrix;
  

  const int MATERIAL_LAMBERT = 1;
  
  void main() {
    vec4 aColor = vec4(uMaterialColor, 1.0); // 物体表面的颜色
    vec4 vertexPosition = uVpMatrix * aPosition; // 顶点的世界坐标
    if (uMaterialType == MATERIAL_LAMBERT) { // lambert类型的材质
      vec3 lightDirection = normalize(uPointLightPosition - vec3(vertexPosition)); // 点光源的方向
      vec3 ambient = uAmbientLightColor * vec3(aColor); // 环境反射
      vec3 transformedNormal = normalize(vec3(uNormalMatrix * vec4(vec3(aNormal), 0.0)));
      // vec3 transformedNormal = normalize(vec3(uTransformMatrix * vec4(vec3(aNormal), 0.0)));
      float dotDeg = max(dot(transformedNormal, lightDirection), 0.0); // 计算入射角 光线方向和法线方向的点积
      vec3 diffuseColor = uPointLightColor * vec3(aColor) * dotDeg; // 漫反射光的颜色
      vColor = vec4(ambient + diffuseColor, aColor.a);
    } else {
      vColor = aColor;
    }
    gl_Position = uTransformMatrix * vertexPosition;
  }
`;

// 片元着色器
const FRAGMENT_SHADER_SOURCE = /*glsl */ `
  precision lowp float;
  varying vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }
`;

const program = initShader(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);

// 定义点光源 ---------------------------------------------------------------------
const pointLight = {
  color: [1.0, 1.0, 0.0],
  position: [0.0, 10.0, 1.0],
};

const uPointLightPositionLocation = gl.getUniformLocation(
  program,
  "uPointLightPosition"
);
const uPointLightColorLocation = gl.getUniformLocation(
  program,
  "uPointLightColor"
);
gl.uniform3fv(uPointLightPositionLocation, pointLight.position);
gl.uniform3fv(uPointLightColorLocation, pointLight.color);

// 定义环境光 --------------------------------------------------------------------
const ambientLightColor = [0.1, 0.1, 0.1];
const uAmbientLightColorLocation = gl.getUniformLocation(
  program,
  "uAmbientLightColor"
);
gl.uniform3fv(uAmbientLightColorLocation, ambientLightColor);

// 定义物体 ----------------------------------------------------------------------
// 物体位置
const aPositionLocation = gl.getAttribLocation(program, "aPosition");
const vertices = new Float32Array([
  // 0123
  1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
  // 0345
  1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1,
  // 0156
  1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1,
  // 1267
  -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1,
  // 2347
  -1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1,
  // 4567
  1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, -1,
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.vertexAttribPointer(aPositionLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPositionLocation);

// 法向量

const aNormalLocation = gl.getAttribLocation(program, "aNormal");
// const normals = new Float32Array(vertices.length);
// let index;
// for (let i = 0; i < vertices.length; i += 12) {
//   const item = cross(
//     [vertices[i], vertices[i + 1], vertices[i + 2]],
//     [vertices[i + 3], vertices[i + 4], vertices[i + 5]]
//   );
//   for (let j = 0; j < 4; j++) {
//     index = i + j * 3;
//     normals[index] = item[0];
//     normals[index + 1] = item[1];
//     normals[index + 2] = item[2];
//   }
// }
const normals = new Float32Array([
  // 0123
  0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  // 0345
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
  // 0156
  0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
  // 1267
  -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  // 2347
  0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
  // 4567
  0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
]);
const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
gl.vertexAttribPointer(aNormalLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aNormalLocation);

// 面
const indices = new Uint8Array([
  0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
  15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
]);
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

// 材质 ----------------------------------------------------------------------
const MaterialType = { Lambert: 1, Normal: 0 };
const material = {
  color: [1.0, 0.0, 0.0],
  type: MaterialType.Lambert,
};

const uMaterialColorLocation = gl.getUniformLocation(program, "uMaterialColor");
gl.uniform3fv(uMaterialColorLocation, material.color);
const uMaterialTypeLocation = gl.getUniformLocation(program, "uMaterialType");
gl.uniform1i(uMaterialTypeLocation, material.type);

gl.enable(gl.DEPTH_TEST);

// 摄像机与矩阵变换处理
const uVpMatrixLocation = gl.getUniformLocation(program, "uVpMatrix");
const uViewMatrixLocation = gl.getUniformLocation(program, "uViewMatrix");
const uPerspectiveMatrixLocation = gl.getUniformLocation(
  program,
  "uPerspectiveMatrix"
);
const uTransformMatrixLocation = gl.getUniformLocation(
  program,
  "uTransformMatrix"
);
const uNormalMatrixLocation = gl.getUniformLocation(program, "uNormalMatrix");
const camera = {
  position: [3, 3, 5],
  look_at: [0.0, 0.0, 0.0],
  up: [0.0, 0.6, 0.0],
  fov: 30,
  aspect: ctx.width / ctx.height,
  far: 100,
  near: 1,
};

let deg = 0;

gl.enable(gl.DEPTH_TEST);

// 视图矩阵和投影矩阵其实就可以抽象成摄像机
const viewMatrix = getViewMatrix(
  ...camera.position,
  ...camera.look_at,
  ...camera.up
);

gl.uniformMatrix4fv(uViewMatrixLocation, false, viewMatrix);

const perspectiveMatrix = getPerspective(
  camera.fov,
  camera.aspect,
  camera.far,
  camera.near
);
gl.uniformMatrix4fv(uPerspectiveMatrixLocation, false, perspectiveMatrix);
const uVpMatrix = mixMatrix(perspectiveMatrix, viewMatrix);
gl.uniformMatrix4fv(uVpMatrixLocation, false, uVpMatrix);

function draw() {
  deg += 0.01;
  const rotateMatrix = getRotateMatrixZ(deg);
  const uTransformMatrix = rotateMatrix;
  gl.uniformMatrix4fv(uTransformMatrixLocation, false, uTransformMatrix);
  const modelMatrix = uTransformMatrix; // 这里没有本地坐标系的变换 而且只有旋转操作 因此模型矩阵即为旋转矩阵
  const normalMatrix = inverseTranspose(modelMatrix); // 法线矩阵为模型矩阵的逆转置
  gl.uniformMatrix4fv(uNormalMatrixLocation, false, normalMatrix);

  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
  requestAnimationFrame(draw);
}
draw();
