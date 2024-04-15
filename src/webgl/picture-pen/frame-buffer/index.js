import createImageShader from "./image-shader.js";
import createPaintShader from "./paint-shader.js";
import createFrameBufferShader from "./frame-buffer-shader.js";

const config = {
  penSize: 4,
  penColor: [1, 0, 0, 1],
};

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

const drawInfos = [];
const numToDraw = 3;
for (let ii = 0; ii < numToDraw; ++ii) {
  const drawInfo = {
    textureInfo: textureInfos[ii],
    pointsArray: [],
    fbo: undefined,
    lastArrayDrawnIndex: 0,
  };
  drawInfos.push(drawInfo);
}

let layerIndex = 0;
let initialized = false;
const resizeObserver = new ResizeObserver(() => {
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);
  if (!initialized) {
    textureInfos[layerIndex].promise.then(() => {
      draw();
    });
  } else {
    draw();
  }
});

resizeObserver.observe(canvas);

const throttleDuration = 200;
let lastEventTime = 0;
document.addEventListener("wheel", (e) => {
  const currentTime = Date.now();
  if (currentTime - lastEventTime > throttleDuration) {
    const length = textureInfos.length;
    const delta = e.deltaY > 0 ? 1 : -1;
    layerIndex = (length + layerIndex + delta) % length;
    lastEventTime = currentTime;
    requestAnimationFrame(draw);
  }
});

function draw() {
  const drawInfo = drawInfos[layerIndex];
  if (!drawInfo.fbo) drawAll();
  else drawAddition();
}

// 全量绘制
function drawAll() {
  const drawInfo = drawInfos[layerIndex];
  drawInfo.fbo = createFBO();
  const { frameBuffer, texture } = drawInfo.fbo;
  drawImage(drawInfo, frameBuffer);
  drawPathAll(frameBuffer, true);
  drawToScreen(texture);
}

// 增量绘制
function drawAddition() {
  const drawInfo = drawInfos[layerIndex];
  const { frameBuffer, texture } = drawInfo.fbo;
  drawPathAddition(frameBuffer);
  drawToScreen(texture);
  if (gl.getError()) console.log(gl.getError());
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

  matrix = m4.scale(matrix, texWidth * 2, texHeight * 2, 1);
  // Set the matrix.
  gl.uniformMatrix4fv(imageShader.location.matrix, false, matrix);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  // draw the quad (2 triangles, 6 vertices)
  const offset = 0;
  const count = 6;
  gl.drawArrays(gl.TRIANGLES, offset, count);
}

const penColor = [1, 0, 0];
let isDrawing = false;
let penPathIndex = 0;
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  penPathIndex = drawInfos[layerIndex].pointsArray.push([]) - 1;
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
  const webglX = (x / gl.canvas.width) * 2 - 1;
  const webglY = (y / gl.canvas.height) * -2 + 1;
  const currentPath = drawInfos[layerIndex].pointsArray[index];

  // 当鼠标快速移动并绘制时 点会比较分散 所以需要在两个分散的点之间进行线性插值

  // 如果路径中已经有点，计算新点和最后一个点之间的距离
  if (currentPath.length > 0) {
    const lastX = currentPath[currentPath.length - 2];
    const lastY = currentPath[currentPath.length - 1];
    const dist = Math.sqrt(
      Math.pow(webglX - lastX, 2) + Math.pow(webglY - lastY, 2)
    );

    // 对于宽度，一个裁剪单位（从 -1 到 1）对应 canvas.width / 2 像素 对于宽度则是 canvas.height / 2
    const threshold = Math.min(
      (2 * config.penSize) / canvas.width,
      (2 * config.penSize) / canvas.height
    );
    let t, numExtraPoints, interpolatedX, interpolatedY;
    if (dist > threshold) {
      numExtraPoints = Math.ceil(dist / threshold);
      for (let i = 1; i <= numExtraPoints; i++) {
        t = i / (numExtraPoints + 1);
        interpolatedX = lastX + (webglX - lastX) * t; // 线性插值
        interpolatedY = lastY + (webglY - lastY) * t;
        currentPath.push(interpolatedX, interpolatedY);
      }
    }
  }
  // 添加当前点到路径
  currentPath.push(webglX, webglY);
}

// 绘制新笔迹
function drawPathAddition(fbo) {
  gl.useProgram(paintShader.program);
  gl.uniform1f(paintShader.location.penSize, config.penSize);
  gl.bindVertexArray(paintShader.vao);
  const drawInfo = drawInfos[layerIndex];
  const { pointsArray, lastArrayDrawnIndex } = drawInfo;
  const points = pointsArray[pointsArray.length - 1].slice(lastArrayDrawnIndex);
  drawSinglePath(fbo, points);
  drawInfo.lastArrayDrawnIndex = pointsArray[pointsArray.length - 1].length;
}

function drawSinglePath(fbo, points) {
  gl.bindBuffer(gl.ARRAY_BUFFER, paintShader.buffer.position);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW);
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
  gl.drawArrays(gl.POINTS, 0, points.length / 2); // 使用密集的点来模拟线条
}

// 绘制旧的笔迹
function drawPathAll(fbo) {
  gl.useProgram(paintShader.program);
  gl.uniform1f(paintShader.location.penSize, config.penSize);
  gl.bindVertexArray(paintShader.vao);
  const drawInfo = drawInfos[layerIndex];
  let pointsArray = drawInfo.pointsArray;
  pointsArray.forEach((points) => {
    drawSinglePath(fbo, points);
  });
}
webglLessonsUI.setupSlider("#size", {
  slide: (event, ui) => {
    config.penSize = ui.value;
    gl.useProgram(paintShader.program);
    gl.uniform1f(paintShader.location.penSize, config.penSize);
  },
  min: 1.0,
  max: 40.0,
  value: config.penSize,
});
