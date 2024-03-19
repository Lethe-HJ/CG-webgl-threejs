import { VaspLoader } from "./vaspLoader.js";
import * as THREE from "https://unpkg.com/three@0.135.0/build/three.module.js";
import * as dat from "https://cdn.jsdelivr.net/npm/dat.gui@0.7.6/build/dat.gui.module.js";
import { surfaceNets } from "./surfacenets_js.js";
import { ConcaveGeometry } from "./concave_geometry.js";

const scene = new THREE.Scene();
const container = document.querySelector("#container");

const light = new THREE.PointLight(0xffffff, 1);
light.position.set(0, 0, 20);
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x454545); // 较弱的环境光
scene.add(ambientLight);

const width = container.clientWidth;
const height = container.clientHeight;
const viewScale = 100;
const camera = new THREE.OrthographicCamera(
  width / -viewScale,
  width / viewScale,
  height / viewScale,
  height / -viewScale,
  1,
  1000
);
camera.position.set(5, 5, 20);
camera.lookAt(5, 5, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

const group = new THREE.Group();
group.scale.set(0.1, 0.1, 0.1);
scene.add(group);

const guiData = {
  level: 0.00604161, // 初始level值
};

// fetch("./data.json")
//   .then((response) => {
//     return response.json();
//   })
//   .then((json) => {
//     return handleData(json.data);
//   })
//   .catch((error) => {
//     console.log("Error:", error);
//   });

function handleData(data) {
  // data = linearInterpolation(data, 1);
  const shape = math.size(data);
  function updateMeshes(level) {
    group.clear();
    level = level * 2164.45670809159;
    [
      {
        value: level,
        color: 0xfee090,
      },
      {
        value: -level,
        color: 0x74add1,
      },
    ].forEach(async ({ value, color }) => {
      // const surface = surfaceNets(shape, (x, y, z) => data[x][y][z] - value);
      const surface = await callSurfaceNets(data, shape, value);
      const geometry = new ConcaveGeometry(surface.positions, surface.cells);
      const material = new THREE.MeshLambertMaterial({
        color,
        transparent: true,
        opacity: 0.7,
      });
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
    });
    renderer.render(scene, camera);
  }
  const gui = new dat.GUI();
  gui
    .add(guiData, "level", -0.01208321, 0.0167771)
    .step(0.00000001)
    .name("Level")
    .onChange((newValue) => {
      updateMeshes(newValue);
    });

  // 使用初始的level值创建网格
  updateMeshes(guiData.level);
}

const manager = new THREE.LoadingManager();
manager.onStart = function (url, itemsLoaded, itemsTotal) {
  console.log(
    "Started loading file: " +
      url +
      ".\nLoaded " +
      itemsLoaded +
      " of " +
      itemsTotal +
      " files."
  );
};

manager.onLoad = function () {
  console.log("Loading complete!");
};

manager.onError = function (url) {
  console.log("There was an error loading " + url);
};
const loader = new VaspLoader(manager);

loader.load(
  "./CHGDIFF.vasp",
  (res) => {
    handleData(res.data);
  },
  () => {},
  (error) => {
    console.log(error);
  }
);

function linearInterpolation(data, factor) {
  console.time("linearInterpolation");
  let d;
  // let format_data = math.reshape(data, shape)
  let shape = math.size(data);
  let out_shape = math.add(math.multiply(math.subtract(shape, 1), factor), 1);
  let out_data = math.zeros(out_shape);
  // console.log(shape, out_shape, data, out_data)
  for (let i = 0; i < out_shape[0]; i++) {
    for (let j = 0; j < out_shape[1]; j++) {
      for (let k = 0; k < out_shape[2]; k++) {
        let origin_i = math.floor(i / factor),
          origin_j = math.floor(j / factor),
          origin_k = math.floor(k / factor);
        let extra_i = (i % factor) / factor,
          extra_j = (j % factor) / factor,
          extra_k = (k % factor) / factor;
        for (let a_i = 0; a_i < 2; a_i++) {
          for (let a_j = 0; a_j < 2; a_j++) {
            for (let a_k = 0; a_k < 2; a_k++) {
              try {
                d = data[origin_i + a_i][origin_j + a_j][origin_k + a_k];
              } catch (e) {
                d = 0;
              }
              d = d ?? 0;
              let res =
                (a_i * extra_i + (1 - a_i) * (1 - extra_i)) *
                (a_j * extra_j + (1 - a_j) * (1 - extra_j)) *
                (a_k * extra_k + (1 - a_k) * (1 - extra_k)) *
                d;
              // console.log(d, '\nidx: ', i, j, k, '\ncube: ', a_i, a_j, a_k, '\nextra: ', extra_i, extra_j, extra_k, '\nres: ', res)
              out_data[i][j][k] += res;
            }
          }
        }
      }
    }
  }
  console.timeEnd("linearInterpolation");
  return out_data;
}

// 假设 Module 已经加载
async function callSurfaceNets(data, dims, level) {
  const Module = window.Module;
  // 首先，我们需要将数据从 JavaScript 数组转移到 WebAssembly 的内存中。
  const dataPtr = Module._malloc(data.length * Float32Array.BYTES_PER_ELEMENT);
  Module.HEAPF32.set(data, dataPtr / Float32Array.BYTES_PER_ELEMENT);

  // 类似地，为 dims 分配内存并复制数据。
  const dimsPtr = Module._malloc(dims.length * Int32Array.BYTES_PER_ELEMENT);
  Module.HEAP32.set(dims, dimsPtr / Int32Array.BYTES_PER_ELEMENT);
  // 调用 surfaceNets 函数。注意，我们需要处理返回值来获取顶点和面。
  const meshPtr = Module._computeSurfaceNets(
    dataPtr,
    dimsPtr,
    level /* 这里可能需要其他参数 */
  );

  // 获取顶点和三角形的数量
  const vertexCount = Module._getMeshVertexCount(meshPtr);
  const triangleCount = Module._getMeshTriangleCount(meshPtr);

  // 获取顶点和三角形数组的指针
  const verticesPtr = Module._getMeshVertices(meshPtr);
  const trianglesPtr = Module._getMeshTriangles(meshPtr);

  // 将顶点数据从 Wasm 内存复制到 JavaScript 数组
  const vertices = new Float32Array(
    Module.HEAPF32.buffer,
    verticesPtr,
    vertexCount * 3
  );
  const copiedVertices = new Float32Array(vertices);

  // 将三角形数据从 Wasm 内存复制到 JavaScript 数组
  const triangles = new Int32Array(
    Module.HEAP32.buffer,
    trianglesPtr,
    triangleCount * 3
  );
  const copiedTriangles = new Int32Array(triangles);

  Module._freeMesh(meshPtr);

  // 记得释放 WebAssembly 内存
  Module._free(dataPtr);
  Module._free(dimsPtr);

  // 创建并返回 geometry
  return new ConcaveGeometry(copiedVertices, copiedTriangles);
}
