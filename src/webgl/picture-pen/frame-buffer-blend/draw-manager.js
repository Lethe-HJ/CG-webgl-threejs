import { DRAW_MODE } from "./constant.js";
import createFrameBufferShader from "./shaders/frame-buffer.js";
import createImageShader from "./shaders/image.js";
import createPaintShader from "./shaders/paint.js";

export default class MaskDrawManager {
  constructor(gl, textureInfos, layerIndex) {
    this.gl = gl;
    this.textureInfos = textureInfos;
    this.drawInfos = [];
    this.layerIndex = layerIndex;
    this.init();
    this.handleCanvasEvent();
  }

  init() {
    const gl = this.gl;
    this.imageShader = createImageShader(gl);
    this.paintShader = createPaintShader(gl);
    this.frameBufferShader = createFrameBufferShader(gl);
    for (let ii = 0; ii < this.textureInfos.length; ++ii) {
      const drawInfo = {
        textureInfo: this.textureInfos[ii],
        pointsArray: [],
        fbo: {
          image: null,
          paint: null,
        },
        lastArrayDrawnIndex: 0,
      };
      this.drawInfos.push(drawInfo);
    }
    this.createImageFrameBuffer();
  }

  createImageFrameBuffer() {
    const gl = this.gl;
    gl.bindVertexArray(this.imageShader.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.imageShader.buffer.position);
    const positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.imageShader.location.position);
    {
      const size = 2;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.vertexAttribPointer(
        this.imageShader.location.position,
        size,
        type,
        normalize,
        stride,
        offset
      );
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.imageShader.buffer.texCoords);
    const texCoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(this.imageShader.location.texCoords);

