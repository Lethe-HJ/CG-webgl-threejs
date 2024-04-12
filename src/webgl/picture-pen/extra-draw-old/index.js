const vertexShaderSource = /*glsl*/ `#version 300 es
  in vec4 a_position;
  in vec2 a_texCoords;
  uniform mat4 u_matrix;
  uniform sampler2D u_penData;
  out vec2 v_texCoords;
  void main() {
    gl_Position = u_matrix * a_position;
    v_texCoords = a_texCoords;
  }
`;

const fragmentShaderSource = /*glsl*/ `#version 300 es
    precision highp float;
    in vec2 v_texCoords;
    uniform sampler2D u_texture;
    out vec4 outColor;
    void main() {
      outColor = texture(u_texture, v_texCoords);
    }
`;

// Get A WebGL context
/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#canvas");
const gl = canvas.getContext("webgl2");
if (!gl) throw new Error("WebGL2 is not supported");

// Use our boilerplate utils to compile the shaders and link into a program
const program = webglUtils.createProgramFromSources(gl, [
  vertexShaderSource,
  fragmentShaderSource,
]);

// look up where the vertex data needs to go.
const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
const texCoordsAttributeLocation = gl.getAttribLocation(program, "a_texCoords");

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

// create the texCoords buffer, make it the current ARRAY_BUFFER
// and copy in the texCoords values
const texCoordsBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordsBuffer);
// Put texCoords in the buffer
const texCoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

// Turn on the attribute
gl.enableVertexAttribArray(texCoordsAttributeLocation);

// Tell the attribute how to get data out of texCoordsBuffer (ARRAY_BUFFER)
size = 2; // 3 components per iteration
type = gl.FLOAT; // the data is 32bit floats
normalize = true; // convert from 0-255 to 0.0-1.0
stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next color
offset = 0; // start at the beginning of the buffer
gl.vertexAttribPointer(
  texCoordsAttributeLocation,
  size,
  type,
  normalize,
  stride,
  offset
);

// creates a texture info { width: w, height: h, texture: tex }
// The texture will start with 1x1 pixels and be updated
// when the image has loaded
function loadImageAndCreateTextureInfo(url, callback) {
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

  textureInfo.promise = new Promise((resolve, reject) => {
    img.addEventListener("load", function () {
      textureInfo.width = img.width;
      textureInfo.height = img.height;

      gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);
      resolve(textureInfo);
    });
  });
  img.src = url;

  return textureInfo;
}

const textureInfos = [
  loadImageAndCreateTextureInfo("../../../../assets/star.jpg"),
  loadImageAndCreateTextureInfo("../../../../assets/leaves.jpg"),
  loadImageAndCreateTextureInfo("../../../../assets/keyboard.jpg"),
];

textureInfos[0].promise.then(() => {
  requestAnimationFrame(draw);
});

const drawInfos = [];
const numToDraw = 3;
for (let ii = 0; ii < numToDraw; ++ii) {
  const drawInfo = {
    textureInfo: textureInfos[ii],
  };
  drawInfos.push(drawInfo);
}

let textureIndex = 0;
const throttleDuration = 200;
let lastEventTime = 0;
document.addEventListener("wheel", (e) => {
  const currentTime = Date.now();
  if (currentTime - lastEventTime > throttleDuration) {
    const length = textureInfos.length;
    const delta = e.deltaY > 0 ? 1 : -1;
    textureIndex = (length + textureIndex + delta) % length;
    lastEventTime = currentTime;
    requestAnimationFrame(draw);
  }
});

const resizeObserver = new ResizeObserver(() => {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  requestAnimationFrame(draw);
});
resizeObserver.observe(canvas);

function draw() {
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
    0,
    0
  );
  drawPath();
}

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
  matrix = m4.scale(matrix, texWidth * 3, texHeight * 3, 1);

  // Set the matrix.
  gl.uniformMatrix4fv(matrixLocation, false, matrix);

  // draw the quad (2 triangles, 6 vertices)
  const offset = 0;
  const count = 6;
  gl.drawArrays(gl.TRIANGLES, offset, count);
}

const penPathData = new Array(drawInfos.length).fill(null).map(() => []);
const penColor = [1, 0, 0];
let isDrawing = false;
let penPathIndex = 0;
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  penPathIndex = penPathData[textureIndex].push([]) - 1;
  // 将鼠标位置转换为WebGL坐标系中的位置，并添加到顶点列表
  addPointToPath(e.clientX, e.clientY, penPathIndex);
  requestAnimationFrame(draw);
});
canvas.addEventListener("mousemove", (e) => {
  if (isDrawing) {
    addPointToPath(e.clientX, e.clientY, penPathIndex);
    requestAnimationFrame(draw);
  }
});
canvas.addEventListener("mouseup", () => (isDrawing = false));
canvas.addEventListener("mouseleave", () => (isDrawing = false));

function addPointToPath(x, y, index) {
  const webglX = (x / canvas.width) * 2 - 1;
  const webglY = (y / canvas.height) * -2 + 1;
  penPathData[textureIndex][index].push(webglX, webglY);
}

const paintVertexShaderSource = /*glsl*/ `#version 300 es
  in vec4 a_paintPosition;
  void main() {
    gl_Position = vec4(a_paintPosition.xy, 0, 1);
    gl_PointSize = 4.0;
  }
`;

const paintFragmentShaderSource = /*glsl*/ `#version 300 es
    precision highp float;
    out vec4 outColor;
    void main() {
      outColor = vec4(1, 0, 0, 1);
    }
`;

const paintProgram = webglUtils.createProgramFromSources(gl, [
  paintVertexShaderSource,
  paintFragmentShaderSource,
]);

// look up where the vertex data needs to go.
const paintPositionAttributeLocation = gl.getAttribLocation(
  paintProgram,
  "a_paintPosition"
);
const paintVao = gl.createVertexArray();
gl.bindVertexArray(paintVao);

const paintPositionBuffer = gl.createBuffer();

function drawPath() {
  // 绘制逻辑
  penPathData[textureIndex].forEach((penPathDataItem) => {
    gl.useProgram(paintProgram);
    gl.bindVertexArray(paintVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, paintPositionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(penPathDataItem),
      gl.DYNAMIC_DRAW
    );
    gl.enableVertexAttribArray(paintPositionAttributeLocation);
    let size = 2;
    let type = gl.FLOAT;
    let normalize = false;
    let stride = 0;
    let offset = 0;
    gl.vertexAttribPointer(
      paintPositionAttributeLocation,
      size,
      type,
      normalize,
      stride,
      offset
    );

    gl.drawArrays(gl.LINE_STRIP, 0, penPathDataItem.length / 2);
  });
}
