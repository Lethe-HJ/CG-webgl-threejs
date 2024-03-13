const ctx = document.getElementById("canvas");
const gl = ctx.getContext("webgl");

const scene = createScene();

const ambient_light = createAmbientLight({
  color: color.hexToRgbNormalized("#191919"),
}); // 定义环境光 实际上就是一些uniform 待传入到着色器
scene.add(ambient_light);

const point_light = createPointLight({
  color: color.hexToRgbNormalized("#ffffff"),
  position: [0.0, 6.0, 0.0],
  attenuation: [0.5, 0.04, 0.032],
}); // 定义点光源  实际上就是一些uniform 待传入到着色器中
scene.add(point_light);

const geometry = createGeometry(); // 定义物体 实际上就是待传入到着色器中的点数据面数据

const material1 = createMaterial(
  {
    type: MaterialType.Phong,
    color: color.hexToRgbNormalized("#00FF00"),
  },
  gl
); // 定义材质 实际上就是着色器

const mesh1 = createMesh(geometry, material1); // Mesh的实质就是将几何体和材质绑定成一组 用材质指定的着色器 绘制一次这个几何体
scene.add(mesh1);

// const material2 = createMaterial(
//   {
//     type: MaterialType.Lambert,
//     color: color.hexToRgbNormalized("#ffffff"),
//   },
//   gl
// );
// const mesh2 = createMesh(geometry, material2);
// const group = createGroup();
// group.add(mesh2);
// group.translate(1, 0, 0);
// scene.add(group);

const camera = createCamera({
  position: [4, 4, 4],
  target: [0.0, 0.0, 0.0],
  up: [0.0, 1.0, 0.0],
  fov: 75 * (Math.PI / 360),
  aspect: ctx.width / ctx.height,
  near: 0.1,
  far: 10,
}); // 定义相机 实际上就是视图矩阵和投影矩阵

const renderer = createRenderer(gl);

let deg = 1;
function animate() {
  deg += 0.005;
  if (deg > 20) deg = 0;
  mesh1.rotation(deg, 2 * deg, 3 * deg);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// ----------------------------- 下面是抽象概念的封装
function createScene() {
  return {
    objects: [],
    meshes: [],
    add(object) {
      if (object.name === AbstractName.Mesh) this.meshes.push(object);
      else this.objects.push(object);
    },
  };
}

function createGeometry() {
  // 物体位置
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

  // 法向量
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

  // 面
  const indices = new Uint8Array([
    0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
    15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
  ]);

  return {
    vertices,
    normals,
    indices,
    attach(program, gl) {
      const a_positionLocation = gl.getAttribLocation(program, "a_position");
      const vertices_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertices_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      gl.vertexAttribPointer(a_positionLocation, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_positionLocation);

      const a_normalLocation = gl.getAttribLocation(program, "a_normal");
      const normal_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normal_buffer);
      gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
      gl.vertexAttribPointer(a_normalLocation, 3, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(a_normalLocation);

      const indices_buffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices_buffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    },
  };
}

function createMaterial(config, gl) {
  const { vertex, fragment } = shaders[config.type];
  const shaderProgram = createShaderProgram(gl, vertex, fragment);
  return {
    shaderProgram,
    color: config.color,
    attach(program, gl) {
      gl.uniform3fv(
        gl.getUniformLocation(program, "u_materialColor"),
        config.color
      );
    },
  };
}

function createShaderProgram(gl, vertexShaderSource, fragmentShaderSource) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  gl.shaderSource(vertexShader, vertexShaderSource); // 指定顶点着色器的源码
  gl.shaderSource(fragmentShader, fragmentShaderSource); // 指定片元着色器的源码

  // 编译着色器
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(
      "ERROR compiling vertex shader!",
      gl.getShaderInfoLog(vertexShader)
    );
    return;
  }

  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(
      "ERROR compiling fragment shader!",
      gl.getShaderInfoLog(fragmentShader)
    );
    return;
  }

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);

  gl.linkProgram(shaderProgram);
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(
      "ERROR linking program!",
      gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }
  gl.useProgram(shaderProgram);
  return shaderProgram;
}

function createCamera(config) {
  const { position, target, up, fov, aspect, near, far } = config;

  const cameraMatrix = m4.lookAt(position, target, up);
  const viewMatrix = m4.inverse(cameraMatrix);

  const projectionMatrix = m4.perspective(fov, aspect, near, far);

  const vpMatrix = m4.multiply(projectionMatrix, viewMatrix);

  return {
    ...config,
    matrix: {
      camera: cameraMatrix,
      projection: projectionMatrix,
      view: viewMatrix,
      vp: vpMatrix,
    },
    attach(program, gl) {
      gl.uniform3fv(
        gl.getUniformLocation(program, "u_cameraPosition"),
        position
      );
    },
  };
}

function createAmbientLight(config) {
  return {
    color: config.color,
    attach(program, gl) {
      gl.uniform3fv(
        gl.getUniformLocation(program, "u_ambientLightColor"),
        config.color
      );
    },
  };
}

