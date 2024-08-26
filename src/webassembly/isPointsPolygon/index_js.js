const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// 设置画布大小（根据需要调整）
canvas.width = canvasWidth;
canvas.height = canvasHeight;

const points = createPoints(canvasWidth, canvasHeight, step);
drawPoints(points);

let x, y;

const { vertices, holeIndices } = createVertices(polygons);

drawPolygonWithHoles(ctx, vertices, holeIndices);

console.time("filter");

const filteredPoints = calculatePointsInPolygon(vertices, holeIndices);

console.timeEnd("filter");

drawPoints(filteredPoints, "red");

function drawPolygonWithHoles(ctx, vertices, holeIndices) {
  ctx.beginPath();

  // Draw the outer polygon
  ctx.moveTo(vertices[0], vertices[1]);
  for (let i = 2; i < holeIndices[0]; i += 2) {
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

  for (let i = 0; i < points.length / 2; i++) {
    // 绘制一个点
    ctx.fillRect(points[2 * i], points[2 * i + 1], 1, 1);
  }
}

function calculatePointsInPolygon(vertices, holeIndices) {
  const filteredPoints = [];
  const outerPolygonEndIndices = holeIndices.length
    ? holeIndices[0]
    : vertices.length;
  const box = getBoundingBox(vertices.slice(0, outerPolygonEndIndices));
  const outerPolygonEdges = precalculateEdges(
    vertices,
    0,
    outerPolygonEndIndices
  );
  const holeEdgesArray = [];
  holeIndices.forEach((holeIndex, idx) => {
    const endIndex = holeIndices[idx + 1] || vertices.length;
    const edges = precalculateEdges(vertices, holeIndex, endIndex);
    holeEdgesArray.push(edges);
  });

  for (let i = 0; i < points.length; i += 2) {
    x = points[i];
    y = points[i + 1];
    if (!isInBoundingBox(x, y, box)) continue;
    const isInPolygon = isPointInPolygonWithHoles(
      x,
      y,
      holeIndices,
      outerPolygonEdges,
      holeEdgesArray
    );
    if (isInPolygon) filteredPoints.push(x, y);
  }
  return filteredPoints;
}

// function precalculateEdges(vertices, start, end) {
//   const len = end - start;
//   const edges = new Array(len / 2 - 1);
//   let index = 0,
//     xi,
//     yi,
//     xj,
//     yj;
//   for (let i = start; i < end - 2; j = i, i += 2) {
//     xi = vertices[i];
//     yi = vertices[i + 1];
//     xj = vertices[i + 2];
//     yj = vertices[i + 3];
//     edges[index++] = [xj - xi, yj - yi, xi, yi, yj];
//   }
//   xi = vertices[end - 2];
//   yi = vertices[end - 1];
//   xj = vertices[0];
//   yj = vertices[1];
//   edges[index] = [xj - xi, yj - yi, xi, yi, yj];
//   return edges;
// }

function precalculateEdges(vertices, start, end) {
  const len = end - start;
  const edges = new Array(len / 2); // Fix: Create an array of the correct length
  let index = 0,
    xi,
    yi,
    xj,
    yj;
  // Fix: Move j declaration outside the loop
  let j = (end - 2 + vertices.length) % vertices.length; // Start with the last vertex before 'end'
  for (let i = start; i < end; i += 2) {
    xi = vertices[i];
    yi = vertices[i + 1];
    xj = vertices[j];
    yj = vertices[j + 1];
    edges[index++] = [xj - xi, yj - yi, xi, yi, yj];
    j = i; // Update j to the current index for the next iteration
  }
  return edges;
}

function isPointInPolygonWithHoles(
  x,
  y,
  holeIndices,
  outerEdges,
  holeEdgesArray
) {
  // 判断点是否在外部多边形内
  if (!isPointInPolygon(x, y, outerEdges)) {
    return false;
  }

  // 判断点是否在任意的洞内
  for (let i = 0; i < holeIndices.length; i++) {
    // 获取孔的预计算边信息
    if (isPointInPolygon(x, y, holeEdgesArray[i])) {
      return false; // 在洞内 那就不在整个多边形内
    }
  }

  return true;
}

function isPointInPolygon(x, y, precalculatedEdges) {
  let inside = false,
    edge,
    dx,
    dy,
    xi,
    yi,
    yj;
  for (let i = 0; i < precalculatedEdges.length; i++) {
    edge = precalculatedEdges[i];
    dx = edge[0];
    dy = edge[1];
    xi = edge[2];
    yi = edge[3];
    yj = edge[4];

    const intersect =
      yi > y != yj > y && // 注意这里使用了缓存的 dy
      x < (dx * (y - yi)) / dy + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function getBoundingBox(vertices) {
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (let i = 0; i < vertices.length; i += 2) {
    const x = vertices[i];
    const y = vertices[i + 1];
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return [minX, minY, maxX, maxY];
}

function isInBoundingBox(x, y, [minX, minY, maxX, maxY]) {
  if (x < minX || x > maxX || y < minY || y > maxY) {
    return false; // 点在包围盒外
  }
  return true;
}
