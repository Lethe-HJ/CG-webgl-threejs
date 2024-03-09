const ctx = document.getElementById("canvas");

const gl = ctx.getContext("webgl");

const VERTEX_SHADER_SOURCE = /*glsl */ `
  uniform mat4 uViewMatrix;  
  uniform mat4 uPerspectiveMatrix;
  uniform mat4 uRotateMatrix;
  uniform mat4 uNormalMatrix;
  uniform vec3 uPointLightPosition;
  attribute vec4 aPosition;
  attribute vec4 aNormal;
  varying vec4 vColor;

  void main() {
    // 定义点光源的颜色
    vec3 uPointLightColor = vec3(1.0,1.0,0.0);

    // 转换光源位置到视图坐标系
    vec4 lightPositionInView = vec4(uPointLightPosition, 1.0);

    // 环境光
    vec3 uAmbientLightColor = vec3(0.2,0.2,0.2);

    // 物体表面的颜色
    vec4 aColor = vec4(1.0,0.0,0.0,1.0);

    mat4 pvMatrix = uViewMatrix * uPerspectiveMatrix; // 视图-投影矩阵

    // 顶点的世界坐标
    vec4 vertexPosition = pvMatrix * uRotateMatrix * aPosition;

    // 点光源的方向
    vec3 lightDirection = normalize(vec3(lightPositionInView) - vec3(vertexPosition));

    // 环境反射
    vec3 ambient = uAmbientLightColor * vec3(aColor);

    // vec3 transformedNormal = normalize(vec3(uNormalMatrix * aNormal));
    vec3 transformedNormal = vec3(aNormal);
    // 计算入射角 光线方向和法线方向的点积
    float dotDeg = dot(lightDirection, transformedNormal);

    // 漫反射光的颜色
    vec3 diffuseColor = uPointLightColor * vec3(aColor) * dotDeg;

    gl_Position = vertexPosition;
    vColor = vec4(ambient + diffuseColor, aColor.a);
  }
`; // 顶点着色器

const FRAGMENT_SHADER_SOURCE = /*glsl */ `
  precision lowp float;
  varying vec4 vColor;

  void main() {
    gl_FragColor = vColor;
  }
`; // 片元着色器

const program = initShader(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE);

const aPositionLocation = gl.getAttribLocation(program, "aPosition");
const aNormalLocation = gl.getAttribLocation(program, "aNormal");
const uNormalMatrixLocation = gl.getUniformLocation(program, "uNormalMatrix");
const uViewMatrixLocation = gl.getUniformLocation(program, "uViewMatrix");
const uPerspectiveMatrixLocation = gl.getUniformLocation(
  program,
  "uPerspectiveMatrix"
);
const uRotateMatrixLocation = gl.getUniformLocation(program, "uRotateMatrix");
const uPointLightPositionLocation = gl.getUniformLocation(
  program,
  "uPointLightPosition"
);

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

// 通过顶点来计算法向量 start =============
const res = [];
for (let i = 0; i < vertices.length; i += 12) {
  const item = cross(
    [vertices[i], vertices[i + 1], vertices[i + 2]],
    [vertices[i + 3], vertices[i + 4], vertices[i + 5]]
  );
  for (let j = 0; j < 4; j++) {
    res.push(...item);
  }
}
// 法向量
const normals = new Float32Array(res);
// 通过顶点来计算法向量  end =============

const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
gl.vertexAttribPointer(aNormalLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aNormalLocation);

const indices = new Uint8Array([
  0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
  15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
]);
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

const camera = {
  position: [3, 3, 5],
  look_at: [0.0, 0.0, 0.0],
  up: [0.0, 0.6, 0.0],
  fov: 30,
  aspect: ctx.width / ctx.height,
  far: 100,
  near: 1,
};

const point_light = {
  position: [-5.0, 6.0, 10.0], // 点光源的位置
};
let deg = 0;

gl.uniform3fv(uPointLightPositionLocation, point_light.position);
gl.enable(gl.DEPTH_TEST);

function draw() {
  deg += 0.01;
  const rotateMatrix = getRotateMatrix(deg);
  gl.uniformMatrix4fv(uRotateMatrixLocation, false, rotateMatrix);
  console.log(`rotateMatrix=${rotateMatrix}`);

  // 视图矩阵和投影矩阵其实就可以抽象成摄像机
  const viewMatrix = getViewMatrix(
    ...camera.position,
    ...camera.look_at,
    ...camera.up
  );
  gl.uniformMatrix4fv(uViewMatrixLocation, false, viewMatrix);
  console.log(`viewMatrix=${viewMatrix}`);

  const perspectiveMatrix = getPerspective(
    camera.fov,
    camera.aspect,
    camera.far,
    camera.near
  );
  gl.uniformMatrix4fv(uPerspectiveMatrixLocation, false, perspectiveMatrix);
  console.log(`perspectiveMatrix=${perspectiveMatrix}`);
  const normalMatrix = inverseTranspose(viewMatrix);
  gl.uniformMatrix4fv(uNormalMatrixLocation, false, normalMatrix);
  console.log(`normalMatrix=${normalMatrix}`);
  gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_BYTE, 0);
  requestAnimationFrame(draw);
}
draw();
