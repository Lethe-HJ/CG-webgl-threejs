import { AbstractName, m4, shadersMap, color, MaterialType } from "./libs.js";

export function createScene() {
  return {
    meshes: [],
    objects: [],
    groups: [],
    children: [],
    add(object) {
      this.children.push(object); // 总是添加到 children 中

      if (object.name === AbstractName.Mesh) {
        this.meshes.push(object); // 添加 mesh 到 meshes 数组
      } else if (object.name === AbstractName.Group) {
        this.groups.push(object); // 仅添加顶级 group 到 groups 数组
        // 递归添加组内的所有 mesh 到 meshes 数组
        object.children.forEach((child) => {
          if (child.name === AbstractName.Mesh) {
            this.meshes.push(child);
          } else if (child.name === AbstractName.Group) {
            // 如果组内还有子组，则递归处理
            this.add(child);
          }
        });
      } else {
        this.objects.push(object);
      }
    },
  };
}

export function createCamera(config) {
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
    attach(gl, program) {
      gl.useProgram(program);
      gl.uniform3fv(
        gl.getUniformLocation(program, "u_cameraPosition"),
        position
      );
    },
  };
}

export function createAmbientLight(config) {
  const _color = color.hexToRgbNormalized(config.color);
  return {
    color: _color,
    attach(gl, program) {
      gl.uniform3fv(
        gl.getUniformLocation(program, "u_ambientLightColor"),
        _color
      );
    },
  };
}

export function createPointLight(pointLight) {
  const _color = color.hexToRgbNormalized(pointLight.color);
  return {
    ...pointLight,
    attach(gl, program) {
      gl.uniform3fv(
        gl.getUniformLocation(program, "u_pointLight.position"),
        pointLight.position
      );
      gl.uniform3fv(
        gl.getUniformLocation(program, "u_pointLight.color"),
        _color
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

export function createGeometry(vertices, normals, indices) {
  return {
    vertices,
    normals,
    indices,
    attach(gl, program) {
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

export function createMaterial(config, gl) {
  const { vertex, fragment } = shadersMap[config.type];
  const shaderProgram = createShaderProgram(gl, vertex, fragment);
  const _color = color.hexToRgbNormalized(config.color);
  return {
    shaderProgram,
    color: _color,
    attach(gl) {
      gl.useProgram(shaderProgram);
      gl.uniform3fv(
        gl.getUniformLocation(shaderProgram, "u_material.color"),
        _color
      );
      if (config.type === MaterialType.Phong) {
        gl.uniform1f(
          gl.getUniformLocation(shaderProgram, "u_material.shininess"),
          config.shininess
        );
      }
    },
  };
}

export function createShaderProgram(
  gl,
  vertexShaderSource,
  fragmentShaderSource
) {
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
  return shaderProgram;
}

export function createMesh(geometry, material) {
  return {
    name: AbstractName.Mesh,
    geometry,
    material,
    parent: null,
    matrixes: {
      mvp: { value: null, location: null },
      model: { value: null, location: null },
      normal: { value: null, location: null },
      rotation: m4.identity(),
      translate: m4.identity(),
      scale: m4.identity(),
      localModel: m4.identity(),
    },
    attach(gl) {
      material.attach(gl);
      const program = this.material.shaderProgram;
      gl.useProgram(program);
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

      geometry.attach(gl, program);
      return {};
    },

    updateModelMatrix() {
      this.matrixes.localModel = m4.multiplySeries(
        this.matrixes.translate,
        this.matrixes.rotation,
        this.matrixes.scale
      );
      this.matrixes.model.value = this.parent
        ? m4.multiply(this.parent.matrixes.model, this.matrixes.localModel)
        : this.matrixes.localModel;
    },

    updateMatrix(gl, camera) {
      const modelMatrix = this.matrixes.model.value;
      const mvpMatrix = m4.multiply(camera.matrix.vp, modelMatrix);
      this.matrixes.mvp.value = mvpMatrix;
      const normalMatrix = m4.transpose(m4.inverse(modelMatrix)); // 法线矩阵为模型矩阵的逆转置
      this.matrixes.normal.value = normalMatrix;
      gl.uniformMatrix4fv(this.matrixes.model.location, false, modelMatrix);
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
    setRotation(xDeg, yDeg, zDeg) {
      this.matrixes.rotation = m4.multiplySeries(
        m4.identity(),
        m4.xRotation(xDeg),
        m4.yRotation(yDeg),
        m4.zRotation(zDeg)
      );
    },
    setPosition(x, y, z) {
      this.matrixes.translate = m4.multiplySeries(
        m4.identity(),
        m4.translation(x, y, z)
      );
    },
    setScale(x, y, z) {
      this.matrixes.scale = m4.multiplySeries(
        m4.identity(),
        m4.scaling(x, y, z)
      );
    },
  };
}

export function createGroup() {
  return {
    name: AbstractName.Group,
    matrixes: {
      model: m4.identity(),
      localModel: m4.identity(),
      rotation: m4.identity(),
      translate: m4.identity(),
      scale: m4.identity(),
    },
    children: [],
    parent: null,
    add(object) {
      this.children.push(object);
      object.parent = this;
    },
    updateModelMatrix() {
      this.matrixes.localModel = m4.multiplySeries(
        this.matrixes.translate,
        this.matrixes.rotation,
        this.matrixes.scale
      );
      this.matrixes.model = this.parent
        ? m4.multiply(this.parent.matrixes.model, this.matrixes.localModel)
        : this.matrixes.localModel;
      this.children.forEach((child) => child.updateModelMatrix());
    },
    setRotation(xDeg, yDeg, zDeg) {
      this.matrixes.rotation = m4.multiplySeries(
        m4.identity(),
        m4.xRotation(xDeg),
        m4.yRotation(yDeg),
        m4.zRotation(zDeg)
      );
    },
    setPosition(x, y, z) {
      this.matrixes.translate = m4.multiplySeries(
        m4.identity(),
        m4.translation(x, y, z)
      );
    },
    setScale(x, y, z) {
      this.matrixes.scale = m4.multiplySeries(
        m4.identity(),
        m4.scaling(x, y, z)
      );
    },
  };
}

export function createRenderer(gl) {
  gl.enable(gl.DEPTH_TEST);
  return {
    render(scene, camera) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      scene.children.forEach((object) => {
        if ([AbstractName.Group, AbstractName.Mesh].includes(object.name))
          object.updateModelMatrix();
      });
      scene.meshes.forEach((mesh) => {
        mesh.attach(gl);
        const shaderProgram = mesh.material.shaderProgram;
        gl.useProgram(shaderProgram);
        mesh.updateMatrix(gl, camera);
        scene.objects.forEach((object) => object.attach(gl, shaderProgram));
        camera.attach(gl, shaderProgram);
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
