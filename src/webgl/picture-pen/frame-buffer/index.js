import createImageShader from "./image-shader.js";
import createPaintShader from "./paint-shader.js";
import createFrameBufferShader from "./frame-buffer-shader.js";

// Get A WebGL context
/** @type {HTMLCanvasElement} */
const canvas = document.querySelector("#canvas");
const gl = canvas.getContext("webgl2");
if (!gl) throw new Error("WebGL2 is not supported");

const imageShader = createImageShader(gl);
const paintShader = createPaintShader(gl);
const frameBufferShader = createFrameBufferShader(gl);

gl.bindVertexArray(imageShader.vao);
gl.bindBuffer(gl.ARRAY_BUFFER, imageShader.buffer.position);
const positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
gl.enableVertexAttribArray(imageShader.location.position);

let size = 2; // 2 components per iteration
let type = gl.FLOAT; // the data is 32bit floats
let normalize = false; // don't normalize the data
let stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
let offset = 0; // start at the beginning of the buffer
gl.vertexAttribPointer(
  imageShader.location.position,
  size,
  type,
  normalize,
  stride,
  offset
);

gl.bindBuffer(gl.ARRAY_BUFFER, imageShader.buffer.texCoords);
const texCoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

gl.enableVertexAttribArray(imageShader.location.texCoords);

size = 2; // 3 components per iteration
type = gl.FLOAT; // the data is 32bit floats
normalize = true; // convert from 0-255 to 0.0-1.0
stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next color
offset = 0; // start at the beginning of the buffer
gl.vertexAttribPointer(
  imageShader.location.texCoords,
  size,
  type,
  normalize,
  stride,
  offset
);

function loadImageAndCreateTextureInfo(url) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
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
    width: 1,
    height: 1,
    texture: tex,
  };
  const img = new Image();

  textureInfo.promise = new Promise((resolve) => {
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
  const drawInfo = drawInfos[textureIndex];
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const { frameBuffer, texture } = createFBO();
  drawImage(drawInfo, frameBuffer);
  drawPath(frameBuffer);
  drawToScreen(texture);
}

function drawToScreen(texture) {
  gl.useProgram(frameBufferShader.program);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindVertexArray(frameBufferShader.vao); // 绑定一个已配置纹理坐标和顶点位置的VAO
  gl.bindBuffer(gl.ARRAY_BUFFER, frameBufferShader.buffer.position);
  const positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(frameBufferShader.location.position);
  let size = 2; // 2 components per iteration
  let type = gl.FLOAT; // the data is 32bit floats
  let normalize = false; // don't normalize the data
  let stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  let offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    frameBufferShader.location.position,
    size,
    type,
    normalize,
    stride,
    offset
  );

  gl.bindBuffer(gl.ARRAY_BUFFER, frameBufferShader.buffer.texCoords);
  const texCoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

  gl.enableVertexAttribArray(frameBufferShader.location.texCoords);

  size = 2; // 3 components per iteration
  type = gl.FLOAT; // the data is 32bit floats
  normalize = true; // convert from 0-255 to 0.0-1.0
  stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next color
  offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    frameBufferShader.location.texCoords,
    size,
    type,
    normalize,
    stride,
    offset
  );

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function createFBO() {
  // 创建纹理
  const targetTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, targetTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.canvas.width,
    gl.canvas.height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // 创建帧缓冲区
  const frameBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

  // 将纹理附加到帧缓冲区
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    targetTexture,
    0
  );
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.error("Framebuffer is not complete");
    return;
  }
  return { frameBuffer, texture: targetTexture };
}

// Unlike images, textures do not have a width and height associated
// with them so we'll pass in the width and height of the texture
function drawImage(drawInfo, fbo) {
  const { texture, width: texWidth, height: texHeight } = drawInfo.textureInfo;
  gl.useProgram(imageShader.program);

  // Setup the attributes for the quad
  gl.bindVertexArray(imageShader.vao);

  const textureUnit = 0;
  // The the shader we're putting the texture on texture unit 0
  gl.uniform1i(imageShader.location.texture, textureUnit);

  // Bind the texture to texture unit 0
  gl.activeTexture(gl.TEXTURE0 + textureUnit);
  gl.bindTexture(gl.TEXTURE_2D, texture);

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
  gl.uniformMatrix4fv(imageShader.location.matrix, false, matrix);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
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

function drawPath(fbo) {
  // 绘制逻辑
  gl.useProgram(paintShader.program);
  gl.bindVertexArray(paintShader.vao);
  penPathData[textureIndex].forEach((penPathDataItem) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, paintShader.buffer.position);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(penPathDataItem),
      gl.DYNAMIC_DRAW
    );
    gl.enableVertexAttribArray(paintShader.location.position);
    let size = 2;
    let type = gl.FLOAT;
    let normalize = false;
    let stride = 0;
    let offset = 0;
    gl.vertexAttribPointer(
      paintShader.location.position,
      size,
      type,
      normalize,
      stride,
      offset
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.drawArrays(gl.LINE_STRIP, 0, penPathDataItem.length / 2);
  });
}
