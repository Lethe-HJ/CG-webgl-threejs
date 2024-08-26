function createPoints(width, height, step) {
  const points = new Int32Array(((width * height) / (step * step)) * 2);
  let k = 0;
  for (let i = 0; i < width; i += step) {
    for (let j = 0; j < height; j += step) {
      points[k] = i;
      points[k + 1] = j;
      k += 2;
    }
  }
  console.log(`待过滤点一共${points.length / 2}个`);
  return points;
}

function createVertices(polygons) {
  const outerPolygon = createCircle(...polygons[0]);
  console.log(`outerPolygon顶点数${outerPolygon.length / 2}个`);
  let vertices = outerPolygon;
  const holeIndices = [];
    // polygons.slice(1).forEach((item, index) => {
    //   holeIndices.push(vertices.length);
    //   const hole = createCircle(...item);
    //   vertices = vertices.concat(hole);
    //   console.log(`hole${index} 顶点数${hole.length / 2}个`);
    // });
  return {
    holeIndices: new Int32Array(holeIndices),
    vertices: new Float32Array(vertices),
  };
}

function createCircle(centerX, centerY, radius, numPoints) {
  const vertices = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    vertices.push(x, y);
  }
  return vertices;
}