    const size = 2;
    const type = gl.FLOAT;
    const normalize = true;
    const stride = 0;
    const offset = 0;
    gl.vertexAttribPointer(
      this.imageShader.location.texCoords,
      size,
      type,
      normalize,
      stride,
      offset
    );
  }

  setLayerIndex(layerIndex) {
    this.layerIndex = layerIndex;
  }

  render() {
    requestAnimationFrame(() => {
      const drawInfo = this.drawInfos[this.layerIndex];
      if (!drawInfo.fbo.image) this.drawAll();
      else this.drawAddition();
    });
  }

  // 全量绘制
  drawAll() {
    const gl = this.gl;
    const drawInfo = this.drawInfos[this.layerIndex];
    drawInfo.fbo.image = this.createFBO();
    drawInfo.fbo.paint = this.createFBO();
    const imageFbo = drawInfo.fbo.image;
    this.drawImage(drawInfo, imageFbo.frameBuffer);
    const paintFbo = drawInfo.fbo.paint;
    gl.disable(gl.BLEND);
    this.drawPathAll(paintFbo.frameBuffer, this.layerIndex);
    this.drawToScreen(imageFbo.texture);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.drawToScreen(paintFbo.texture);
  }

  // 增量绘制
  drawAddition() {
    const gl = this.gl;
    const drawInfo = this.drawInfos[this.layerIndex];
    const imageFbo = drawInfo.fbo.image;
    const paintFbo = drawInfo.fbo.paint;
    gl.disable(gl.BLEND); // 绘制笔迹时不需要混合 否则橡皮擦无法覆盖之前的笔迹
    this.drawPathAddition(paintFbo.frameBuffer);
    this.drawToScreen(imageFbo.texture);
    gl.enable(gl.BLEND); // 合并paintFbo和imageFbo时需要混合
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.drawToScreen(paintFbo.texture);
    if (gl.getError()) console.log(gl.getError());
  }

  drawToScreen(texture) {
    const gl = this.gl;
    const frameBufferShader = this.frameBufferShader;
    gl.useProgram(frameBufferShader.program);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindVertexArray(frameBufferShader.vao); // 绑定一个已配置纹理坐标和顶点位置的VAO
    gl.bindBuffer(gl.ARRAY_BUFFER, frameBufferShader.buffer.position);
    const positions = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(frameBufferShader.location.position);
    {
      const size = 2;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.vertexAttribPointer(
        frameBufferShader.location.position,
        size,
        type,
        normalize,
        stride,
        offset
      );
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, frameBufferShader.buffer.texCoords);
    const texCoords = [0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(frameBufferShader.location.texCoords);
    {
      const size = 2;
      const type = gl.FLOAT;
      const normalize = true;
      const stride = 0;
      const offset = 0;
      gl.vertexAttribPointer(
        frameBufferShader.location.texCoords,
        size,
        type,
        normalize,
        stride,
        offset
      );
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  createFBO() {
    const gl = this.gl;
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
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
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

  drawImage(drawInfo, fbo) {
    const gl = this.gl;
    const imageShader = this.imageShader;
    const {
      texture,
      width: texWidth,
      height: texHeight,
    } = drawInfo.textureInfo;
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

  addPointToPath(x, y, index) {
    const gl = this.gl;
    const webglX = (x / gl.canvas.width) * 2 - 1;
    const webglY = (y / gl.canvas.height) * -2 + 1;
    const currentPath = this.drawInfos[this.layerIndex].pointsArray[index].data;

    // 当鼠标快速移动并绘制时 点会比较分散 所以需要在两个分散的点之间进行线性插值

    // 如果路径中已经有点，计算新点和最后一个点之间的距离
    // if (currentPath.length > 0) {
    //   const lastX = currentPath[currentPath.length - 2];
    //   const lastY = currentPath[currentPath.length - 1];
    //   const dist = Math.sqrt(
    //     Math.pow(webglX - lastX, 2) + Math.pow(webglY - lastY, 2)
    //   );

    //   // 对于宽度，一个裁剪单位（从 -1 到 1）对应 canvas.width / 2 像素 对于宽度则是 canvas.height / 2
    //   const threshold = Math.min(
    //     (2 * config.pen.size) / canvas.width,
    //     (2 * config.pen.size) / canvas.height
    //   );
    //   let t, numExtraPoints, interpolatedX, interpolatedY;
    //   if (dist > threshold) {
    //     numExtraPoints = Math.ceil(dist / threshold);
    //     for (let i = 1; i <= numExtraPoints; i++) {
    //       t = i / (numExtraPoints + 1);
    //       interpolatedX = lastX + (webglX - lastX) * t; // 线性插值
    //       interpolatedY = lastY + (webglY - lastY) * t;
    //       currentPath.push(interpolatedX, interpolatedY);
    //     }
    //   }
    // }
    // 添加当前点到路径
    currentPath.push(webglX, webglY);
  }

  // 绘制新笔迹
  drawPathAddition(fbo) {
    const gl = this.gl;
    const paintShader = this.paintShader;
    const drawInfo = this.drawInfos[this.layerIndex];
    const { pointsArray, lastArrayDrawnIndex } = drawInfo;
    if (!pointsArray.length) return;
    const lastPointsArrayItem = pointsArray[pointsArray.length - 1];
    let { data, color, size } = lastPointsArrayItem;
    const additionData = data.slice(lastArrayDrawnIndex);

    gl.useProgram(paintShader.program);
    gl.uniform1f(paintShader.location.pen.size, size);
    if (config.mode === DRAW_MODE.eraser) {
      color = [1, 1, 1, 0];
    }
    gl.uniform4fv(paintShader.location.pen.color, color);
    gl.bindVertexArray(paintShader.vao);
    this.drawSinglePath(fbo, additionData);
    drawInfo.lastArrayDrawnIndex = lastPointsArrayItem.length;
  }

  drawSinglePath(fbo, data) {
    const gl = this.gl;
    const paintShader = this.paintShader;
    gl.bindBuffer(gl.ARRAY_BUFFER, paintShader.buffer.position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(paintShader.location.position);
    {
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
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.drawArrays(gl.LINE_STRIP, 0, data.length / 2); // 使用密集的点来模拟线条
  }

  // 绘制旧的笔迹
  drawPathAll(fbo) {
    const gl = this.gl;
    const paintShader = this.paintShader;
    const drawInfo = this.drawInfos[this.layerIndex];
    gl.useProgram(paintShader.program);
    gl.bindVertexArray(paintShader.vao);
    let pointsArray = drawInfo.pointsArray;
    pointsArray.forEach((pointsItem) => {
      const { data, color, size } = pointsItem;
      gl.uniform1f(paintShader.location.pen.size, size);
      gl.uniform1f(paintShader.location.pen.color, color);
      this.drawSinglePath(fbo, data);
    });
  }

  handleCanvasEvent() {
    let isDrawing = false;
    let penPathIndex = 0;
    const scope = this;

    function mousedown(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isDrawing = true;
      const newPointsItem = {
        data: [],
        color: config.pen.color,
        size: config.pen.size,
      };
      penPathIndex =
        scope.drawInfos[scope.layerIndex].pointsArray.push(newPointsItem) - 1;
      // 将鼠标位置转换为WebGL坐标系中的位置，并添加到顶点列表
      scope.addPointToPath(e.clientX, e.clientY, penPathIndex);
      scope.render();
    }

    function mousemove(e) {
      if (e.button !== 0) return;
      if (isDrawing) {
        scope.addPointToPath(e.clientX, e.clientY, penPathIndex);
        scope.render();
      }
    }

    function mouseup(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isDrawing = false;
    }

    function mouseleave(e) {
      isDrawing = false;
    }

    this.activeMouseLeft = function () {
      canvas.addEventListener("mousedown", mousedown);
      canvas.addEventListener("mousemove", mousemove);
      canvas.addEventListener("mouseup", mouseup);
      canvas.addEventListener("mouseleave", mouseleave);
    };

    this.activeMouseLeft();

    this.deactivateMouseLeft = function () {
      canvas.removeEventListener("mousedown", mousedown);
      canvas.removeEventListener("mousemove", mousemove);
      canvas.removeEventListener("mouseup", mouseup);
      canvas.removeEventListener("mouseleave", mouseleave);
    };
  }
}