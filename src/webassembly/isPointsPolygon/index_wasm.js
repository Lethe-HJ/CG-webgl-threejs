const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// 设置画布大小（根据需要调整）
canvas.width = canvasWidth;
canvas.height = canvasHeight;

const points = createPoints(canvasWidth, canvasHeight, step);
// drawPoints(points);

let x, y;

Module.onRuntimeInitialized = () => {
  const filteredPoints = calculate(polygons);
  drawPoints(filteredPoints, "red");

  // const filteredPoints1 = calculate(polygons1);
  // drawPoints(filteredPoints1, "red");
  // setInterval(calculate, 1000);
};

function calculate(polygons) {
  const { vertices, holeIndices } = createVertices(polygons);
  const start = new Date().getTime();
  // Get the byte length of the data to allocate
  const pointsByteLength = points.length * points.BYTES_PER_ELEMENT;
  const verticesByteLength = vertices.length * vertices.BYTES_PER_ELEMENT;
  const holeIndicesByteLength =
    holeIndices.length * holeIndices.BYTES_PER_ELEMENT;
  const filteredPointsByteLength =
    (points.length / 2) * points.BYTES_PER_ELEMENT;

  // Allocate memory in the Wasm heap
  const pointsPtr = Module._malloc(pointsByteLength);
  const verticesPtr = Module._malloc(verticesByteLength);

  const holeIndicesPtr = Module._malloc(holeIndicesByteLength);
  const filteredPointsIndicesPtr = Module._malloc(filteredPointsByteLength);
  // Copy data to the Wasm heap
  Module.HEAP32.set(points, pointsPtr >> 2);
  Module.HEAPF32.set(vertices, verticesPtr >> 2);
  Module.HEAP32.set(holeIndices, holeIndicesPtr >> 2);
  // console.timeEnd("prepare");
  console.time("calculate");
  const filteredPointsIndicesLen = Module._calculatePointsInPolygon(
    pointsPtr,
    points.length,
    verticesPtr,
    vertices.length,
    holeIndicesPtr,
    holeIndices.length,
    filteredPointsIndicesPtr
  );
  console.timeEnd("calculate");
  // console.time("get data");
  // Retrieve results from the allocated memory
  const filteredPointsIndices = new Int32Array(
    Module.HEAP32.buffer,
    filteredPointsIndicesPtr,
    filteredPointsIndicesLen
  );
  const end = new Date().getTime();
  const currentTime = end - start;
  if (!window.minTime) window.minTime = currentTime;
  else if (currentTime < window.minTime) {
    console.log(currentTime);
    window.minTime = currentTime;
  }

  const filteredPoints = new Array(filteredPointsIndices.length * 2);
  for (let i = 0; i < filteredPointsIndices.length; i += 1) {
    const indices = filteredPointsIndices[i];
    filteredPoints[i * 2] = points[indices * 2];
    filteredPoints[i * 2 + 1] = points[indices * 2 + 1];
  }

  // console.timeEnd("get data");
  // console.time("clear");
  // Free allocated memory
  Module._free(pointsPtr);
  Module._free(verticesPtr);
  Module._free(holeIndicesPtr);
  Module._free(filteredPointsIndicesPtr);
  // console.timeEnd("clear");
  drawPolygonWithHoles(ctx, vertices, holeIndices);
  return filteredPoints;
}

function drawPolygonWithHoles(ctx, vertices, holeIndices) {
  ctx.beginPath();

  // Draw the outer polygon
  ctx.moveTo(vertices[0], vertices[1]);
  const verticesEnd = holeIndices[0] ?? vertices.length;
  for (let i = 2; i < verticesEnd; i += 2) {
    ctx.lineTo(vertices[i], vertices[i + 1]);
  }
  ctx.closePath();
  ctx.stroke();

  // Draw each hole
  for (let h = 0; h < holeIndices.length; h++) {
    const startIndex = holeIndices[h];
    const endIndex = holeIndices[h + 1] || vertices.length; // Handle the last hole

    ctx.moveTo(vertices[startIndex], vertices[startIndex + 1]);
    for (let i = startIndex + 2; i < endIndex; i += 2) {
      ctx.lineTo(vertices[i], vertices[i + 1]);
    }
    ctx.closePath();
    ctx.stroke();
  }
}

function drawPoints(points, color = "black") {
  ctx.fillStyle = color; // 点的颜色

  for (let i = 0; i < points.length; i += 2) {
    // 绘制一个点
    ctx.fillRect(points[i], points[i + 1], 1, 1);
  }
}
