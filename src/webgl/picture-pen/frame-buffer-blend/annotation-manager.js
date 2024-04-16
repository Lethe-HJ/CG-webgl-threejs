import { DRAW_MODE } from "./constant.js";
import { EraserDrawer } from "./eraser.js";
import { PenDrawer } from "./pen.js";
import createFrameBufferShader from "./shaders/frame-buffer.js";
import createImageShader from "./shaders/image.js";
import createPaintShader from "./shaders/paint.js";
import { TraceDrawer } from "./trace.js";

export default class AnnotationManager {
  constructor(gl, textureInfos, layerIndex, config) {
    this.gl = gl;
    this.textureInfos = textureInfos;
    this.drawInfos = [];
    this.layerIndex = layerIndex;
    this.config = config;
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
    this.initDrawers();
  }

  initDrawers() {
    this.drawers = {
      [DRAW_MODE.pen]: new PenDrawer(this.gl),
      [DRAW_MODE.eraser]: new EraserDrawer(this.gl),
      [DRAW_MODE.trace]: new TraceDrawer(this.gl),
    };
    this.currentDrawer = this.drawers[this.config.mode];
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
      if (!drawInfo.fbo.image) this.drawAll(drawInfo);
      else this.drawAddition(drawInfo);
      checkGLError(this.gl);
    });
  }

  setMode(mode) {
    if (mode !== DRAW_MODE.none) {
      this.activeMouseLeft();
    } else {
      this.deactivateMouseLeft();
    }
    this.currentDrawer = this.drawers[mode];
  }

  setConfig(newConfig) {
    this.config = newConfig;
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
    this.drawers[DRAW_MODE.pen].drawAllPath(paintFbo.frameBuffer, drawInfo);
    this.drawToScreen(imageFbo.texture);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.drawToScreen(paintFbo.texture);
  }

  // 增量绘制
  drawAddition(drawInfo) {
    const gl = this.gl;
    const imageFbo = drawInfo.fbo.image;
    const paintFbo = drawInfo.fbo.paint;
    gl.disable(gl.BLEND); // 绘制笔迹时不需能混合 否则橡皮擦无法覆盖之前的笔迹
    this.currentDrawer.drawAdditionPath(
      paintFbo.frameBuffer,
      drawInfo,
      this.config
    );
    this.drawToScreen(imageFbo.texture);
    gl.enable(gl.BLEND); // 合并paintFbo和imageFbo时需要混合
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.drawToScreen(paintFbo.texture);
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
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

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
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      console.error("Failed to create framebuffer: " + status.toString());
      return null;
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

  handleCanvasEvent() {
    let isDrawing = false;
    let penPathIndex = 0;
    const scope = this;

    function mousedown(e) {
      if (e.button !== 0) return;
      const config = scope.config;
      e.preventDefault();
      e.stopPropagation();
      isDrawing = true;
      const newPointsItem = {
        data: [],
        color: null,
        size: config.pen.size,
      };
      penPathIndex =
        scope.drawInfos[scope.layerIndex].pointsArray.push(newPointsItem) - 1;
      // 将鼠标位置转换为WebGL坐标系中的位置，并添加到顶点列表
      const drawInfo = scope.drawInfos[scope.layerIndex];
      scope.currentDrawer.addPointToPath(
        e.clientX,
        e.clientY,
        penPathIndex,
        drawInfo,
        scope.config
      );
      scope.render();
    }

    function mousemove(e) {
      if (e.button !== 0) return;
      if (isDrawing) {
        const drawInfo = scope.drawInfos[scope.layerIndex];
        scope.currentDrawer.addPointToPath(
          e.clientX,
          e.clientY,
          penPathIndex,
          drawInfo,
          scope.config
        );
        scope.render();
      }
    }

    function mouseup(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      isDrawing = false;
      if (scope.currentDrawer.drawEnd) {
        const drawInfo = scope.drawInfos[scope.layerIndex];
        scope.currentDrawer.drawEnd(drawInfo);
        scope.render();
      }
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

function checkGLError(gl) {
  const error = gl.getError();
  const errorMap = {
    [gl.NO_ERROR]: "NO_ERROR",
    [gl.INVALID_ENUM]: "INVALID_ENUM",
    [gl.INVALID_VALUE]: "INVALID_VALUE",
    [gl.INVALID_OPERATION]: "INVALID_OPERATION",
    [gl.INVALID_FRAMEBUFFER_OPERATION]: "INVALID_FRAMEBUFFER_OPERATION",
    [gl.OUT_OF_MEMORY]: "OUT_OF_MEMORY",
    [gl.CONTEXT_LOST_WEBGL]: "CONTEXT_LOST_WEBGL",
  };

  if (error !== gl.NO_ERROR) {
    const errorMessage = errorMap[error] || `Unknown Error (${error})`;
    console.error(`WebGL Error: ${errorMessage}`);
  }
}
