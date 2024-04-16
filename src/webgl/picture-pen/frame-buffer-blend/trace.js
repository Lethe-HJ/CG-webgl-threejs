import createPaintShader from "./shaders/paint.js";

export class TraceDrawer {
  constructor(gl) {
    this.gl = gl;
    this.paintShader = createPaintShader(gl);
    this.hideLines = [];
  }

  addPointToPath(x, y, index, drawInfo, config) {
    const gl = this.gl;
    const webglX = (x / gl.canvas.width) * 2 - 1;
    const webglY = (y / gl.canvas.height) * -2 + 1;
    const pointsItem = drawInfo.pointsArray[index];
    if (!pointsItem.color) pointsItem.color = config.pen.color; // 设置颜色
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
    const { data, color } = lastPointsArrayItem;
    const additionData = data.slice(lastArrayDrawnIndex);

    gl.useProgram(paintShader.program);
    gl.uniform1f(paintShader.location.pen.size, 10.0);
    gl.bindVertexArray(paintShader.vao);
    if (this.hideLines.length) { // 隐藏上一次的环回连线
      gl.uniform4fv(paintShader.location.pen.color, [1, 1, 1, 0]);
      this.drawSinglePath(fbo, this.hideLines);
    }
    gl.uniform4fv(paintShader.location.pen.color, color);
    this.drawSinglePath(fbo, additionData);
    drawInfo.lastArrayDrawnIndex = lastPointsArrayItem.length;


    // 将loop的最后的环回连线记录下来 在下一次绘制时隐藏该连线
    this.hideLines.push(
      data[data.length - 2],
      data[data.length - 1],
      data[0],
      data[1]
    );
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
    gl.drawArrays(gl.LINE_LOOP, 0, data.length / 2);
  }

  // 绘制旧的笔迹
  drawAllPath(fbo, drawInfo) {
    const gl = this.gl;
    const paintShader = this.paintShader;
    gl.useProgram(paintShader.program);
    gl.bindVertexArray(paintShader.vao);
    let pointsArray = drawInfo.pointsArray;
    pointsArray.forEach((pointsItem) => {
      const { data, color, size } = pointsItem;
      gl.uniform1f(paintShader.location.pen.size, size);
      gl.uniform4fv(paintShader.location.pen.color, color);
      this.drawSinglePath(fbo, data);
    });
  }

  drawEnd(drawInfo) {
    this.hideLines = [];
  }
}
