const ctx = document.getElementById("canvas");

const gl = ctx.getContext("webgl");

// 顶点着色器
const VERTEX_SHADER_SOURCE = /*glsl */ `
  attribute vec4 a_position;
  attribute vec4 a_normal;
  varying vec4 v_color;
  uniform vec3 u_pointLightColor;
  uniform vec3 u_pointLightPosition;
  uniform vec3 u_ambientLightColor;
  uniform vec3 u_materialColor;
  uniform int u_materialType;
  

  uniform mat4 u_vpMatrix;
  uniform mat4 u_viewMatrix;
  uniform mat4 u_perspectiveMatrix;
  uniform mat4 u_transformMatrix;
  uniform mat4 u_normalMatrix;
  

  const int MATERIAL_LAMBERT = 1;
  
  void main() {
    vec4 aColor = vec4(u_materialColor, 1.0); // 物体表面的颜色
    vec4 vertexPosition = u_vpMatrix * a_position; // 顶点的世界坐标
    if (u_materialType == MATERIAL_LAMBERT) { // lambert类型的材质
      vec3 lightDirection = normalize(u_pointLightPosition - vec3(vertexPosition)); // 点光源的方向
      vec3 ambient = u_ambientLightColor * vec3(aColor); // 环境反射
      vec3 transformedNormal = normalize(vec3(u_normalMatrix * vec4(vec3(a_normal), 0.0)));
      // vec3 transformedNormal = normalize(vec3(u_transformMatrix * vec4(vec3(a_normal), 0.0)));
      float dotDeg = max(dot(transformedNormal, lightDirection), 0.0); // 计算入射角 光线方向和法线方向的点积
      vec3 diffuseColor = u_pointLightColor * vec3(aColor) * dotDeg; // 漫反射光的颜色
      v_color = vec4(ambient + diffuseColor, aColor.a);
    } else {
      v_color = aColor;
    }
    gl_Position = u_transformMatrix * vertexPosition;
  }
`;

// 片元着色器
const FRAGMENT_SHADER_SOURCE = /*glsl */ `
  precision lowp float;
  varying vec4 v_color;

  void main() {
    gl_FragColor = v_color;
  }
`;

const program = initShader(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);

// 定义点光源 ---------------------------------------------------------------------
const pointLight = {
  color: [1.0, 1.0, 0.0],
  position: [0.0, 10.0, 1.0],
};

const u_pointLightPositionLocation = gl.getUniformLocation(
  program,
  "u_pointLightPosition"
);
const u_pointLightColorLocation = gl.getUniformLocation(
  program,
  "u_pointLightColor"
);
gl.uniform3fv(u_pointLightPositionLocation, pointLight.position);
gl.uniform3fv(u_pointLightColorLocation, pointLight.color);

// 定义环境光 --------------------------------------------------------------------
const ambientLightColor = [0.1, 0.1, 0.1];
const u_ambientLightColorLocation = gl.getUniformLocation(
  program,
  "u_ambientLightColor"
);
gl.uniform3fv(u_ambientLightColorLocation, ambientLightColor);

// 定义物体 ----------------------------------------------------------------------
// 物体位置
const a_positionLocation = gl.getAttribLocation(program, "a_position");
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
gl.vertexAttribPointer(a_positionLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(a_positionLocation);

// 法向量

const a_normalLocation = gl.getAttribLocation(program, "a_normal");
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
gl.vertexAttribPointer(a_normalLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(a_normalLocation);

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

const u_materialColorLocation = gl.getUniformLocation(
  program,
  "u_materialColor"
);
gl.uniform3fv(u_materialColorLocation, material.color);
const u_materialTypeLocation = gl.getUniformLocation(program, "u_materialType");
gl.uniform1i(u_materialTypeLocation, material.type);

gl.enable(gl.DEPTH_TEST);

// 摄像机与矩阵变换处理
const u_vpMatrixLocation = gl.getUniformLocation(program, "u_vpMatrix");
const u_viewMatrixLocation = gl.getUniformLocation(program, "u_viewMatrix");
const u_perspectiveMatrixLocation = gl.getUniformLocation(
  program,
  "u_perspectiveMatrix"
);
const u_transformMatrixLocation = gl.getUniformLocation(
  program,
  "u_transformMatrix"
);
const u_normalMatrixLocation = gl.getUniformLocation(program, "u_normalMatrix");
const camera = {
  position: [3, 3, 10],
  look_at: [0.0, 0.0, 0.0],
  up: [0.0, 0.6, 0.0],
  fov: 30,
  aspect: ctx.width / ctx.height,
  far: 100,
  near: 1,
};



// 视图矩阵和投影矩阵其实就可以抽象成摄像机
const viewMatrix = getViewMatrix(
  ...camera.position,
  ...camera.look_at,
  ...camera.up
);

gl.uniformMatrix4fv(u_viewMatrixLocation, false, viewMatrix);

const perspectiveMatrix = getPerspective(
  camera.fov,
  camera.aspect,
  camera.far,
  camera.near
);
gl.uniformMatrix4fv(u_perspectiveMatrixLocation, false, perspectiveMatrix);
const u_vpMatrix = mixMatrix(perspectiveMatrix, viewMatrix);
gl.uniformMatrix4fv(u_vpMatrixLocation, false, u_vpMatrix);

let deg = 1;
gl.enable(gl.DEPTH_TEST);

function draw() {
  deg += 0.01;
  const rotateMatrix = getRotateMatrixZ(deg);
  const u_transformMatrix = rotateMatrix;
  gl.uniformMatrix4fv(u_transformMatrixLocation, false, u_transformMatrix);
  const modelMatrix = u_transformMatrix; // 这里没有本地坐标系的变换 而且只有旋转操作 因此模型矩阵即为旋转矩阵
  const normalMatrix = inverseTranspose(modelMatrix); // 法线矩阵为模型矩阵的逆转置
  gl.uniformMatrix4fv(u_normalMatrixLocation, false, normalMatrix);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
  requestAnimationFrame(draw);
}
draw();