function createPointLight(pointLight) {
  return {
    ...pointLight,
    attach(program, gl) {
      gl.uniform3fv(
        gl.getUniformLocation(program, "u_pointLight.position"),
        pointLight.position
      );
      gl.uniform3fv(
        gl.getUniformLocation(program, "u_pointLight.color"),
        pointLight.color
      );
      gl.uniform1f(
        gl.getUniformLocation(program, "u_pointLight.constant"),
        pointLight.attenuation[0]
      );
      gl.uniform1f(
        gl.getUniformLocation(program, "u_pointLight.linear"),
        pointLight.attenuation[1]
      );
      gl.uniform1f(
        gl.getUniformLocation(program, "u_pointLight.quadratic"),
        pointLight.attenuation[2]
      );
    },
  };
}

function createMesh(geometry, material) {
  return {
    name: AbstractName.Mesh,
    geometry,
    material,
    matrixes: {
      mvp: { value: null, location: null },
      model: { value: null, location: null },
      normal: { value: null, location: null },
      rotation: m4.identity(),
      translate: m4.identity(),
      scale: m4.identity(),
    },
    attach(program, gl) {
      this.matrixes.mvp.location = gl.getUniformLocation(
        program,
        "u_mvpMatrix"
      );
      this.matrixes.model.location = gl.getUniformLocation(
        program,
        "u_modelMatrix"
      );
      this.matrixes.normal.location = gl.getUniformLocation(
        program,
        "u_normalMatrix"
      );
      return {
        ...material.attach(program, gl),
        ...geometry.attach(program, gl),
      };
    },

    updateMatrix(gl, camera) {
      const { rotation, translate, scale } = this.matrixes;
      const modelMatrix = m4.multiplySeries(rotation, scale, translate);
      this.matrixes.model.value = modelMatrix;
      const mvpMatrix = m4.multiply(camera.matrix.vp, modelMatrix);
      this.matrixes.mvp.value = mvpMatrix;
      const normalMatrix = m4.transpose(m4.inverse(modelMatrix)); // 法线矩阵为模型矩阵的逆转置
      this.matrixes.normal.value = normalMatrix;
      gl.uniformMatrix4fv(
        this.matrixes.model.location,
        false,
        this.matrixes.model.value
      );
      gl.uniformMatrix4fv(
        this.matrixes.mvp.location,
        false,
        this.matrixes.mvp.value
      );
      gl.uniformMatrix4fv(
        this.matrixes.normal.location,
        false,
        this.matrixes.normal.value
      );
    },
    rotation(xDeg, yDeg, zDeg) {
      this.matrixes.rotation = m4.multiplySeries(
        m4.identity(),
        m4.xRotation(xDeg),
        m4.yRotation(yDeg),
        m4.zRotation(zDeg)
      );
    },
    translate(x, y, z) {
      this.matrixes.translate = m4.multiplySeries(
        m4.identity(),
        m4.translate(x),
        m4.translate(y),
        m4.translate(z)
      );
    },
    scale(x, y, z) {
      this.matrixes.translate = m4.multiplySeries(
        m4.identity(),
        m4.scaling(x),
        m4.scaling(y),
        m4.scaling(z)
      );
    },
  };
}

function createGroup() {
  return {
    name: AbstractName.Group,
    matrixes: {
      rotation: m4.identity(),
      translate: m4.identity(),
      scale: m4.identity(),
    },
    children: [],
    add(object) {
      this.children.push(object);
    },
    attach(program, gl) {
      this.children.forEach((child) => {
        child.attach(program, gl);
      });
    },
    rotation(xDeg, yDeg, zDeg) {
      this.matrixes.rotation = m4.multiplySeries(
        m4.identity(),
        m4.xRotation(xDeg),
        m4.yRotation(yDeg),
        m4.zRotation(zDeg)
      );
    },
    translate(x, y, z) {
      this.matrixes.translate = m4.multiplySeries(
        m4.identity(),
        m4.translate(x),
        m4.translate(y),
        m4.translate(z)
      );
    },
    scale(x, y, z) {
      this.matrixes.translate = m4.multiplySeries(
        m4.identity(),
        m4.scaling(x),
        m4.scaling(y),
        m4.scaling(z)
      );
    },
  };
}

function createRenderer(gl) {
  gl.enable(gl.DEPTH_TEST);
  return {
    render(scene, camera) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      scene.meshes.find((mesh) => {
        const shaderProgram = mesh.material.shaderProgram;
        mesh.attach(shaderProgram, gl);
        mesh.updateMatrix(gl, camera);
        scene.objects.forEach((object) => object.attach(shaderProgram, gl));
        camera.attach(shaderProgram, gl);
        gl.drawElements(
          gl.TRIANGLES,
          mesh.geometry.indices.length,
          gl.UNSIGNED_BYTE,
          0
        );
      });
    },
  };
}
