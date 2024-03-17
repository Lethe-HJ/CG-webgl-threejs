import * as easy3d from "./easy3d.js";
import { MaterialType } from "./libs.js";
const ctx = document.getElementById("canvas");
const gl = ctx.getContext("webgl");

const scene = easy3d.createScene();

const ambient_light = easy3d.createAmbientLight({
  color: "#494949",
}); // 定义环境光 实际上就是一些uniform 待传入到着色器
scene.add(ambient_light);

const point_light = easy3d.createPointLight({
  color: "#ffffff",
  position: [2.0, 6.0, 2.0],
  attenuation: [0.5, 0.01, 0.032],
}); // 定义点光源  实际上就是一些uniform 待传入到着色器中
scene.add(point_light);

const camera = easy3d.createCamera({
  position: [1, 1, 10],
  target: [1.0, 0.0, 0.0],
  up: [0.0, 1.0, 0.0],
  fov: 90 * (Math.PI / 360),
  aspect: ctx.width / ctx.height,
  near: 0.1,
  far: 20,
}); // 定义相机 实际上就是视图矩阵和投影矩阵

// 物体位置
const vertices = new Float32Array([
  // 0123
  1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1,
  // 0345
  1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1,
  // 0156
  1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1,
  // 1267
  -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1,
  // 2347
  -1, -1, 1, 1, -1, 1, 1, -1, -1, -1, -1, -1,
  // 4567
  1, -1, -1, 1, 1, -1, -1, 1, -1, -1, -1, -1,
]);

// 法向量
const normals = new Float32Array([
  // 0123
  0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  // 0345
  1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,
  // 0156
  0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,
  // 1267
  -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0,
  // 2347
  0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0,
  // 4567
  0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
]);

// 面
const indices = new Uint8Array([
  0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14,
  15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23,
]);

const geometry = easy3d.createGeometry(vertices, normals, indices); // 定义物体 实际上就是待传入到着色器中的点数据面数据

const material1 = easy3d.createMaterial(
  {
    type: MaterialType.Phong,
    color: "#00FF00",
    shininess: 100.0,
  },
  gl
); // 定义材质 实际上就是着色器

const mesh1 = easy3d.createMesh(geometry, material1); // Mesh的实质就是将几何体和材质绑定成一组 用材质指定的着色器 绘制一次这个几何体
mesh1.setPosition(-2, 0, 0);
mesh1.setScale(1.5, 1.5, 1.5);
scene.add(mesh1);

const material2 = easy3d.createMaterial(
  {
    type: MaterialType.Lambert,
    color: "#00FF00",
  },
  gl
);
const mesh2 = easy3d.createMesh(geometry, material2);
const group = easy3d.createGroup();
group.add(mesh2);
group.setPosition(4, 0, 0);
group.setScale(1.5, 1.5, 1.5);
scene.add(group);

const renderer = easy3d.createRenderer(gl);

let deg = 1;
function animate() {
  deg += 0.005;
  if (deg > 20) deg = 0;
  mesh1.setRotation(deg, 2 * deg, 3 * deg);
  mesh2.setRotation(deg, 2 * deg, 3 * deg);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
