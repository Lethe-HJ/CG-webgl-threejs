import createPaintShader from "./shaders/paint.js";

const eraserColor = [1, 1, 1, 0]; // 橡皮擦的颜色

export class EraserDrawer {
  constructor(gl) {
    this.gl = gl;
    this.paintShader = createPaintShader(gl);
  }

  addPointToPath(x, y, index, drawInfo, config) {
    const gl = this.gl;
    const webglX = (x / gl.canvas.width) * 2 - 1;
    const webglY = (y / gl.canvas.height) * -2 + 1;
    const pointsItem = drawInfo.pointsArray[index];
    if (!pointsItem.color) pointsItem.color = eraserColor; // 设置颜色
    const currentPath = pointsItem.data;

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
        (2 * config.pen.size) / canvas.width,
        (2 * config.pen.size) / canvas.height
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
  drawAdditionPath(fbo, drawInfo) {
    const gl = this.gl;
    const paintShader = this.paintShader;
    const { pointsArray, lastArrayDrawnIndex } = drawInfo;
    if (!pointsArray.length) return;
    const lastPointsArrayItem = pointsArray[pointsArray.length - 1];
    const { data, color, size } = lastPointsArrayItem;
    const additionData = data.slice(lastArrayDrawnIndex);

    gl.useProgram(paintShader.program);
    gl.uniform1f(paintShader.location.pen.size, size);
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
    gl.drawArrays(gl.POINTS, 0, data.length / 2); // 使用密集的点来模拟线条
    // 这里不用LINE_STRIP的原因是LINE_STRIP不能直接控制线条的宽度
  }
}
