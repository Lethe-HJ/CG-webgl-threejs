import * as THREE from "https://unpkg.com/three@0.135.0/build/three.module.js";

export class VaspLoader extends THREE.Loader {
  constructor(manager) {
    super(manager);
  }

  load(url, onLoad, onProgress, onError) {
    const loader = new THREE.FileLoader(this.manager);
    loader.setPath(this.path);
    loader.setResponseType("text");
    loader.load(
      url,
      (text) => {
        onLoad(this.parse(text));
      },
      onProgress,
      onError
    );
  }

  parse(text) {
    const lines = text.split("\n");
    const dimensionLineIndex = lines.findIndex((line) =>
      line.match(/^\s*\d+\s+\d+\s+\d+\s*$/)
    );
    const dimensionLine = lines[dimensionLineIndex];
    const shape = dimensionLine.trim().split(/\s+/).map(Number);

    const dataStartIndex = dimensionLineIndex + 1;
    const totalSize = shape[0] * shape[1] * shape[2];

    // 创建一个Float32Array来存储所有数据
    let data = new Float32Array(totalSize);
    let flatData = [];

    for (let i = dataStartIndex; i < lines.length; i++) {
      const nums = lines[i]
        .trim()
        .split(/\s+/)
        .map((num) => parseFloat(num));
      flatData.push(...nums);
    }

    // 填充Float32Array
    for (let i = 0; i < flatData.length; i++) {
      data[i] = flatData[i];
    }
    return { shape, data };
  }

  // parse(text) {
  //   const lines = text.split("\n");
  //   const dimensionLineIndex = lines.findIndex((line) =>
  //     line.match(/^\s*\d+\s+\d+\s+\d+\s*$/)
  //   );
  //   const dimensionLine = lines[dimensionLineIndex];
  //   const shape = dimensionLine.trim().split(/\s+/).map(Number);

  //   const dataStartIndex = dimensionLineIndex + 1;

  //   // 创建一个填充为0的三维数组
  //   let data = new Array(shape[0])
  //     .fill(null)
  //     .map(() =>
  //       new Array(shape[1]).fill(null).map(() => new Array(shape[2]).fill(0))
  //     );

  //   let flatData = [];

  //   for (let i = dataStartIndex; i < lines.length; i++) {
  //     const nums = lines[i]
  //       .trim()
  //       .split(/\s+/)
  //       .map((num) => parseFloat(num));
  //     flatData.push(...nums);
  //   }

  //   for (let z = 0; z < shape[2]; z++) {
  //     for (let y = 0; y < shape[1]; y++) {
  //       for (let x = 0; x < shape[0]; x++) {
  //         data[x][y][z] = flatData[z * shape[0] * shape[1] + y * shape[0] + x];
  //       }
  //     }
  //   }

  //   return { shape, data };
  // }
}
