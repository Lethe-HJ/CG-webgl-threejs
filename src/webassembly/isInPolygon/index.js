const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// 设置画布大小（根据需要调整）
canvas.width = 1200;
canvas.height = 800;

function createPoints() {
  const points = new Uint32Array(3840000);
  let k = 0;
  for (let i = 0; i < 1200; i += 1) {
    for (let j = 0; j < 800; j += 1) {
      points[k++] = i;
      points[k++] = j;
    }
  }
  return points;
}

const points = createPoints();

function drawPoints(points, color = "black") {
  ctx.fillStyle = color; // 点的颜色

  for (let i = 0; i < points.length / 2; i++) {
    // 绘制一个点
    ctx.fillRect(points[2 * i], points[2 * i + 1], 1, 1);
  }
}

// drawPoints(points);

const filteredPoints = [];
let x, y;
const vertices = [
  200, 200, 800, 200, 800, 600, 200, 600, 300, 300, 400, 300, 400, 400, 300,
  400,
]; // 矩形 + 一个孔
const holeIndices = [8]; // 孔的起始索引为 8

console.time("111");
const box = getBoundingBox(vertices.slice(0, holeIndices[0]));
for (let i = 0; i < points.length; i += 2) {
  x = points[i];
  y = points[i + 1];
  if (!isInBoundingBox([x, y], box)) continue;
  const isInPolygon = isPointInPolygonWithHoles(
    [x, y],
    vertices,
    holeIndices // 没有孔
  );
  if (isInPolygon) filteredPoints.push(x, y);
}
console.timeEnd("111");
console.log(filteredPoints); // 打印出的结果为 []

drawPolygonWithHoles(ctx, vertices, holeIndices);

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

function isPointInPolygonWithHoles(point, vertices, holeIndices) {
  // Check if the point is inside the outer polygon
  if (!isPointInPolygon(point, vertices.slice(0, holeIndices[0]))) {
    return false;
  }

  // Check if the point is inside any of the holes
  for (let i = 0; i < holeIndices.length; i++) {
    const holeStart = holeIndices[i];
    const holeEnd = holeIndices[i + 1] || vertices.length; // Handle the last hole
    const holeVertices = vertices.slice(holeStart, holeEnd);
    if (isPointInPolygon(point, holeVertices)) {
      return false; // Point is inside a hole, so it's not inside the polygon
    }
  }

  return true; // Point is inside the outer polygon and not in any holes
}

function isPointInPolygon(point, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 2; i < vertices.length; j = i, i += 2) {
    const xi = vertices[i],
      yi = vertices[i + 1];
    const xj = vertices[j],
      yj = vertices[j + 1];

    const intersect =
      yi > point[1] != yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

function isLeft(xi, yi, xj, yj, point) {
  return (xj - xi) * (point[1] - yi) - (point[0] - xi) * (yj - yi);
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

function isInBoundingBox(point, box) {
  const [minX, minY, maxX, maxY] = box;

  if (
    point[0] < minX ||
    point[0] > maxX ||
    point[1] < minY ||
    point[1] > maxY
  ) {
    return false; // 点在包围盒外
  }
  return true;
}
