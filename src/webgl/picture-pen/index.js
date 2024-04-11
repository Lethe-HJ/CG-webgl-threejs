const vertexShaderSource = /*glsl*/ `#version 300 es
  in vec4 a_position;
  in vec2 a_texcoord;
  uniform mat4 u_matrix;
  out vec2 v_texcoord;
  void main() {
    gl_Position = u_matrix * a_position;
    v_texcoord = a_texcoord;
  }
`;

const fragmentShaderSource = /*glsl*/ `#version 300 es
    precision highp float;
    in vec2 v_texcoord;
    uniform sampler2D u_texture;
    out vec4 outColor;
    void main() {
      outColor = texture(u_texture, v_texcoord);
    }
`;

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  const canvas = document.querySelector("#canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) return;

  // Use our boilerplate utils to compile the shaders and link into a program
  const program = webglUtils.createProgramFromSources(gl, [
    vertexShaderSource,
    fragmentShaderSource,
  ]);

  // look up where the vertex data needs to go.
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  const texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");

  // lookup uniforms
  const matrixLocation = gl.getUniformLocation(program, "u_matrix");
  const textureLocation = gl.getUniformLocation(program, "u_texture");

  // Create a vertex array object (attribute state)
  const vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // create the position buffer, make it the current ARRAY_BUFFER
  // and copy in the color values
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Put a unit quad in the buffer
  const positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  let size = 2; // 2 components per iteration
  let type = gl.FLOAT; // the data is 32bit floats
  let normalize = false; // don't normalize the data
  let stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  // create the texcoord buffer, make it the current ARRAY_BUFFER
  // and copy in the texcoord values
  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  // Put texcoords in the buffer
  const texcoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

  // Turn on the attribute
  gl.enableVertexAttribArray(texcoordAttributeLocation);

  // Tell the attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
  size = 2; // 3 components per iteration
  type = gl.FLOAT; // the data is 32bit floats
  normalize = true; // convert from 0-255 to 0.0-1.0
  stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next color
  offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    texcoordAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  // creates a texture info { width: w, height: h, texture: tex }
  // The texture will start with 1x1 pixels and be updated
  // when the image has loaded
  function loadImageAndCreateTextureInfo(url) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 255, 255])
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const textureInfo = {
      width: 1, // we don't know the size until it loads
      height: 1,
      texture: tex,
    };
    const img = new Image();
    img.addEventListener("load", function () {
      textureInfo.width = img.width;
      textureInfo.height = img.height;

      gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
    });
    img.src = url;

    return textureInfo;
  }

  const textureInfos = [
    loadImageAndCreateTextureInfo("../../../assets/star.jpg"),
    loadImageAndCreateTextureInfo("../../../assets/leaves.jpg"),
    loadImageAndCreateTextureInfo("../../../assets/keyboard.jpg"),
  ];

  const drawInfos = [];
  const numToDraw = 3;
  const speed = 60;
  for (let ii = 0; ii < numToDraw; ++ii) {
    const drawInfo = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      textureInfo: textureInfos[ii],
    };
    drawInfos.push(drawInfo);
  }

  let textureIndex = 0;
// 我希望通过按下回车键修改textureIndex的值，从而切换图片

  function draw() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const drawInfo = drawInfos[textureIndex];
    drawImage(
      drawInfo.textureInfo.texture,
      drawInfo.textureInfo.width,
      drawInfo.textureInfo.height,
      drawInfo.x,
      drawInfo.y
    );
  }

  function render() {
    draw();
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

  // Unlike images, textures do not have a width and height associated
  // with them so we'll pass in the width and height of the texture
  function drawImage(tex, texWidth, texHeight) {
    gl.useProgram(program);

    // Setup the attributes for the quad
    gl.bindVertexArray(vao);

    const textureUnit = 0;
    // The the shader we're putting the texture on texture unit 0
    gl.uniform1i(textureLocation, textureUnit);

    // Bind the texture to texture unit 0
    gl.activeTexture(gl.TEXTURE0 + textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, tex);

    // this matrix will convert from pixels to clip space
    let matrix = m4.orthographic(
      0,
      gl.canvas.clientWidth,
      gl.canvas.clientHeight,
      0,
      -1,
      1
    );

    // scale our 1 unit quad
    // from 1 unit to texWidth, texHeight units
    matrix = m4.scale(matrix, texWidth, texHeight, 1);

    // Set the matrix.
    gl.uniformMatrix4fv(matrixLocation, false, matrix);

    // draw the quad (2 triangles, 6 vertices)
    const offset = 0;
    const count = 6;
    gl.drawArrays(gl.TRIANGLES, offset, count);
  }
}

main();
