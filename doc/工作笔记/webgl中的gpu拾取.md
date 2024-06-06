```ts
  filterPathWithPickBuffer(glWindowStartX: number, glWindowStartY: number, pickWidth: number = 1, pickHeight: number = 1) {

    // 先从OffscreenTextures.PICK buffer中读取数据，这些数据用于拾取anno
    const {gl} = this;
    let buffer = this.pickRectAreaBuffer;
    if (!buffer) {
      buffer = gl.createBuffer();
      gl.bindBuffer(WebGL2RenderingContext.PIXEL_PACK_BUFFER, buffer);
      gl.bufferData(
        WebGL2RenderingContext.PIXEL_PACK_BUFFER, 2 * 4 * 4 * pickWidth * pickHeight,
        WebGL2RenderingContext.STREAM_READ);
        // 第二个参数指定缓冲区大小
        // 每个像素四个通道 每个通道都是32位 也就是4字节 最前面的2不知道什么意思?
    } else {
      gl.bindBuffer(WebGL2RenderingContext.PIXEL_PACK_BUFFER, buffer);
    }

    const {offscreenFramebuffer} = this;
    offscreenFramebuffer.readPixelFloat32IntoBuffer(
      OffscreenTextures.PICK, glWindowStartX, glWindowStartY, 0, pickWidth,
      pickHeight);//读取到this.pickRectAreaBuffer 的GPU缓存中

    let pickBufferContents: Float32Array = new Float32Array(4 * pickWidth * pickHeight);
    gl.bindBuffer(WebGL2RenderingContext.PIXEL_PACK_BUFFER, buffer);
    gl.getBufferSubData(WebGL2RenderingContext.PIXEL_PACK_BUFFER, 0, pickBufferContents);//从绑定的PIXEL_PACK_BUFFER读取数据到pickBufferContents
    gl.bindBuffer(WebGL2RenderingContext.PIXEL_PACK_BUFFER, null);

    const imageData = this.pickCtx.getImageData(0, 0, pickWidth, pickHeight);
    const data = imageData.data;
    const idSet: Set<number> = new Set();
    const rowLength = pickWidth * 4;
    for (let i = 0; i < data.length; i += 4) {
      let bufferIndex = (pickHeight - Math.floor(i / rowLength)) * rowLength + i % rowLength;
      if (pickBufferContents[bufferIndex] > 0 && data[i+3] > 0) {//data[i+3]为canvas 2D 的alpha通道，如果alpha通道不为0，说明这个像素点需要拾取anno
        idSet.add(pickBufferContents[bufferIndex]);
        data[i] = 255; // red
        data[i + 1] = 0; // green
        data[i + 2] = 0; // blue
        // data[i + 3] = 255; // alpha
      } else {
        data[i + 3] = 0; // alpha
      }
    }
    const pickIdSet:Set<number> = new Set();
    const pickCellInfoList: Array<PickCellInfo> = [];
    for (const pickOffsetId of idSet) {
      const pickCellInfo = this.pickIDs.getPickCellInfo(pickOffsetId);
      if (pickCellInfo && !pickIdSet.has(pickCellInfo.cellId)) {
        pickCellInfo && pickCellInfoList.push(pickCellInfo);
        pickIdSet.add(pickCellInfo.cellId);
      }
    }
    this.pickCtx.putImageData(imageData, 0, 0);
    return pickCellInfoList;
  }
```

webgl2中浮点数是32位的