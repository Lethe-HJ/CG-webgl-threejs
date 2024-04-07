import * as THREE from "https://unpkg.com/three@0.135.0/build/three.module.js";

export class ConcaveGeometry extends THREE.BufferGeometry {
  constructor(positions, cells) {
    super();
    this.type = "ConcaveGeometry";
    // 使用类型化数组代替普通数组
    this.vertices = new Float32Array(cells.length * 3); // 每个面有3个顶点，每个顶点3个坐标
    this.normals = new Float32Array(cells.length * 3); // 每个面对应的法向量

    this.renderGeometry(positions, cells);
  }

  renderGeometry(positions, cells) {
    let idx1,
      idx2,
      idx3,
      ax,
      ay,
      az,
      bx,
      by,
      bz,
      cx,
      cy,
      cz,
      v1x,
      v1y,
      v1z,
      v2x,
      v2y,
      v2z,
      nx,
      ny,
      nz,
      length;
    for (let i = 0, j = 0; i < cells.length; i += 3, j += 9) {
      idx1 = cells[i] * 3;
      idx2 = cells[i + 1] * 3;
      idx3 = cells[i + 2] * 3;

      // 直接从positions数组中获取顶点坐标
      ax = positions[idx1];
      ay = positions[idx1 + 1];
      az = positions[idx1 + 2];
      bx = positions[idx2];
      by = positions[idx2 + 1];
      bz = positions[idx2 + 2];
      cx = positions[idx3];
      cy = positions[idx3 + 1];
      cz = positions[idx3 + 2];

      // 存储顶点坐标
      this.vertices.set([ax, ay, az, bx, by, bz, cx, cy, cz], j);

      // 计算法向量
      (v1x = bx - ax), (v1y = by - ay), (v1z = bz - az);
      (v2x = cx - ax), (v2y = cy - ay), (v2z = cz - az);

      // 叉乘计算法向量
      nx = v1y * v2z - v1z * v2y;
      ny = v1z * v2x - v1x * v2z;
      nz = v1x * v2y - v1y * v2x;

      // 标准化法向量
      length = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= length;
      ny /= length;
      nz /= length;

      // 每个顶点同样的法向量
      this.normals.set([nx, ny, nz, nx, ny, nz, nx, ny, nz], j);
    }

    this.setAttribute("position", new THREE.BufferAttribute(this.vertices, 3));
    this.setAttribute("normal", new THREE.BufferAttribute(this.normals, 3));
  }
}
